import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function AttendanceHistory() {
  const [records, setRecords] = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/attendance/my');
        setRecords(res.data.records);
        setStats(res.data.stats);
      } catch (err) {
        console.error('Failed to fetch attendance history', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Attendance History</h2>

      {/* Stats mini-cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-5">
          {[
            { label: 'Total',   value: stats.total,   color: 'text-gray-900'    },
            { label: 'Present', value: stats.present, color: 'text-green-600'   },
            { label: 'Late',    value: stats.late,    color: 'text-yellow-600'  },
            { label: 'Absent',  value: stats.absent,  color: 'text-red-600'     },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-2.5 px-1">
              <p className={`text-lg sm:text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {records.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-sm">No attendance records yet.</p>
        </div>
      ) : (
        <>
          {/* ── Mobile: card per record ── */}
          <div className="sm:hidden space-y-3">
            {records.map((rec) => (
              <div key={rec._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center justify-between gap-3">
                  {/* Date */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(rec.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">
                      {rec.markedBy?.replace('-', ' ') || '—'}
                    </p>
                  </div>
                  {/* Right side: status + time */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`badge-${rec.status}`}>
                      {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {rec.markedAt
                        ? new Date(rec.markedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop: full table ── */}
          <div className="hidden sm:block card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Marked by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((rec) => (
                  <tr key={rec._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {new Date(rec.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
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
                    <td className="px-4 py-3 text-gray-500 capitalize">
                      {rec.markedBy?.replace('-', ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}