import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import FaceCapture from '../components/face/FaceCapture';

const STEPS = ['Account details', 'Register face'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '', studentId: '', course: '', batch: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await register(form);
      toast.success('Account created! Now register your face.');
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceRegistered = () => {
    toast.success('Face registered! Redirecting to dashboard...');
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  const handleSkipFace = () => {
    toast.info('You can register your face from your dashboard later.');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4 py-8">
      <div className="w-full max-w-sm sm:max-w-md">

        {/* Header */}
        <div className="text-center mb-5 sm:mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 rounded-2xl mb-3">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-5 sm:mb-6">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? 'bg-indigo-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>

        <div className="card">
          {step === 0 && (
            <form onSubmit={handleAccountSubmit} className="space-y-3 sm:space-y-4">
              {/* Full name — full width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Chandan Kumar Sahoo"
                  required
                />
              </div>

              {/* Email — full width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="you@institute.edu"
                  required
                />
              </div>

              {/* Student ID + Course — 2 cols on sm+, stacked on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                  <input
                    name="studentId"
                    value={form.studentId}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="STU001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <input
                    name="course"
                    value={form.course}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="MCA"
                  />
                </div>
              </div>

              {/* Batch + Password — 2 cols on sm+, stacked on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                  <input
                    name="batch"
                    value={form.batch}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="2024-28"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Continue'}
              </button>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}

          {step === 1 && (
            <div>
              <FaceCapture mode="register" onSuccess={handleFaceRegistered} />
              <button
                onClick={handleSkipFace}
                className="btn-secondary w-full mt-3 text-xs"
              >
                Skip for now (do this from dashboard later)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}