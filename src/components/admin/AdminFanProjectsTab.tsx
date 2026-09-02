import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Heart, Calendar, Users, ExternalLink, DollarSign } from 'lucide-react';
import { FanProject, FanProjectCategory } from '../../types';
import { ImageUploadField } from '../ImageUploadField';
import { LockInModal } from '../LockInModal';

interface AdminFanProjectsTabProps {
  fanProjects: FanProject[];
  onSave: (project: FanProject) => Promise<FanProject>;
  onDelete: (id: string) => Promise<boolean>;
}

export const AdminFanProjectsTab: React.FC<AdminFanProjectsTabProps> = ({
  fanProjects,
  onSave,
  onDelete
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FanProject | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FanProjectCategory>('Donation Drives');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [raisedAmount, setRaisedAmount] = useState('');
  const [organizer, setOrganizer] = useState("A'TIN Panay Community");
  const [status, setStatus] = useState<'Active' | 'Completed' | 'Upcoming'>('Active');
  const [bannerImage, setBannerImage] = useState('');
  const [link, setLink] = useState('');
  const [date, setDate] = useState('October 2026');
  const [impactMetrics, setImpactMetrics] = useState('');

  // Lock-In Prompt State
  const [showLockPrompt, setShowLockPrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setTitle('');
    setCategory('Donation Drives');
    setDescription('');
    setTargetAmount('');
    setRaisedAmount('');
    setOrganizer("A'TIN Panay Community");
    setStatus('Active');
    setBannerImage('');
    setLink('');
    setDate('October 2026');
    setImpactMetrics('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (fp: FanProject) => {
    setEditingItem(fp);
    setTitle(fp.title);
    setCategory(fp.category);
    setDescription(fp.description);
    setTargetAmount(fp.targetAmount ? String(fp.targetAmount) : '');
    setRaisedAmount(fp.raisedAmount ? String(fp.raisedAmount) : '');
    setOrganizer(fp.organizer || "A'TIN Panay Community");
    setStatus(fp.status || 'Active');
    setBannerImage(fp.bannerImage);
    setLink(fp.link || '');
    setDate(fp.date || 'October 2026');
    setImpactMetrics(fp.impactMetrics || '');
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !bannerImage.trim()) {
      alert('Please provide a project title and upload a banner image.');
      return;
    }
    setShowLockPrompt(true);
  };

  const handleConfirmLockIn = async () => {
    setIsSaving(true);
    try {
      const itemToSave: FanProject = {
        id: editingItem ? editingItem.id : `FP-${Date.now().toString(36).toUpperCase()}`,
        title: title.trim(),
        category,
        description: description.trim(),
        targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
        raisedAmount: raisedAmount ? parseFloat(raisedAmount) : undefined,
        organizer: organizer.trim(),
        status,
        bannerImage: bannerImage.trim(),
        link: link.trim() || undefined,
        date: date.trim(),
        impactMetrics: impactMetrics.trim() || undefined
      };

      await onSave(itemToSave);
      setShowLockPrompt(false);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to lock in fan project:', err);
      alert(err.message || 'Failed to save fan project.');
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
              <Heart className="w-5 h-5 text-[#f472b6]" />
              <span>Panay Community & Fan Projects Management</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-[#f472b6]/20 text-[#f472b6] text-xs font-bold border border-[#f472b6]/30">
              {fanProjects.length} projects
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage fan projects, donation drives, community outreach, and fundraisers with photo storage in APMERCH_DATAFOLDER/FanProjects.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#7c5cb7]/25 hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Project</span>
        </button>
      </div>

      {/* Grid of Fan Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {fanProjects.map(fp => (
          <div
            key={fp.id}
            className="rounded-2xl bg-[#131b2e] border border-[#232f4b] overflow-hidden flex flex-col group hover:border-[#7c5cb7] transition-all"
          >
            {/* Banner Image */}
            <div className="relative aspect-video bg-[#0b0f19] overflow-hidden">
              <img
                src={fp.bannerImage}
                alt={fp.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/20 uppercase">
                  {fp.status}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#f472b6]/80 backdrop-blur-md text-[10px] font-bold text-white uppercase">
                  {fp.category}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#b19cd9] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{fp.date}</span>
                </span>
                <h4 className="text-sm font-bold text-white line-clamp-1 mt-1">
                  {fp.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                  {fp.description}
                </p>
              </div>

              {/* Raised amount bar if available */}
              {fp.targetAmount ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                    <span>Raised: ₱{fp.raisedAmount || 0}</span>
                    <span>Goal: ₱{fp.targetAmount}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0b0f19] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#7c5cb7] to-[#f472b6]"
                      style={{
                        width: `${Math.min(100, Math.round(((fp.raisedAmount || 0) / fp.targetAmount) * 100))}%`
                      }}
                    />
                  </div>
                </div>
              ) : null}

              <div className="pt-2 border-t border-[#232f4b] flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] truncate">
                  By {fp.organizer}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(fp)}
                    className="p-1.5 rounded-lg bg-[#1e1b4b] hover:bg-[#2d1b69] text-[#b19cd9] transition-colors"
                    title="Edit Fan Project"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete project "${fp.title}"?`)) {
                        onDelete(fp.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 transition-colors"
                    title="Delete Fan Project"
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
                <Heart className="w-5 h-5 text-[#f472b6]" />
                <span>{editingItem ? 'Edit Fan Project' : 'Create New Fan Project'}</span>
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
                <label className="block font-semibold text-slate-300 mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Panay Bayanihan Relief & Cup Sleeves Project"
                  className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  >
                    <option value="Donation Drives">Donation Drives</option>
                    <option value="Streaming Projects">Streaming Projects</option>
                    <option value="Birthday Projects">Birthday Projects</option>
                    <option value="Community Projects">Community Projects</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  >
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Organizer / Fan Club</label>
                  <input
                    type="text"
                    value={organizer}
                    onChange={e => setOrganizer(e.target.value)}
                    placeholder="A'TIN Panay Community"
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Date / Schedule</label>
                  <input
                    type="text"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    placeholder="October 11, 2026"
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Goal / Target (PHP optional)</label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={e => setTargetAmount(e.target.value)}
                    placeholder="15000"
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Current Raised (PHP optional)</label>
                  <input
                    type="number"
                    value={raisedAmount}
                    onChange={e => setRaisedAmount(e.target.value)}
                    placeholder="8500"
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description & Purpose</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Details of the initiative, beneficiary organization, donation perks..."
                  className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">External Link / Form URL</label>
                  <input
                    type="url"
                    value={link}
                    onChange={e => setLink(e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Impact Metrics / Notes</label>
                  <input
                    type="text"
                    value={impactMetrics}
                    onChange={e => setImpactMetrics(e.target.value)}
                    placeholder="500 Cup Sleeves Distributed"
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>
              </div>

              {/* Banner Photo via ImageUploadField */}
              <div className="pt-2 border-t border-[#232f4b]">
                <ImageUploadField
                  label="Project Banner / Photo *"
                  value={bannerImage}
                  onChange={setBannerImage}
                  folder="FanProjects"
                  helperText="Upload or enter URL. Stored in APMERCH_DATAFOLDER/FanProjects."
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
                  Save & Lock In Fan Project
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
        itemType="Fan Project"
        isSaving={isSaving}
        onConfirm={handleConfirmLockIn}
        onCancel={() => setShowLockPrompt(false)}
      />
    </div>
  );
};
