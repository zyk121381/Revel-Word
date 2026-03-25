import { useState, useEffect } from 'react';
import { getMySessions, getCategories, getUnits } from '@/app/actions';
import { ArrowLeft, Activity, Clock, CheckCircle2, XCircle, PlayCircle, PauseCircle, RefreshCw, BookOpen, Loader2 } from 'lucide-react';

export function UserPanel({ onBack }: { onBack: () => void }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMySessions(),
      getCategories(),
      getUnits()
    ]).then(([sess, cats, uns]) => {
      setSessions(sess);
      setCategories(cats);
      setUnits(uns);
      setLoading(false);
    });
  }, []);

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

  if (loading) return <div className="flex justify-center mt-24"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto mt-12 px-4 space-y-12 pb-24 relative z-10">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform">
          <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </button>
        <div className="p-3.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg shadow-blue-500/20">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          我的练习记录
        </h2>
      </div>
      
      {sessions.length === 0 ? (
        <div className="text-center p-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 text-slate-500 shadow-xl shadow-slate-200/20 dark:shadow-black/40">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity className="w-12 h-12 opacity-50" />
          </div>
          <p className="text-xl font-medium">暂无练习记录，去开始学习吧！</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sessions.map((s: any) => {
            const events = s.events || [];
            return (
              <div key={s.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-lg shadow-slate-200/10 dark:shadow-black/20 hover:shadow-xl hover:shadow-slate-200/20 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10 mb-8">
                  <div>
                    <h4 className="font-black text-2xl flex items-center gap-3 text-slate-800 dark:text-slate-100 mb-4">
                      <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-400">
                        {s.isReview ? <RefreshCw className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                      </div>
                      {s.context?.type === 'REVIEW' ? '智能复习' : (s.unit ? getFullUnitName(s.unit.id) : '未知单元')}
                      <span className={`text-sm px-4 py-1.5 rounded-xl font-bold tracking-wide ${s.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : s.status === 'PAUSED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                        {s.status === 'COMPLETED' ? '已完成' : s.status === 'PAUSED' ? '已暂停' : '进行中'}
                      </span>
                    </h4>
                    {s.context?.details && (
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-slate-700 dark:text-slate-300">复习内容:</span> {s.context.details}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl"><PlayCircle className="w-4 h-4 text-slate-400" /> 开始: {new Date(s.startTime).toLocaleString()}</span>
                      {s.endTime && <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl"><CheckCircle2 className="w-4 h-4 text-slate-400" /> 结束: {new Date(s.endTime).toLocaleString()}</span>}
                    </div>
                  </div>
                  {s.stats && (
                    <div className="text-right bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/50 min-w-[160px]">
                      <div className="text-5xl font-black text-blue-600 dark:text-blue-400 tracking-tight">{Math.round(s.stats.accuracy * 100)}%</div>
                      <div className="text-sm font-bold text-blue-400 dark:text-blue-500 uppercase tracking-wider mt-2">正确率</div>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                {events.length > 0 && (
                  <div className="mb-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 relative z-10">
                    <h5 className="text-sm font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-400" /> 活动时间线
                    </h5>
                    <div className="flex flex-wrap gap-3">
                      {events.map((e: any, i: number) => (
                        <div key={i} className="text-sm font-medium bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2 shadow-sm">
                          {e.type === 'START' && <PlayCircle className="w-4 h-4 text-blue-500" />}
                          {e.type === 'PAUSE' && <PauseCircle className="w-4 h-4 text-amber-500" />}
                          {e.type === 'RESUME' && <PlayCircle className="w-4 h-4 text-emerald-500" />}
                          {e.type === 'END' && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                          {new Date(e.time).toLocaleTimeString()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Word Stats */}
                {s.wordStats && Object.values(s.wordStats).some((stat: any) => stat.incorrect > 0) && (
                  <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800/50 relative z-10">
                    <h5 className="text-sm font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-400" /> 单词错误统计
                    </h5>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(s.wordStats).map(([word, stats]: any) => (
                        stats.incorrect > 0 && (
                          <div key={word} className="text-sm font-medium bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 px-4 py-2 rounded-xl border border-rose-200/50 dark:border-rose-500/20 flex items-center gap-3 shadow-sm">
                            <span className="font-bold text-base">{word}</span>
                            <span className="w-px h-4 bg-rose-200 dark:bg-rose-500/30"></span>
                            <span>错 {stats.incorrect} 次</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
