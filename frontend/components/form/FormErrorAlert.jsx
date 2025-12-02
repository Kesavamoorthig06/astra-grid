import React from 'react';
import { HiExclamationTriangle, HiXMark } from 'react-icons/hi2';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export default function FormErrorAlert({ error, onDismiss }) {
  if (!error) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-50 flex justify-center px-4">
      <Alert className="pointer-events-auto flex w-full max-w-2xl items-center gap-3 shadow-lg">
        <HiExclamationTriangle className="mt-0.5 h-5 w-5 shrink-0 text-black" />
        <div className="space-y-1">
          <AlertTitle>Missing information</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-auto text-black/60 transition hover:text-black"
          aria-label="Dismiss alert"
        >
          <HiXMark className="h-4 w-4" />
        </button>
      </Alert>
    </div>
  );
}
