import React from 'react';
import { DialogTitle, DialogDescription } from '../ui/dialog';

export default function RecommendationsHeader({ count }) {
  return (
    <div className="border-b pb-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-blue-500">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="min-w-0">
          <DialogTitle>ASTRA-GRID's Recommendations</DialogTitle>
          <DialogDescription className="whitespace-nowrap text-sm text-gray-600">
            AI-powered suggestions to mitigate risks and improve outcomes
          </DialogDescription>
          <span className="text-xs font-normal text-gray-500">({count} suggestions)</span>
        </div>
      </div>
    </div>
  );
}
