import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, X, Download } from 'lucide-react';
import { parseEmailList } from '../../utils/csvParser';
import { Button } from '../common/Button';

interface CsvUploaderProps {
  onEmailsParsed: (emails: string[]) => void;
  parsedEmails: string[];
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({ onEmailsParsed, parsedEmails }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [invalidEntries, setInvalidEntries] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');

  const processFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      if (text) {
        const result = parseEmailList(text);
        onEmailsParsed(result.validEmails);
        setInvalidEntries(result.invalidEntries);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualAdd = () => {
    if (!manualInput.trim()) return;
    const result = parseEmailList(manualInput);
    const combined = Array.from(new Set([...parsedEmails, ...result.validEmails]));
    onEmailsParsed(combined);
    setManualInput('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    onEmailsParsed(parsedEmails.filter(e => e !== emailToRemove));
  };

  const handleLoadSampleLeads = () => {
    const sample = [
      'tim.cook@apple.com',
      'satya.nadella@microsoft.com',
      'sundar.pichai@google.com',
      'sam.altman@openai.com',
      'jensen.huang@nvidia.com',
      'mark.z@meta.com',
      'brian.chesky@airbnb.com',
      'demis.hassabis@deepmind.com',
    ];
    onEmailsParsed(sample);
    setFileName('reachinbox_sample_leads.csv');
    setInvalidEntries([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300">
          Upload Leads (CSV or TXT)
        </label>
        <button
          type="button"
          onClick={handleLoadSampleLeads}
          className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
        >
          <Download className="w-3 h-3" />
          <span>Load 8 Sample Leads</span>
        </button>
      </div>

      {/* Drag & Drop Box */}
      <div
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              processFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">
              {fileName ? fileName : 'Click to upload or drag & drop CSV'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Supports CSV with email column or plain comma-separated lists
            </p>
          </div>
        </div>
      </div>

      {/* Detection summary banner */}
      {parsedEmails.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{parsedEmails.length} valid email addresses detected</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onEmailsParsed([]);
              setFileName(null);
            }}
            className="text-[11px] text-emerald-400/80 hover:text-emerald-300 underline cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Invalid entries notice */}
      {invalidEntries.length > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Skipped {invalidEntries.length} invalid or non-email entries.</span>
        </div>
      )}

      {/* Parsed email preview pills */}
      {parsedEmails.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Recipient preview:</span>
            <span>Showing up to 10</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
            {parsedEmails.slice(0, 10).map((email, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 text-[11px] text-slate-300 border border-slate-700/60"
              >
                <span>{email}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEmail(email)}
                  className="text-slate-400 hover:text-rose-400 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {parsedEmails.length > 10 && (
              <span className="text-[11px] text-slate-400 self-center px-1 font-mono">
                +{parsedEmails.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Or manually paste emails */}
      <div className="pt-1">
        <label className="block text-[11px] text-slate-400 mb-1">
          Or paste comma-separated emails:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            placeholder="e.g. john@acme.com, lisa@venture.io"
            className="flex-1 bg-[#161822] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleManualAdd();
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleManualAdd}
            disabled={!manualInput.trim()}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};
