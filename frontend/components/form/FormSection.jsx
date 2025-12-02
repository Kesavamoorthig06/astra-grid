import React from 'react';

export default function FormSection({ icon: Icon, title, children, iconClassName = 'text-primary' }) {
  return (
    <section className="bg-card border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-5 h-5 ${iconClassName}`} />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
