import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  Smile,
  Tag,
  Users2
} from 'lucide-react';
import ActionItemsTable from './ActionItemsTable';
import { 
  formatMeetingMinutesText, 
  downloadTextFile, 
  downloadCsvFile, 
  generatePdfMinutes 
} from '../utils/exportUtils';

export default function MinutesReportModal({ meeting, onClose, onActionItemStatusChange }) {
  const [copied, setCopied] = useState(false);

  if (!meeting) return null;

  const handleCopy = () => {
    const text = formatMeetingMinutesText(meeting);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadTxt = () => {
    const text = formatMeetingMinutesText(meeting);
    const filename = `meeting_minutes_${meeting.id || 'export'}.txt`;
    downloadTextFile(filename, text);
  };

  const handleDownloadCsv = () => {
    const filename = `action_items_${meeting.id || 'export'}.csv`;
    downloadCsvFile(filename, meeting.action_items || [], meeting.title, meeting.date);
  };

  const handleExportPdf = () => {
    generatePdfMinutes(meeting);
  };

  const participantsList = Array.isArray(meeting.participants)
    ? meeting.participants
    : (meeting.participants ? [meeting.participants] : []);

  const keywordsList = Array.isArray(meeting.keywords) ? meeting.keywords : [];
  const speakerContribs = Array.isArray(meeting.speaker_analytics) ? meeting.speaker_analytics : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-soft-xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-outfit">Meeting Minutes Report</h2>
              <p className="text-xs text-slate-500">Structured report generated with explainable NLP</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              title="Download as Plain Text"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">.TXT</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              title="Download Action Items as CSV"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-tealAccent-600" />
              <span className="hidden sm:inline">.CSV</span>
            </button>

            <button
              onClick={handleExportPdf}
              title="Export as PDF"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition-all shadow-sm shadow-brand-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-800">
          
          {/* Executive Header Box */}
          <div className="bg-gradient-to-r from-brand-50/70 via-white to-tealAccent-50/50 rounded-2xl p-6 border border-brand-100/80 shadow-soft-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-600 text-white tracking-wide">
                  OFFICIAL MEETING MINUTES
                </span>
                {meeting.sentiment?.tone && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-tealAccent-100 text-tealAccent-800 flex items-center gap-1">
                    <Smile className="w-3 h-3 text-tealAccent-600" />
                    {meeting.sentiment.tone}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {meeting.stats?.estimated_duration_min ? `~${meeting.stats.estimated_duration_min} min meeting` : 'Recorded'}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-outfit">
              {meeting.title || 'Untitled Meeting'}
            </h1>

            <div className="mt-4 pt-4 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-2 text-slate-600">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span className="font-semibold text-slate-700">Date:</span>
                <span>{meeting.date || 'Not specified'}</span>
              </div>
              <div className="flex items-start space-x-2 text-slate-600">
                <Users className="w-4 h-4 text-tealAccent-600 shrink-0 mt-0.5" />
                <span className="font-semibold text-slate-700 shrink-0">Attendees:</span>
                <span className="line-clamp-2">{participantsList.join(', ') || 'Not specified'}</span>
              </div>
            </div>

            {/* Keyword Chips */}
            {keywordsList.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200/50 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                  <Tag className="w-3 h-3" />
                  Key Topics:
                </span>
                {keywordsList.map((k, i) => (
                  <span key={i} className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white border border-slate-200/70 text-slate-700 shadow-2xs">
                    {k.keyword}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 1. Meeting Summary */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-outfit flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                1. Executive Summary
              </h3>
              <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                {meeting.summary_type || 'Extractive TF-IDF (Scikit-Learn)'}
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm leading-relaxed text-slate-700">
              {meeting.summary || 'No summary available.'}
            </div>
          </section>

          {/* 2. Key Discussion Points */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-outfit flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tealAccent-600"></span>
              2. Key Discussion Points
            </h3>
            {meeting.discussion_points && meeting.discussion_points.length > 0 ? (
              <ul className="space-y-2">
                {meeting.discussion_points.map((pt, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                    <span className="text-tealAccent-600 font-bold mt-0.5">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic">No key discussion points identified.</p>
            )}
          </section>

          {/* 3. Decisions Made */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-outfit flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              3. Decisions Made
            </h3>
            {meeting.decisions && meeting.decisions.length > 0 ? (
              <div className="space-y-2">
                {meeting.decisions.map((dec, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 mr-2 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Confirmed Decision
                      </span>
                      <span className="text-slate-800 font-medium">{dec}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic">
                No explicit decisions were identified in the transcript.
              </div>
            )}
          </section>

          {/* 4. Action Items & Commitments */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-outfit flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              4. Action Items & Next Commitments
            </h3>
            <ActionItemsTable 
              items={meeting.action_items || []} 
              meetingId={meeting.id} 
              onStatusChange={onActionItemStatusChange}
            />
          </section>

          {/* 5. Pending Issues / Follow-up */}
          {meeting.pending_issues && meeting.pending_issues.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-outfit flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                5. Pending Issues & Follow-up Topics
              </h3>
              <ul className="space-y-2">
                {meeting.pending_issues.map((issue, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-sm text-slate-700 bg-rose-50/40 p-3 rounded-xl border border-rose-100">
                    <span className="text-rose-500 font-bold mt-0.5">!</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 6. Speaker Participation Breakdown */}
          {speakerContribs.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-outfit flex items-center gap-2">
                <Users2 className="w-4 h-4 text-brand-600" />
                6. Speaker Participation Breakdown
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {speakerContribs.map((spk, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                    <span className="font-bold text-slate-800 block truncate">{spk.speaker}</span>
                    <span className="text-brand-600 font-extrabold text-sm block mt-0.5">{spk.percentage}%</span>
                    <span className="text-[10px] text-slate-400">{spk.words} words • {spk.turns} turns</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* NLP Attribution Footer Note */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Word count: {meeting.stats?.word_count || 'N/A'} • Sentences: {meeting.stats?.sentence_count || 'N/A'}</span>
            <span className="font-medium text-brand-600">
              Processed by Scikit-Learn TF-IDF & TextRank NLP Engine
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
