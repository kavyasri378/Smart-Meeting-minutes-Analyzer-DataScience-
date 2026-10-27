import React, { useState } from 'react';
import { CheckCircle2, Clock, PlayCircle, User, Calendar } from 'lucide-react';
import { updateActionItemStatus } from '../api/client';

export default function ActionItemsTable({ items = [], meetingId = null, onStatusChange = null }) {
  const [filter, setFilter] = useState('all');
  const [updatingIndex, setUpdatingIndex] = useState(null);

  const handleStatusToggle = async (originalIndex, currentStatus) => {
    if (!meetingId) return; // Read-only if unsaved
    let nextStatus = 'Pending';
    if (currentStatus === 'Pending') nextStatus = 'In Progress';
    else if (currentStatus === 'In Progress') nextStatus = 'Completed';
    else nextStatus = 'Pending';

    setUpdatingIndex(originalIndex);
    try {
      await updateActionItemStatus(meetingId, originalIndex, nextStatus);
      if (onStatusChange) {
        onStatusChange(originalIndex, nextStatus);
      }
    } catch (err) {
      console.error("Failed to update item status:", err);
    } finally {
      setUpdatingIndex(null);
    }
  };

  // Associate each item with its original index so filtering doesn't break status updating
  const indexedItems = items.map((item, originalIndex) => ({ ...item, originalIndex }));

  const filteredItems = indexedItems.filter(item => {
    if (filter === 'pending') return item.status !== 'Completed';
    if (filter === 'completed') return item.status === 'Completed';
    return true;
  });

  const getStatusBadge = (status, originalIndex) => {
    const isUpdating = updatingIndex === originalIndex;
    let badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
    let Icon = Clock;

    if (status === 'Completed') {
      badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
      Icon = CheckCircle2;
    } else if (status === 'In Progress') {
      badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
      Icon = PlayCircle;
    }

    return (
      <button
        onClick={() => meetingId && handleStatusToggle(originalIndex, status)}
        disabled={!meetingId || isUpdating}
        title={meetingId ? "Click to toggle status: Pending -> In Progress -> Completed" : "Save meeting to toggle status"}
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass} transition-all ${
          meetingId ? 'hover:scale-105 cursor-pointer shadow-2xs active:scale-95' : 'cursor-default'
        } ${isUpdating ? 'opacity-50 animate-pulse' : ''}`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{isUpdating ? 'Updating...' : status}</span>
      </button>
    );
  };

  if (!items || items.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center">
        <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-600">No action items or commitments identified</p>
        <p className="text-xs text-slate-400 mt-1">Transcript did not contain explicit task assignments or deadlines.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Table Sub-header with Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
          <span>{filteredItems.length} task{filteredItems.length !== 1 ? 's' : ''} listed</span>
          {meetingId && <span className="text-slate-400">• Click status badge to cycle status</span>}
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              filter === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              filter === 'pending' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Active ({items.filter(i => i.status !== 'Completed').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              filter === 'completed' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Done ({items.filter(i => i.status === 'Completed').length})
          </button>
        </div>
      </div>

      {/* Structured Table */}
      <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-soft-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Task Description</th>
                <th className="py-3 px-4 w-48">Responsible Person</th>
                <th className="py-3 px-4 w-40">Due Date</th>
                <th className="py-3 px-4 w-32 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredItems.map((item) => (
                <tr key={item.originalIndex} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-400">
                    {item.originalIndex + 1}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 font-medium">
                    <span className={item.status === 'Completed' ? 'line-through text-slate-400' : ''}>
                      {item.task}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/50">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className={item.assignee === 'Not specified' ? 'text-slate-400 italic' : 'text-slate-700 font-semibold'}>
                        {item.assignee || 'Not specified'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center space-x-1.5 text-xs text-slate-600 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-tealAccent-600" />
                      <span className={item.due_date === 'Not specified' ? 'text-slate-400 italic' : 'text-slate-800'}>
                        {item.due_date || 'Not specified'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {getStatusBadge(item.status, item.originalIndex)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
