import React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import { AlertOctagon, AlertTriangle, CheckCircle2, Info, LoaderCircle, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { toastManager, useToast } from '@/hooks/use-toast';

const TYPE_META = {
  default: {
    className: 'border-slate-200 bg-white/95 text-slate-900',
    icon: Info,
    iconClassName: 'text-slate-500',
  },
  success: {
    className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icon: CheckCircle2,
    iconClassName: 'text-emerald-600',
  },
  error: {
    className: 'border-red-200 bg-red-50 text-red-900',
    icon: AlertOctagon,
    iconClassName: 'text-red-600',
  },
  warning: {
    className: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: AlertTriangle,
    iconClassName: 'text-amber-500',
  },
  info: {
    className: 'border-sky-200 bg-sky-50 text-sky-900',
    icon: Info,
    iconClassName: 'text-sky-600',
  },
  loading: {
    className: 'border-slate-200 bg-white text-slate-900',
    icon: LoaderCircle,
    iconClassName: 'text-slate-500 animate-spin',
  },
};

function ToastViewportRenderer() {
  const { toasts } = useToast();

  return (
    <Toast.Viewport className="pointer-events-none fixed bottom-4 right-4 z-1200 flex flex-col items-end gap-3 px-4">
      {toasts.map((toast) => {
        const meta = TYPE_META[toast.type] ?? TYPE_META.default;
        const Icon = meta.icon;

        return (
          <Toast.Positioner key={toast.id} toast={toast} className="pointer-events-none w-full sm:max-w-sm">
            <Toast.Root
              toast={toast}
              className={cn(
                'pointer-events-auto w-full rounded-xl border px-4 py-3 shadow-[0_4px_18px_rgba(9,9,11,0.12)] backdrop-blur-sm transition-all data-[transition-status=starting]:opacity-0 data-[transition-status=starting]:-translate-y-2 data-[transition-status=ending]:opacity-0 data-[transition-status=ending]:translate-y-2',
                meta.className,
              )}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5" aria-hidden>
                  <Icon className={cn('h-4 w-4', meta.iconClassName)} />
                </span>
                <div className="flex-1 space-y-1">
                  {toast.title && <Toast.Title className="text-sm font-semibold leading-5">{toast.title}</Toast.Title>}
                  {toast.description && (
                    <Toast.Description className="text-sm leading-relaxed text-slate-600">
                      {toast.description}
                    </Toast.Description>
                  )}
                </div>
                <Toast.Close
                  className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
                </Toast.Close>
              </div>
            </Toast.Root>
          </Toast.Positioner>
        );
      })}
    </Toast.Viewport>
  );
}

export function ToastSystemProvider({ children }) {
  return (
    <Toast.Provider toastManager={toastManager} timeout={4500} limit={3}>
      {children}
      <Toast.Portal>
        <ToastViewportRenderer />
      </Toast.Portal>
    </Toast.Provider>
  );
}
