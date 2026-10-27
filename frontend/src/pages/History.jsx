import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Users, 
  Trash2, 
  Eye, 
  Download, 
  FileText, 
  Clock, 
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { getMeetings, getMeetingDetails, deleteMeeting } from '../api/client';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { generatePdfMinutes, downloadTextFile, formatMeetingMinutesText } from '../utils/exportUtils';

export default function History({ onViewMeeting, onShowToast }) {
  const [meetings, setMeetings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async (query = '') => {
    try {
      setLoading(true);
      const data = await getMeetings(query);
      setMeetings(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load meetings:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    loadMeetings(val);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteMeeting(deleteTarget.id);
      setMeetings(prev => prev.filter(m => m.id !== deleteTarget.id));
      onShowToast?.(`Deleted meeting "${deleteTarget.title}"`, 'info');
      setDeleteTarget(null);
    } catch (err) {
      alert("Failed to delete meeting: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickPdf = async (id, e) => {
    e.stopPropagation();
    try {
      const details = await getMeetingDetails(id);
      generatePdfMinutes(details);
    } catch (err) {
      alert("Export failed: " + err.message);
    }
  };

  const handleQuickTxt = async (id, e) => {
    e.stopPropagation();
    try {
      const details = await getMeetingDetails(id);
      const text = formatMeetingMinutesText(details);
      downloadTextFile(`minutes_${details.id}.txt`, text);
    } catch (err) {
      alert("Export failed: " + err.message);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Search Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-outfit">Saved Meeting Minutes Archive</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Persisted in local SQLite database • {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} stored
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by title or attendee..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadMeetings(searchQuery)}
            className="font-bold underline ml-4 hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Meetings Grid / List */}
      {loading ? (
        <div className="p-16 text-center">
          <RefreshCw className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading meeting history...</p>
        </div>
      ) : meetings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {meetings.map((m) => (
            <div
              key={m.id}
              onClick={() => onViewMeeting(m.id)}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft-sm hover:shadow-soft-md transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:border-brand-300"
            >
              <div>
                {/* Card Top Metadata */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-semibold text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-600" />
                    {m.date}
                  </span>
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                    #{m.id}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors font-outfit line-clamp-1">
                  {m.title}
                </h3>

                {/* Summary snippet */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mt-2">
                  {m.summary_snippet}
                </p>

                {/* Attendees list */}
                {m.participants && m.participants.length > 0 && (
                  <div className="mt-3 flex items-center space-x-1.5 text-xs text-slate-500">
                    <Users className="w-3.5 h-3.5 text-tealAccent-600 shrink-0" />
                    <span className="line-clamp-1">{m.participants.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Card Footer: Badges & Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-tealAccent-50 text-tealAccent-700 border border-tealAccent-200/70">
                    {m.action_items_count} tasks
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-brand-50 text-brand-700 border border-brand-200/70">
                    {m.decisions_count} dec.
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => handleQuickTxt(m.id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Download .TXT"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleQuickPdf(m.id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                    title="Export PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(m);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Meeting"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 font-outfit">
            {searchQuery ? 'No Matching Meetings Found' : 'No Meetings Archived Yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchQuery 
              ? `No meetings found matching "${searchQuery}". Try a different keyword.` 
              : 'Your processed meetings will be listed here with instant access to minutes, decisions, and action items.'}
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          meetingTitle={deleteTarget.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}

    </div>
  );
}
