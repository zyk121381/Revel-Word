import { useState, useEffect } from 'react';
import { 
  getUsers, createUser, deleteUser, updateUser,
  getCategories, createCategory, updateCategory, deleteCategory,
  createUnit, deleteUnit, getUnits, updateUnit,
  getUserSessions, getUnitWords, updateWord, deleteWord, addWordToUnit
} from '@/app/actions';
import { analyzeWords } from '@/lib/analyze';
import { UnitWordsManager } from './UnitWordsManager';
import { 
  Trash2, Plus, Loader2, Users, FolderTree, Activity, 
  ChevronRight, ChevronDown, Edit2, Image as ImageIcon,
  Clock, CheckCircle2, XCircle, PlayCircle, PauseCircle,
  Folder, FileText, User as UserIcon, ArrowLeft, RefreshCw, BookOpen
} from 'lucide-react';

export function AdminPanel({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'tree'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userSessions, setUserSessions] = useState<any[]>([]);
  const [sessionLoading, setSessionLoading] = useState(false);

  const loadData = async () => {
    try {
      const [u, c, un] = await Promise.all([getUsers(), getCategories(), getUnits()]);
      setUsers(u);
      setCategories(c);
      setUnits(un);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewUser = async (user: any) => {
    setSelectedUser(user);
    setSessionLoading(true);
    try {
      const sessions = await getUserSessions(user.id);
      setUserSessions(sessions);
    } catch (e) {
      console.error(e);
    } finally {
      setSessionLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col shadow-2xl shadow-slate-200/20 dark:shadow-black/40 z-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 pointer-events-none"></div>
        <div className="p-8 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center gap-4 relative z-10">
          <button onClick={onBack} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <h2 className="text-2xl font-black tracking-tight bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">管理后台</h2>
        </div>
        <nav className="flex-1 p-6 space-y-3 relative z-10">
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all duration-300 ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-[1.02]' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:scale-[1.02]'}`}
          >
            <Users className={`w-6 h-6 ${activeTab === 'users' ? 'text-indigo-200' : 'text-slate-400'}`} /> 用户与记录
          </button>
          <button 
            onClick={() => setActiveTab('content')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all duration-300 ${activeTab === 'content' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-[1.02]' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:scale-[1.02]'}`}
          >
            <FolderTree className={`w-6 h-6 ${activeTab === 'content' ? 'text-indigo-200' : 'text-slate-400'}`} /> 内容管理
          </button>
          <button 
            onClick={() => setActiveTab('tree')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all duration-300 ${activeTab === 'tree' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-[1.02]' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:scale-[1.02]'}`}
          >
            <Folder className={`w-6 h-6 ${activeTab === 'tree' ? 'text-indigo-200' : 'text-slate-400'}`} /> 文件树
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8 md:p-12 relative bg-slate-50/50 dark:bg-slate-950/50">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none"></div>
        <div className="relative z-10 h-full">
          {error && (
            <div className="mb-8 p-5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-500/20 flex items-center gap-3 font-medium shadow-sm">
              <XCircle className="w-6 h-6 shrink-0" /> {error}
            </div>
          )}

          {activeTab === 'users' && !selectedUser && (
            <UsersView users={users} onReload={loadData} onViewUser={handleViewUser} setError={setError} />
          )}

          {activeTab === 'users' && selectedUser && (
            <UserDetails 
              user={selectedUser} 
              sessions={userSessions} 
              loading={sessionLoading} 
              onBack={() => setSelectedUser(null)} 
            />
          )}

          {activeTab === 'content' && (
            <ContentManager categories={categories} units={units} onReload={loadData} setError={setError} />
          )}

          {activeTab === 'tree' && (
            <TreeManager categories={categories} units={units} onReload={loadData} setError={setError} />
          )}
        </div>
      </div>
    </div>
  );
}

function UsersView({ users, onReload, onViewUser, setError }: any) {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUser(newUsername, newPassword, newAvatar || undefined);
      setNewUsername(''); setNewPassword(''); setNewAvatar('');
      await onReload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser(editingUser.id, {
        username: editUsername,
        password: editPassword || undefined,
        avatarUrl: editAvatar || undefined
      });
      setEditingUser(null);
      await onReload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user: any) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditPassword('');
    setEditAvatar(user.avatarUrl || '');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该用户吗？')) return;
    try {
      await deleteUser(id);
      await onReload();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/20 dark:shadow-black/40 border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <h3 className="text-2xl font-black mb-8 flex items-center gap-3 relative z-10 text-slate-800 dark:text-slate-100">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <Plus className="w-6 h-6" />
          </div>
          添加新用户
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-5 relative z-10">
          <input type="text" placeholder="用户名" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="p-4 border-2 border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-950/50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium placeholder:text-slate-400" required />
          <input type="password" placeholder="密码" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="p-4 border-2 border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-950/50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium placeholder:text-slate-400" required />
          <div className="relative flex items-center">
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setNewAvatar(reader.result as string);
                reader.readAsDataURL(file);
              }
            }} className="hidden" id="avatar-upload" />
            <label htmlFor="avatar-upload" className="w-full p-4 border-2 border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-slate-500 cursor-pointer flex items-center justify-between">
              <span className="truncate">{newAvatar ? '已选择头像' : '上传头像 (可选)'}</span>
              <ImageIcon className="w-5 h-5" />
            </label>
            {newAvatar && (
              <div className="absolute right-14 w-8 h-8 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
                <img src={newAvatar} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <button type="submit" disabled={loading} className="py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : '确认添加'}
          </button>
        </form>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-slate-200/20 dark:shadow-black/40 border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
        <div className="p-8 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <Users className="w-6 h-6 text-indigo-500" /> 用户列表
          </h3>
          <span className="px-4 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-bold">
            共 {users.length} 名用户
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200/50 dark:border-slate-800/50">
              <tr>
                <th className="p-6 font-bold text-slate-500 text-sm tracking-wider uppercase">用户</th>
                <th className="p-6 font-bold text-slate-500 text-sm tracking-wider uppercase">角色</th>
                <th className="p-6 font-bold text-slate-500 text-sm tracking-wider uppercase">注册时间</th>
                <th className="p-6 font-bold text-slate-500 text-sm tracking-wider uppercase text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                  <td className="p-6 flex items-center gap-5">
                    <div className="relative">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="avatar" className="w-14 h-14 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xl shadow-md border-2 border-white dark:border-slate-800 group-hover:scale-105 transition-transform">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {u.role === 'ADMIN' && (
                        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-lg block text-slate-800 dark:text-slate-100">{u.username}</span>
                      <span className="text-xs text-slate-500 font-medium">ID: {u.id.substring(0, 8)}...</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide inline-flex items-center gap-1.5 ${u.role === 'ADMIN' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/30 shadow-sm' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700 shadow-sm'}`}>
                      {u.role === 'ADMIN' ? '管理员' : '普通用户'}
                    </span>
                  </td>
                  <td className="p-6 text-slate-500 font-medium">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-6 text-right space-x-3">
                    <button onClick={() => startEdit(u)} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:border-blue-800 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => onViewUser(u)} className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 dark:text-indigo-400 dark:hover:bg-indigo-900/30 dark:hover:border-indigo-800 rounded-xl transition-all font-bold text-sm inline-flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95">
                      <Activity className="w-4 h-4" /> 记录
                    </button>
                    {u.role !== 'ADMIN' && (
                      <button onClick={() => handleDelete(u.id)} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:border-rose-800 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800">
            <h3 className="text-2xl font-black mb-6 text-slate-800 dark:text-slate-100">编辑用户</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <input type="text" placeholder="用户名" value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-full p-4 border-2 border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 focus:border-indigo-500 outline-none" required />
              <input type="password" placeholder="新密码 (留空则不修改)" value={editPassword} onChange={e => setEditPassword(e.target.value)} className="w-full p-4 border-2 border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 focus:border-indigo-500 outline-none" />
              <div className="relative flex items-center">
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setEditAvatar(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }} className="hidden" id="edit-avatar-upload" />
                <label htmlFor="edit-avatar-upload" className="w-full p-4 border-2 border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 focus:border-indigo-500 outline-none cursor-pointer flex items-center justify-between">
                  <span className="truncate">{editAvatar ? '已选择头像' : '上传新头像'}</span>
                  <ImageIcon className="w-5 h-5" />
                </label>
                {editAvatar && (
                  <div className="absolute right-14 w-8 h-8 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
                    <img src={editAvatar} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition-all">取消</button>
                <button type="submit" disabled={loading} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '保存修改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function UserDetails({ user, sessions, loading, onBack }: any) {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/20 dark:shadow-black/40 border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <button onClick={onBack} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95 relative z-10">
          <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </button>
        <div className="relative z-10">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar" className="w-20 h-20 rounded-2xl object-cover border-4 border-white dark:border-slate-800 shadow-lg" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-3xl border-4 border-white dark:border-slate-800 shadow-lg">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="relative z-10 flex-1">
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-1">{user.username} 的练习记录</h2>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold">
              {user.role === 'ADMIN' ? '管理员' : '普通用户'}
            </span>
            <p className="text-slate-500 font-medium text-sm">注册于 {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <button onClick={() => {
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessions, null, 2));
          const downloadAnchorNode = document.createElement('a');
          downloadAnchorNode.setAttribute("href", dataStr);
          downloadAnchorNode.setAttribute("download", `user_${user.username}_sessions.json`);
          document.body.appendChild(downloadAnchorNode);
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
        }} className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 relative z-10 font-bold text-sm flex items-center gap-2">
          导出 JSON
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
      ) : sessions.length === 0 ? (
        <div className="text-center p-20 text-slate-500 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-black/40 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <Activity className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-lg font-bold">暂无练习记录</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sessions.map((s: any) => (
            <div key={s.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-lg shadow-slate-200/10 dark:shadow-black/20 hover:shadow-xl hover:shadow-slate-200/20 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 relative z-10">
                <div>
                  <h4 className="font-black text-xl flex items-center gap-3 text-slate-800 dark:text-slate-100">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                      {s.isReview ? <RefreshCw className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                    </div>
                    {s.isReview ? '复习模式' : s.unit?.name || '未知单元'}
                    <span className={`text-xs px-3 py-1.5 rounded-xl font-bold tracking-wide ${s.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : s.status === 'PAUSED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                      {s.status === 'COMPLETED' ? '已完成' : s.status === 'PAUSED' ? '已暂停' : '进行中'}
                    </span>
                  </h4>
                  <div className="text-sm text-slate-500 font-medium mt-3 flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg"><PlayCircle className="w-4 h-4 text-slate-400" /> {new Date(s.startTime).toLocaleString()}</span>
                    {s.endTime && <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg"><CheckCircle2 className="w-4 h-4 text-slate-400" /> {new Date(s.endTime).toLocaleString()}</span>}
                  </div>
                </div>
                {s.stats && (
                  <div className="text-right bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                    <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{Math.round(s.stats.accuracy * 100)}%</div>
                    <div className="text-xs font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider mt-1">正确率</div>
                  </div>
                )}
              </div>

              {/* Timeline Events */}
              <div className="mb-6 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 relative z-10">
                <h5 className="text-sm font-bold mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" /> 活动时间线
                </h5>
                <div className="flex flex-wrap gap-2">
                  {s.events?.map((e: any, i: number) => (
                    <div key={i} className="text-xs font-medium flex items-center gap-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 shadow-sm">
                      {e.type === 'START' && <PlayCircle className="w-3.5 h-3.5 text-blue-500" />}
                      {e.type === 'PAUSE' && <PauseCircle className="w-3.5 h-3.5 text-amber-500" />}
                      {e.type === 'RESUME' && <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />}
                      {e.type === 'END' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />}
                      {new Date(e.time).toLocaleTimeString()}
                    </div>
                  ))}
                </div>
              </div>

              {/* Word Stats */}
              {s.wordStats && Object.values(s.wordStats).some((stat: any) => stat.incorrect > 0) && (
                <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800/50 relative z-10">
                  <h5 className="text-sm font-bold mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-400" /> 单词错误统计
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(s.wordStats).map(([word, stats]: any) => (
                      stats.incorrect > 0 && (
                        <div key={word} className="text-sm font-medium bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 px-3 py-1.5 rounded-xl border border-rose-200/50 dark:border-rose-500/20 flex items-center gap-2 shadow-sm">
                          <span className="font-bold">{word}</span>
                          <span className="w-px h-3 bg-rose-200 dark:bg-rose-500/30"></span>
                          <span>错 {stats.incorrect} 次</span>
                        </div>
                      )
                    ))}
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

function ContentManager({ categories, units, onReload, setError }: any) {
  const [newCatName, setNewCatName] = useState('');
  const [parentCatId, setParentCatId] = useState('');
  
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitWords, setNewUnitWords] = useState('');
  const [unitCatId, setUnitCatId] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);

  if (selectedUnit) {
    return <UnitWordsManager unit={selectedUnit} onBack={() => setSelectedUnit(null)} setError={setError} />;
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCategory(newCatName, parentCatId || null);
      setNewCatName(''); setParentCatId('');
      await onReload();
    } catch (err: any) { setError(err.message); }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const analyzed = await analyzeWords(newUnitWords);
      if (analyzed.length === 0) throw new Error('未能识别到有效的英语单词');
      await createUnit(newUnitName, analyzed, unitCatId || null);
      setNewUnitName(''); setNewUnitWords(''); setUnitCatId('');
      await onReload();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleDeleteCat = async (id: string) => {
    if (!confirm('删除分类将级联删除其子分类，确定吗？')) return;
    try { await deleteCategory(id); await onReload(); } catch (err: any) { setError(err.message); }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm('确定删除该单元吗？')) return;
    try { await deleteUnit(id); await onReload(); } catch (err: any) { setError(err.message); }
  };

  // Helper to render tree
  const renderCategoryTree = (cats: any[], parentId: string | null = null, depth = 0) => {
    const children = cats.filter(c => c.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <div className={`space-y-3 ${depth > 0 ? 'ml-8 mt-3 border-l-2 border-slate-200 dark:border-slate-700 pl-6 relative before:absolute before:top-0 before:-left-[2px] before:w-[2px] before:h-full before:bg-gradient-to-b before:from-indigo-500/50 before:to-transparent' : ''}`}>
        {children.map(cat => (
          <div key={cat.id} className="space-y-3">
            <div className="flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 font-bold text-slate-800 dark:text-slate-200 text-lg">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-500">
                  <Folder className="w-5 h-5 fill-amber-500/20" />
                </div>
                {cat.name}
              </div>
              <button onClick={() => handleDeleteCat(cat.id)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-2.5 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"><Trash2 className="w-5 h-5" /></button>
            </div>
            
            {/* Units in this category */}
            {cat.units?.length > 0 && (
              <div className="ml-8 space-y-2 mt-2">
                {cat.units.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors group/unit">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-md text-indigo-500">
                        <FileText className="w-4 h-4" />
                      </div>
                      {u.name} 
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-xs font-bold">
                        {u._count?.words || 0} 词
                      </span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover/unit:opacity-100 focus-within:opacity-100 transition-all">
                      <button onClick={() => setSelectedUnit(u)} className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteUnit(u.id)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-2 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {renderCategoryTree(cats, cat.id, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  // Root units
  const rootUnits = units.filter((u: any) => !u.categoryId);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Add Category */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/20 dark:shadow-black/40 border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-amber-500/10 transition-colors"></div>
        <h3 className="text-xl font-black mb-6 flex items-center gap-3 relative z-10 text-slate-800 dark:text-slate-100">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-xl text-amber-600 dark:text-amber-400">
            <FolderTree className="w-5 h-5" />
          </div>
          新建分类
        </h3>
        <form onSubmit={handleAddCategory} className="space-y-4 relative z-10">
          <input type="text" placeholder="分类名称" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full p-4 border-2 border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-950/50 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-medium placeholder:text-slate-400" required />
          <div className="relative">
            <select value={parentCatId} onChange={e => setParentCatId(e.target.value)} className="w-full p-4 border-2 border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-950/50 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-medium text-slate-700 dark:text-slate-300 appearance-none">
              <option value="">作为根分类</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
          <button type="submit" className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40">添加分类</button>
        </form>
      </div>

      {/* Add Unit */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/20 dark:shadow-black/40 border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
        <h3 className="text-xl font-black mb-6 flex items-center gap-3 relative z-10 text-slate-800 dark:text-slate-100">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          新建单元
        </h3>
        <form onSubmit={handleAddUnit} className="space-y-4 relative z-10">
          <input type="text" placeholder="单元名称" value={newUnitName} onChange={e => setNewUnitName(e.target.value)} className="w-full p-4 border-2 border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-950/50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium placeholder:text-slate-400" required />
          <div className="relative">
            <select value={unitCatId} onChange={e => setUnitCatId(e.target.value)} className="w-full p-4 border-2 border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-950/50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-slate-700 dark:text-slate-300 appearance-none">
              <option value="">无分类 (根目录)</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
          <textarea placeholder="输入单词列表 (换行分隔)..." value={newUnitWords} onChange={e => setNewUnitWords(e.target.value)} className="w-full h-40 p-4 border-2 border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-950/50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium placeholder:text-slate-400 resize-none leading-relaxed" required />
          <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'AI 智能出题并保存'}
          </button>
        </form>
      </div>
    </div>
  );
}

function TreeManager({ categories, units, onReload, setError }: any) {
  const [selectedUnit, setSelectedUnit] = useState<any>(null);

  if (selectedUnit) {
    return <UnitWordsManager unit={selectedUnit} onBack={() => setSelectedUnit(null)} setError={setError} />;
  }

  const handleDeleteCat = async (id: string) => {
    if (!confirm('删除分类将级联删除其子分类，确定吗？')) return;
    try { await deleteCategory(id); await onReload(); } catch (err: any) { setError(err.message); }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm('确定删除该单元吗？')) return;
    try { await deleteUnit(id); await onReload(); } catch (err: any) { setError(err.message); }
  };

  // Helper to render tree
  const renderCategoryTree = (cats: any[], parentId: string | null = null, depth = 0) => {
    const children = cats.filter(c => c.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <div className={`space-y-3 ${depth > 0 ? 'ml-8 mt-3 border-l-2 border-slate-200 dark:border-slate-700 pl-6 relative before:absolute before:top-0 before:-left-[2px] before:w-[2px] before:h-full before:bg-gradient-to-b before:from-indigo-500/50 before:to-transparent' : ''}`}>
        {children.map(cat => (
          <div key={cat.id} className="space-y-3">
            <div className="flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 font-bold text-slate-800 dark:text-slate-200 text-lg">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-500">
                  <Folder className="w-5 h-5 fill-amber-500/20" />
                </div>
                {cat.name}
              </div>
              <button onClick={() => handleDeleteCat(cat.id)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-2.5 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"><Trash2 className="w-5 h-5" /></button>
            </div>
            
            {/* Units in this category */}
            {cat.units?.length > 0 && (
              <div className="ml-8 space-y-2 mt-2">
                {cat.units.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors group/unit">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-md text-indigo-500">
                        <FileText className="w-4 h-4" />
                      </div>
                      {u.name} 
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-xs font-bold">
                        {u._count?.words || 0} 词
                      </span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover/unit:opacity-100 focus-within:opacity-100 transition-all">
                      <button onClick={() => setSelectedUnit(u)} className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteUnit(u.id)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-2 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {renderCategoryTree(cats, cat.id, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  // Root units
  const rootUnits = units.filter((u: any) => !u.categoryId);

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/20 dark:shadow-black/40 border border-slate-200/50 dark:border-slate-800/50 min-h-[800px] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <h3 className="text-2xl font-black mb-8 text-slate-800 dark:text-slate-100 relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
            <FolderTree className="w-6 h-6" />
          </div>
          内容结构树
        </h3>
        
        <div className="relative z-10 space-y-6">
          {/* Root Units */}
          {rootUnits.length > 0 && (
            <div className="space-y-3">
              {rootUnits.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-3 font-bold text-slate-800 dark:text-slate-200 text-lg">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-500">
                      <FileText className="w-5 h-5" />
                    </div>
                    {u.name} 
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md text-xs font-bold">
                      {u._count?.words || 0} 词
                    </span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all">
                    <button onClick={() => setSelectedUnit(u)} className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2.5 rounded-xl transition-all"><Edit2 className="w-5 h-5" /></button>
                    <button onClick={() => handleDeleteUnit(u.id)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-2.5 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Category Tree */}
          <div className="space-y-4">
            {renderCategoryTree(categories)}
          </div>

          {categories.length === 0 && rootUnits.length === 0 && (
            <div className="text-center text-slate-400 dark:text-slate-500 py-20 flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <FolderTree className="w-10 h-10 opacity-50" />
              </div>
              <p className="text-lg font-medium">暂无任何内容，请在左侧添加</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
