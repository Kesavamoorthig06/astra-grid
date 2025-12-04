import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

export default function Magic() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('nav.magic')}</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{t('common.info')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-12 text-center backdrop-blur-sm">
          <Sparkles className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Coming Soon</h3>
          <p className="text-gray-500 dark:text-gray-400">Special admin features will appear here</p>
        </div>
      </div>
    </div>
  );
}
