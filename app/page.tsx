'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, CheckCircle, XCircle, ArrowRight, RefreshCw, Trophy, Volume2, MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import Markdown from 'react-markdown';
import { createAIService, type AIConfig } from '@/lib/ai-service';

// --- Types ---
type ExerciseType = 'EN_TO_ZH' | 'ZH_TO_EN' | 'SPELL' | 'FILL' | 'AUDIO_TO_ZH' | 'AUDIO_SPELL';

interface WordDefinition {
  pos: string;
  meaning: string;
}

interface WordData {
  word: string;
  translation: string;
  definitions: WordDefinition[];
  relatedForms: string[];
  example: string;
  exampleTranslation: string;
  distractorsZh: string[];
  distractorsEn: string[];
}

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

// Build OpenAI-compatible schema from Gemini Type schema
const buildOpenAISchema = (geminiSchema: any) => {
  // This is a simplified conversion for the specific schema used in this app
  return {
    type: "object",
    properties: {
      words: {
        type: "array",
        items: {
          type: "object",
          properties: {
            word: { type: "string", description: "英文单词" },
            translation: { type: "string", description: "简短中文翻译（用于选择题）" },
            definitions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pos: { type: "string", description: "词性缩写，如 n., v., adj." },
                  meaning: { type: "string", description: "该词性下的中文意思" }
                },
                required: ["pos", "meaning"]
              }
            },
            relatedForms: {
              type: "array",
              items: { type: "string" }
            },
            example: { type: "string" },
            exampleTranslation: { type: "string" },
            distractorsZh: { type: "array", items: { type: "string" } },
            distractorsEn: { type: "array", items: { type: "string" } }
          },
          required: ["word", "translation", "definitions", "relatedForms", "example", "exampleTranslation", "distractorsZh", "distractorsEn"]
        }
      }
    },
    required: ["words"]
  };
};

const analyzeWords = async (words: string) => {
  const aiService = createAIService();
  const provider = process.env.NEXT_PUBLIC_AI_PROVIDER || 'openai';

  const prompt = `请分析以下英语单词列表。对于每个单词，请提供：
1. 简短中文翻译和中文的词性（用于选择题）
2. 详细的词性和多重意思列表
3. 相关的词汇变形（如过去式、过去分词、复数、副词形式等，请注明变形类型）
4. 一个英文例句
5. 例句的中文翻译
6. 3个用于选择题的中文干扰项和它们的词性（与其他单词的意思不同）
7. 3个用于选择题的英文干扰项（形近词或其他单词）

如果输入的文本中包含非英语单词或无意义的内容，请忽略它们。只返回有效英语单词的分析结果。

单词列表：
${words}`;

  let responseSchema: any;

  if (provider === 'openai') {
    // OpenAI schema format
    responseSchema = {
      words: [
        {
          word: "英文单词",
          translation: "简短中文翻译",
          definitions: [
            { pos: "n.", meaning: "名词含义" }
          ],
          relatedForms: ["过去式", "过去分词", "复数形式"],
          example: "英文例句",
          exampleTranslation: "例句翻译",
          distractorsZh: ["干扰项1", "干扰项2", "干扰项3"],
          distractorsEn: ["distraction1", "distraction2", "distraction3"]
        }
      ]
    };
  } else {
    // Gemini schema format - try to import Type dynamically
    try {
      const { Type } = require('@google/genai');
      responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING, description: "英文单词" },
            translation: { type: Type.STRING, description: "简短中文翻译（用于选择题）" },
            definitions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pos: { type: Type.STRING, description: "词性缩写，如 n., v., adj." },
                  meaning: { type: Type.STRING, description: "该词性下的中文意思" }
                },
                required: ["pos", "meaning"]
              },
              description: "单词的详细词性和多重意思"
            },
            relatedForms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "相关词汇变形（如过去式、过去分词、复数、副词形式等，例如 'went (过去式)'）"
            },
            example: { type: Type.STRING, description: "英文例句" },
            exampleTranslation: { type: Type.STRING, description: "例句中文翻译" },
            distractorsZh: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3个中文干扰项" },
            distractorsEn: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3个英文干扰项" },
          },
          required: ["word", "translation", "definitions", "relatedForms", "example", "exampleTranslation", "distractorsZh", "distractorsEn"]
        }
      };
    } catch (error) {
      throw new Error('Gemini SDK is not installed. Please install it with: npm install @google/genai');
    }
  }

  const response = await aiService.generateContent({
    prompt,
    responseSchema,
  });

  if (!response.text) throw new Error("AI 未返回结果");

  // Parse response
  let parsedData: WordData[];
  if (provider === 'openai') {
    const jsonResponse = JSON.parse(response.text);
    parsedData = jsonResponse.words || [];
  } else {
    parsedData = JSON.parse(response.text) as WordData[];
  }

  return parsedData;
};

