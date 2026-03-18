import React, { useState } from 'react';

export default function Navbar({ user, onLogout, isAdmin = false }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Left — logo + title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 shrink-0 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-sm truncate">Smart Attendance</span>
          {isAdmin && (
            <span className="shrink-0 text-xs bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded-full">Admin</span>
          )}
        </div>

        {/* Right — desktop */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 leading-none truncate max-w-[140px]">{user?.name}</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[140px]">{user?.studentId || user?.email}</p>
          </div>
          <div className="w-8 h-8 shrink-0 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={onLogout}
            className="text-xs text-gray-500 hover:text-gray-900 transition-colors px-2 py-1.5 rounded hover:bg-gray-100 whitespace-nowrap"
          >
            Sign out
          </button>
        </div>

        {/* Right — mobile: avatar + hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          <div className="w-8 h-8 shrink-0 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-2">
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{user?.studentId || user?.email}</p>
          </div>
          <button
            onClick={() => { setMenuOpen(false); onLogout(); }}
            className="w-full text-left text-sm text-red-600 hover:text-red-700 font-medium py-1"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}