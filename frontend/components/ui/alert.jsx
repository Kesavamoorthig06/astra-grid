import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const alertVariants = cva(
  'relative flex w-full items-start gap-3 rounded-lg border px-4 py-4 text-sm shadow-sm',
  {
    variants: {
      variant: {
        default: 'bg-white text-black border-border',
        destructive: 'border-red-500/50 bg-red-500/10 text-red-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5 ref={ref} className={cn('text-sm font-semibold leading-none tracking-tight', className)} {...props} />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm leading-relaxed text-black/80', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertDescription, AlertTitle };
