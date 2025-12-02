import * as React from 'react';
import { Dialog as BaseDialog } from '@base-ui-components/react/dialog';
import { cn } from '../../lib/utils';

const Dialog = BaseDialog.Root;

const DialogTrigger = BaseDialog.Trigger;

const DialogPortal = BaseDialog.Portal;

const DialogClose = BaseDialog.Close;

const DialogBackdrop = React.forwardRef(({ className, ...props }, ref) => (
  <BaseDialog.Backdrop
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogBackdrop.displayName = 'DialogBackdrop';

const DialogPopup = React.forwardRef(({ className, children, ...props }, ref) => (
  <BaseDialog.Popup
    ref={ref}
    className={cn(
      'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
      'w-full max-w-3xl max-h-[90vh] overflow-y-auto',
      'rounded-xl border bg-white p-6 shadow-2xl',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
      'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
      'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
      'duration-200',
      className
    )}
    {...props}
  >
    {children}
  </BaseDialog.Popup>
));
DialogPopup.displayName = 'DialogPopup';

const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <BaseDialog.Title
    ref={ref}
    className={cn('text-xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <BaseDialog.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';

export {
  Dialog,
  DialogPortal,
  DialogBackdrop,
  DialogClose,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
