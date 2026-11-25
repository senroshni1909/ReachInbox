import React, { useEffect } from 'react';
import { Trash2, Clock, Mail, X, Loader2 } from 'lucide-react';
import type { EmailJob } from '../../types';
import { formatFigmaTime } from '../../utils/dateFormatter';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
  email: EmailJob | null;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  email,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isDeleting]);

  if (!isOpen || !email) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-10 transform animate-in zoom-in-95 duration-150 p-6 space-y-5">
        {/* Header with Icon and Close Button */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">Delete Scheduled Email</h3>
              <p className="text-xs text-gray-500 mt-0.5">This will cancel and remove the email job from the queue.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Job Details Card */}
        <div className="bg-[#f9fafb] border border-gray-100 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-gray-400">Recipient:</span>
            <span className="font-semibold text-gray-900 truncate">{email.recipientName || email.recipient}</span>
          </div>

          <div className="flex items-baseline gap-2 text-gray-700">
            <span className="text-gray-400 shrink-0">Subject:</span>
            <span className="font-medium text-gray-800 truncate">{email.subject || '(No subject)'}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-3.5 h-3.5 text-[#d45828] shrink-0" />
            <span className="text-gray-400">Scheduled for:</span>
            <span className="text-[#d45828] font-medium">{formatFigmaTime(email.scheduledTime || email.sentTime)}</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          Are you sure you want to delete this scheduled job? Once deleted, this email will not be sent and the action cannot be undone.
        </p>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Job</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
