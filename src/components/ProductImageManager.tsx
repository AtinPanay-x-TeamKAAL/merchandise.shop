import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  Upload, 
  Link as LinkIcon, 
  Star, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  Plus, 
  Sparkles, 
  Image as ImageIcon, 
  Check, 
  X, 
  Move,
  AlertCircle,
  Maximize2,
  RefreshCw,
  Tag,
  Folder
} from 'lucide-react';
import { ProductGalleryItem, ProductCategory } from '../types';
import { googleSheetsApi } from '../services/googleSheetsApi';

interface ProductImageManagerProps {
  galleryImages: ProductGalleryItem[];
  coverImageUrl: string;
  category: ProductCategory;
  onChange: (images: ProductGalleryItem[], coverUrl: string) => void;
}

// Preset gallery structure recommendations per product type
export const GALLERY_PRESETS: Record<string, { name: string; labels: string[]; iconName: string }> = {
  Apparel: {
    name: 'T-Shirt & Apparel',
    labels: ['Front Mockup', 'Back Mockup', 'Design Layout', 'Actual Shirt', 'Size Chart'],
    iconName: '👕'
  },
  Drinkware: {
    name: 'Tumbler & Drinkware',
    labels: ['Product View', 'Design View'],
    iconName: '🥤'
  },
  Merchandise: {
    name: 'Banner & Accessories',
    labels: ['Main Product Image', 'Design Closeup'],
    iconName: '🚩'
  },
  Collections: {
    name: 'Exclusive Fan Set',
    labels: ['Collection Bundle', 'Inclusions Preview', 'Exclusive Sticker Freebie'],
    iconName: '✨'
  },
  General: {
    name: 'Standard Merch',
    labels: ['Main View', 'Detail View', 'Dimensions / Scale'],
    iconName: '📦'
  }
};

const SUGGESTED_LABELS = [
  'Front Mockup',
  'Back Mockup',
  'Design Layout',
  'Actual Shirt',
  'Size Chart',
  'Product View',
  'Design View',
  'Main Product Image',
  'Design Closeup',
  'Angle View',
  'Packaging',
  'Lifestyle / In-Use'
];

/**
 * Optimizes an uploaded image file (JPG, PNG, WEBP) via Canvas client-side
 * to ensure high resolution while preventing excessive storage payload.
 */
export const optimizeImageFile = (file: File, maxDimension = 1400, quality = 0.88): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.match(/image\/(jpeg|png|webp|jpg)/i)) {
      reject(new Error('Unsupported file type. Please upload JPG, PNG, or WEBP images.'));
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

        // Draw and export optimized image
        ctx.drawImage(img, 0, 0, width, height);
        const outputType = file.type.includes('png') ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputType, quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to read image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file from disk'));
    reader.readAsDataURL(file);
  });
};

