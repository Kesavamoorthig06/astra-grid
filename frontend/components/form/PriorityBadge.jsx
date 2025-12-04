import React from 'react';
import { Badge } from '@/components/ui/base-badge';

export default function PriorityBadge({ priority }) {
  const variantMap = {
    High: 'destructive',
    Medium: 'warning',
    Low: 'success',
  };
  return (
    <Badge
      variant={variantMap[priority] || 'info'}
      appearance="ghost"
      size="sm"
      className="font-semibold tracking-tight"
    >
      {priority}
    </Badge>
  );
}
