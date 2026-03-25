'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, CheckCircle, XCircle, ArrowRight, RefreshCw, Trophy, Volume2, MessageCircle, X, Send, Loader2, Bot, LogOut, Settings, Save, Activity } from 'lucide-react';
import Markdown from 'react-markdown';
import { createAIService, type AIConfig } from '@/lib/ai-service';
import { ThemeToggle } from '@/components/ThemeToggle';
import { analyzeWords, type WordData, type WordDefinition } from '@/lib/analyze';
import { checkDbConfigured, getSessionData, logout, saveProgress, deleteProgress, startSession, pauseSession, resumeSession, endSession } from '@/app/actions';
import { Login } from '@/components/Login';
import { AdminPanel } from '@/components/AdminPanel';
import { Dashboard } from '@/components/Dashboard';

import { UserPanel } from '@/components/UserPanel';

// --- Types ---
type ExerciseType = 'EN_TO_ZH' | 'ZH_TO_EN' | 'SPELL' | 'FILL' | 'AUDIO_TO_ZH' | 'AUDIO_SPELL';

interface Exercise {
  id: string;
  word: WordData;
  type: ExerciseType;
  options?: string[];
  maskedWord?: string;
}

interface WordProgress {
  wordData: WordData;
  step: number;
  dueAt: number;
  status: 'LEARNING' | 'MASTERED';
  sequence: ExerciseType[];
}

interface Stats {
  [type: string]: { correct: number; total: number };
}

// --- Helpers ---
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function maskWord(word: string) {
  if (word.length <= 2) return word.replace(/./g, '_');
  const chars = word.split('');
  const numToHide = Math.max(1, Math.floor(word.length * 0.4));
  let hiddenCount = 0;
  let attempts = 0;
  while (hiddenCount < numToHide && attempts < 100) {
    const idx = Math.floor(Math.random() * chars.length);
    if (chars[idx] !== '_' && chars[idx] !== ' ' && chars[idx] !== '-') {
      chars[idx] = '_';
      hiddenCount++;
    }
    attempts++;
  }
  return chars.join('');
}

const playAudio = (text: string) => {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.error('Audio playback failed', e);
  }
};

