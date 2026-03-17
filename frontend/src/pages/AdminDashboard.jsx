import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import api from '../utils/api';
import StatsCard from '../components/ui/StatsCard';
import Navbar from '../components/ui/Navbar';
import StudentTable from '../components/attendance/StudentTable';
import DailyAttendanceTable from '../components/attendance/DailyAttendanceTable';

const VIEWS = { OVERVIEW: 'overview', DAILY: 'daily', STUDENTS: 'students' };

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [view, setView] = useState(VIEWS.OVERVIEW);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyRecords, setDailyRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      toast.error('Failed to load stats');
    }
  }, []);

  const fetchDailyRecords = useCallback(async (date) => {
    try {
      const res = await api.get(`/admin/attendance/daily?date=${date}`);
      setDailyRecords(res.data.records);
      setStats((prev) => ({ ...prev, ...res.data.stats }));
    } catch (err) {
      toast.error('Failed to load daily attendance');
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await api.get('/admin/students');
      setStudents(res.data.students);
    } catch (err) {
      toast.error('Failed to load students');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchDailyRecords(selectedDate), fetchStudents()]);
      setLoading(false);
    };
    init();
  }, [fetchStats, fetchDailyRecords, fetchStudents, selectedDate]);

  // Real-time socket updates
  useSocket('admin', {
    onAttendanceUpdate: (data) => {
      const { record } = data;
      setRecentActivity((prev) => [record, ...prev].slice(0, 10));
      setLiveCount((c) => c + 1);
      // Update daily table if it's today
      const today = new Date().toISOString().split('T')[0];
      if (selectedDate === today) {
        setDailyRecords((prev) => {
          const exists = prev.find((r) => r._id === record._id);
          if (exists) return prev.map((r) => (r._id === record._id ? record : r));
          return [record, ...prev];
        });
      }
      toast.info(`${record.student?.name} marked ${record.status}`, { autoClose: 3000 });
    },
    onStatsUpdate: (newStats) => {
      setStats((prev) => ({ ...prev, ...newStats }));
    },
  });

  const handleExport = async () => {
    try {
      const res = await api.get(`/admin/export?date=${selectedDate}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${selectedDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV exported!');
    } catch {
      toast.error('Export failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={logout} isAdmin />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
            <p className="text-gray-500 text-sm mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          {liveCount > 0 && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-3 py-1.5 rounded-full border border-green-200">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {liveCount} live update{liveCount > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatsCard label="Total Students" value={stats.totalStudents || stats.total} color="indigo" />
            <StatsCard label="Present" value={stats.present} color="green" />
            <StatsCard label="Late" value={stats.late} color="yellow" />
            <StatsCard label="Absent" value={stats.absent} color="red" />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {[
            { key: VIEWS.OVERVIEW, label: 'Live Feed' },
            { key: VIEWS.DAILY, label: 'Daily Records' },
            { key: VIEWS.STUDENTS, label: 'All Students' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                view === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Live Feed ── */}
        {view === VIEWS.OVERVIEW && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Real-time attendance feed
            </h3>
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No activity yet. Attendance updates will appear here in real time.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentActivity.map((rec, i) => (
                  <li key={i} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{rec.student?.name}</p>
                      <p className="text-xs text-gray-500">{rec.student?.studentId} · {rec.student?.course}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge-${rec.status}`}>
                        {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {rec.markedAt ? new Date(rec.markedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Daily Records ── */}
        {view === VIEWS.DAILY && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-field w-auto"
                />
              </div>
              <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            </div>
            <DailyAttendanceTable records={dailyRecords} date={selectedDate} />
          </div>
        )}

        {/* ── All Students ── */}
        {view === VIEWS.STUDENTS && <StudentTable students={students} />}
      </main>
    </div>
  );
}