// --- Components ---
const RingChart = ({ percentage, label, size = 120, strokeWidth = 10, colorClass = "text-indigo-600" }: { percentage: number, label?: string, size?: number, strokeWidth?: number, colorClass?: string }) => {
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
          className="text-slate-100"
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
        <span className="text-xl font-bold text-slate-800">{percentage}%</span>
        {label && <span className="text-xs text-slate-500 font-medium mt-1">{label}</span>}
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
      className="space-y-6 w-full max-w-md mx-auto"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.stopPropagation();
        }
      }}
    >
      {maskedWord && (
        <div className="text-center text-3xl font-mono tracking-widest text-slate-400 mb-6">
          {maskedWord.split('').map((char, i) => 
            char === '_' ? 
              <span key={i} className="inline-block w-6 border-b-4 border-slate-300 mx-1 mb-1"></span> : 
              <span key={i} className="inline-block w-6 mx-1 text-slate-800 font-bold">{char}</span>
          )}
        </div>
      )}
      <input 
        ref={inputRef}
        type="text" 
        value={val} 
        onChange={e => setVal(e.target.value)} 
        onKeyDown={handleKeyDown}
        className="w-full text-center text-2xl p-4 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
        placeholder={placeholder || "输入英文单词..."}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck="false"
      />
      <button 
        onClick={() => val.trim() && onSubmit(val.trim())}
        disabled={!val.trim()}
        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors"
      >
        提交
      </button>
    </div>
  );
};

