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
  const [view, setView]               = useState(VIEWS.OVERVIEW);
  const [stats, setStats]             = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyRecords, setDailyRecords] = useState([]);
  const [students, setStudents]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [liveCount, setLiveCount]     = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch {
      toast.error('Failed to load stats');
    }
  }, []);

  const fetchDailyRecords = useCallback(async (date) => {
    try {
      const res = await api.get(`/admin/attendance/daily?date=${date}`);
      setDailyRecords(res.data.records);
      setStats((prev) => ({ ...prev, ...res.data.stats }));
    } catch {
      toast.error('Failed to load daily attendance');
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await api.get('/admin/students');
      setStudents(res.data.students);
    } catch {
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

  useSocket('admin', {
    onAttendanceUpdate: (data) => {
      const { record } = data;
      setRecentActivity((prev) => [record, ...prev].slice(0, 10));
      setLiveCount((c) => c + 1);
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
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
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

  const bottomTabs = [
    {
      key: VIEWS.OVERVIEW, label: 'Live Feed',
      icon: (active) => (
        <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      key: VIEWS.DAILY, label: 'Daily',
      icon: (active) => (
        <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: VIEWS.STUDENTS, label: 'Students',
      icon: (active) => (
        <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={logout} isAdmin />

      {/* Desktop tab bar — hidden on mobile */}
      <div className="hidden sm:block bg-white border-b border-gray-200 sticky top-14 z-10">
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          {bottomTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                view === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label === 'Live Feed' ? 'Live Feed' : tab.label === 'Daily' ? 'Daily Records' : 'All Students'}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24 sm:pb-8">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-2 mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {liveCount > 0 && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 text-xs sm:text-sm font-medium px-2.5 py-1.5 rounded-full border border-green-200">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0" />
              {liveCount} live update{liveCount > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Stats — 2×2 on mobile, 4 cols on sm+ */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-8">
            <StatsCard label="Total Students" value={stats.totalStudents || stats.total} color="indigo" />
            <StatsCard label="Present"        value={stats.present}                      color="green"  />
            <StatsCard label="Late"           value={stats.late}                         color="yellow" />
            <StatsCard label="Absent"         value={stats.absent}                       color="red"    />
          </div>
        )}

        {/* ── Live Feed ── */}
        {view === VIEWS.OVERVIEW && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0" />
              Real-time attendance feed
            </h3>
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No activity yet. Attendance updates will appear here in real time.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentActivity.map((rec, i) => (
                  <li key={i} className="flex items-center justify-between py-3 gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{rec.student?.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {rec.student?.studentId}{rec.student?.course ? ` · ${rec.student.course}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`badge-${rec.status}`}>
                        {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                      </span>
                      <span className="text-xs text-gray-400 hidden sm:inline whitespace-nowrap">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <input
                type="date"
                value={selectedDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field w-full sm:w-auto"
              />
              <button onClick={handleExport} className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* ── Bottom Navigation Bar — mobile only ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-3 h-16 px-2">
          {bottomTabs.map((tab) => {
            const isActive = view === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className="flex flex-col items-center justify-center gap-1 rounded-xl mx-0.5 transition-all active:scale-95"
              >
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}>
                  {tab.icon(isActive)}
                </div>
                <span className={`text-[10px] font-medium leading-none transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}