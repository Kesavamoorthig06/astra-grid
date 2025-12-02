'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import * as SliderPrimitive from '@radix-ui/react-slider';

function Slider({
  className,
  children,
  ...props
}) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn('relative flex h-5 w-full touch-none select-none items-center group', className)}
      {...props}>
      <SliderPrimitive.Track className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 transition-all duration-150">
        <SliderPrimitive.Range className="absolute h-full bg-linear-to-r from-gray-800 to-black transition-all duration-150" />
      </SliderPrimitive.Track>
      {children}
    </SliderPrimitive.Root>
  );
}

function SliderThumb({
  className,
  ...props
}) {
  return (
    <SliderPrimitive.Thumb
      data-slot="slider-thumb"
      className={cn(
        'block size-5 shrink-0 cursor-grab active:cursor-grabbing rounded-full border-3 border-white bg-black shadow-lg shadow-black/30 ring-0 transition-all duration-150 ease-out hover:scale-110 hover:shadow-xl hover:shadow-black/40 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 active:scale-95',
        className
      )}
      {...props} />
  );
}

export { Slider, SliderThumb };
