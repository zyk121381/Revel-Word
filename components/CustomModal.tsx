import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'warning' | 'success';
  isAlert?: boolean;
}

export function CustomModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = '确定', 
  cancelText = '取消', 
  type = 'warning', 
  isAlert = false 
}: ModalProps) {
  if (!isOpen) return null;

  const icons = {
    danger: <AlertTriangle className="w-6 h-6 text-rose-500" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    info: <Info className="w-6 h-6 text-blue-500" />,
    success: <CheckCircle2 className="w-6 h-6 text-emerald-500" />
  };

  const buttonColors = {
    danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20',
    info: 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200/50 dark:border-slate-800/50">
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl shrink-0 ${
              type === 'danger' ? 'bg-rose-100 dark:bg-rose-500/20' :
              type === 'warning' ? 'bg-amber-100 dark:bg-amber-500/20' :
              type === 'info' ? 'bg-blue-100 dark:bg-blue-500/20' :
              'bg-emerald-100 dark:bg-emerald-500/20'
            }`}>
              {icons[type]}
            </div>
            <div className="pt-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 sm:px-8 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          {!isAlert && onCancel && (
            <button 
              onClick={onCancel}
              className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 ${buttonColors[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
