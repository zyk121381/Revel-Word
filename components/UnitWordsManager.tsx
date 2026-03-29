import { useState, useEffect, useCallback } from 'react';
import { getUnitWords, updateWord, deleteWord, addWordToUnit } from '@/app/actions';
import { analyzeWords } from '@/lib/analyze';
import { ArrowLeft, Trash2, Edit2, Plus, Loader2, Save, X } from 'lucide-react';
import { useModal } from './useModal';

export function UnitWordsManager({ unit, onBack, setError }: any) {
  const { showConfirm, ModalComponent } = useModal();
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWord, setEditingWord] = useState<any>(null);
  const [newWordsInput, setNewWordsInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [regenerating, setRegenerating] = useState(false);

  const loadWords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUnitWords(unit.id);
      setWords(data);
      setSelectedWords(new Set());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [unit.id, setError]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const toggleWordSelection = (id: string) => {
    const newSelection = new Set(selectedWords);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedWords(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedWords.size === words.length) {
      setSelectedWords(new Set());
    } else {
      setSelectedWords(new Set(words.map(w => w.id)));
    }
  };

  const handleRegenerate = async () => {
    if (selectedWords.size === 0) return;
    
    showConfirm({
      title: '重新生成题目',
      message: `确定要让 AI 重新生成选中的 ${selectedWords.size} 个单词的题目吗？`,
      confirmText: '确定生成',
      type: 'warning',
      onConfirm: async () => {
        setRegenerating(true);
        try {
          const wordsToRegenerate = words.filter(w => selectedWords.has(w.id));
          const wordsText = wordsToRegenerate.map(w => w.word).join(', ');
          
          const analyzed = await analyzeWords(wordsText);
          if (analyzed.length === 0) throw new Error('未能识别到有效的英语单词');
          
          // Update each word
          for (const newWordData of analyzed) {
            const oldWord = wordsToRegenerate.find(w => w.word.toLowerCase() === newWordData.word.toLowerCase());
            if (oldWord) {
              await updateWord(oldWord.id, newWordData);
            }
          }
          
          await loadWords();
        } catch (err: any) {
          setError(err.message);
        } finally {
          setRegenerating(false);
        }
      }
    });
  };

  const handleDelete = async (id: string) => {
    showConfirm({
      title: '删除单词',
      message: '确定删除该单词吗？',
      confirmText: '删除',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteWord(id);
          await loadWords();
        } catch (err: any) {
          setError(err.message);
        }
      }
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { id, ...data } = editingWord;
      await updateWord(id, data);
      setEditingWord(null);
      await loadWords();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddWords = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const analyzed = await analyzeWords(newWordsInput);
      if (analyzed.length === 0) throw new Error('未能识别到有效的英语单词');
      for (const wordData of analyzed) {
        await addWordToUnit(unit.id, wordData);
      }
      setNewWordsInput('');
      await loadWords();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{unit.name} - 单词管理</h3>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <h4 className="font-bold mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> 添加新单词</h4>
        <form onSubmit={handleAddWords} className="space-y-4">
          <textarea
            value={newWordsInput}
            onChange={e => setNewWordsInput(e.target.value)}
            placeholder="输入要添加的英语单词，用逗号或空格分隔..."
            className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
            required
          />
          <button disabled={adding} type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            添加单词
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={words.length > 0 && selectedWords.size === words.length}
                onChange={toggleAllSelection}
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">全选 ({selectedWords.size}/{words.length})</span>
            </label>
            <button 
              onClick={handleRegenerate}
              disabled={selectedWords.size === 0 || regenerating}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-bold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
              AI 重新出题
            </button>
          </div>
          
          {words.map(word => (
            <div key={word.id} className={`bg-white dark:bg-slate-900 p-4 rounded-xl border ${selectedWords.has(word.id) ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-800'} shadow-sm flex flex-col gap-3 transition-all`}>
              {editingWord?.id === word.id ? (
                <form onSubmit={handleUpdate} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">单词</label>
                      <input
                        value={editingWord.word}
                        onChange={e => setEditingWord({...editingWord, word: e.target.value})}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                        placeholder="单词"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">简短翻译</label>
                      <input
                        value={editingWord.translation}
                        onChange={e => setEditingWord({...editingWord, translation: e.target.value})}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                        placeholder="翻译"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">例句</label>
                    <textarea
                      value={editingWord.example || ''}
                      onChange={e => setEditingWord({...editingWord, example: e.target.value})}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm resize-none h-16"
                      placeholder="英文例句"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">例句翻译</label>
                    <textarea
                      value={editingWord.exampleTranslation || ''}
                      onChange={e => setEditingWord({...editingWord, exampleTranslation: e.target.value})}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm resize-none h-16"
                      placeholder="例句中文翻译"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">中文干扰项 (用逗号分隔)</label>
                      <input
                        value={(editingWord.distractorsZh || []).join(', ')}
                        onChange={e => setEditingWord({...editingWord, distractorsZh: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                        placeholder="中文干扰项"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">英文干扰项 (用逗号分隔)</label>
                      <input
                        value={(editingWord.distractorsEn || []).join(', ')}
                        onChange={e => setEditingWord({...editingWord, distractorsEn: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                        placeholder="英文干扰项"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setEditingWord(null)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2"><X className="w-4 h-4" /> 取消</button>
                    <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg flex items-center gap-2"><Save className="w-4 h-4" /> 保存</button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-center group">
                  <label className="flex items-center gap-4 cursor-pointer flex-1">
                    <input 
                      type="checkbox" 
                      checked={selectedWords.has(word.id)}
                      onChange={() => toggleWordSelection(word.id)}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-bold text-lg text-slate-800 dark:text-slate-200">{word.word}</div>
                      <div className="text-sm text-slate-500">{word.translation}</div>
                    </div>
                  </label>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingWord(word)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(word.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <ModalComponent />
    </div>
  );
}
