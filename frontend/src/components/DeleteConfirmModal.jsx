import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({ meetingTitle, onConfirm, onCancel, isDeleting }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-soft-xl max-w-md w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
        <div className="flex items-center space-x-3 text-rose-600 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-outfit">Delete Meeting Record?</h3>
            <p className="text-xs text-slate-500">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
          Are you sure you want to permanently remove <span className="font-semibold text-slate-900">"{meetingTitle}"</span> and all associated extracted minutes, decisions, and action items?
        </p>

        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm shadow-rose-600/20 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
