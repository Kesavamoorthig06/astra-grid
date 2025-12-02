'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardHeading, CardToolbar } from '../ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from 'lucide-react';

export default function CollapsibleDemo() {
  const [isOpen, setIsOpen] = React.useState(false);

  const stats = [
    {
      label: 'Added to Cart',
      value: 3842,
      change: '+1.8%',
      changeType: 'increase',
    },
    {
      label: 'Reached Checkout',
      value: 1256,
      change: '-1.2%',
      changeType: 'decrease',
    },
    { label: 'Purchased', value: 649, change: '+2.4%', changeType: 'increase' },
  ];

  return (
    <Card className="w-[350px]">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="h-auto py-4">
          <CardHeading>
            <div className="text-muted-foreground font-medium text-sm">Conversion Rate</div>
            <div className="flex items-center gap-1.5">
              <span className="text-foreground font-semibold text-xl">29.9%</span>
              <Badge variant="primary" appearance="outline" size="sm" shape="circle">
                +4,5%
              </Badge>
            </div>
          </CardHeading>
          <CardToolbar>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="">
                Details
                {isOpen ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </CollapsibleTrigger>
          </CardToolbar>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="text-sm space-y-3">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-muted-foreground">{stat.label}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-foreground font-semibold">${stat.value.toLocaleString()}</span>
                  <span
                    className={cn(
                      'flex items-center justify-end text-sm font-medium min-w-20',
                      stat.changeType === 'increase' ? 'text-success' : 'text-destructive'
                    )}>
                    {stat.changeType === 'increase' ? (
                      <ArrowUp className="size-3.5" />
                    ) : (
                      <ArrowDown className="size-3.5" />
                    )}
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
