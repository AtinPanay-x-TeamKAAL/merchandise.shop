import React, { useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Clock, FileText, User } from 'lucide-react';
import { TeamKAALLibraryItem, LibraryItemType } from '../../types';
import { ImageUploadField } from '../ImageUploadField';
import { LockInModal } from '../LockInModal';

interface AdminLibraryTabProps {
  items: TeamKAALLibraryItem[];
  onSave: (item: TeamKAALLibraryItem) => Promise<TeamKAALLibraryItem>;
  onDelete: (id: string) => Promise<boolean>;
}

export const AdminLibraryTab: React.FC<AdminLibraryTabProps> = ({
  items,
  onSave,
  onDelete
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TeamKAALLibraryItem | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('Team KAAL Archives');
  const [type, setType] = useState<LibraryItemType>('Story');
  const [category, setCategory] = useState('Special Edition');
  const [coverImage, setCoverImage] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [contentSnippet, setContentSnippet] = useState('');
  const [readUrl, setReadUrl] = useState('');
  const [readTimeMinutes, setReadTimeMinutes] = useState('15');
  const [chaptersCount, setChaptersCount] = useState('1');

  // Lock-In Prompt State
  const [showLockPrompt, setShowLockPrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setTitle('');
    setAuthor('Team KAAL Archives');
    setType('Story');
    setCategory('Special Edition');
    setCoverImage('');
    setSynopsis('');
    setContentSnippet('');
    setReadUrl('');
    setReadTimeMinutes('15');
    setChaptersCount('1');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: TeamKAALLibraryItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setAuthor(item.author || 'Team KAAL Archives');
    setType(item.type || 'Story');
    setCategory(item.category || 'Special Edition');
    setCoverImage(item.coverImage);
    setSynopsis(item.synopsis || item.description || '');
    setContentSnippet(item.contentSnippet || '');
    setReadUrl(item.readUrl || item.downloadUrl || '');
    setReadTimeMinutes(String(item.readTimeMinutes || 15));
    setChaptersCount(String(item.chaptersCount || 1));
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !coverImage.trim()) {
      alert('Please provide a publication title and upload a cover photo.');
      return;
    }
    setShowLockPrompt(true);
  };

  const handleConfirmLockIn = async () => {
    setIsSaving(true);
    try {
      const itemToSave: TeamKAALLibraryItem = {
        id: editingItem ? editingItem.id : `KAAL-${Date.now().toString(36).toUpperCase()}`,
        title: title.trim(),
        author: author.trim(),
        type,
        category: category.trim(),
        coverImage: coverImage.trim(),
        synopsis: synopsis.trim(),
        description: synopsis.trim(),
        contentSnippet: contentSnippet.trim() || undefined,
        readUrl: readUrl.trim() || undefined,
        readTimeMinutes: parseInt(readTimeMinutes, 10) || 15,
        chaptersCount: parseInt(chaptersCount, 10) || 1,
        publishedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };

      await onSave(itemToSave);
      setShowLockPrompt(false);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to lock in library item:', err);
      alert(err.message || 'Failed to save library item.');
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
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>Team KAAL Library Corner Management</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              {items.length} publications
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage official fanfics, zines, articles, and reading materials with cover photos in APMERCH_DATAFOLDER/TeamKAAL.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#7c5cb7]/25 hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Publication</span>
        </button>
      </div>

      {/* Grid of Library Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map(item => (
          <div
            key={item.id}
            className="rounded-2xl bg-[#131b2e] border border-[#232f4b] overflow-hidden flex flex-col group hover:border-[#7c5cb7] transition-all"
          >
            {/* Cover Image */}
            <div className="relative aspect-[3/4] bg-[#0b0f19] overflow-hidden max-h-64">
              <img
                src={item.coverImage}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/20 uppercase">
                  {item.type || 'Story'}
                </span>
                {item.readTimeMinutes && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-600/80 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{item.readTimeMinutes} min</span>
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#f472b6] flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>By {item.author}</span>
                </span>
                <h4 className="text-sm font-bold text-white line-clamp-1 mt-1">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                  {item.synopsis || item.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#232f4b] flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  {item.category}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg bg-[#1e1b4b] hover:bg-[#2d1b69] text-[#b19cd9] transition-colors"
                    title="Edit Publication"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete publication "${item.title}"?`)) {
                        onDelete(item.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 transition-colors"
                    title="Delete Publication"
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
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span>{editingItem ? 'Edit Publication' : 'Create New Publication'}</span>
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
                <label className="block font-semibold text-slate-300 mb-1">Publication Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Panay Chronicles: The Golden Sun Edition"
                  className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Author / Pen Name</label>
                  <input
                    type="text"
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    placeholder="Team KAAL Writers Guild"
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  >
                    <option value="Fanfiction">Fanfiction</option>
                    <option value="Story">Story</option>
                    <option value="Ebook">Ebook</option>
                    <option value="PDF">PDF</option>
                    <option value="Archive">Archive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Special Edition"
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Est. Read Time (mins)</label>
                  <input
                    type="number"
                    value={readTimeMinutes}
                    onChange={e => setReadTimeMinutes(e.target.value)}
                    placeholder="15"
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Chapters / Pages</label>
                  <input
                    type="number"
                    value={chaptersCount}
                    onChange={e => setChaptersCount(e.target.value)}
                    placeholder="1"
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Synopsis / Summary</label>
                <textarea
                  rows={3}
                  value={synopsis}
                  onChange={e => setSynopsis(e.target.value)}
                  placeholder="Plot summary, backstory, or edition introduction..."
                  className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Opening Snippet / Excerpt</label>
                <textarea
                  rows={2}
                  value={contentSnippet}
                  onChange={e => setContentSnippet(e.target.value)}
                  placeholder="Introductory paragraph or teaser excerpt..."
                  className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Read Link / Drive Document URL</label>
                <input
                  type="url"
                  value={readUrl}
                  onChange={e => setReadUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              {/* Cover Photo via ImageUploadField */}
              <div className="pt-2 border-t border-[#232f4b]">
                <ImageUploadField
                  label="Book Cover Photo *"
                  value={coverImage}
                  onChange={setCoverImage}
                  folder="TeamKAAL"
                  helperText="Upload or enter URL. Stored in APMERCH_DATAFOLDER/TeamKAAL."
                  aspectRatio="square"
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
                  Save & Lock In Publication
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
        itemType="Library Item"
        isSaving={isSaving}
        onConfirm={handleConfirmLockIn}
        onCancel={() => setShowLockPrompt(false)}
      />
    </div>
  );
};
