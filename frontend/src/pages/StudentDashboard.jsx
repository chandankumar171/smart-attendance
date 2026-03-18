import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import FaceCapture from '../components/face/FaceCapture';
import AttendanceHistory from '../components/attendance/AttendanceHistory';
import StatsCard from '../components/ui/StatsCard';
import Navbar from '../components/ui/Navbar';

const VIEWS = { HOME: 'home', MARK: 'mark', HISTORY: 'history', FACE: 'face' };

export default function StudentDashboard() {
  const { user, updateUser, logout } = useAuth();
  const [view, setView]               = useState(VIEWS.HOME);
  const [todayRecord, setTodayRecord] = useState(null);
  const [windowStatus, setWindowStatus] = useState(null);
  const [stats, setStats]             = useState(null);
  const [loadingToday, setLoadingToday] = useState(true);

  const fetchTodayStatus = useCallback(async () => {
    try {
      const res = await api.get('/attendance/today');
      setTodayRecord(res.data.todayRecord);
      setWindowStatus(res.data.windowStatus);
    } catch (err) {
      console.error('Failed to fetch today status', err);
    } finally {
      setLoadingToday(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/attendance/my');
      setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  }, []);

  useEffect(() => {
    fetchTodayStatus();
    fetchStats();
  }, [fetchTodayStatus, fetchStats]);

  const handleAttendanceSuccess = (data) => {
    setTodayRecord({ status: data.status, markedAt: data.markedAt });
    fetchStats();
    setTimeout(() => setView(VIEWS.HOME), 2000);
  };

  const handleFaceRegistered = () => {
    updateUser({ isFaceRegistered: true });
    toast.success('Face registered successfully!');
    setTimeout(() => setView(VIEWS.HOME), 1500);
  };

  const getWindowLabel = () => {
    if (todayRecord) return null;
    if (!windowStatus) return { text: 'Attendance closed', color: 'text-red-600', bg: 'bg-red-50' };
    if (windowStatus === 'late') return { text: 'Late window open (until 10:00 AM)', color: 'text-yellow-700', bg: 'bg-yellow-50' };
    return { text: 'Attendance window open (until 9:30 AM for Present)', color: 'text-green-700', bg: 'bg-green-50' };
  };

  const windowLabel = getWindowLabel();
  const faceAlert   = !user?.isFaceRegistered;

  const desktopTabs = [
    { key: VIEWS.HOME,    label: 'Overview' },
    { key: VIEWS.MARK,    label: 'Mark Attendance' },
    { key: VIEWS.HISTORY, label: 'History' },
    { key: VIEWS.FACE,    label: user?.isFaceRegistered ? 'Update Face' : 'Register Face' },
  ];

  const bottomTabs = [
    {
      key: VIEWS.HOME, label: 'Overview',
      icon: (active) => (
        <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      key: VIEWS.MARK, label: 'Mark',
      icon: (active) => (
        <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      key: VIEWS.HISTORY, label: 'History',
      icon: (active) => (
        <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      key: VIEWS.FACE, label: 'Face',
      icon: (active) => (
        <div className="relative">
          <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {faceAlert && (
            <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={logout} />

      {/* Desktop tab bar — hidden on mobile */}
      <div className="hidden sm:block bg-white border-b border-gray-200 sticky top-14 z-10">
        <div className="max-w-4xl mx-auto px-4 flex gap-1">
          {desktopTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                view === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.key === VIEWS.FACE && faceAlert && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-xs bg-red-500 text-white rounded-full">!</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main content — extra bottom padding on mobile for bottom nav */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24 sm:pb-8">

        {/* ── Overview ── */}
        {view === VIEWS.HOME && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Wellcome, {user?.name?.split(' ')[0]} 👋
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {!loadingToday && (
              <div className={`rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3 ${
                todayRecord
                  ? todayRecord.status === 'present' ? 'bg-green-50 border border-green-200'
                  : todayRecord.status === 'late'    ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-red-50 border border-red-200'
                  : (windowLabel?.bg || 'bg-gray-50') + ' border border-gray-200'
              }`}>
                <div className="min-w-0 flex-1">
                  {todayRecord ? (
                    <>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        Today:{' '}
                        <span className={
                          todayRecord.status === 'present' ? 'text-green-700' :
                          todayRecord.status === 'late'    ? 'text-yellow-700' : 'text-red-700'
                        }>
                          {todayRecord.status.charAt(0).toUpperCase() + todayRecord.status.slice(1)}
                        </span>
                      </p>
                      {todayRecord.markedAt && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                          Marked at {new Date(todayRecord.markedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className={`font-semibold text-sm sm:text-base ${windowLabel?.color}`}>{windowLabel?.text}</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">You have not marked attendance today</p>
                    </>
                  )}
                </div>
                {!todayRecord && windowStatus && (
                  <button onClick={() => setView(VIEWS.MARK)} className="btn-primary text-xs sm:text-sm shrink-0 px-3 py-2">
                    Mark Now
                  </button>
                )}
              </div>
            )}

            {faceAlert && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-amber-800 text-sm">Face not registered</p>
                  <p className="text-amber-700 text-xs mt-0.5">Register your face to start marking attendance automatically.</p>
                </div>
                <button onClick={() => setView(VIEWS.FACE)} className="text-xs font-medium text-amber-700 hover:underline shrink-0">
                  Register →
                </button>
              </div>
            )}

            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <StatsCard label="Total Days" value={stats.total}   color="indigo" />
                <StatsCard label="Present"    value={stats.present} color="green"  />
                <StatsCard label="Late"       value={stats.late}    color="yellow" />
                <StatsCard label="Absent"     value={stats.absent}  color="red"    />
              </div>
            )}

            {stats && stats.total > 0 && (
              <div className="card">
                <p className="text-sm font-medium text-gray-700 mb-2">Attendance rate</p>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.round(((stats.present + stats.late) / stats.total) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  {Math.round(((stats.present + stats.late) / stats.total) * 100)}% attendance
                  ({stats.present + stats.late} / {stats.total} days)
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Mark Attendance ── */}
        {view === VIEWS.MARK && (
          <div className="w-full max-w-sm mx-auto">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Mark Attendance</h2>
            <p className="text-sm text-gray-500 mb-5">Look into the camera to verify your identity.</p>
            {todayRecord ? (
              <div className="card text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900">Attendance already recorded for today</p>
                <p className="text-sm text-gray-500 mt-1 capitalize">Status: {todayRecord.status}</p>
              </div>
            ) : !windowStatus ? (
              <div className="card text-center">
                <p className="font-semibold text-red-600">Attendance window is closed</p>
                <p className="text-sm text-gray-500 mt-1">Attendance closes at 10:00 AM each day.</p>
              </div>
            ) : !user?.isFaceRegistered ? (
              <div className="card text-center">
                <p className="font-semibold text-amber-600">Face not registered</p>
                <p className="text-sm text-gray-500 mt-1">Please register your face first.</p>
                <button onClick={() => setView(VIEWS.FACE)} className="btn-primary mt-4">Register Face</button>
              </div>
            ) : (
              <FaceCapture mode="attendance" onSuccess={handleAttendanceSuccess} />
            )}
          </div>
        )}

        {/* ── History ── */}
        {view === VIEWS.HISTORY && <AttendanceHistory />}

        {/* ── Face Registration ── */}
        {view === VIEWS.FACE && (
          <div className="w-full max-w-sm mx-auto">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
              {user?.isFaceRegistered ? 'Update Face Data' : 'Register Your Face'}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Make sure you're in a well-lit area and looking directly at the camera.
            </p>
            <FaceCapture mode="register" onSuccess={handleFaceRegistered} />
          </div>
        )}
      </main>

      {/* ── Bottom Navigation Bar — mobile only ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-4 h-16 px-1">
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