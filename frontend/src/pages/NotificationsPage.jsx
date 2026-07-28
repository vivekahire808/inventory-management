import React from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, Trash2, CheckCheck } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function NotificationsPage() {
  const { notifications, markAllRead, clearNotifications } = useSocket();

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Bell className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 font-heading">Real-Time Notification Stream</h2>
            <p className="text-xs text-slate-400">Live Socket.io notifications for low stock alerts & worker reorder updates</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={markAllRead}
            disabled={notifications.length === 0}
            className="btn-secondary text-xs"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
          <button
            onClick={clearNotifications}
            disabled={notifications.length === 0}
            className="btn-secondary text-xs text-rose-400 hover:text-rose-300"
          >
            <Trash2 className="w-4 h-4" /> Clear Logs
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-semibold text-slate-300">No Notifications Received Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Real-time low stock warnings and background reorder job updates will automatically appear here as they occur.
            </p>
          </div>
        ) : (
          notifications.map((item) => {
            const isWarning = item.type === 'LOW_STOCK_WARNING';
            const isSuccess = item.reorder?.reorder_status === 'COMPLETED';

            return (
              <div
                key={item.id}
                className={`glass-panel p-4 border-l-4 transition-all ${
                  isWarning 
                    ? 'border-l-amber-500 bg-amber-950/20 hover:bg-amber-950/30' 
                    : isSuccess 
                    ? 'border-l-emerald-500 bg-emerald-950/20 hover:bg-emerald-950/30' 
                    : 'border-l-indigo-500 bg-indigo-950/20 hover:bg-indigo-950/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
                      isWarning ? 'bg-amber-500/20 text-amber-400' : isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                    }`}>
                      {isWarning ? <AlertTriangle className="w-5 h-5" /> : isSuccess ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-100">{item.title}</h4>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.message}</p>

                      {item.reorder && (
                        <div className="mt-2 text-xs text-slate-400">
                          Reorder #{item.reorder.id} Status ({item.reorder.reorder_status})
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
