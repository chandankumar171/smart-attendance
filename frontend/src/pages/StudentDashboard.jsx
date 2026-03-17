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
  const [view, setView] = useState(VIEWS.HOME);
  const [todayRecord, setTodayRecord] = useState(null);
  const [windowStatus, setWindowStatus] = useState(null);
  const [stats, setStats] = useState(null);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={logout} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Nav tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          {[
            { key: VIEWS.HOME, label: 'Overview' },
            { key: VIEWS.MARK, label: 'Mark Attendance' },
            { key: VIEWS.HISTORY, label: 'History' },
            { key: VIEWS.FACE, label: user?.isFaceRegistered ? 'Update Face' : 'Register Face' },
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
              {tab.key === VIEWS.FACE && !user?.isFaceRegistered && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-xs bg-red-500 text-white rounded-full">!</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {view === VIEWS.HOME && (
          <div className="space-y-6">
            {/* Greeting */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Good morning, {user?.name?.split(' ')[0]} 👋</h2>
              <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Today's status banner */}
            {!loadingToday && (
              <div className={`rounded-xl p-4 flex items-center justify-between ${
                todayRecord
                  ? todayRecord.status === 'present' ? 'bg-green-50 border border-green-200'
                  : todayRecord.status === 'late' ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-red-50 border border-red-200'
                  : windowLabel?.bg + ' border border-gray-200'
              }`}>
                <div>
                  {todayRecord ? (
                    <>
                      <p className="font-semibold text-gray-900">
                        Today: <span className={todayRecord.status === 'present' ? 'text-green-700' : todayRecord.status === 'late' ? 'text-yellow-700' : 'text-red-700'}>
                          {todayRecord.status.charAt(0).toUpperCase() + todayRecord.status.slice(1)}
                        </span>
                      </p>
                      {todayRecord.markedAt && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          Marked at {new Date(todayRecord.markedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className={`font-semibold ${windowLabel?.color}`}>{windowLabel?.text}</p>
                      <p className="text-sm text-gray-500 mt-0.5">You have not marked attendance today</p>
                    </>
                  )}
                </div>
                {!todayRecord && windowStatus && (
                  <button onClick={() => setView(VIEWS.MARK)} className="btn-primary text-sm shrink-0">
                    Mark Now
                  </button>
                )}
              </div>
            )}

            {/* Face not registered warning */}
            {!user?.isFaceRegistered && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="font-medium text-amber-800 text-sm">Face not registered</p>
                  <p className="text-amber-700 text-xs mt-0.5">Register your face to start marking attendance automatically.</p>
                </div>
                <button onClick={() => setView(VIEWS.FACE)} className="text-xs font-medium text-amber-700 hover:underline shrink-0">Register →</button>
              </div>
            )}

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatsCard label="Total Days" value={stats.total} color="indigo" />
                <StatsCard label="Present" value={stats.present} color="green" />
                <StatsCard label="Late" value={stats.late} color="yellow" />
                <StatsCard label="Absent" value={stats.absent} color="red" />
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
          <div className="max-w-sm mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Mark Attendance</h2>
            <p className="text-sm text-gray-500 mb-6">Look into the camera to verify your identity.</p>

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
          <div className="max-w-sm mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {user?.isFaceRegistered ? 'Update Face Data' : 'Register Your Face'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Make sure you're in a well-lit area and looking directly at the camera.
            </p>
            <FaceCapture mode="register" onSuccess={handleFaceRegistered} />
          </div>
        )}
      </main>
    </div>
  );
}