import React from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  X, 
  Flame 
} from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast, setSelectedEvent, events } = useSecurity();

  if (toasts.length === 0) return null;

  const getToastStyle = (type: string) => {
    switch (type) {
      case 'security_red':
        return {
          bg: '#1c1517',
          border: 'rgba(239,68,68,0.3)',
          icon: <Flame className="w-4 h-4 text-rose-400 shrink-0" />,
          titleColor: '#f87171',
        };
      case 'error':
        return {
          bg: '#1c1517',
          border: 'rgba(239,68,68,0.25)',
          icon: <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />,
          titleColor: '#f87171',
        };
      case 'warning':
        return {
          bg: '#1c1a14',
          border: 'rgba(245,158,11,0.25)',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          titleColor: '#fbbf24',
        };
      case 'success':
        return {
          bg: '#141c16',
          border: 'rgba(34,197,94,0.25)',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          titleColor: '#4ade80',
        };
      default:
        return {
          bg: '#1a1a1c',
          border: '#2a2a2e',
          icon: <Info className="w-4 h-4 text-indigo-400 shrink-0" />,
          titleColor: '#f0f0f1',
        };
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const style = getToastStyle(toast.type);
        return (
          <div
            key={toast.id}
            className="pointer-events-auto p-3.5 rounded-xl shadow-xl transition-all duration-200 fade-in"
            style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
            }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{style.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold" style={{ color: style.titleColor }}>
                    {toast.title}
                  </h4>
                  <span className="text-[10px]" style={{ color: '#555560' }}>
                    {toast.timestamp}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: '#888890' }}>
                  {toast.message}
                </p>

                {toast.eventId && (
                  <button
                    onClick={() => {
                      const evt = events.find((e) => e.id === toast.eventId);
                      if (evt) setSelectedEvent(evt);
                    }}
                    className="mt-2 text-[11px] font-medium transition-colors"
                    style={{ color: '#818cf8' }}
                  >
                    View Details →
                  </button>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded text-neutral-500 hover:text-neutral-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
