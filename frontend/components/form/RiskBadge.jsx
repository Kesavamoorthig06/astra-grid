import React from 'react';
import { Badge } from '@/components/ui/base-badge';

const VARIANT_MAP = {
  High: 'destructive',
  Medium: 'warning',
  Low: 'success',
};

export default function RiskBadge({ risk }) {
  const normalized = risk || 'Unknown';
  const variant = VARIANT_MAP[normalized] || 'info';

  return (
    <Badge
      variant={variant}
      appearance="ghost"
      size="sm"
      className="font-semibold tracking-tight"
    >
      {normalized}
    </Badge>
  );
}
