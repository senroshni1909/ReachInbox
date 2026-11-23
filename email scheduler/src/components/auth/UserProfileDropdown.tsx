import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, ChevronDown, CheckCircle, Shield } from 'lucide-react';

interface UserProfileDropdownProps {
  onOpenLoginModal: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ onOpenLoginModal }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={() => navigate('/login')}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-all shadow-md cursor-pointer"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
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
        <span>Sign in with Google</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 transition-all cursor-pointer text-left"
      >
        <img
          src={user.avatar}
          alt={user.name}
          className="w-8 h-8 rounded-lg object-cover border border-slate-700 bg-slate-800"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`;
          }}
        />
        <div className="hidden sm:block">
          <p className="text-xs font-bold text-slate-100 leading-tight flex items-center gap-1">
            <span>{user.name}</span>
            <CheckCircle className="w-3 h-3 text-emerald-400 inline" />
          </p>
          <p className="text-[11px] text-slate-400 font-mono leading-tight">{user.email}</p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#11131a] border border-slate-800 rounded-xl shadow-2xl shadow-black/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2.5 border-b border-slate-800/80 mb-1">
            <p className="text-xs font-semibold text-slate-100">{user.name}</p>
            <p className="text-xs text-slate-400 font-mono truncate">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-400 font-medium">
              <Shield className="w-3 h-3" />
              <span>Google OAuth Authenticated</span>
            </div>
          </div>

          <button
            onClick={() => {
              setIsOpen(false);
              onOpenLoginModal();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer text-left"
          >
            <span>Switch Google Account</span>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              logout();
              navigate('/login', { replace: true });
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