const MultipleChoice = ({ options, onSubmit }: { options: string[], onSubmit: (val: string) => void }) => {
  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mx-auto"
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
          className="p-6 text-lg font-medium text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all active:scale-95 text-left flex items-center"
        >
          <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mr-4 text-sm font-bold shrink-0">
            {String.fromCharCode(65 + i)}
          </span>
          <span>{opt}</span>
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
            className="fixed bottom-24 right-6 w-[360px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden"
          >
            <div className="bg-indigo-600 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <h3 className="font-bold">英语学习助手</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.length === 0 && (
                <div className="text-center text-slate-400 mt-10 text-sm">
                  有什么关于英语单词或语法的问题？<br/>随时问我吧！
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2 ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm shadow-sm'}`}>
                    {msg.role === 'assistant' ? (
                      <div className="markdown-body text-sm prose prose-slate prose-sm max-w-none">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    ) : (
                      <div className="text-sm">{msg.content}</div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-white border-t border-slate-100 shrink-0">
              <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                  placeholder="输入你的问题..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="text-indigo-600 disabled:text-slate-400 transition-colors p-1"
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
  const [appState, setAppState] = useState<'INPUT' | 'ANALYZING' | 'EXERCISE' | 'RESULT'>('INPUT');
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

  const [showFeedback, setShowFeedback] = useState(false);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');

  const pickNextExercise = (progresses: WordProgress[], currentStep: number) => {
    const learningWords = progresses.filter(p => p.status === 'LEARNING');
    if (learningWords.length === 0) {
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
      
      const progresses: WordProgress[] = analyzed.map(word => {
        const baseTypes: ExerciseType[] = ['EN_TO_ZH', 'ZH_TO_EN', 'FILL', 'AUDIO_TO_ZH'];
        return {
          wordData: word,
          step: 0,
          dueAt: Math.floor(Math.random() * 3), // slight initial jitter to mix words
          status: 'LEARNING',
          sequence: [...shuffleArray(baseTypes), 'AUDIO_SPELL', 'SPELL']
        };
      });
      setWordProgresses(progresses);
      
      const initialWordStats: Record<string, { correct: number; incorrect: number }> = {};
      analyzed.forEach(w => {
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

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-2 text-indigo-600">
          <BookOpen className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight">Revel Word</h1>
        </div>
      </header>

      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          {appState === 'INPUT' && (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto mt-12 px-4"
            >
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">输入你要复习的单词</h2>
                <p className="text-slate-500 mb-6">支持用逗号、空格或换行分隔。AI 将自动为你生成多维度的记忆测试。建议每次输入 10-20 个单词。</p>
                
                <textarea
                  value={wordsInput}
                  onChange={e => setWordsInput(e.target.value)}
                  className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none transition-all text-slate-700 text-lg"
                  placeholder="例如: apple, banana, computer..."
                />
                
                {error && <p className="text-rose-500 mt-3 text-sm flex items-center gap-1"><XCircle className="w-4 h-4"/>{error}</p>}
                
                <button
                  onClick={handleAnalyze}
                  className="mt-6 w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  开始生成专属练习 <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {appState === 'ANALYZING' && (
            <motion.div 
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto mt-32 px-4 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="inline-block mb-6 text-indigo-600"
              >
                <RefreshCw className="w-12 h-12" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">AI 正在分析单词...</h2>
              <p className="text-slate-500">正在为你生成中文翻译、例句及多维度测试题，请稍候。</p>
            </motion.div>
          )}

          {appState === 'EXERCISE' && currentExercise && (
            <motion.div 
              key="exercise"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto mt-8 px-4 flex flex-col lg:flex-row gap-8 items-start"
            >
              <div className="flex-1 w-full">
                <div className="mb-8">
                  <div className="flex justify-between text-sm font-medium text-slate-500 mb-2">
                    <span>已掌握: {masteredCount} / {totalWords} 词</span>
                    <span>学习中: {learningCount} 词</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-indigo-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col relative overflow-hidden">
                <AnimatePresence>
                  {showSuccessAnim && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", duration: 0.6, bounce: 0.5 }}
                      >
                        <CheckCircle className="w-32 h-32 text-emerald-500 drop-shadow-lg" />
                      </motion.div>
                      <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-6 text-3xl font-bold text-emerald-600"
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
                      className="flex-1 flex flex-col"
                    >
                      <div className="mb-8 text-center">
                        <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-semibold mb-4">
                          {currentExercise.type === 'EN_TO_ZH' && '选择正确的中文意思'}
                          {currentExercise.type === 'ZH_TO_EN' && '选择正确的英文单词'}
                          {currentExercise.type === 'SPELL' && '根据中文拼写单词'}
                          {currentExercise.type === 'FILL' && '补全单词缺失的字母'}
                          {currentExercise.type === 'AUDIO_TO_ZH' && '听音辨意'}
                          {currentExercise.type === 'AUDIO_SPELL' && '听音拼写'}
                        </span>
                        {(currentExercise.type === 'AUDIO_TO_ZH' || currentExercise.type === 'AUDIO_SPELL') ? (
                          <div className="flex flex-col items-center justify-center gap-4">
                            <button 
                              onClick={() => playAudio(currentExercise.word.word)} 
                              className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-200 transition-colors shadow-sm"
                            >
                              <Volume2 className="w-12 h-12" />
                            </button>
                            <h2 className="text-2xl font-bold text-slate-800 mt-2">
                              {currentExercise.type === 'AUDIO_TO_ZH' ? '请选择听到的单词意思' : '请拼写听到的单词'}
                            </h2>
                          </div>
                        ) : (
                          <h2 className="text-4xl font-bold text-slate-800 flex items-center justify-center gap-3">
                            {currentExercise.type === 'EN_TO_ZH' ? currentExercise.word.word : currentExercise.word.translation}
                            {currentExercise.type === 'EN_TO_ZH' && (
                              <button onClick={() => playAudio(currentExercise.word.word)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                                <Volume2 className="w-6 h-6" />
                              </button>
                            )}
                          </h2>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-center">
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
                      className="flex-1 flex flex-col justify-center"
                    >
                      <div className="p-6 sm:p-8 rounded-2xl bg-rose-50 text-rose-800">
                        <div className="flex items-center gap-3 mb-4">
                          <XCircle className="w-8 h-8 text-rose-500" />
                          <h3 className="text-2xl font-bold">回答错误</h3>
                        </div>
                        
                        <div className="space-y-3 bg-white/60 p-5 rounded-xl text-left mt-4">
                          <p className="text-lg mb-2"><span className="font-semibold text-slate-700">正确答案：</span><span className="font-bold text-slate-900">{getCorrectAnswerText()}</span></p>
                          <div className="pt-3 border-t border-slate-200/60">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 text-xl">{currentExercise.word.word}</p>
                              <button onClick={() => playAudio(currentExercise.word.word)} className="text-slate-400 hover:text-indigo-600">
                                <Volume2 className="w-5 h-5" />
                              </button>
                            </div>
                            
                            <div className="mt-2 space-y-1">
                              {currentExercise.word.definitions?.map((def, i) => (
                                <p key={i} className="text-slate-700">
                                  <span className="font-semibold text-indigo-600 mr-2">{def.pos}</span>
                                  {def.meaning}
                                </p>
                              ))}
                            </div>

                            {currentExercise.word.relatedForms && currentExercise.word.relatedForms.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {currentExercise.word.relatedForms.map((form, i) => (
                                  <span key={i} className="px-2 py-1 bg-slate-200/70 text-slate-600 text-sm rounded-md">
                                    {form}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mt-4 p-3 bg-indigo-50/50 rounded-lg">
                              <p className="text-slate-700 text-lg">{currentExercise.word.example}</p>
                              <p className="text-slate-500 mt-1">{currentExercise.word.exampleTranslation}</p>
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
                          className="mt-8 w-full py-4 rounded-xl font-bold text-lg text-white bg-rose-500 hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
                        >
                          继续 <span className="text-sm font-normal opacity-80">(按回车键)</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="w-full lg:w-80 shrink-0 space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 w-full text-left">整体准确率</h3>
                  <RingChart 
                    percentage={
                      Object.values(stats).reduce((sum, s) => sum + s.total, 0) === 0 
                        ? 0 
                        : Math.round((Object.values(stats).reduce((sum, s) => sum + s.correct, 0) / Object.values(stats).reduce((sum, s) => sum + s.total, 0)) * 100)
                    } 
                    size={160} 
                    strokeWidth={14} 
                    colorClass="text-indigo-600" 
                  />
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">各题型准确率</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col items-center">
                      <RingChart percentage={getAccuracy('EN_TO_ZH')} size={80} strokeWidth={8} colorClass="text-emerald-500" />
                      <span className="text-xs font-medium text-slate-500 mt-2">英译中</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <RingChart percentage={getAccuracy('ZH_TO_EN')} size={80} strokeWidth={8} colorClass="text-blue-500" />
                      <span className="text-xs font-medium text-slate-500 mt-2">中译英</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <RingChart percentage={getAccuracy('FILL')} size={80} strokeWidth={8} colorClass="text-amber-500" />
                      <span className="text-xs font-medium text-slate-500 mt-2">补全单词</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <RingChart percentage={getAccuracy('SPELL')} size={80} strokeWidth={8} colorClass="text-rose-500" />
                      <span className="text-xs font-medium text-slate-500 mt-2">拼写</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <RingChart percentage={getAccuracy('AUDIO_TO_ZH')} size={80} strokeWidth={8} colorClass="text-purple-500" />
                      <span className="text-xs font-medium text-slate-500 mt-2">听音辨意</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <RingChart percentage={getAccuracy('AUDIO_SPELL')} size={80} strokeWidth={8} colorClass="text-pink-500" />
                      <span className="text-xs font-medium text-slate-500 mt-2">听音拼写</span>
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
              className="max-w-md mx-auto mt-24 px-4 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="inline-block mb-6 bg-yellow-100 p-6 rounded-full text-yellow-500"
              >
                <Trophy className="w-16 h-16" />
              </motion.div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">太棒了！</h2>
              <p className="text-slate-600 text-lg mb-8">你已经成功掌握了这批所有的单词！</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 text-left">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <div className="text-sm text-slate-500 mb-1">英译中准确率</div>
                  <div className="text-2xl font-bold text-slate-800">{getAccuracy('EN_TO_ZH')}%</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <div className="text-sm text-slate-500 mb-1">中译英准确率</div>
                  <div className="text-2xl font-bold text-slate-800">{getAccuracy('ZH_TO_EN')}%</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <div className="text-sm text-slate-500 mb-1">补全单词准确率</div>
                  <div className="text-2xl font-bold text-slate-800">{getAccuracy('FILL')}%</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <div className="text-sm text-slate-500 mb-1">拼写准确率</div>
                  <div className="text-2xl font-bold text-slate-800">{getAccuracy('SPELL')}%</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <div className="text-sm text-slate-500 mb-1">听音辨意准确率</div>
                  <div className="text-2xl font-bold text-slate-800">{getAccuracy('AUDIO_TO_ZH')}%</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <div className="text-sm text-slate-500 mb-1">听音拼写准确率</div>
                  <div className="text-2xl font-bold text-slate-800">{getAccuracy('AUDIO_SPELL')}%</div>
                </div>
              </div>

              <div className="mb-8">
                <button
                  onClick={() => setShowWordStats(!showWordStats)}
                  className="text-indigo-600 font-medium hover:text-indigo-800 transition-colors flex items-center justify-center w-full"
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
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-left">
                        <div className="grid grid-cols-3 bg-slate-50 p-3 border-b border-slate-200 text-sm font-bold text-slate-600">
                          <div>单词</div>
                          <div className="text-center">正确率</div>
                          <div className="text-center">错误次数</div>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                          {Object.entries(wordStats).map(([word, stat]) => {
                            const total = stat.correct + stat.incorrect;
                            const acc = total > 0 ? Math.round((stat.correct / total) * 100) : 0;
                            return (
                              <div key={word} className="grid grid-cols-3 p-3 text-sm items-center">
                                <div className="font-medium text-slate-800">{word}</div>
                                <div className="text-center">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${acc >= 80 ? 'bg-emerald-100 text-emerald-700' : acc >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                    {acc}%
                                  </span>
                                </div>
                                <div className="text-center font-mono text-slate-600">{stat.incorrect}</div>
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
                onClick={() => {
                  setWordsInput('');
                  setAppState('INPUT');
                }}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors"
              >
                再来一组
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <AIAssistant />
      </main>
    </div>
  );
}
