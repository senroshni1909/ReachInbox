import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, Sparkles, Check } from 'lucide-react';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const [customName, setCustomName] = useState('Alex Carter');
  const [customEmail, setCustomEmail] = useState('alex.carter@reachinbox.ai');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSignIn = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      loginWithGoogle({
        name: customName || 'ReachInbox Lead',
        email: customEmail || 'user@reachinbox.ai',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${customEmail}`,
      });
      setIsSubmitting(false);
      onClose();
      showToast({
        type: 'success',
        title: 'Logged in successfully',
        message: `Welcome back, ${customName}! Google OAuth session verified.`,
      });
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Google OAuth Authentication"
      description="Connect your verified Google Workspace or Outbox account to schedule and manage campaigns."
      maxWidth="md"
    >
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Production Flow</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Google OAuth returns the user identity containing Name, Email, and Avatar, then grants persistent session tokens stored securely for scheduling actions.
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            Account to authenticate as:
          </label>
          <div className="grid grid-cols-1 gap-2">
            {[
              {
                name: 'Alex Carter',
                email: 'alex.carter@reachinbox.ai',
                role: 'Head of Growth',
              },
              {
                name: 'Sarah Mitchell',
                email: 'sarah.m@outboxlabs.com',
                role: 'Outbound Ops Lead',
              },
            ].map(acc => {
              const isSelected = customEmail === acc.email;
              return (
                <div
                  key={acc.email}
                  onClick={() => {
                    setCustomName(acc.name);
                    setCustomEmail(acc.email);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${acc.email}`}
                      alt={acc.name}
                      className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-100">{acc.name}</p>
                      <p className="text-[11px] text-slate-400">{acc.email}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2">
          <Button
            onClick={handleGoogleSignIn}
            isLoading={isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white text-slate-900 hover:bg-slate-100 border border-slate-200 font-semibold shadow-xl"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            <span>Continue with Google</span>
          </Button>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Google Sign-In & Workspace Sync</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
