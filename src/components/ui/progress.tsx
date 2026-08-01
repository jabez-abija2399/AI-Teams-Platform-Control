import * as React from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className = '', value = 0, ...props }, ref) => {
    const clamped = Math.max(0, Math.min(100, value));
    return (
      <div
        ref={ref}
        className={`relative w-full overflow-hidden rounded-full bg-gray-800 ${className}`}
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-indigo-500 transition-all duration-300 ease-in-out"
          style={{ transform: `translateX(-${100 - clamped}%)` }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';
