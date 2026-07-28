import React, { useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function NotificationToast({ onNavigateToAlerts }) {
  const { activeToast, dismissToast } = useSocket();

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        dismissToast();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  if (!activeToast) return null;

  const isWarning = activeToast.type === 'warning';
  const isSuccess = activeToast.type === 'success';

  return (
    <div className="fixed top-5 right-5 z-50 max-w-md w-full toast-slide">
      <div className={`glass-panel p-4 border-l-4 shadow-2xl relative ${
        isWarning ? 'border-l-amber-500 bg-amber-950/40' : isSuccess ? 'border-l-emerald-500 bg-emerald-950/40' : 'border-l-indigo-500 bg-indigo-950/40'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg flex-shrink-0 ${
            isWarning ? 'bg-amber-500/20 text-amber-400' : isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
          }`}>
            {isWarning ? <AlertTriangle className="w-5 h-5 animate-bounce" /> : isSuccess ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          </div>

          <div className="flex-1 pr-4">
            <h4 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              {activeToast.title}
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                {new Date(activeToast.timestamp).toLocaleTimeString()}
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {activeToast.message}
            </p>
            {activeToast.reorder && (
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={() => {
                    dismissToast();
                    if (onNavigateToAlerts) onNavigateToAlerts();
                  }}
                  className="text-xs bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium px-2.5 py-1 rounded transition-colors"
                >
                  View Alerts →
                </button>
              </div>
            )}
          </div>

          <button
            onClick={dismissToast}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
