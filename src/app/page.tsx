'use client';

import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Sparkles, LogOut } from 'lucide-react';

export default function SimpleAuthApp() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Form states
  const [email, setEmail] = useState('abi@gmail.com');
  const [password, setPassword] = useState('Abija@2399');
  const [name, setName] = useState('Abija User');
  const [confirmPassword, setConfirmPassword] = useState('');

  // App states
  const [userSession, setUserSession] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleQuickFill = () => {
    setEmail('abi@gmail.com');
    setPassword('Abija@2399');
    setName('Abija User');
    setErrorMessage(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (email === 'abi@gmail.com' && password === 'Abija@2399') {
        setUserSession({ name: 'Abija User', email: 'abi@gmail.com' });
        setSuccessMessage('Successfully authenticated! Welcome to your workspace.');
      } else {
        setErrorMessage('Invalid credentials. Use test user: abi@gmail.com / Abija@2399');
      }
    }, 600);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== confirmPassword && confirmPassword.length > 0) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setUserSession({ name: name || 'New Developer', email });
      setSuccessMessage('Account created successfully! Session active.');
    }, 600);
  };

  const handleLogout = () => {
    setUserSession(null);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans select-none">
      {/* Container */}
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-950 border border-sky-800 text-sky-400 rounded-full text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next.js App Router Auth</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI Teams Platform</h1>
          <p className="text-slate-400 text-xs">Simple Login & Signup Authentication App</p>
        </div>

        {/* User Session Screen */}
        {userSession ? (
          <div className="space-y-5 text-center py-4 bg-slate-950 p-6 rounded-xl border border-slate-800">
            <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Welcome, {userSession.name}!</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{userSession.email}</p>
            </div>
            <div className="p-3 bg-emerald-950/60 border border-emerald-900 rounded-lg text-emerald-300 text-xs">
              ✓ Active Session Token Generated & Authenticated
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <>
            {/* Quick Seed Button */}
            <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px]">Test Credentials:</span>
              <button
                type="button"
                onClick={handleQuickFill}
                className="px-2.5 py-1 bg-sky-950 border border-sky-800 text-sky-300 hover:bg-sky-900 rounded text-[11px] font-mono font-medium flex items-center gap-1 transition-colors"
              >
                <span>⚡ Fill abi@gmail.com</span>
              </button>
            </div>

            {/* Notifications */}
            {errorMessage && (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-lg text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Tab Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => { setActiveTab('login'); setErrorMessage(null); }}
                className={`py-1.5 rounded transition-all ${
                  activeTab === 'login'
                    ? 'bg-slate-800 text-sky-400 shadow'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setActiveTab('signup'); setErrorMessage(null); }}
                className={`py-1.5 rounded transition-all ${
                  activeTab === 'signup'
                    ? 'bg-slate-800 text-sky-400 shadow'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Login Form */}
            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="abi@gmail.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Abija@2399"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-sky-950/50"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            ) : (
              /* Signup Form */
              <form onSubmit={handleSignup} className="space-y-3">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-slate-300">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Abija User"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="abi@gmail.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Abija@2399"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-950/50"
                >
                  <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
