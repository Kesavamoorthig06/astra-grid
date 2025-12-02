import * as React from 'react';
import { isValidElement } from 'react';
import { Select as SelectPrimitive } from '@base-ui-components/react/select';
import { cva } from 'class-variance-authority';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, X } from 'lucide-react';
import { cn } from '../../utils/cn';

// Create a Context for `indicatorPosition` and `indicator` control
const SelectContext = React.createContext(
  { indicatorPosition: 'left', indicator: null, indicatorVisibility: true, icon: null }
);

// Root Component
const Select = ({
  indicatorPosition = 'left',
  indicatorVisibility = true,
  indicator,
  icon,
  ...props
}) => {
  return (
    <SelectContext.Provider value={{ indicatorPosition, indicatorVisibility, indicator, icon }}>
      <SelectPrimitive.Root data-slot="select" {...props} />
    </SelectContext.Provider>
  );
};

function SelectGroup({
  ...props
}) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectPortal({
  className,
  ...props
}) {
  return <SelectPrimitive.Portal data-slot="select-portal" className={cn("z-100", className)} {...props} />;
}

function SelectPositioner({
  className,
  ...props
}) {
  return <SelectPrimitive.Positioner data-slot="select-positioner" className={cn("z-100", className)} {...props} />;
}

function SelectValue({
  placeholder,
  ...props
}) {
  if (!placeholder) {
    return <SelectPrimitive.Value data-slot="select-value" {...props} />;
  }

  return (
    <SelectPrimitive.Value
      className="text-sm"
      render={(_, { value }) => {
        if (value) {
          return <SelectPrimitive.Value data-slot="select-value" {...props} />;
        }

        // Placeholder
        return (
          <span data-slot="select-value" className="text-muted-foreground">
            {placeholder}
          </span>
        );
      }}
      {...props} />
  );
}

// Clear - A button to clear the input value
function SelectClear({
  className,
  children,
  onClick,
  ...props
}) {
  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick?.(event);
  };

  return (
    <button
      data-slot="select-clear"
      className={cn(`
                  cursor-pointer absolute top-1/2 -translate-y-1/2 end-2 
                  rounded-sm opacity-60 hover:opacity-100 transition-opacity 					
                  focus:outline-none focus:ring-0 focus:ring-offset-0 
                  disabled:pointer-events-none data-disabled:pointer-events-none 
              `, className)}
      onClick={handleClick}
      {...props}>
      {children ? children : <X />}
    </button>
  );
}

