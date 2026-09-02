import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, Trash2, CheckCircle, Folder, Loader2 } from 'lucide-react';
import { googleSheetsApi } from '../services/googleSheetsApi';

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

/**
 * Optimizes an uploaded image file (JPG, PNG, WEBP) via Canvas client-side
 * to ensure high quality while reducing payload size for Google Sheets & Drive.
 */
export const optimizeImageFile = (
  file: File, 
  maxDimension = 1100, 
  quality = 0.82
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.match(/image\/(jpeg|png|webp|jpg|gif)/i)) {
      reject(new Error('Unsupported file format. Please upload JPG, PNG, or WEBP images.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Keep alpha for png if needed, or use compressed webp/jpeg
        if (file.type.includes('png')) {
          try {
            const webp = canvas.toDataURL('image/webp', quality);
            if (webp.startsWith('data:image/webp')) {
              resolve(webp);
              return;
            }
          } catch {}
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };
      img.onerror = () => reject(new Error('Could not parse image file.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file from disk.'));
    reader.readAsDataURL(file);
  });
};

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setIsProcessing(true);
    setStatusMessage('Optimizing photo...');
    try {
      const optimized = await optimizeImageFile(file);
      setStatusMessage(`Uploading to APMERCH_DATAFOLDER/${folder}...`);
      
      // Attempt upload to Google Drive if Apps Script is configured
      const finalUrl = await googleSheetsApi.uploadImage(optimized, file.name, folder);
      onChange(finalUrl);
      setStatusMessage('Photo saved and ready to lock in!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Image processing failed:', err);
      setStatusMessage(err.message || 'Image processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
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
    <div className="space-y-2">
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
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-4 text-center transition-all flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? 'border-[#f472b6] bg-[#7c5cb7]/15'
              : 'border-[#232f4b] hover:border-[#7c5cb7] bg-[#0b0f19]/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
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
                <span className="font-bold text-white">Click to upload photo</span> or drag & drop
                <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, or WEBP (Optimized for Drive & Sheets)</p>
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
