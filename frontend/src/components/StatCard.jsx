import React from 'react';

export default function StatCard({ title, value, icon: Icon, subtitle, color = 'purple' }) {
  const colorStyles = {
    purple: {
      bg: 'bg-brand-50',
      text: 'text-brand-600',
      border: 'border-brand-100',
      badge: 'bg-brand-100 text-brand-700'
    },
    teal: {
      bg: 'bg-tealAccent-50',
      text: 'text-tealAccent-600',
      border: 'border-tealAccent-100',
      badge: 'bg-tealAccent-100 text-tealAccent-800'
    },
    blue: {
      bg: 'bg-sky-50',
      text: 'text-sky-600',
      border: 'border-sky-100',
      badge: 'bg-sky-100 text-sky-700'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      badge: 'bg-amber-100 text-amber-800'
    }
  };

  const style = colorStyles[color] || colorStyles.purple;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft-sm hover:shadow-soft-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`w-10 h-10 rounded-xl ${style.bg} ${style.text} flex items-center justify-center border ${style.border}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-outfit">{value}</div>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
