import React, { useState } from 'react';
import { useDiscreetMode } from '@/contexts/DiscreetModeContext';

interface DiscreetTextProps {
  text: string | null | undefined;
  variant: 'name' | 'body';
  className?: string;
  children?: React.ReactNode;
}

export const DiscreetText: React.FC<DiscreetTextProps> = ({
  text,
  variant,
  className = '',
  children
}) => {
  const { isDiscreetMode } = useDiscreetMode();
  const [isRevealed, setIsRevealed] = useState(false);
  
  // If discreet mode is off, show text normally
  if (!isDiscreetMode) {
    return (
      <span className={className}>
        {children || text || ''}
      </span>
    );
  }

  // If discreet mode is on, apply blur with reveal functionality
  const baseClasses = variant === 'name' 
    ? 'select-none cursor-help'
    : 'select-none cursor-help';
    
  const blurClasses = isRevealed 
    ? 'blur-none' 
    : variant === 'name' 
      ? 'blur-[3px]' 
      : 'blur-[2px]';

  const combinedClasses = `${baseClasses} ${blurClasses} transition-all duration-300 ${className}`;

  const handleMouseEnter = () => {
    setIsRevealed(true);
  };

  const handleMouseLeave = () => {
    setIsRevealed(false);
  };

  const handleTouchStart = () => {
    setIsRevealed(true);
  };

  const handleTouchEnd = () => {
    setIsRevealed(false);
  };

  return (
    <span
      className={combinedClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Hidden content - hover or press and hold to reveal"
      title="Hover or press and hold to reveal"
    >
      {children || text || ''}
    </span>
  );
};