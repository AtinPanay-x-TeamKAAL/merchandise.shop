import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Layers, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import { CollectionItem } from '../../types';
import { ImageUploadField } from '../ImageUploadField';
import { LockInModal } from '../LockInModal';

interface AdminCollectionsTabProps {
  collections: CollectionItem[];
  onSave: (collection: CollectionItem) => Promise<CollectionItem>;
  onDelete: (id: string) => Promise<boolean>;
}

export const AdminCollectionsTab: React.FC<AdminCollectionsTabProps> = ({
  collections,
  onSave,
  onDelete
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CollectionItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Official Capsule');
  const [season, setSeason] = useState('Cinema Panay Edition');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState<'Exclusive' | 'Limited Edition' | 'Archived'>('Exclusive');
  const [releaseYear, setReleaseYear] = useState('2026');
  const [itemCount, setItemCount] = useState('8');

  // Lock-In Save State
  const [showLockPrompt, setShowLockPrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setCategory('Official Capsule');
    setSeason('Cinema Panay Edition');
    setCoverImage('');
    setStatus('Exclusive');
    setReleaseYear('2026');
    setItemCount('8');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (col: CollectionItem) => {
    setEditingItem(col);
    setTitle(col.title);
    setDescription(col.description);
    setCategory(col.category || 'Official Capsule');
    setSeason(col.season || 'Cinema Panay Edition');
    setCoverImage(col.coverImage);
    setStatus(col.status || 'Exclusive');
    setReleaseYear(col.releaseYear || '2026');
    setItemCount(String(col.itemCount || 1));
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !coverImage.trim()) {
      alert('Please provide a collection title and upload a cover photo.');
      return;
    }
    // Trigger Lock-In confirmation prompt
    setShowLockPrompt(true);
  };

  const handleConfirmLockIn = async () => {
    setIsSaving(true);
    try {
      const itemToSave: CollectionItem = {
        id: editingItem ? editingItem.id : `COL-${Date.now().toString(36).toUpperCase()}`,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        season: season.trim(),
        coverImage: coverImage.trim(),
        status,
        releaseYear: releaseYear.trim(),
        itemCount: parseInt(itemCount, 10) || 1
      };

      await onSave(itemToSave);
      setShowLockPrompt(false);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to lock in collection:', err);
      alert(err.message || 'Failed to save collection.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-[#131b2e] border border-[#232f4b]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#b19cd9]" />
              <span>Exclusive Collections Management</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-[#7c5cb7]/20 text-[#b19cd9] text-xs font-bold border border-[#7c5cb7]/30">
              {collections.length} items
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage official merch capsules, seasonal drops, and promotional graphics with Google Drive storage.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#7c5cb7]/25 hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Collection</span>
        </button>
      </div>

      {/* Grid of Collections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {collections.map(col => (
          <div
            key={col.id}
            className="rounded-2xl bg-[#131b2e] border border-[#232f4b] overflow-hidden flex flex-col group hover:border-[#7c5cb7] transition-all"
          >
            {/* Cover Image */}
            <div className="relative aspect-[16/10] bg-[#0b0f19] overflow-hidden">
              <img
                src={col.coverImage}
                alt={col.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/20 uppercase">
                  {col.status}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#7c5cb7]/80 backdrop-blur-md text-[10px] font-bold text-white uppercase">
                  {col.releaseYear}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#f472b6]">
                  {col.season}
                </span>
                <h4 className="text-sm font-bold text-white line-clamp-1 mt-0.5">
                  {col.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                  {col.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#232f4b] flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  <strong className="text-white font-mono">{col.itemCount}</strong> items included
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(col)}
                    className="p-1.5 rounded-lg bg-[#1e1b4b] hover:bg-[#2d1b69] text-[#b19cd9] transition-colors"
                    title="Edit Collection"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete collection "${col.title}"?`)) {
                        onDelete(col.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 transition-colors"
                    title="Delete Collection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-[#0b0f19] border border-[#232f4b] rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#232f4b] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#b19cd9]" />
                <span>{editingItem ? 'Edit Collection' : 'Create New Collection'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Collection Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="A'TIN Panay Official Merch Capsule 2026"
                  className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Season / Edition</label>
                  <input
                    type="text"
                    value={season}
                    onChange={e => setSeason(e.target.value)}
                    placeholder="Cinema Panay Edition"
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Release Year</label>
                  <input
                    type="text"
                    value={releaseYear}
                    onChange={e => setReleaseYear(e.target.value)}
                    placeholder="2026"
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  >
                    <option value="Exclusive">Exclusive</option>
                    <option value="Limited Edition">Limited Edition</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Item Count</label>
                  <input
                    type="number"
                    value={itemCount}
                    onChange={e => setItemCount(e.target.value)}
                    placeholder="8"
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Highlights of the collection, fabric specs, and design inspiration..."
                  className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              {/* Cover Photo via ImageUploadField */}
              <div className="pt-2 border-t border-[#232f4b]">
                <ImageUploadField
                  label="Collection Cover Photo *"
                  value={coverImage}
                  onChange={setCoverImage}
                  folder="Collection"
                  helperText="Upload or enter URL. Stored in APMERCH_DATAFOLDER/Collection."
                  aspectRatio="video"
                  required
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-[#232f4b] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white text-xs font-bold shadow-md hover:opacity-95"
                >
                  Save & Lock In Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lock-In Prompt Modal */}
      <LockInModal
        isOpen={showLockPrompt}
        title={title}
        itemType="Collection"
        isSaving={isSaving}
        onConfirm={handleConfirmLockIn}
        onCancel={() => setShowLockPrompt(false)}
      />
    </div>
  );
};
