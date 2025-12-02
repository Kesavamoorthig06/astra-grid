import React, { useEffect, useState } from 'react';
import { CountingNumber } from '../ui/counting-number';

export default function PredictionResults({ prediction }) {
  const [showNumbers, setShowNumbers] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!prediction) {
      setShowNumbers(false);
      return;
    }
    setShowNumbers(false);
    const timer = setTimeout(() => {
      setAnimationKey((prev) => prev + 1);
      setShowNumbers(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [prediction]);

  if (!prediction) return null;

  const cards = [
    {
      label: 'Cost Overrun Risk',
      value: prediction.cost_overrun_percent,
      suffix: '%',
      decimals: 2,
    },
    {
      label: 'Schedule Delay',
      value: prediction.schedule_delay_days,
      suffix: ' days',
      decimals: 1,
    },
  ];

  return (
    <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border bg-card/80 p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {showNumbers && typeof card.value === 'number' ? (
              <>
                <CountingNumber
                  key={`${card.label}-${animationKey}`}
                  from={0}
                  to={card.value}
                  duration={1.5}
                  delay={card.label === 'Schedule Delay' ? 200 : 0}
                  className="mr-1"
                  format={(value) => value.toFixed(card.decimals)}
                />
                <span className="text-xl font-semibold text-muted-foreground">{card.suffix}</span>
              </>
            ) : (
              <span className="text-base font-medium text-muted-foreground/70">Awaiting prediction…</span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
