import { useState, useEffect } from 'react';
import { getUnitWords, updateWord, deleteWord, addWordToUnit } from '@/app/actions';
import { analyzeWords } from '@/lib/analyze';
import { ArrowLeft, Trash2, Edit2, Plus, Loader2, Save, X } from 'lucide-react';

export function UnitWordsManager({ unit, onBack, setError }: any) {
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWord, setEditingWord] = useState<any>(null);
  const [newWordsInput, setNewWordsInput] = useState('');
  const [adding, setAdding] = useState(false);

  const loadWords = async () => {
    setLoading(true);
    try {
      const data = await getUnitWords(unit.id);
      setWords(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWords();
  }, [unit.id]);

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该单词吗？')) return;
    try {
      await deleteWord(id);
      await loadWords();
    } catch (err: any) {
      setError(err.message);
    }
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
          {words.map(word => (
            <div key={word.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
              {editingWord?.id === word.id ? (
                <form onSubmit={handleUpdate} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={editingWord.word}
                      onChange={e => setEditingWord({...editingWord, word: e.target.value})}
                      className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg"
                      placeholder="单词"
                      required
                    />
                    <input
                      value={editingWord.translation}
                      onChange={e => setEditingWord({...editingWord, translation: e.target.value})}
                      className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg"
                      placeholder="翻译"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingWord(null)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-4 h-4" /></button>
                    <button type="submit" className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg"><Save className="w-4 h-4" /></button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-center group">
                  <div>
                    <div className="font-bold text-lg text-slate-800 dark:text-slate-200">{word.word}</div>
                    <div className="text-sm text-slate-500">{word.translation}</div>
                  </div>
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
    </div>
  );
}
