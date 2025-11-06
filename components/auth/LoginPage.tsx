import React, { useState } from 'react';

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
    <div className="flex items-center justify-center pt-10">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="bg-slate-800 shadow-lg shadow-amber-500/5 rounded-lg px-8 pt-6 pb-8 mb-4">
          <div className="mb-6 text-center">
             <h2 className="text-2xl font-bold text-amber-400">Welcome to Examify</h2>
             <p className="text-slate-400 text-sm mt-1">Please sign in to continue</p>
          </div>

          <div className="mb-4">
            <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              className="shadow appearance-none border border-slate-600 bg-slate-700 rounded w-full py-2 px-3 text-amber-50 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-amber-500"
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow appearance-none border border-slate-600 bg-slate-700 rounded w-full py-2 px-3 text-amber-50 mb-3 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-amber-500"
              id="password"
              type="password"
              placeholder="******************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="bg-red-900/50 border border-red-500/30 text-red-300 text-xs italic p-2 rounded mb-4">{error}</p>}
          
          <div className="flex items-center justify-between">
            <button
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Sign In
            </button>
          </div>
           <div className="text-center mt-4 text-xs text-slate-500">
             <p>
                Contact Examify support team{' '}
                <a 
                    href="https://wa.me/qr/X5UGJ6KJXCT6N1" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-amber-400 hover:underline"
                >
                    +252634423354
                </a>
            </p>
           </div>
        </form>
        <p className="text-center text-slate-500 text-xs">
          &copy;{new Date().getFullYear()} Examify. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;