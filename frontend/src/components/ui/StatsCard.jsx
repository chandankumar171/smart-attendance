import React from 'react';

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  green:  'bg-green-50 text-green-700 border-green-100',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  red:    'bg-red-50 text-red-700 border-red-100',
};

export default function StatsCard({ label, value, color = 'indigo' }) {
  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${colorMap[color]}`}>
      <p className="text-xl sm:text-2xl font-bold leading-tight">{value ?? '—'}</p>
      <p className="text-xs font-medium mt-0.5 opacity-80 leading-tight">{label}</p>
    </div>
  );
}