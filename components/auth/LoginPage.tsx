
import React, { useState } from 'react';
import Logo from '../Logo';

interface LoginPageProps {
  onLogin: (username: string, password_provided: string) => void;
  error: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="flex flex-col items-center justify-center pt-10 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo className="h-32 w-32" />
          <h2 className="text-3xl font-bold text-amber-400 mt-4">Examify</h2>
          <p className="text-slate-400 text-sm">Professional AI Exam Suite</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 shadow-xl shadow-black/40 border border-slate-700 rounded-2xl px-8 pt-8 pb-8 mb-4">
          <div className="mb-6 text-center">
             <h3 className="text-xl font-semibold text-white">Welcome Back</h3>
             <p className="text-slate-400 text-sm mt-1">Please sign in to your dashboard</p>
          </div>

          <div className="mb-4">
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="username">
              Username
            </label>
            <input
              className="shadow appearance-none border border-slate-600 bg-slate-900/50 rounded-xl w-full py-3 px-4 text-amber-50 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              id="username"
              type="text"
              placeholder="e.g. teacher_mit"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow appearance-none border border-slate-600 bg-slate-900/50 rounded-xl w-full py-3 px-4 text-amber-50 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              id="password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="bg-red-900/40 border border-red-500/30 text-red-300 text-xs p-3 rounded-xl mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>}
          
          <div className="flex items-center justify-between">
            <button
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-4 rounded-xl focus:outline-none shadow-lg shadow-amber-500/20 transform transition active:scale-95"
              type="submit"
            >
              Sign In
            </button>
          </div>

          <div className="text-center mt-8 pt-6 border-t border-slate-700/50">
             <p className="text-xs text-slate-500">
                Support: <a href="https://wa.me/qr/X5UGJ6KJXCT6N1" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 font-medium">+252 634 423354</a>
            </p>
          </div>
        </form>
        <p className="text-center text-slate-600 text-[10px] uppercase tracking-widest mt-4">
          &copy; {new Date().getFullYear()} Examify Technology. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
