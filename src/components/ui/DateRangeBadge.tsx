import React from 'react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface DateRangeBadgeProps {
  start: Date;
  end: Date;
  className?: string;
}

export const DateRangeBadge: React.FC<DateRangeBadgeProps> = ({ start, end, className }) => {
  // Format the date range nicely
  const formatDateRange = (startDate: Date, endDate: Date): string => {
    const startFormatted = format(startDate, 'MMM d');
    const endFormatted = format(endDate, 'MMM d, yyyy');
    
    // If same month, show "Aug 19 – 25, 2025"
    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
      const startDay = format(startDate, 'd');
      const endFormatted = format(endDate, 'd, yyyy');
      const month = format(startDate, 'MMM');
      return `${month} ${startDay} – ${endFormatted}`;
    }
    
    return `${startFormatted} – ${endFormatted}`;
  };

  return (
    <Badge variant="outline" className={`text-muted-foreground border-muted-foreground/30 ${className}`}>
      {formatDateRange(start, end)}
    </Badge>
  );
};