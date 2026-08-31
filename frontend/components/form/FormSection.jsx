import React from 'react';

export default function FormSection({ icon: Icon, title, children, iconClassName = 'text-primary', description }) {
  return (
    <section className="bg-card border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className={`w-5 h-5 ${iconClassName}`} />}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
      )}
      {children}
    </section>
  );
}
