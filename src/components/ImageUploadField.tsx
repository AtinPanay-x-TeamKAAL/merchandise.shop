import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, Trash2, CheckCircle, Folder, Loader2, AlertCircle } from 'lucide-react';
import { googleSheetsApi } from '../services/googleSheetsApi';
import { optimizeImageFile, isImageFile } from '../utils/imageOptimizer';

export { optimizeImageFile };

export type DriveFolder = 'Payment_Qr' | 'Logos' | 'Merchandise' | 'Collection' | 'FanProjects' | 'Homepage' | 'TeamKAAL';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (newUrl: string) => void;
  folder: DriveFolder;
  helperText?: string;
  aspectRatio?: 'square' | 'video' | 'banner' | 'auto';
  required?: boolean;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  folder,
  helperText,
  aspectRatio = 'square',
  required = false
}) => {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    if (!file) return;

    if (!isImageFile(file)) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WEBP, GIF, SVG, etc.).');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage('Optimizing photo...');

    try {
      const optimized = await optimizeImageFile(file, {
        maxDimension: folder === 'Homepage' ? 1600 : folder === 'Logos' ? 800 : 1200,
        quality: 0.86
      });

      setStatusMessage(`Saving photo to APMERCH_DATAFOLDER/${folder}...`);
      
      // Attempt upload to Google Drive if Apps Script is configured
      let finalUrl = optimized;
      try {
        finalUrl = await googleSheetsApi.uploadImage(optimized, file.name, folder);
      } catch (uploadErr) {
        console.warn('Drive upload fallback notice:', uploadErr);
        finalUrl = optimized;
      }

      onChange(finalUrl);
      setStatusMessage('Photo loaded and ready to lock in!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Image processing failed:', err);
      setErrorMessage(err.message || 'Image processing failed. Please try another image.');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files[0]) {
      const file = e.clipboardData.files[0];
      if (isImageFile(file)) {
        e.preventDefault();
        handleFileProcess(file);
      }
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
    setUrlInput('');
    setStatusMessage('URL updated!');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'square': return 'aspect-square max-w-[140px]';
      case 'video': return 'aspect-video max-w-[240px]';
      case 'banner': return 'aspect-[21/9] max-w-full';
      default: return 'max-h-44';
    }
  };

  return (
    <div className="space-y-2" onPaste={handlePaste}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <span>{label}</span>
          {required && <span className="text-rose-400">*</span>}
        </label>
        <div className="flex items-center gap-1 text-[11px] text-[#b19cd9]">
          <Folder className="w-3 h-3 text-[#7c5cb7]" />
          <span>APMERCH_DATAFOLDER/{folder}</span>
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      )}

      {/* Mode Switcher */}
      <div className="flex items-center gap-1 bg-[#0b0f19] p-1 rounded-xl border border-[#232f4b] w-fit text-[11px] font-bold">
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
            tab === 'upload'
              ? 'bg-[#7c5cb7] text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Upload className="w-3 h-3" />
          <span>Upload File</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
            tab === 'url'
              ? 'bg-[#7c5cb7] text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LinkIcon className="w-3 h-3" />
          <span>Image URL</span>
        </button>
      </div>

      {/* Upload Box or URL Input */}
      {tab === 'upload' ? (
        <div
          tabIndex={0}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-4 text-center transition-all flex flex-col items-center justify-center gap-2 outline-none focus:border-[#7c5cb7] ${
            isDragging
              ? 'border-[#f472b6] bg-[#7c5cb7]/15'
              : 'border-[#232f4b] hover:border-[#7c5cb7] bg-[#0b0f19]/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileProcess(e.target.files[0]);
              }
            }}
          />
          {isProcessing ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-[#b19cd9]">
              <Loader2 className="w-4 h-4 animate-spin text-[#f472b6]" />
              <span>{statusMessage || 'Processing image...'}</span>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-[#7c5cb7]/20 border border-[#7c5cb7]/40 flex items-center justify-center text-[#e0d7f5]">
                <Upload className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-white">Click to upload photo</span>, drag & drop, or paste (Ctrl+V)
                <p className="text-[10px] text-slate-400 mt-0.5">Supports JPG, PNG, WEBP, GIF, SVG, AVIF (Auto-optimized)</p>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://..."
            className="flex-1 px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#7c5cb7]"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3 py-2 rounded-xl bg-[#1e1b4b] hover:bg-[#2d1b69] border border-[#3b2b73] text-xs font-bold text-[#b19cd9]"
          >
            Apply
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-medium bg-rose-950/30 p-2 rounded-lg border border-rose-500/30">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {statusMessage && !isProcessing && (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Image Preview & Delete */}
      {value && (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0b0f19] border border-[#232f4b]">
          <div className={`rounded-lg overflow-hidden border border-[#232f4b] bg-black/50 flex items-center justify-center ${getAspectClass()}`}>
            <img
              src={value}
              alt="Uploaded preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback placeholder if link breaks
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Current Locked Photo</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">
              {value.startsWith('data:image') ? 'Base64 image (ready for lock in & Drive sync)' : value}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            title="Remove photo"
            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
