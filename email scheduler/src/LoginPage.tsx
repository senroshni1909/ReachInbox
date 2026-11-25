import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      loginWithGoogle({
        name: 'Oliver Brown',
        email: 'oliver.brown@domain.io',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        provider: 'google',
      });
      setIsLoading(false);
      showToast({
        type: 'success',
        title: 'Logged in with Google',
        message: 'Welcome back, Oliver Brown! Redirecting to dashboard...',
      });
      navigate('/dashboard', { replace: true });
    }, 400);
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const userEmail = email.trim() || 'oliver.brown@domain.io';
    const userName = userEmail.split('@')[0].replace(/[._]/g, ' ');
    const formattedName = userName.charAt(0).toUpperCase() + userName.slice(1);

    setIsLoading(true);
    setTimeout(() => {
      loginWithGoogle({
        name: formattedName || 'Oliver Brown',
        email: userEmail,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`,
        provider: 'google',
      });
      setIsLoading(false);
      showToast({
        type: 'success',
        title: 'Login successful',
        message: `Welcome, ${formattedName}! Redirecting to dashboard...`,
      });
      navigate('/dashboard', { replace: true });
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4 selection:bg-[#00a63e]/20 selection:text-[#00a63e]">
      {/* Centered Login Card matching exact Figma Design */}
      <div className="w-full max-w-[340px] bg-white border border-[#ebecee] rounded-2xl p-7 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
        {/* Title */}
        <h1 className="text-[26px] font-bold text-[#1c1c1c] text-center mb-6 tracking-tight">
          Login
        </h1>

        {/* Login with Google Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full h-[40px] bg-[#e5f6ec] hover:bg-[#d8f0e1] active:bg-[#cdecd8] text-[#2d3748] font-medium text-[13px] rounded-lg flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {/* Google 4-Color G Icon */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Login with Google</span>
        </button>

        {/* Divider: or sign up through email */}
        <div className="flex items-center my-4 gap-2">
          <div className="flex-1 h-px bg-[#eef0f2]" />
          <span className="text-[11px] text-[#9ca3af] font-normal tracking-wide whitespace-nowrap">
            or sign up through email
          </span>
          <div className="flex-1 h-px bg-[#eef0f2]" />
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleEmailLogin} className="space-y-2.5">
          <div>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email ID"
              className="w-full h-[40px] bg-[#f4f7f5] text-[#1c1c1c] placeholder-[#9ca3af] text-xs px-3.5 rounded-lg border-0 outline-none focus:ring-1 focus:ring-[#00a63e] transition-all"
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full h-[40px] bg-[#f4f7f5] text-[#1c1c1c] placeholder-[#9ca3af] text-xs px-3.5 rounded-lg border-0 outline-none focus:ring-1 focus:ring-[#00a63e] transition-all"
            />
          </div>

          {/* Green Submit Button (#00a63e) */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[40px] mt-1 bg-[#00a63e] hover:bg-[#009637] active:bg-[#008732] text-white font-medium text-xs rounded-lg flex items-center justify-center transition-colors cursor-pointer shadow-[0_1px_2px_rgba(0,166,62,0.2)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
