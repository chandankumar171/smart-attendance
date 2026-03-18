import React from 'react';

export default function DailyAttendanceTable({ records, date }) {
  if (records.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 text-sm">No attendance records for {date}.</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile: card per student (hidden on sm+) ── */}
      <div className="sm:hidden space-y-3">
        {records.map((rec) => (
          <div key={rec._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            {/* Top row: name + status badge */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-sm">{rec.student?.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{rec.student?.studentId}</p>
              </div>
              <span className={`badge-${rec.status} shrink-0`}>
                {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
              </span>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-3 border-t border-gray-100">
              {rec.student?.course && (
                <div>
                  <p className="text-xs text-gray-400">Course</p>
                  <p className="text-xs font-medium text-gray-700 mt-0.5">{rec.student.course}</p>
                </div>
              )}
              {rec.student?.batch && (
                <div>
                  <p className="text-xs text-gray-400">Batch</p>
                  <p className="text-xs font-medium text-gray-700 mt-0.5">{rec.student.batch}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400">Time</p>
                <p className="text-xs font-medium text-gray-700 mt-0.5">
                  {rec.markedAt
                    ? new Date(rec.markedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Marked by</p>
                <p className="text-xs font-medium text-gray-700 mt-0.5 capitalize">
                  {rec.markedBy?.replace('-', ' ') || '—'}
                </p>
              </div>
              {rec.student?.email && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-xs font-medium text-gray-700 mt-0.5 truncate">{rec.student.email}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop: full table (hidden on mobile) ── */}
      <div className="hidden sm:block card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Course</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Marked by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((rec) => (
                <tr key={rec._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{rec.student?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{rec.student?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{rec.student?.studentId}</td>
                  <td className="px-4 py-3 text-gray-500">{rec.student?.course || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge-${rec.status}`}>
                      {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {rec.markedAt
                      ? new Date(rec.markedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 capitalize whitespace-nowrap">
                    {rec.markedBy?.replace('-', ' ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}