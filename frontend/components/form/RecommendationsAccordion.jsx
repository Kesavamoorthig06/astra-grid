import React from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../ui/accordion';
import PriorityBadge from './PriorityBadge';

export default function RecommendationsAccordion({ recommendations }) {
  return (
    <div className="rounded-xl border bg-gray-50 p-5">
      <Accordion type="single" collapsible indicator="plus" className="w-full">
        {recommendations.map((rec, idx) => (
          <AccordionItem key={rec.id} value={`rec-${idx}`}>
            <AccordionTrigger>
              <div className="flex items-center gap-3 flex-1 pr-4">
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{rec.title}</span>
                    <PriorityBadge priority={rec.priority} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{rec.category}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-700 bg-gray-100 p-3 rounded-lg">
                  {rec.summary}
                </p>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                    Action Items
                  </p>
                  <ul className="space-y-2">
                    {rec.details.map((detail, detailIdx) => (
                      <li key={detailIdx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-gray-400">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t">
                  <span className="text-xs font-medium text-gray-700">
                    Expected Impact: {rec.impact}
                  </span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