// Define size variants for SelectTrigger
const selectTriggerVariants = cva(`
      group relative flex w-fit items-center justify-between gap-2 rounded-md border whitespace-nowrap select-none
      shadow-xs transition-[color,box-shadow,border-color] outline-none
      focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
      aria-invalid:ring-destructive/50 aria-invalid:border-destructive
      data-disabled:pointer-events-none data-disabled:opacity-60
      *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 *:data-[slot=select-value]:font-medium
      [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='text-'])]:text-muted-foreground
  `, {
  variants: {
    size: {
      xs: `
                  h-7 px-2 text-xs gap-1 rounded-md
                  [&_[data-slot=select-icon]]:size-3.5 [&_[data-slot=select-icon]]:-me-0.75
                  [&_[data-slot=select-clear]>svg]:size-3 [&_[data-slot=select-clear]]:end-6
              `,
      sm: `
                  h-8 px-2.5 text-xs gap-1 rounded-md
                  [&_[data-slot=select-icon]]:size-3.5 [&_[data-slot=select-icon]]:-me-0.75
                  [&_[data-slot=select-clear]>svg]:size-3 [&_[data-slot=select-clear]]:end-6
              `,
      md: `
                  h-9 px-3 text-sm gap-1 rounded-md
                  [&_[data-slot=select-icon]]:size-4 [&_[data-slot=select-icon]]:-me-1
                  [&_[data-slot=select-clear]>svg]:size-3.5 [&_[data-slot=select-clear]]:end-7
              `,
      lg: `
                  h-10 px-4 text-sm gap-1.5 rounded-md
                  [&_[data-slot=select-icon]]:size-4 [&_[data-slot=select-icon]]:-me-1.25
                  [&_[data-slot=select-clear]>svg]:size-3.5 [&_[data-slot=select-clear]]:end-8
              `,
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

function SelectTrigger({
  className,
  children,
  size,
  ...props
}) {
  const { icon } = React.useContext(SelectContext);

  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(selectTriggerVariants({ size }), className)}
      {...props}>
      {children}
      <SelectPrimitive.Icon>
        {icon && isValidElement(icon) ? (
          icon
        ) : (
          <ChevronDownIcon
            data-slot="select-icon"
            className="opacity-60 transition-transform duration-200" />
        )}
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  side = 'bottom',
  sideOffset = 2,
  align = 'start',
  alignOffset = 0,
  position = 'popper',
  ...props
}) {
  return (
    <SelectPortal>
      <SelectPositioner
        sideOffset={sideOffset}
        alignItemWithTrigger={position === 'item-aligned'}
        side={side}
        align={align}
        alignOffset={alignOffset}>
        <SelectScrollUpButton />
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(`
                            relative z-100 max-h-(--available-height) min-w-(--anchor-width) overflow-x-hidden overflow-y-auto
                            bg-popover text-popover-foreground
                            rounded-md border p-1 shadow-lg							
                            origin-(--transform-origin)
                            data-open:animate-in data-closed:animate-out 
                            data-closed:fade-out-0 data-open:fade-in-0 
                            data-closed:zoom-out-95 data-open:zoom-in-95
                            data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 
                            data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2
                          `, position === 'item-aligned' && '[&_*[data-slot=select-item]]:min-w-(--anchor-width)', className)}
          {...props}>
          {children}
        </SelectPrimitive.Popup>
        <SelectScrollDownButton />
      </SelectPositioner>
    </SelectPortal>
  );
}

function SelectItem({
  className,
  children,
  ...props
}) {
  const { indicatorPosition, indicatorVisibility, indicator } = React.useContext(SelectContext);

  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(`
                  relative flex w-full items-center cursor-default select-none
                  rounded-sm py-1.5 text-sm font-medium outline-hidden
                  data-highlighted:bg-accent data-highlighted:text-accent-foreground
                  data-disabled:pointer-events-none data-disabled:opacity-50
                  [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground
                  *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2
              `, indicatorPosition === 'left' ? 'ps-7 pe-2' : 'pe-7 ps-2', className)}
      {...props}>
      {indicatorVisibility &&
        (indicator && isValidElement(indicator) ? (
          indicator
        ) : (
          <span
            className={cn(
              'absolute flex h-3.5 w-3.5 items-center justify-center',
              indicatorPosition === 'left' ? 'start-2' : 'end-2'
            )}>
            <SelectPrimitive.ItemIndicator data-slot="select-item-indicator">
              <CheckIcon className="h-4 w-4 text-primary" />
            </SelectPrimitive.ItemIndicator>
          </span>
        ))}
      <SelectPrimitive.ItemText data-slot="select-item-text">{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectLabel({
  className,
  ...props
}) {
  const { indicatorPosition } = React.useContext(SelectContext);

  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn(
        'text-muted-foreground py-1.5 text-xs font-medium',
        indicatorPosition === 'left' ? 'ps-7 pe-2' : 'pe-7 ps-2',
        className
      )}
      {...props} />
  );
}

function SelectIndicator({
  children,
  className,
  ...props
}) {
  const { indicatorPosition } = React.useContext(SelectContext);

  return (
    <span
      data-slot="select-indicator"
      className={cn(
        'absolute flex top-1/2 -translate-y-1/2 items-center justify-center',
        indicatorPosition === 'left' ? 'start-2' : 'end-2',
        className
      )}
      {...props}>
      <SelectPrimitive.ItemIndicator>{children}</SelectPrimitive.ItemIndicator>
    </span>
  );
}

function SelectSeparator({
  className,
  ...props
}) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('bg-border pointer-events-none -mx-1 my-1 h-px', className)}
      {...props} />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        'fixed top-0 left-0 right-0 z-10 flex w-full cursor-default items-center justify-center rounded-t-md py-1 bg-popover',
        className
      )}
      {...props}>
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-10 flex w-full cursor-default items-center justify-center rounded-b-md py-1 bg-popover',
        className
      )}
      {...props}>
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownArrow>
  );
}

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectIndicator,
  SelectSeparator,
  SelectClear,
};