// --- Components ---
const RingChart = ({ percentage, label, size = 120, strokeWidth = 10, colorClass = "text-indigo-600 dark:text-indigo-400" }: { percentage: number, label?: string, size?: number, strokeWidth?: number, colorClass?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colorClass} transition-all duration-1000 ease-out`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{percentage}%</span>
        {label && <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{label}</span>}
      </div>
    </div>
  );
};

const SpellInput = ({ onSubmit, placeholder, maskedWord }: { onSubmit: (val: string) => void, placeholder?: string, maskedWord?: string }) => {
  const [val, setVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && val.trim()) {
      onSubmit(val.trim());
    }
  };

  return (
    <div 
      className="space-y-8 w-full max-w-md mx-auto relative z-10"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.stopPropagation();
        }
      }}
    >
      {maskedWord && (
        <div className="text-center text-4xl font-mono tracking-[0.5em] text-slate-400 dark:text-slate-500 mb-8 flex justify-center">
          {maskedWord.split('').map((char, i) => 
            char === '_' ? 
              <span key={i} className="inline-block w-8 border-b-4 border-indigo-300 dark:border-indigo-600 mx-1 mb-1"></span> : 
              <span key={i} className="inline-block w-8 mx-1 text-slate-800 dark:text-slate-100 font-bold">{char}</span>
          )}
        </div>
      )}
      <input 
        ref={inputRef}
        type="text" 
        value={val} 
        onChange={e => setVal(e.target.value)} 
        onKeyDown={handleKeyDown}
        className="w-full text-center text-3xl p-6 border-2 border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-slate-900 dark:text-slate-100 rounded-[2rem] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-600 font-bold"
        placeholder={placeholder || "输入英文单词..."}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck="false"
      />
      <button 
        onClick={() => val.trim() && onSubmit(val.trim())}
        disabled={!val.trim()}
        className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2rem] font-black text-xl disabled:opacity-50 disabled:grayscale hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-95 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
      >
        提交答案 <ArrowRight className="w-6 h-6" />
      </button>
    </div>
  );
};

const MultipleChoice = ({ options, onSubmit }: { options: string[], onSubmit: (val: string) => void }) => {
  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full max-w-4xl mx-auto relative z-10"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.stopPropagation();
        }
      }}
    >
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => onSubmit(opt)}
          className="p-6 md:p-8 text-lg md:text-xl font-bold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-slate-200/50 dark:border-slate-700/50 rounded-[2rem] hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/80 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all active:scale-95 text-left flex items-center group shadow-lg shadow-slate-200/20 dark:shadow-black/20 hover:shadow-xl hover:shadow-indigo-500/10"
        >
          <span className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mr-6 text-lg font-black shrink-0 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-purple-600 group-hover:text-white transition-all shadow-inner">
            {String.fromCharCode(65 + i)}
          </span>
          <span className="leading-relaxed">{opt}</span>
        </button>
      ))}
    </div>
  );
};

// --- AI Assistant Component ---
const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant' | 'system', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initChat = () => {
    if (!chatRef.current) {
      const aiService = createAIService();
      chatRef.current = aiService.createChat({
        systemInstruction: "你是一个专业的英语学习助手。请简明扼要地解答用户关于英语单词、语法、用法的疑问。请用中文回答。",
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      initChat();
      if (!chatRef.current) throw new Error("API service initialization failed");
      const response = await chatRef.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'assistant', content: response.text || '抱歉，我没有理解你的问题。' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，发生了一些错误，请稍后再试。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all flex items-center justify-center z-40"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[360px] h-[500px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-indigo-500/20 dark:shadow-black/40 border border-slate-200/50 dark:border-slate-800/50 flex flex-col z-50 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 flex items-center justify-between shrink-0 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg tracking-tight">英语学习助手</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all relative z-10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 dark:bg-slate-950/50">
              {messages.length === 0 && (
                <div className="text-center text-slate-400 dark:text-slate-500 mt-12 text-sm flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-500">
                    <Bot className="w-8 h-8 opacity-50" />
                  </div>
                  <p>有什么关于英语单词或语法的问题？<br/>随时问我吧！</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-5 py-3.5 ${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl rounded-tr-sm shadow-md shadow-indigo-500/20' : 'bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 rounded-2xl rounded-tl-sm shadow-sm'}`}>
                    {msg.role === 'assistant' ? (
                      <div className="markdown-body text-sm prose prose-slate dark:prose-invert prose-sm max-w-none leading-relaxed">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed">{msg.content}</div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm text-slate-500">正在思考...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                  placeholder="输入你的问题..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 transition-all p-2 rounded-xl shadow-sm active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// --- Main App ---
export default function App() {
  const [appState, setAppState] = useState<'INPUT' | 'ANALYZING' | 'EXERCISE' | 'RESULT' | 'LOGIN' | 'DASHBOARD' | 'ADMIN' | 'USER_PANEL'>('INPUT');
  const [isDbConfigured, setIsDbConfigured] = useState(false);
  const [user, setUser] = useState<{ id: string, username: string, role: string, avatarUrl?: string } | null>(null);
  const [currentUnitId, setCurrentUnitId] = useState<string | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [practiceContext, setPracticeContext] = useState<any>(null);

  useEffect(() => {
    checkDbConfigured().then(configured => {
      setIsDbConfigured(configured);
      if (configured) {
        getSessionData().then(session => {
          if (session) {
            setUser(session);
            setAppState('DASHBOARD');
          } else {
            setAppState('LOGIN');
          }
        });
      } else {
        setAppState('INPUT');
      }
    });
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAppState('LOGIN');
  };

  const handleSaveProgress = async () => {
    if (!user || user.role === 'ADMIN') return;
    const progressData = {
      wordProgresses,
      stepCounter,
      stats,
      wordStats,
      currentSessionId,
      practiceContext
    };
    if (currentSessionId) {
      let totalCorrect = 0;
      let total = 0;
      Object.values(stats).forEach(s => {
        totalCorrect += s.correct;
        total += s.total;
      });
      const accuracy = total > 0 ? totalCorrect / total : 0;
      await pauseSession(currentSessionId, { accuracy }, wordStats);
    }
    await saveProgress(currentUnitId, progressData, isReviewMode);
    alert('进度已保存！');
    setAppState('DASHBOARD');
  };

  const handleStartExercise = async (words: any[], unitId: string | null, isReview: boolean, savedProgress?: any, contextInfo?: any) => {
    setCurrentUnitId(unitId);
    setIsReviewMode(isReview);
    
    if (savedProgress) {
      if (savedProgress.currentSessionId) {
        await resumeSession(savedProgress.currentSessionId);
        setCurrentSessionId(savedProgress.currentSessionId);
      } else {
        const sessionId = await startSession(unitId, isReview, savedProgress.practiceContext || contextInfo);
        if (sessionId) setCurrentSessionId(sessionId);
      }
      setWordProgresses(savedProgress.wordProgresses);
      setStepCounter(savedProgress.stepCounter);
      setStats(savedProgress.stats);
      setWordStats(savedProgress.wordStats);
      setPracticeContext(savedProgress.practiceContext || contextInfo);
      pickNextExercise(savedProgress.wordProgresses, savedProgress.stepCounter);
      setAppState('EXERCISE');
      return;
    }

    setPracticeContext(contextInfo);
    const sessionId = await startSession(unitId, isReview, contextInfo);
    if (sessionId) setCurrentSessionId(sessionId);

    const progresses: WordProgress[] = words.map(word => {
      const allTypes: ExerciseType[] = ['EN_TO_ZH', 'ZH_TO_EN', 'FILL', 'AUDIO_TO_ZH', 'AUDIO_SPELL'];
      const shuffled = shuffleArray(allTypes);
      const count = Math.floor(Math.random() * 2) + 2; 
      const selected = shuffled.slice(0, count);
      
      return {
        wordData: word,
        step: 0,
        dueAt: Math.floor(Math.random() * 3), 
        status: 'LEARNING',
        sequence: [...selected, 'SPELL']
      };
    });
    setWordProgresses(progresses);
    
    const initialWordStats: Record<string, { correct: number; incorrect: number }> = {};
    words.forEach(w => {
      initialWordStats[w.word] = { correct: 0, incorrect: 0 };
    });
    setWordStats(initialWordStats);
    setShowWordStats(false);

    setStepCounter(0);
    setStats({
      EN_TO_ZH: { correct: 0, total: 0 },
      ZH_TO_EN: { correct: 0, total: 0 },
      FILL: { correct: 0, total: 0 },
      SPELL: { correct: 0, total: 0 },
      AUDIO_TO_ZH: { correct: 0, total: 0 },
      AUDIO_SPELL: { correct: 0, total: 0 },
    });
    pickNextExercise(progresses, 0);
    setAppState('EXERCISE');
  };

  const [wordsInput, setWordsInput] = useState('');
  const [error, setError] = useState('');

  const [wordProgresses, setWordProgresses] = useState<WordProgress[]>([]);
  const [stepCounter, setStepCounter] = useState(0);
  const [stats, setStats] = useState<Stats>({
    EN_TO_ZH: { correct: 0, total: 0 },
    ZH_TO_EN: { correct: 0, total: 0 },
    FILL: { correct: 0, total: 0 },
    SPELL: { correct: 0, total: 0 },
    AUDIO_TO_ZH: { correct: 0, total: 0 },
    AUDIO_SPELL: { correct: 0, total: 0 },
  });
  const [wordStats, setWordStats] = useState<Record<string, { correct: number; incorrect: number }>>({});
  const [showWordStats, setShowWordStats] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const [showFeedback, setShowFeedback] = useState(false);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');

  const pickNextExercise = (progresses: WordProgress[], currentStep: number) => {
    const learningWords = progresses.filter(p => p.status === 'LEARNING');
    if (learningWords.length === 0) {
      if (currentSessionId) {
        // Calculate overall accuracy
        let totalCorrect = 0;
        let total = 0;
        Object.values(stats).forEach(s => {
          totalCorrect += s.correct;
          total += s.total;
        });
        const accuracy = total > 0 ? totalCorrect / total : 0;
        endSession(currentSessionId, { accuracy }, wordStats);
        setCurrentSessionId(null);
      }
      setAppState('RESULT');
      return;
    }

    let dueWords = learningWords.filter(p => p.dueAt <= currentStep);
    if (dueWords.length === 0) {
      const minDueAt = Math.min(...learningWords.map(p => p.dueAt));
      dueWords = learningWords.filter(p => p.dueAt === minDueAt);
    }

    const pickedProgress = dueWords[Math.floor(Math.random() * dueWords.length)];
    const type = pickedProgress.sequence[pickedProgress.step];
    const word = pickedProgress.wordData;

    const exercise: Exercise = {
      id: `${word.word}-${type}-${Date.now()}`,
      word,
      type,
      options: (type === 'EN_TO_ZH' || type === 'AUDIO_TO_ZH') 
        ? shuffleArray([word.translation, ...word.distractorsZh.slice(0, 3)])
        : type === 'ZH_TO_EN'
        ? shuffleArray([word.word, ...word.distractorsEn.slice(0, 3)])
        : undefined,
      maskedWord: type === 'FILL' ? maskWord(word.word) : undefined
    };

    setCurrentExercise(exercise);
  };

  const handleAnalyze = async () => {
    if (!wordsInput.trim()) {
      setError('请输入至少一个单词');
      return;
    }
    setError('');
    setAppState('ANALYZING');
    try {
      const analyzed = await analyzeWords(wordsInput);
      if (analyzed.length === 0) {
        throw new Error("未能识别到有效的英语单词，请检查输入。");
      }
      
      handleStartExercise(analyzed, null, false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '分析失败，请重试');
      setAppState('INPUT');
    }
  };

  const submitAnswer = (answer: string) => {
    if (showSuccessAnim || showFeedback || !currentExercise) return;
    setUserAnswer(answer);
    let correct = false;
    if (currentExercise.type === 'EN_TO_ZH' || currentExercise.type === 'AUDIO_TO_ZH') {
      correct = answer === currentExercise.word.translation;
    } else if (currentExercise.type === 'ZH_TO_EN') {
      correct = answer === currentExercise.word.word;
    } else if (currentExercise.type === 'SPELL' || currentExercise.type === 'FILL' || currentExercise.type === 'AUDIO_SPELL') {
      correct = answer.trim().toLowerCase() === currentExercise.word.word.toLowerCase();
    }

    setIsCorrect(correct);
    
    setStats(prev => ({
      ...prev,
      [currentExercise.type]: {
        correct: prev[currentExercise.type].correct + (correct ? 1 : 0),
        total: prev[currentExercise.type].total + 1
      }
    }));

    setWordStats(prev => ({
      ...prev,
      [currentExercise.word.word]: {
        correct: (prev[currentExercise.word.word]?.correct || 0) + (correct ? 1 : 0),
        incorrect: (prev[currentExercise.word.word]?.incorrect || 0) + (correct ? 0 : 1),
      }
    }));

    if (correct) {
      setShowSuccessAnim(true);
    } else {
      setShowFeedback(true);
    }
  };

  const nextExercise = () => {
    setShowFeedback(false);
    setShowSuccessAnim(false);
    setUserAnswer('');
    
    if (!currentExercise) return;

    const newCounter = stepCounter + 1;
    setStepCounter(newCounter);

    const newProgresses = [...wordProgresses];
    const progressIndex = newProgresses.findIndex(p => p.wordData.word === currentExercise.word.word);
    
    if (progressIndex !== -1) {
      const progress = { ...newProgresses[progressIndex] };
      
      if (isCorrect) {
        progress.step += 1;
        if (progress.step >= progress.sequence.length) {
          progress.status = 'MASTERED';
        } else {
          progress.dueAt = newCounter + 2 + Math.floor(Math.random() * 2); // Spaced repetition delay with jitter
        }
      } else {
        progress.dueAt = newCounter; // Immediate review
        
        // Ensure all 6 types are in sequence if a mistake is made, and SPELL is always the last
        const allTypes: ExerciseType[] = ['EN_TO_ZH', 'ZH_TO_EN', 'FILL', 'AUDIO_TO_ZH', 'AUDIO_SPELL', 'SPELL'];
        const missingTypes = allTypes.filter(t => !progress.sequence.includes(t));
        if (missingTypes.length > 0) {
          const sequenceWithoutSpell = progress.sequence.filter(t => t !== 'SPELL');
          const missingWithoutSpell = missingTypes.filter(t => t !== 'SPELL');
          progress.sequence = [...sequenceWithoutSpell, ...shuffleArray(missingWithoutSpell), 'SPELL'];
        }
      }
      
      newProgresses[progressIndex] = progress;
      setWordProgresses(newProgresses);
      pickNextExercise(newProgresses, newCounter);
    }
  };

  const nextExerciseRef = useRef(nextExercise);
  useEffect(() => {
    nextExerciseRef.current = nextExercise;
  });

  useEffect(() => {
    if (showSuccessAnim) {
      const timer = setTimeout(() => {
        nextExerciseRef.current();
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [showSuccessAnim]);

  const getCorrectAnswerText = () => {
    if (!currentExercise) return '';
    switch (currentExercise.type) {
      case 'EN_TO_ZH': return currentExercise.word.translation;
      case 'ZH_TO_EN': return currentExercise.word.word;
      case 'SPELL': return currentExercise.word.word;
      case 'FILL': return currentExercise.word.word;
      case 'AUDIO_TO_ZH': return currentExercise.word.translation;
      case 'AUDIO_SPELL': return currentExercise.word.word;
    }
  };

  useEffect(() => {
    if (currentExercise && (currentExercise.type === 'AUDIO_TO_ZH' || currentExercise.type === 'AUDIO_SPELL')) {
      playAudio(currentExercise.word.word);
    }
  }, [currentExercise]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && showFeedback) {
        e.preventDefault();
        nextExerciseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFeedback]);

  useEffect(() => {
    if (appState === 'EXERCISE' && !showFeedback && currentExercise?.type === 'EN_TO_ZH') {
      playAudio(currentExercise.word.word);
    }
  }, [appState, showFeedback, currentExercise]);

  const masteredCount = wordProgresses.filter(p => p.status === 'MASTERED').length;
  const totalWords = wordProgresses.length;
  const learningCount = totalWords - masteredCount;
  const totalSteps = wordProgresses.reduce((sum, p) => sum + p.sequence.length, 0);
  const completedSteps = wordProgresses.reduce((sum, p) => sum + p.step, 0);

  const getAccuracy = (type: ExerciseType) => {
    const s = stats[type];
    if (s.total === 0) return 0;
    return Math.round((s.correct / s.total) * 100);
  };

  const handleGoToDashboard = async () => {
    if (appState === 'EXERCISE') {
      if (currentSessionId) {
        let totalCorrect = 0;
        let total = 0;
        Object.values(stats).forEach(s => {
          totalCorrect += s.correct;
          total += s.total;
        });
        const accuracy = total > 0 ? totalCorrect / total : 0;
        await pauseSession(currentSessionId, { accuracy }, wordStats);
      }
      if (user && user.role !== 'ADMIN') {
        const progressData = { wordProgresses, stepCounter, stats, wordStats, currentSessionId };
        await saveProgress(currentUnitId, progressData, isReviewMode);
      }
    }
    setAppState('DASHBOARD');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 dark:bg-slate-950 relative selection:bg-indigo-500/30">
      {/* Global Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[120px]"></div>
      </div>

      <header className="bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-50 transition-colors duration-300 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => user ? handleGoToDashboard() : setAppState('INPUT')}>
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl group-hover:scale-105 transition-transform shadow-md shadow-indigo-500/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-br from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">Revel Word</h1>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-white/50 dark:bg-slate-900/50 py-1.5 px-3 rounded-full border border-slate-200/50 dark:border-slate-800/50 shadow-sm backdrop-blur-sm">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-700 shadow-sm" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-xs shadow-sm border border-indigo-200/50 dark:border-indigo-800/50">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 pr-1">{user.username}</span>
                </div>
                {user.role === 'ADMIN' && (
                  <button onClick={() => setAppState('ADMIN')} className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-slate-100/50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-full">
                    <Settings className="w-4 h-4" /> 管理
                  </button>
                )}
                <button onClick={() => setAppState('USER_PANEL')} className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-slate-100/50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-full">
                  <Activity className="w-4 h-4" /> 我的记录
                </button>
                <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors bg-slate-100/50 dark:bg-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-900/30 px-3 py-1.5 rounded-full">
                  <LogOut className="w-4 h-4" /> 退出
                </button>
              </div>
            )}
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full relative z-10">
        <AnimatePresence mode="wait">
          {appState === 'LOGIN' && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Login onLogin={(u) => { setUser(u); setAppState('DASHBOARD'); }} />
            </motion.div>
          )}

          {appState === 'ADMIN' && user?.role === 'ADMIN' && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminPanel onBack={() => setAppState('DASHBOARD')} />
            </motion.div>
          )}

          {appState === 'DASHBOARD' && user && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dashboard onStartExercise={handleStartExercise} onUserPanelClick={() => setAppState('USER_PANEL')} />
            </motion.div>
          )}

          {appState === 'USER_PANEL' && user && (
            <motion.div key="user-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UserPanel onBack={() => setAppState('DASHBOARD')} />
            </motion.div>
          )}

          {appState === 'INPUT' && (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto mt-12 md:mt-20 px-4"
            >
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/20 dark:shadow-black/40 border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-700"></div>
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400 shadow-inner">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">输入你要复习的单词</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg leading-relaxed">支持用逗号、空格或换行分隔。AI 将自动为你生成多维度的记忆测试。建议每次输入 10-20 个单词。</p>
                  
                  <div className="relative group/textarea">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-0 group-hover/textarea:opacity-20 transition duration-500"></div>
                    <textarea
                      value={wordsInput}
                      onChange={e => setWordsInput(e.target.value)}
                      className="relative w-full h-56 p-6 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-700/50 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none transition-all text-slate-700 dark:text-slate-200 text-lg leading-relaxed placeholder:text-slate-400 font-medium shadow-inner"
                      placeholder="例如: apple, banana, computer..."
                    />
                  </div>
                  
                  {error && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-rose-500 mt-4 text-sm font-bold flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/30 p-3 rounded-xl">
                      <XCircle className="w-5 h-5"/>{error}
                    </motion.p>
                  )}
                  
                  <button
                    onClick={handleAnalyze}
                    className="mt-8 w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40"
                  >
                    开始生成专属练习 <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {appState === 'ANALYZING' && (
            <motion.div 
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto mt-32 px-4 text-center flex flex-col items-center"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="relative bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 text-indigo-600 dark:text-indigo-400"
                >
                  <RefreshCw className="w-12 h-12" />
                </motion.div>
              </div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">AI 正在分析单词...</h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg">正在为你生成中文翻译、例句及多维度测试题，请稍候。</p>
            </motion.div>
          )}

          {appState === 'EXERCISE' && currentExercise && (
            <motion.div 
              key="exercise"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto mt-8 px-4 flex flex-col lg:flex-row gap-8 items-start relative z-10 pb-20"
            >
              <div className="flex-1 w-full max-w-4xl mx-auto">
                {practiceContext && (
                  <div className="mb-6 flex items-center justify-center">
                    <div className="inline-flex items-center gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-6 py-2.5 rounded-full border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                      <span className="flex items-center gap-2 text-sm font-black text-indigo-600 dark:text-indigo-400">
                        {practiceContext.type === 'REVIEW' ? <RefreshCw className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                        {practiceContext.title}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                      <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{practiceContext.subtitle}</span>
                      {practiceContext.details && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                          <span className="text-sm font-medium text-slate-400 dark:text-slate-500 max-w-[200px] truncate" title={practiceContext.details}>{practiceContext.details}</span>
                        </>
                      )}
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                      <span className="text-sm font-bold text-slate-500 dark:text-slate-400">共 {practiceContext.totalWords || totalWords} 词</span>
                    </div>
                  </div>
                )}
                <div className="mb-8">
                  <div className="flex justify-between items-end mb-4">
                    <div className="flex items-center gap-4 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-900/50 px-4 py-2 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm shadow-sm">
                      <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> 已掌握: {masteredCount} / {totalWords}</span>
                      <div className="w-px h-4 bg-slate-300 dark:bg-slate-700"></div>
                      <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-amber-500" /> 学习中: {learningCount}</span>
                    </div>
                    {user && user.role !== 'ADMIN' && (
                      <button onClick={handleSaveProgress} className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-900/50 text-sm font-bold text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-colors border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm shadow-sm hover:shadow-md">
                        <Save className="w-4 h-4" /> 保存并退出
                      </button>
                    )}
                  </div>
                  <div className="h-4 bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm shadow-inner">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }}></div>
                    </motion.div>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 sm:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/20 dark:shadow-black/40 border border-slate-200/50 dark:border-slate-800/50 min-h-[500px] flex flex-col relative overflow-hidden">
                <AnimatePresence>
                  {showSuccessAnim && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", duration: 0.6, bounce: 0.5 }}
                      >
                        <div className="w-32 h-32 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                          <CheckCircle className="w-20 h-20 text-emerald-500 drop-shadow-lg" />
                        </div>
                      </motion.div>
                      <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight"
                      >
                        回答正确！
                      </motion.h3>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {!showFeedback ? (
                    <motion.div 
                      key={currentExercise.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex-1 flex flex-col relative z-10"
                    >
                      <div className="mb-10 text-center">
                        <span className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-bold mb-8 border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                          {currentExercise.type === 'EN_TO_ZH' && '选择正确的中文意思'}
                          {currentExercise.type === 'ZH_TO_EN' && '选择正确的英文单词'}
                          {currentExercise.type === 'SPELL' && '根据中文拼写单词'}
                          {currentExercise.type === 'FILL' && '补全单词缺失的字母'}
                          {currentExercise.type === 'AUDIO_TO_ZH' && '听音辨意'}
                          {currentExercise.type === 'AUDIO_SPELL' && '听音拼写'}
                        </span>
                        {(currentExercise.type === 'AUDIO_TO_ZH' || currentExercise.type === 'AUDIO_SPELL') ? (
                          <div className="flex flex-col items-center justify-center gap-6">
                            <button 
                              onClick={() => playAudio(currentExercise.word.word)} 
                              className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/20 transition-all border border-indigo-200/50 dark:border-indigo-800/50 relative group"
                            >
                              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping opacity-0 group-hover:opacity-100"></div>
                              <Volume2 className="w-16 h-16 relative z-10" />
                            </button>
                            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                              {currentExercise.type === 'AUDIO_TO_ZH' ? '请选择听到的单词意思' : '请拼写听到的单词'}
                            </h2>
                          </div>
                        ) : (
                          <h2 className="text-5xl md:text-6xl font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-4 tracking-tight">
                            {currentExercise.type === 'EN_TO_ZH' ? currentExercise.word.word : currentExercise.word.translation}
                            {currentExercise.type === 'EN_TO_ZH' && (
                              <button onClick={() => playAudio(currentExercise.word.word)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl transition-all shadow-sm hover:shadow-md">
                                <Volume2 className="w-8 h-8" />
                              </button>
                            )}
                          </h2>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
                        {(currentExercise.type === 'EN_TO_ZH' || currentExercise.type === 'AUDIO_TO_ZH') && <MultipleChoice options={currentExercise.options!} onSubmit={submitAnswer} />}
                        {currentExercise.type === 'ZH_TO_EN' && <MultipleChoice options={currentExercise.options!} onSubmit={submitAnswer} />}
                        {(currentExercise.type === 'SPELL' || currentExercise.type === 'AUDIO_SPELL') && <SpellInput key={currentExercise.id} onSubmit={submitAnswer} />}
                        {currentExercise.type === 'FILL' && <SpellInput key={currentExercise.id} onSubmit={submitAnswer} maskedWord={currentExercise.maskedWord} />}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="feedback"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex-1 flex flex-col justify-center relative z-10"
                    >
                      <div className="p-8 sm:p-10 rounded-[2rem] bg-rose-50/80 dark:bg-rose-900/20 text-rose-800 dark:text-rose-200 border border-rose-200/50 dark:border-rose-800/50 backdrop-blur-sm shadow-xl shadow-rose-500/10">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-rose-100 dark:bg-rose-900/50 rounded-2xl text-rose-500 dark:text-rose-400">
                            <XCircle className="w-8 h-8" />
                          </div>
                          <h3 className="text-3xl font-black tracking-tight">回答错误</h3>
                        </div>
                        
                        <div className="space-y-4 bg-white/80 dark:bg-slate-900/80 p-6 rounded-2xl text-left mt-6 shadow-sm border border-slate-200/50 dark:border-slate-800/50">
                          <p className="text-xl mb-2 flex items-center gap-2"><span className="font-bold text-slate-500 dark:text-slate-400">正确答案：</span><span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-lg">{getCorrectAnswerText()}</span></p>
                          {['SPELL', 'FILL', 'AUDIO_SPELL'].includes(currentExercise.type) && (
                            <p className="text-xl mb-2 flex items-center gap-2"><span className="font-bold text-slate-500 dark:text-slate-400">你的答案：</span><span className="font-black text-rose-600 dark:text-rose-400 line-through bg-rose-50 dark:bg-rose-900/30 px-3 py-1 rounded-lg">{userAnswer}</span></p>
                          )}
                          <div className="pt-6 mt-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                              <p className="font-black text-slate-900 dark:text-slate-100 text-2xl">{currentExercise.word.word}</p>
                              <button onClick={() => playAudio(currentExercise.word.word)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors">
                                <Volume2 className="w-5 h-5" />
                              </button>
                            </div>
                            
                            <div className="mt-4 space-y-2">
                              {currentExercise.word.definitions?.map((def, i) => (
                                <p key={i} className="text-slate-700 dark:text-slate-300 text-lg">
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400 mr-3 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">{def.pos}</span>
                                  {def.meaning}
                                </p>
                              ))}
                            </div>

                            {currentExercise.word.relatedForms && currentExercise.word.relatedForms.length > 0 && (
                              <div className="mt-5 flex flex-wrap gap-2">
                                {currentExercise.word.relatedForms.map((form, i) => (
                                  <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700">
                                    {form}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mt-6 p-5 bg-indigo-50/80 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/50">
                              <p className="text-slate-800 dark:text-slate-200 text-lg font-medium leading-relaxed">{currentExercise.word.example}</p>
                              <p className="text-slate-500 dark:text-slate-400 mt-2">{currentExercise.word.exampleTranslation}</p>
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={nextExercise} 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.stopPropagation();
                            }
                          }}
                          className="mt-8 w-full py-5 rounded-2xl font-black text-xl text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 transition-all active:scale-95 shadow-xl shadow-rose-500/20 flex items-center justify-center gap-2"
                        >
                          继续 <span className="text-sm font-medium opacity-80 bg-black/10 px-2 py-0.5 rounded-md ml-2">按回车键</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="w-full lg:w-80 shrink-0 space-y-6">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-slate-200/20 dark:shadow-black/40 border border-slate-200/50 dark:border-slate-800/50 flex flex-col items-center">
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6 w-full text-left flex items-center gap-2">
                    <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                    整体准确率
                  </h3>
                  <RingChart 
                    percentage={
                      Object.values(stats).reduce((sum, s) => sum + s.total, 0) === 0 
                        ? 0 
                        : Math.round((Object.values(stats).reduce((sum, s) => sum + s.correct, 0) / Object.values(stats).reduce((sum, s) => sum + s.total, 0)) * 100)
                    } 
                    size={160} 
                    strokeWidth={14} 
                    colorClass="text-indigo-600 dark:text-indigo-400" 
                  />
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-slate-200/20 dark:shadow-black/40 border border-slate-200/50 dark:border-slate-800/50">
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
                    各题型准确率
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col items-center bg-slate-50/50 dark:bg-slate-950/50 p-3 rounded-2xl">
                      <RingChart percentage={getAccuracy('EN_TO_ZH')} size={80} strokeWidth={8} colorClass="text-emerald-500 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">英译中</span>
                    </div>
                    <div className="flex flex-col items-center bg-slate-50/50 dark:bg-slate-950/50 p-3 rounded-2xl">
                      <RingChart percentage={getAccuracy('ZH_TO_EN')} size={80} strokeWidth={8} colorClass="text-blue-500 dark:text-blue-400" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">中译英</span>
                    </div>
                    <div className="flex flex-col items-center bg-slate-50/50 dark:bg-slate-950/50 p-3 rounded-2xl">
                      <RingChart percentage={getAccuracy('FILL')} size={80} strokeWidth={8} colorClass="text-amber-500 dark:text-amber-400" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">补全单词</span>
                    </div>
                    <div className="flex flex-col items-center bg-slate-50/50 dark:bg-slate-950/50 p-3 rounded-2xl">
                      <RingChart percentage={getAccuracy('SPELL')} size={80} strokeWidth={8} colorClass="text-rose-500 dark:text-rose-400" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">拼写</span>
                    </div>
                    <div className="flex flex-col items-center bg-slate-50/50 dark:bg-slate-950/50 p-3 rounded-2xl">
                      <RingChart percentage={getAccuracy('AUDIO_TO_ZH')} size={80} strokeWidth={8} colorClass="text-purple-500 dark:text-purple-400" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">听音辨意</span>
                    </div>
                    <div className="flex flex-col items-center bg-slate-50/50 dark:bg-slate-950/50 p-3 rounded-2xl">
                      <RingChart percentage={getAccuracy('AUDIO_SPELL')} size={80} strokeWidth={8} colorClass="text-pink-500 dark:text-pink-400" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">听音拼写</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {appState === 'RESULT' && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto mt-12 md:mt-20 px-4 text-center relative z-10 pb-20"
            >
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/20 dark:shadow-black/40 border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none"></div>
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                  className="inline-block mb-8 relative"
                >
                  <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/50 dark:to-amber-900/50 p-6 rounded-full text-yellow-600 dark:text-yellow-400 shadow-xl shadow-yellow-500/20 border border-yellow-200/50 dark:border-yellow-800/50">
                    <Trophy className="w-20 h-20 drop-shadow-md" />
                  </div>
                </motion.div>
                <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 mb-4 tracking-tight">太棒了！</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xl mb-10 font-medium">你已经成功掌握了这批所有的单词！</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6 mb-10 text-left">
                  <div className="bg-white/50 dark:bg-slate-950/50 p-5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 hover:shadow-md transition-shadow">
                    <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>英译中</div>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{getAccuracy('EN_TO_ZH')}%</div>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-950/50 p-5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 hover:shadow-md transition-shadow">
                    <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div>中译英</div>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{getAccuracy('ZH_TO_EN')}%</div>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-950/50 p-5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 hover:shadow-md transition-shadow">
                    <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div>补全单词</div>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{getAccuracy('FILL')}%</div>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-950/50 p-5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 hover:shadow-md transition-shadow">
                    <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div>拼写</div>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{getAccuracy('SPELL')}%</div>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-950/50 p-5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 hover:shadow-md transition-shadow">
                    <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div>听音辨意</div>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{getAccuracy('AUDIO_TO_ZH')}%</div>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-950/50 p-5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 hover:shadow-md transition-shadow">
                    <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-pink-500"></div>听音拼写</div>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{getAccuracy('AUDIO_SPELL')}%</div>
                  </div>
                </div>

                <div className="mb-10">
                  <button
                    onClick={() => setShowWordStats(!showWordStats)}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors flex items-center justify-center w-full bg-indigo-50 dark:bg-indigo-900/30 py-3 rounded-xl"
                  >
                    {showWordStats ? '隐藏每个单词的统计' : '查看每个单词的统计'}
                  </button>
                  
                  <AnimatePresence>
                    {showWordStats && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-4"
                      >
                        <div className="bg-white/50 dark:bg-slate-950/50 rounded-2xl shadow-inner border border-slate-200/50 dark:border-slate-800/50 overflow-hidden text-left">
                          <div className="grid grid-cols-3 bg-slate-100/50 dark:bg-slate-900/50 p-4 border-b border-slate-200/50 dark:border-slate-800/50 text-sm font-black text-slate-600 dark:text-slate-400">
                            <div>单词</div>
                            <div className="text-center">正确率</div>
                            <div className="text-center">错误次数</div>
                          </div>
                          <div className="divide-y divide-slate-100 dark:divide-slate-800/50 max-h-64 overflow-y-auto">
                            {Object.entries(wordStats).map(([word, stat]) => {
                              const total = stat.correct + stat.incorrect;
                              const acc = total > 0 ? Math.round((stat.correct / total) * 100) : 0;
                              return (
                                <div key={word} className="grid grid-cols-3 p-4 text-sm items-center hover:bg-white/50 dark:hover:bg-slate-900/50 transition-colors">
                                  <div className="font-bold text-slate-800 dark:text-slate-200 text-lg">{word}</div>
                                  <div className="text-center">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${acc >= 80 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : acc >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'}`}>
                                      {acc}%
                                    </span>
                                  </div>
                                  <div className="text-center font-mono text-slate-500 dark:text-slate-400 font-bold text-lg">{stat.incorrect}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={async () => {
                    if (user) {
                      await deleteProgress(currentUnitId, isReviewMode);
                      setAppState('DASHBOARD');
                    } else {
                      setWordsInput('');
                      setAppState('INPUT');
                    }
                  }}
                  className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-black text-xl transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
                >
                  {user ? '返回仪表盘' : '再来一组'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AIAssistant />
      </main>
    </div>
  );
}
