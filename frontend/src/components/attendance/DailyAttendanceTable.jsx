import React from 'react';

export default function DailyAttendanceTable({ records, date }) {
  if (records.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No attendance records for {date}.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Course</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Time</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Marked by</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {records.map((rec) => (
            <tr key={rec._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900">{rec.student?.name}</td>
              <td className="px-4 py-3 text-gray-500">{rec.student?.studentId}</td>
              <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{rec.student?.course || '—'}</td>
              <td className="px-4 py-3">
                <span className={`badge-${rec.status}`}>
                  {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                {rec.markedAt
                  ? new Date(rec.markedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </td>
              <td className="px-4 py-3 text-gray-500 capitalize hidden md:table-cell">
                {rec.markedBy?.replace('-', ' ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}