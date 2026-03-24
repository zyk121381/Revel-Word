import { useState } from 'react';
import { login } from '@/app/actions';

export function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.success) {
        onLogin({ username, role: result.role, avatarUrl: result.avatarUrl });
      }
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 px-4 relative z-10">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/20 dark:shadow-black/40 border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-8 text-center tracking-tight">欢迎回来</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">用户名</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full p-4 bg-slate-50/50 dark:bg-slate-950/50 border-2 border-slate-200/50 dark:border-slate-700/50 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-800 dark:text-slate-100 font-medium shadow-inner"
                required
                placeholder="输入您的用户名"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-4 bg-slate-50/50 dark:bg-slate-950/50 border-2 border-slate-200/50 dark:border-slate-700/50 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-800 dark:text-slate-100 font-medium shadow-inner"
                required
                placeholder="输入您的密码"
              />
            </div>
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 rounded-xl text-rose-600 dark:text-rose-400 text-sm font-medium text-center">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-black text-lg transition-all disabled:opacity-50 disabled:grayscale shadow-xl shadow-indigo-600/20 active:scale-95 flex justify-center items-center"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : '登录'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