export const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  galleryImages,
  coverImageUrl,
  category,
  onChange
}) => {
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [labelInput, setLabelInput] = useState('Product View');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Fullscreen image preview lightbox
  const [previewImage, setPreviewImage] = useState<{ url: string; label: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize gallery images to guarantee valid array with proper string properties
  const safeGalleryImages: ProductGalleryItem[] = useMemo(() => {
    if (!Array.isArray(galleryImages)) return [];
    return galleryImages
      .filter(Boolean)
      .map((img: any, i: number) => {
        if (typeof img === 'string') {
          return { label: `Photo #${i + 1}`, url: img };
        }
        return {
          label: typeof img?.label === 'string' && img.label.trim() ? img.label : `Photo #${i + 1}`,
          url: typeof img?.url === 'string' ? img.url : ''
        };
      })
      .filter(item => Boolean(item.url));
  }, [galleryImages]);

  // Determine active preset based on category
  const activePresetKey = category === 'Apparel' ? 'Apparel' : category === 'Drinkware' ? 'Drinkware' : 'Merchandise';
  const currentPreset = GALLERY_PRESETS[activePresetKey] || GALLERY_PRESETS.General;

  // Handle uploading new images
  const handleFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    setErrorMessage(null);

    const newImages: ProductGalleryItem[] = [...safeGalleryImages];
    let defaultCover = coverImageUrl;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.match(/image\/(jpeg|png|webp|jpg)/i)) {
          continue;
        }

        const dataUrl = await optimizeImageFile(file);
        let finalUrl = dataUrl;
        try {
          finalUrl = await googleSheetsApi.uploadImage(dataUrl, file.name, 'Merchandise');
        } catch {
          finalUrl = dataUrl;
        }
        
        // Auto-assign smart label if preset labels exist
        let assignedLabel = labelInput;
        if (newImages.length < currentPreset.labels.length) {
          assignedLabel = currentPreset.labels[newImages.length];
        } else if (file.name) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          assignedLabel = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        }

        newImages.push({
          label: assignedLabel,
          url: finalUrl
        });
      }

      if (!defaultCover && newImages.length > 0) {
        defaultCover = newImages[0].url;
      }

      onChange(newImages, defaultCover || (newImages[0] ? newImages[0].url : ''));
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing uploaded image.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Add from URL input
  const handleAddUrl = () => {
    if (!urlInput.trim()) {
      setErrorMessage('Please provide a valid image URL');
      return;
    }

    setErrorMessage(null);
    const newImages = [...safeGalleryImages, { label: labelInput.trim() || 'Product View', url: urlInput.trim() }];
    const cover = coverImageUrl || urlInput.trim();
    onChange(newImages, cover);
    setUrlInput('');
  };

  // Drag and drop handlers for main dropzone
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Reorder actions
  const moveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= safeGalleryImages.length) return;

    const updated = [...safeGalleryImages];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    // If moving top item, update cover image as top item by default
    const newCover = coverImageUrl === moved.url && targetIndex === 0 ? moved.url : coverImageUrl;
    onChange(updated, newCover);
  };

  const setAsCover = (url: string) => {
    onChange(safeGalleryImages, url);
  };

  const removeImage = (index: number) => {
    const removedUrl = safeGalleryImages[index]?.url;
    const updated = safeGalleryImages.filter((_, i) => i !== index);
    
    let newCover = coverImageUrl;
    if (coverImageUrl === removedUrl) {
      newCover = updated[0]?.url || '';
    }

    onChange(updated, newCover);
  };

  const updateImageLabel = (index: number, newLabel: string) => {
    const updated = [...safeGalleryImages];
    updated[index] = { ...updated[index], label: newLabel };
    onChange(updated, coverImageUrl);
  };

  // Apply quick preset structure
  const applyPresetStructure = (presetKey: string) => {
    const targetPreset = GALLERY_PRESETS[presetKey];
    if (!targetPreset) return;

    // Update existing labels or prepare template slots
    const updated = safeGalleryImages.map((img, i) => ({
      ...img,
      label: targetPreset.labels[i] || img.label
    }));
    onChange(updated, coverImageUrl);
  };

  return (
    <div className="space-y-4">
      
      {/* Header & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#232f4b] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#b19cd9]" />
              <span>Product Image Management & Gallery</span>
            </h4>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#7c5cb7]/20 text-[#b19cd9] border border-[#7c5cb7]/30">
              {safeGalleryImages.length} {safeGalleryImages.length === 1 ? 'image' : 'images'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Folder className="w-3 h-3 text-emerald-400" />
              <span>APMERCH_DATAFOLDER/Merchandise</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Upload high-resolution JPG, PNG, WEBP files or supply URLs. Drag to reorder.
          </p>
        </div>

        {/* Upload Mode Switch (Preferred: Upload Image) */}
        <div className="flex items-center bg-[#0b0f19] p-1 rounded-xl border border-[#232f4b] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setInputMode('upload')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              inputMode === 'upload'
                ? 'bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image (Preferred)</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode('url')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              inputMode === 'url'
                ? 'bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Paste Image URL</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Actions */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#f472b6]" />
          <span>Gallery Presets:</span>
        </span>
        {Object.entries(GALLERY_PRESETS).map(([key, p]) => (
          <button
            key={key}
            type="button"
            onClick={() => applyPresetStructure(key)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 transition-all ${
              (category === 'Apparel' && key === 'Apparel') || (category === 'Drinkware' && key === 'Drinkware')
                ? 'bg-[#1e1b4b] border-[#7c5cb7] text-[#e0d7f5]'
                : 'bg-[#0b0f19] border-[#232f4b] text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <span>{p.iconName}</span>
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* Primary Input Container */}
      {inputMode === 'upload' ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDraggingOver
              ? 'border-[#f472b6] bg-[#f472b6]/10 scale-[1.01]'
              : 'border-[#232f4b] hover:border-[#7c5cb7] bg-[#131b2e]/50 hover:bg-[#131b2e]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7c5cb7]/20 to-[#f472b6]/20 border border-[#7c5cb7]/40 flex items-center justify-center text-[#e0d7f5] shadow-lg">
              {isProcessing ? (
                <RefreshCw className="w-6 h-6 animate-spin text-[#f472b6]" />
              ) : (
                <Upload className="w-6 h-6 text-[#b19cd9]" />
              )}
            </div>

            <div>
              <p className="text-xs sm:text-sm font-bold text-white">
                {isProcessing ? 'Optimizing & Uploading Images...' : 'Click to select or Drag & Drop Images Here'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supports <span className="text-slate-200 font-semibold">JPG, PNG, WEBP</span> • Multiple files allowed
              </p>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <span className="text-[10px] px-2.5 py-0.5 rounded bg-[#1e1b4b] text-[#b19cd9] border border-[#3b2b73]">
                Auto-Scales & Retains High Definition
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* URL Input Option */
        <div className="p-4 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            <div className="sm:col-span-4">
              <label className="block font-semibold text-slate-300 mb-1">Image Label / Angle</label>
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="e.g. Front Mockup"
                className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
              />
            </div>
            <div className="sm:col-span-8">
              <label className="block font-semibold text-slate-300 mb-1">Image Direct URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/... or cloud image link"
                  className="flex-1 px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white font-mono text-xs focus:outline-none focus:border-[#7c5cb7]"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  className="px-4 py-2 bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add URL</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Label Chips for Fast Assignment */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400">Quick Labels:</span>
            {SUGGESTED_LABELS.slice(0, 6).map((lbl) => (
              <button
                key={lbl}
                type="button"
                onClick={() => setLabelInput(lbl)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  labelInput === lbl
                    ? 'bg-[#7c5cb7] text-white border-[#7c5cb7]'
                    : 'bg-[#0b0f19] text-slate-400 border-[#232f4b] hover:text-slate-200'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Gallery Image List & Reordering Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
          <span>Active Product Gallery ({safeGalleryImages.length})</span>
          <span className="text-[10px] text-[#f472b6] normal-case font-normal">
            ★ Star indicates primary cover image displayed in catalog
          </span>
        </div>

        {safeGalleryImages.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#0b0f19] border border-dashed border-[#232f4b] text-slate-500 text-xs">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            No images uploaded yet. Upload or paste a URL above to display in the product showcase.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {safeGalleryImages.map((img, idx) => {
              const imgUrl = img.url || '';
              const isCover = (coverImageUrl && imgUrl === coverImageUrl) || (!coverImageUrl && idx === 0);

              return (
                <div
                  key={`slot-${idx}-${(imgUrl || '').slice(-25)}`}
                  className={`p-3 rounded-2xl border transition-all duration-200 flex gap-3 relative group ${
                    isCover
                      ? 'bg-gradient-to-r from-[#1e1b4b]/80 to-[#131b2e] border-[#7c5cb7] shadow-lg shadow-[#7c5cb7]/15'
                      : 'bg-[#0b0f19] border-[#232f4b] hover:border-slate-600'
                  }`}
                >
                  {/* Thumbnail & Lightbox preview trigger */}
                  <div 
                    onClick={() => setPreviewImage(img)}
                    className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-900 border border-[#232f4b] shrink-0 cursor-pointer group/thumb"
                    title="Click for full-resolution preview"
                  >
                    <img
                      src={imgUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'}
                      alt={img.label || 'Product View'}
                      className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Maximize2 className="w-4 h-4" />
                    </div>

                    {isCover && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-500 text-black font-black text-[9px] uppercase tracking-wider flex items-center gap-0.5 shadow-md">
                        <Star className="w-2.5 h-2.5 fill-black" />
                        <span>Cover</span>
                      </div>
                    )}
                  </div>

                  {/* Details, Label Edit & Action Buttons */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 space-y-2">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          Slot #{idx + 1}
                        </span>
                        
                        {/* Quick Cover Toggle Button */}
                        <button
                          type="button"
                          onClick={() => setAsCover(imgUrl)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                            isCover
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                              : 'bg-[#131b2e] text-slate-400 hover:text-amber-300 hover:bg-amber-400/10 border border-[#232f4b]'
                          }`}
                        >
                          <Star className={`w-3 h-3 ${isCover ? 'fill-amber-400 text-amber-400' : ''}`} />
                          <span>{isCover ? 'Main Cover' : 'Set as Cover'}</span>
                        </button>
                      </div>

                      {/* Editable Label */}
                      <div className="relative">
                        <input
                          type="text"
                          value={img.label || ''}
                          onChange={(e) => updateImageLabel(idx, e.target.value)}
                          placeholder="Image Label (e.g. Front Mockup)"
                          className="w-full px-2.5 py-1.5 bg-[#131b2e] border border-[#232f4b] focus:border-[#7c5cb7] rounded-lg text-xs font-semibold text-white truncate"
                        />
                      </div>

                      {/* Quick Label Pills */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {SUGGESTED_LABELS.slice(0, 4).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => updateImageLabel(idx, tag)}
                            className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                              img.label === tag
                                ? 'bg-[#7c5cb7]/30 text-[#e0d7f5] border-[#7c5cb7]'
                                : 'bg-[#0b0f19] text-slate-500 border-[#232f4b] hover:text-slate-300'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reordering & Deletion Row */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#232f4b]/60">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveImage(idx, 'up')}
                          className="p-1 rounded-md bg-[#131b2e] hover:bg-[#1e1b4b] disabled:opacity-30 disabled:hover:bg-[#131b2e] text-slate-300 hover:text-white border border-[#232f4b]"
                          title="Move earlier in gallery display"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === safeGalleryImages.length - 1}
                          onClick={() => moveImage(idx, 'down')}
                          className="p-1 rounded-md bg-[#131b2e] hover:bg-[#1e1b4b] disabled:opacity-30 disabled:hover:bg-[#131b2e] text-slate-300 hover:text-white border border-[#232f4b]"
                          title="Move later in gallery display"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] text-slate-500 ml-1">Reorder</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewImage(img)}
                          className="p-1 rounded-md bg-[#131b2e] hover:bg-[#1e1b4b] text-slate-300 hover:text-white border border-[#232f4b]"
                          title="Preview full size"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="p-1 rounded-md bg-rose-950/40 hover:bg-rose-900 text-rose-400 hover:text-rose-200 border border-rose-500/30"
                          title="Remove image from gallery"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Preview Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-3xl w-full bg-[#0b0f19] border border-[#232f4b] rounded-2xl p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#232f4b] pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{previewImage.label}</span>
                <span className="text-[10px] text-[#b19cd9] font-mono">High-Definition Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-black border border-[#232f4b] flex items-center justify-center max-h-[70vh]">
              <img
                src={previewImage.url}
                alt={previewImage.label}
                className="max-h-[70vh] w-auto object-contain mx-auto"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Label: <strong className="text-white">{previewImage.label}</strong></span>
              <button
                type="button"
                onClick={() => {
                  setAsCover(previewImage.url);
                  setPreviewImage(null);
                }}
                className="px-3 py-1.5 bg-[#7c5cb7] hover:bg-[#6b4da5] text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <Star className="w-3.5 h-3.5" />
                <span>Make Primary Cover Image</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
