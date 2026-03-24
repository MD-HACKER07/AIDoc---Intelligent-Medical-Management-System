import React from 'react';

type LoadingProps = {
  variant?: 'default' | 'spinner' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
};

export function Loading({
  variant = 'default',
  size = 'md',
  text = 'Loading...',
  fullScreen = false
}: LoadingProps) {
  const containerClasses = fullScreen
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50'
    : 'flex flex-col items-center justify-center py-8';

  const sizes = {
    sm: {
      spinner: 'h-6 w-6 border-2',
      dots: 'h-1.5 w-1.5',
      pulse: 'h-8 w-8'
    },
    md: {
      spinner: 'h-10 w-10 border-2',
      dots: 'h-2 w-2',
      pulse: 'h-12 w-12'
    },
    lg: {
      spinner: 'h-16 w-16 border-3',
      dots: 'h-3 w-3',
      pulse: 'h-16 w-16'
    }
  };

  const renderLoading = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div className={`${sizes[size].spinner} animate-spin rounded-full border-solid border-blue-500 border-t-transparent`}></div>
        );
      case 'dots':
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${sizes[size].dots} bg-blue-500 rounded-full animate-bounce`}
                style={{ animationDelay: `${i * 0.15}s` }}
              ></div>
            ))}
          </div>
        );
      case 'pulse':
        return (
          <div
            className={`${sizes[size].pulse} bg-blue-500/20 rounded-full animate-pulse flex items-center justify-center`}
          >
            <div className={`${
              size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-6 w-6' : 'h-8 w-8'
            } bg-blue-500/40 rounded-full animate-pulse`}></div>
          </div>
        );
      default:
        return (
          <div className={`${sizes[size].spinner} animate-spin rounded-full border-solid border-blue-500 border-t-transparent`}></div>
        );
    }
  };

  return (
    <div className={containerClasses}>
      {renderLoading()}
      {text && (
        <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm font-medium">
          {text}
        </p>
      )}
    </div>
  );
} 