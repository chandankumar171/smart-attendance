import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

export default function StudentTable({ students }) {
  const [selected, setSelected] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const viewStudent = async (student) => {
    setSelected(student);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/admin/attendance/student/${student._id}`);
      setStudentDetail(res.data);
    } catch {
      toast.error('Failed to load student details');
    } finally {
      setLoadingDetail(false);
    }
  };

  if (selected) {
    return (
      <div>
        <button onClick={() => { setSelected(null); setStudentDetail(null); }} className="flex items-center gap-1 text-sm text-indigo-600 hover:underline mb-4">
          ← Back to all students
        </button>

        <div className="card mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{selected.name}</h3>
              <p className="text-sm text-gray-500">{selected.email} · ID: {selected.studentId}</p>
              <p className="text-sm text-gray-500">{selected.course} · {selected.batch}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selected.isFaceRegistered ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {selected.isFaceRegistered ? 'Face registered' : 'No face data'}
              </span>
            </div>
          </div>

          {studentDetail?.stats && (
            <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
              {[
                { label: 'Total', value: studentDetail.stats.total ?? 0 },
                { label: 'Present', value: studentDetail.stats.present ?? 0 },
                { label: 'Late', value: studentDetail.stats.late ?? 0 },
                { label: 'Absent', value: studentDetail.stats.absent ?? 0 },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-lg font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {studentDetail?.stats?.percentage !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Attendance rate</span>
                <span>{studentDetail.stats.percentage ?? 0}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${(studentDetail.stats.percentage ?? 0) >= 75 ? 'bg-green-500' : (studentDetail.stats.percentage ?? 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${studentDetail.stats.percentage ?? 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {loadingDetail ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentDetail?.records?.map((rec) => (
                  <tr key={rec._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{rec.date}</td>
                    <td className="px-4 py-3">
                      <span className={`badge-${rec.status}`}>
                        {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {rec.markedAt ? new Date(rec.markedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">All Students ({students.length})</h2>
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Student ID</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Course / Batch</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Face</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((s) => (
              <tr key={s._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{s.studentId}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{s.course || '—'} {s.batch ? `· ${s.batch}` : ''}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${s.isFaceRegistered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.isFaceRegistered ? '✓ Registered' : 'Not set'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => viewStudent(s)} className="text-xs text-indigo-600 hover:underline font-medium">
                    View history
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}