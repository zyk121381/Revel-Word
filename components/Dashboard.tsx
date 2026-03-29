import { useState, useEffect } from 'react';
import { getCategories, getUnits, getProgress, getReviewWords, getUnitWords, getMySessions } from '@/app/actions';
import { BookOpen, Play, RefreshCw, Loader2, Folder, FileText, ChevronRight, ChevronDown, Clock, Activity, CheckCircle2, PauseCircle } from 'lucide-react';
import { useModal } from './useModal';

export function Dashboard({ onStartExercise, onUserPanelClick }: { onStartExercise: (words: any[], unitId: string | null, isReview: boolean, savedProgress?: any, contextInfo?: any) => void, onUserPanelClick: () => void }) {
  const { showConfirm, showAlert, ModalComponent } = useModal();
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [reviewCount, setReviewCount] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([getCategories(), getUnits(), getMySessions()]).then(([cats, uns, sess]) => {
      setCategories(cats);
      setUnits(uns);
      setSessions(sess);
      setLoading(false);
    });
  }, []);

  const toggleCat = (id: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getFullUnitName = (unitId: string) => {
    const unit = units.find(u => u.id === unitId);
    if (!unit) return '未知单元';
    let path = [unit.name];
    let currentCat = categories.find(c => c.id === unit.categoryId);
    while (currentCat) {
      path.unshift(currentCat.name);
      currentCat = categories.find(c => c.id === currentCat?.parentId);
    }
    return path.join(' - ');
  };

  const handleStartUnit = async (unitId: string) => {
    setStarting(true);
    try {
      const unit = units.find(u => u.id === unitId);
      const fullPath = getFullUnitName(unitId);
      const parts = fullPath.split(' - ');
      const title = parts.pop() || '未知单元';
      const subtitle = parts.length > 0 ? parts.join(' - ') : '未分类';
      
      const contextInfo = {
        title,
        subtitle,
        type: 'LEARN'
      };

      const savedProgress = await getProgress(unitId, false);
      if (savedProgress) {
        showConfirm({
          title: '继续学习',
          message: '发现保存的学习进度，是否继续上次的学习？',
          confirmText: '继续学习',
          cancelText: '重新开始',
          type: 'info',
          onConfirm: () => {
            onStartExercise([], unitId, false, savedProgress, contextInfo);
            setStarting(false);
          },
          onCancel: async () => {
            try {
              const words = await getUnitWords(unitId);
              onStartExercise(words, unitId, false, undefined, { ...contextInfo, totalWords: words.length });
            } finally {
              setStarting(false);
            }
          }
        });
        return;
      }
      const words = await getUnitWords(unitId);
      onStartExercise(words, unitId, false, undefined, { ...contextInfo, totalWords: words.length });
    } finally {
      if (!starting) setStarting(false); // Only set if not waiting for modal
    }
  };

  const handleStartReview = async () => {
    if (selectedUnits.length === 0) {
      showAlert({ title: '提示', message: '请至少选择一个单元进行复习', type: 'warning' });
      return;
    }
    setStarting(true);
    try {
      const selectedUnitNames = selectedUnits.map(id => getFullUnitName(id));
      const contextInfo = {
        title: '智能复习',
        subtitle: `复习 ${selectedUnits.length} 个单元`,
        details: selectedUnitNames.join(', '),
        type: 'REVIEW'
      };

      const savedProgress = await getProgress(null, true);
      if (savedProgress) {
        showConfirm({
          title: '继续复习',
          message: '发现保存的复习进度，是否继续上次的复习？',
          confirmText: '继续复习',
          cancelText: '重新开始',
          type: 'info',
          onConfirm: () => {
            onStartExercise([], null, true, savedProgress, contextInfo);
            setStarting(false);
          },
          onCancel: async () => {
            try {
              const words = await getReviewWords(selectedUnits, reviewCount);
              if (words.length === 0) {
                showAlert({ title: '提示', message: '所选单元中没有单词', type: 'warning' });
                return;
              }
              onStartExercise(words, null, true, undefined, { ...contextInfo, totalWords: words.length });
            } finally {
              setStarting(false);
            }
          }
        });
        return;
      }
      const words = await getReviewWords(selectedUnits, reviewCount);
      if (words.length === 0) {
        showAlert({ title: '提示', message: '所选单元中没有单词', type: 'warning' });
        setStarting(false);
        return;
      }
      onStartExercise(words, null, true, undefined, { ...contextInfo, totalWords: words.length });
    } finally {
      if (!starting) setStarting(false); // Only set if not waiting for modal
    }
  };

  const toggleUnitSelection = (id: string) => {
    setSelectedUnits(prev => 
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  const renderCategoryTree = (cats: any[], parentId: string | null = null, depth = 0) => {
    const children = cats.filter(c => c.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <div className={`space-y-3 ${depth > 0 ? 'ml-6 mt-3 border-l-2 border-indigo-100 dark:border-indigo-900/50 pl-4 relative' : ''}`}>
        {children.map(cat => {
          const isExpanded = expandedCats.has(cat.id);
          return (
            <div key={cat.id} className="space-y-3 relative">
              {depth > 0 && (
                <div className="absolute -left-4 top-5 w-4 h-0.5 bg-indigo-100 dark:bg-indigo-900/50"></div>
              )}
              <button 
                onClick={() => toggleCat(cat.id)}
                className="w-full flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
              >
                <div className="flex items-center gap-3 font-bold text-slate-800 dark:text-slate-100 text-lg">
                  <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-500 group-hover:scale-110 transition-transform">
                    <Folder className="w-5 h-5 fill-amber-500/20" /> 
                  </div>
                  {cat.name}
                </div>
                <div className={`p-1.5 rounded-full transition-colors ${isExpanded ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500' : 'text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </button>
              
              {isExpanded && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                  {/* Units in this category */}
                  {cat.units?.length > 0 && (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ml-6 mt-3">
                      {cat.units.map((u: any) => (
                        <div key={u.id} className="p-4 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col justify-between hover:shadow-lg hover:shadow-indigo-500/10 transition-all group relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
                          <div className="relative z-10 flex items-start justify-between mb-4">
                            <h3 className="font-bold text-base flex items-center gap-2 text-slate-800 dark:text-slate-100">
                              <FileText className="w-4 h-4 text-indigo-500" />
                              <span className="truncate">{u.name}</span>
                            </h3>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md whitespace-nowrap">{u._count?.words || 0} 词</span>
                          </div>
                          <button
                            onClick={() => handleStartUnit(u.id)}
                            disabled={starting}
                            className="relative z-10 w-full py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg font-bold text-sm hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-all flex items-center justify-center gap-1.5 active:scale-95 group/btn"
                          >
                            <Play className="w-3.5 h-3.5 fill-current transition-transform group-hover/btn:scale-110" /> 开始
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {renderCategoryTree(cats, cat.id, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="flex justify-center mt-24"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  const rootUnits = units.filter(u => !u.categoryId);
  const unfinishedSessions = sessions.filter(s => s.status === 'PAUSED');

  return (
    <div className="max-w-6xl mx-auto mt-12 px-4 space-y-12 pb-24 relative z-10">
      {/* Unfinished Sessions Section */}
      {unfinishedSessions.length > 0 && (
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/20">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              继续学习
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {unfinishedSessions.map(s => {
              const progress = s.stats ? Math.round((s.stats.correct + s.stats.incorrect) / s.stats.total * 100) : 0;
              return (
                <div key={s.id} className="p-6 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex flex-col justify-between hover:shadow-2xl hover:shadow-amber-500/10 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-amber-500/10 transition-colors"></div>
                  <div className="relative z-10">
                    <h3 className="font-black text-xl flex items-center gap-3 text-slate-800 dark:text-slate-100 mb-2">
                      <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-500">
                        {s.isReview ? <RefreshCw className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                      </div>
                      {s.isReview ? '智能复习' : s.unit?.name || '未知单元'}
                    </h3>
                    <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 mt-2 bg-slate-100 dark:bg-slate-800 inline-block px-3 py-1 rounded-lg">
                      {s.unit ? `${getFullUnitName(s.unit.id).split(' - ').slice(0, -1).join(' - ')} / ` : ''}{s.isReview ? '复习' : '学习'}
                    </div>
                    <div className="text-xs text-slate-400 mb-6">
                      开始于: {new Date(s.startTime).toLocaleString()}
                    </div>
                    <div className="mb-6">
                      <div className="flex justify-between text-xs font-bold mb-1 text-slate-500">
                        <span>进度</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => s.isReview ? handleStartReview() : handleStartUnit(s.unitId)}
                    disabled={starting}
                    className="relative z-10 w-full py-3.5 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-2xl font-bold hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 transition-all flex items-center justify-center gap-2 active:scale-95 group/btn"
                  >
                    <Play className="w-5 h-5 fill-current transition-transform group-hover/btn:scale-110" /> 继续
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Learning Section */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            学习新单元
          </h2>
        </div>

        {categories.length === 0 && rootUnits.length === 0 ? (
          <div className="text-center p-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 text-slate-500 shadow-xl shadow-slate-200/20 dark:shadow-black/40">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Folder className="w-12 h-12 opacity-50" />
            </div>
            <p className="text-xl font-medium">暂无单元，请联系管理员添加。</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Root Units */}
            {rootUnits.length > 0 && (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                {rootUnits.map(u => (
                  <div key={u.id} className="p-6 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex flex-col justify-between hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
                    <div className="relative z-10">
                      <h3 className="font-black text-xl flex items-center gap-3 text-slate-800 dark:text-slate-100 mb-2">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-500">
                          <FileText className="w-5 h-5" />
                        </div>
                        {u.name}
                      </h3>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 mt-2 bg-slate-100 dark:bg-slate-800 inline-block px-3 py-1 rounded-lg">{u._count?.words || 0} 个单词</p>
                    </div>
                    <button
                      onClick={() => handleStartUnit(u.id)}
                      disabled={starting}
                      className="relative z-10 w-full py-3.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-2xl font-bold hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 active:scale-95 group/btn"
                    >
                      <Play className="w-5 h-5 fill-current transition-transform group-hover/btn:scale-110" /> 开始学习
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Category Tree */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl shadow-slate-200/20 dark:shadow-black/40 border border-slate-200/50 dark:border-slate-800/50">
              {renderCategoryTree(categories)}
            </div>
          </div>
        )}
      </section>

      {/* Review Section */}
      <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl shadow-slate-200/20 dark:shadow-black/40 border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] -ml-20 -mb-20 pointer-events-none"></div>
        
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="p-3.5 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/20">
            <RefreshCw className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            智能复习
          </h2>
        </div>

        <div className="space-y-6 relative z-10 w-full">
          <div className="bg-slate-50/50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 w-full">
            <label className="flex items-center gap-3 text-lg font-black text-slate-800 dark:text-slate-200 mb-6">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm">1</div>
              选择要复习的单元
            </label>
            <div className="flex flex-wrap gap-3">
              {units.map(u => {
                const fullPath = getFullUnitName(u.id);
                const parts = fullPath.split(' - ');
                const name = parts.pop();
                const path = parts.join(' - ');
                return (
                  <button
                    key={u.id}
                    onClick={() => toggleUnitSelection(u.id)}
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all border-2 flex flex-col items-start ${
                      selectedUnits.includes(u.id) 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/50 dark:text-emerald-300 shadow-md shadow-emerald-500/10 scale-105' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm'
                    }`}
                  >
                    {path && <span className="text-xs opacity-70 mb-1">{path}</span>}
                    <span>{name}</span>
                  </button>
                );
              })}
              {units.length === 0 && <span className="text-slate-400 text-sm font-medium py-2">暂无可复习的单元</span>}
            </div>
          </div>
          
          <div className="bg-slate-50/50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 w-full">
            <label className="flex items-center gap-3 text-lg font-black text-slate-800 dark:text-slate-200 mb-6">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm">2</div>
              本次复习单词数量
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="1"
                max="500"
                value={reviewCount}
                onChange={e => setReviewCount(parseInt(e.target.value) || 10)}
                className="w-32 p-4 text-xl font-black border-2 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-center text-slate-800 dark:text-slate-100 shadow-inner"
              />
              <span className="text-slate-500 font-bold text-lg">个单词</span>
            </div>
          </div>

          <div className="flex justify-center pt-4 w-full">
            <button
              onClick={handleStartReview}
              disabled={starting || selectedUnits.length === 0}
              className="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-xl hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95"
            >
              <Play className="w-6 h-6 fill-current" /> 立即开始复习
            </button>
          </div>
        </div>
      </section>

      <ModalComponent />
    </div>
  );
}
