import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  Copy, 
  Download, 
  Check, 
  AlertCircle, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  BookOpen, 
  FileSpreadsheet,
  Sliders,
  Cpu,
  Smile,
  BarChart2,
  Tag,
  Award
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { SAMPLE_TRANSCRIPTS } from '../data/sampleTranscripts';
import { analyzeMeeting } from '../api/client';
import ActionItemsTable from '../components/ActionItemsTable';
import { 
  formatMeetingMinutesText, 
  downloadTextFile, 
  downloadCsvFile, 
  generatePdfMinutes 
} from '../utils/exportUtils';

export default function Analyze({ onShowToast }) {
  // Form Inputs
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [participantsInput, setParticipantsInput] = useState('');
  const [transcript, setTranscript] = useState('');
  const [summaryLength, setSummaryLength] = useState('medium');
  const [summaryAlgorithm, setSummaryAlgorithm] = useState('tfidf_centroid');
  const [saveToDb, setSaveToDb] = useState(true);

  // UI States
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('minutes');
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);

  // Colors for Speaker Analytics chart
  const SPEAKER_COLORS = ['#7c3aed', '#0d9488', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

  // Load sample transcript
  const handleLoadSample = (sample) => {
    setTitle(sample.title);
    setDate(new Date().toISOString().split('T')[0]);
    setParticipantsInput(sample.participants.join(', '));
    setTranscript(sample.transcript);
    setError(null);
    onShowToast?.(`Loaded "${sample.title}" sample transcript!`, 'info');
  };

  // Handle .txt file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      setError('Unsupported file format. Please upload a plain text (.txt) file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setTranscript(content);
      if (!title) {
        const derivedTitle = file.name.replace(/\.txt$/i, '').replace(/[-_]/g, ' ');
        setTitle(derivedTitle.charAt(0).toUpperCase() + derivedTitle.slice(1));
      }
      setError(null);
      onShowToast?.(`Imported ${file.name} successfully!`, 'success');
    };
    reader.onerror = () => {
      setError('Failed to read the uploaded text file.');
    };
    reader.readAsText(file);
  };

  // Perform NLP Analysis
  const handleAnalyze = async () => {
    setError(null);

    const trimmed = transcript.trim();
    if (!trimmed) {
      setError('Please provide a meeting transcript by typing, pasting, or uploading a .txt file.');
      return;
    }

    const words = trimmed.split(/\s+/);
    if (words.length < 15) {
      setError(`Transcript is too short to analyze meaningfully (${words.length} words provided; at least 15 words required).`);
      return;
    }

    setAnalyzing(true);
    setAnalysisStep(1);

    const stepTimer1 = setTimeout(() => setAnalysisStep(2), 500);
    const stepTimer2 = setTimeout(() => setAnalysisStep(3), 1000);

    try {
      const parts = participantsInput
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);

      const payload = {
        title: title.trim() || undefined,
        date: date || undefined,
        participants: parts,
        transcript: trimmed,
        summary_length: summaryLength,
        summary_algorithm: summaryAlgorithm,
        save_to_db: saveToDb
      };

      const response = await analyzeMeeting(payload);
      setResult(response);
      setActiveTab('minutes');
      onShowToast?.('Analysis completed and minutes saved!', 'success');
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(err.message || 'Analysis failed. Please ensure the backend server is running.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  const handleCopyMinutes = () => {
    if (!result) return;
    const text = formatMeetingMinutesText(result);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    onShowToast?.('Meeting minutes copied to clipboard!', 'success');
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    const text = formatMeetingMinutesText(result);
    downloadTextFile(`minutes_${result.id || 'export'}.txt`, text);
  };

  const handleDownloadCsv = () => {
    if (!result) return;
    downloadCsvFile(`action_items_${result.id || 'export'}.csv`, result.action_items || [], result.title, result.date);
  };

  const handleExportPdf = () => {
    if (!result) return;
    generatePdfMinutes(result);
  };

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const lineCount = transcript.trim() ? transcript.trim().split('\n').length : 0;
  const charCount = transcript.length;

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Input Configuration Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft-sm space-y-6">
        
        {/* Card Header & Sample Dropdowns */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 font-outfit">Meeting Analysis Configuration</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Provide meeting details or click a pre-loaded sample transcript below for instant testing.
            </p>
          </div>

          {/* Quick Sample Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              Load Sample:
            </span>
            {SAMPLE_TRANSCRIPTS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleLoadSample(sample)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200 hover:border-brand-200 transition-all shadow-2xs"
                title={sample.description}
              >
                {sample.id === 'software_team' && '⚙️ Sprint Planning'}
                {sample.id === 'college_capstone' && '🎓 Capstone Review'}
                {sample.id === 'business_planning' && '💼 Business Strategy'}
              </button>
            ))}
          </div>
        </div>

        {/* Metadata Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Meeting Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sprint 14 Planning & Architecture"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Meeting Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Participants <span className="text-slate-400 font-normal">(optional, comma-separated)</span>
            </label>
            <input
              type="text"
              value={participantsInput}
              onChange={(e) => setParticipantsInput(e.target.value)}
              placeholder="e.g. Sarah, Alex, Michael (auto-detected if empty)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-slate-50/50"
            />
          </div>
        </div>

        {/* NLP Parameters: Algorithm & Granularity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Algorithm Mode */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-bold text-slate-800">Summarization Algorithm:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'tfidf_centroid', label: 'TF-IDF Centroid', desc: 'Normalized Centroid Cosine' },
                { id: 'textrank', label: 'TextRank Graph', desc: 'Sentence PageRank Centrality' },
                { id: 'frequency', label: 'Lexical Frequency', desc: 'Term Frequency Baseline' },
              ].map((alg) => (
                <button
                  key={alg.id}
                  onClick={() => setSummaryAlgorithm(alg.id)}
                  className={`px-2.5 py-2 rounded-xl text-center transition-all ${
                    summaryAlgorithm === alg.id
                      ? 'bg-brand-600 text-white shadow-sm font-bold'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="text-xs">{alg.label}</div>
                  <div className={`text-[10px] truncate ${summaryAlgorithm === alg.id ? 'text-brand-100' : 'text-slate-400'}`}>
                    {alg.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Granularity & Save Switch */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Sliders className="w-4 h-4 text-tealAccent-600" />
                <span className="text-xs font-bold text-slate-800">Summary Granularity:</span>
              </div>
              <div className="flex items-center space-x-2">
                {[
                  { id: 'short', label: 'Short (~20%)' },
                  { id: 'medium', label: 'Medium (~35%)' },
                  { id: 'detailed', label: 'Detailed (~50%)' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSummaryLength(opt.id)}
                    className={`flex-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      summaryLength === opt.id
                        ? 'bg-tealAccent-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveToDb}
                  onChange={(e) => setSaveToDb(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span>Save to History Archive</span>
              </label>
              <span className="text-[11px] text-slate-400">Zero-hallucination guarantee</span>
            </div>
          </div>
        </div>

        {/* Transcript Textarea & File Upload Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>Meeting Transcript</span>
              <span className="text-rose-500">*</span>
            </label>

            <div className="flex items-center space-x-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1.5 text-xs font-semibold text-tealAccent-700 hover:text-tealAccent-800 bg-tealAccent-50 hover:bg-tealAccent-100/70 px-3 py-1 rounded-xl border border-tealAccent-200/80 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload .TXT File</span>
              </button>

              {transcript && (
                <button
                  type="button"
                  onClick={() => { setTranscript(''); setResult(null); }}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={8}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste meeting dialogue or transcript here... 
Example format:
Sarah: Welcome everyone. Let's discuss our project goals.
Alex: I finished the database setup. We decided to keep SQLite.
Michael: I will prepare the final presentation by Friday."
              className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-slate-50/30 leading-relaxed font-mono"
            />
          </div>

          {/* Transcript Stats Footer */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center space-x-4">
              <span>{wordCount} words</span>
              <span>{lineCount} lines</span>
              <span>{charCount} characters</span>
            </div>
            <span>Estimated speech: ~{Math.max(1, Math.round(wordCount / 140))} min</span>
          </div>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-3 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Input Error: </span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Action Button & Loading Progress */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
            <span>Multi-modal NLP: Extractive Sentence Ranking, Sentiment Modeling, and Task Disambiguation.</span>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || !transcript.trim()}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-600 to-tealAccent-600 hover:from-brand-700 hover:to-tealAccent-700 text-white px-7 py-3 rounded-2xl font-bold text-sm shadow-md shadow-brand-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>
                  {analysisStep === 1 && "Tokenizing & Diarizing..."}
                  {analysisStep === 2 && `Scoring with ${summaryAlgorithm}...`}
                  {analysisStep === 3 && "Extracting Decisions & Sentiment..."}
                  {analysisStep === 0 && "Analyzing..."}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Transcript</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Analysis Results Display */}
      {result && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft-sm space-y-6 animate-in fade-in duration-200">
          
          {/* Result Header & Export Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-tealAccent-100 text-tealAccent-800 tracking-wide uppercase">
                  Analysis Complete
                </span>
                {result.id && (
                  <span className="text-xs text-slate-400 font-medium">Record #{result.id}</span>
                )}
                {result.sentiment?.tone && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-100 text-brand-800 flex items-center gap-1">
                    <Smile className="w-3 h-3 text-brand-600" />
                    {result.sentiment.tone}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-outfit mt-1">
                {result.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  {result.date}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-tealAccent-600" />
                  {result.participants?.join(', ') || 'Attendees'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  {result.summary_type}
                </span>
              </div>
            </div>

            {/* Quick Export Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyMinutes}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy Minutes'}</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Download .TXT</span>
              </button>

              <button
                onClick={handleDownloadCsv}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-tealAccent-600" />
                <span>Action Items (.CSV)</span>
              </button>

              <button
                onClick={handleExportPdf}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition-all shadow-sm shadow-brand-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center space-x-1 border-b border-slate-100 overflow-x-auto pb-1">
            {[
              { id: 'minutes', label: 'Structured Minutes' },
              { id: 'summary', label: 'Executive Summary' },
              { id: 'decisions', label: `Decisions (${result.decisions?.length || 0})` },
              { id: 'actions', label: `Action Items (${result.action_items?.length || 0})` },
              { id: 'points', label: 'Discussion Points' },
              { id: 'sentiment', label: 'Meeting Sentiment & Tone' },
              { id: 'speakers', label: `Speaker Analytics (${result.speaker_analytics?.length || 0})` },
              { id: 'keywords', label: `Topics & Keywords (${result.keywords?.length || 0})` },
              { id: 'evaluation', label: 'ROUGE Evaluation' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-50 text-brand-700 border border-brand-200/80 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Display */}
          <div className="space-y-6">
            
            {/* TAB 1: Structured Meeting Minutes View */}
            {activeTab === 'minutes' && (
              <div className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-200/70">
                {/* 1. Summary */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">1. Meeting Summary</h3>
                  <p className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200/70">
                    {result.summary}
                  </p>
                </div>

                {/* 2. Key Discussion Points */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Key Discussion Points</h3>
                  {result.discussion_points?.length > 0 ? (
                    <ul className="space-y-1.5">
                      {result.discussion_points.map((pt, i) => (
                        <li key={i} className="flex items-start space-x-2 text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-200/70">
                          <span className="text-tealAccent-600 font-bold">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">None extracted.</p>
                  )}
                </div>

                {/* 3. Decisions Made */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">3. Decisions Made</h3>
                  {result.decisions?.length > 0 ? (
                    <div className="space-y-2">
                      {result.decisions.map((dec, i) => (
                        <div key={i} className="flex items-start space-x-3 p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="font-medium text-slate-800">{dec}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No explicit decisions were identified.</p>
                  )}
                </div>

                {/* 4. Action Items */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">4. Action Items & Commitments</h3>
                  <ActionItemsTable items={result.action_items || []} meetingId={result.id} />
                </div>

                {/* 5. Pending Issues */}
                {result.pending_issues?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">5. Pending Follow-up</h3>
                    <ul className="space-y-1.5">
                      {result.pending_issues.map((issue, i) => (
                        <li key={i} className="flex items-start space-x-2 text-sm text-slate-700 bg-white p-3 rounded-xl border border-rose-100">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Executive Summary Only */}
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-brand-50/60 border border-brand-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-brand-700">Algorithm: {result.summary_type}</span>
                  <span className="text-slate-500">
                    Compression: {Math.round((1 - (result.summary.split(/\s+/).length / (result.stats?.word_count || 1))) * 100)}% reduction
                  </span>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-sm leading-relaxed text-slate-800 font-normal">
                  {result.summary}
                </div>
              </div>
            )}

            {/* TAB 3: Decisions Made Only */}
            {activeTab === 'decisions' && (
              <div className="space-y-3">
                {result.decisions?.length > 0 ? (
                  result.decisions.map((dec, i) => (
                    <div key={i} className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 mb-1">
                          Consensus Reached
                        </span>
                        <p className="text-slate-900 font-medium">{dec}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-sm font-semibold text-slate-600">No explicit decisions were identified in the transcript.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Action Items Table */}
            {activeTab === 'actions' && (
              <ActionItemsTable items={result.action_items || []} meetingId={result.id} />
            )}

            {/* TAB 5: Key Discussion Points */}
            {activeTab === 'points' && (
              <div className="space-y-3">
                {result.discussion_points?.length > 0 ? (
                  result.discussion_points.map((pt, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start space-x-3 text-sm">
                      <span className="w-6 h-6 rounded-full bg-tealAccent-100 text-tealAccent-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-slate-800 leading-relaxed">{pt}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No key discussion points identified.</p>
                )}
              </div>
            )}

            {/* TAB 6: Sentiment & Tone Analytics */}
            {activeTab === 'sentiment' && (
              <div className="space-y-6">
                {/* Tone Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <span className="text-xs font-bold text-emerald-700 uppercase">Positive / Collaborative</span>
                    <p className="text-2xl font-extrabold text-emerald-900 mt-1">
                      {result.sentiment?.breakdown?.positive || 0}%
                    </p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">Constructive proposals and mutual agreements</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-xs font-bold text-slate-700 uppercase">Neutral / Informational</span>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">
                      {result.sentiment?.breakdown?.neutral || 0}%
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Factual updates and status reviews</p>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <span className="text-xs font-bold text-amber-700 uppercase">Critical / Problem-Solving</span>
                    <p className="text-2xl font-extrabold text-amber-900 mt-1">
                      {result.sentiment?.breakdown?.critical || 0}%
                    </p>
                    <p className="text-[11px] text-amber-600 mt-0.5">Bottlenecks, latencies, and pending risks</p>
                  </div>
                </div>

                {/* Speaker Sentiment breakdown */}
                {result.sentiment?.speaker_sentiments?.length > 0 && (
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Speaker Tone Polarities</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.sentiment.speaker_sentiments.map((spk, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{spk.speaker}</span>
                            <span className="text-slate-400 ml-2 font-mono">({spk.utterance_count} turns)</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded font-semibold ${
                            spk.score > 0.05 ? 'bg-emerald-100 text-emerald-800' :
                            spk.score < -0.05 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {spk.tone}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: Speaker Analytics */}
            {activeTab === 'speakers' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                  {/* Pie Chart */}
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/70 h-64 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-slate-700 mb-2">Speaking Time Share (% Words)</span>
                    <ResponsiveContainer width="100%" height="90%">
                      <PieChart>
                        <Pie
                          data={result.speaker_analytics || []}
                          dataKey="words"
                          nameKey="speaker"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          label={({ speaker, percentage }) => `${speaker}: ${percentage}%`}
                        >
                          {(result.speaker_analytics || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={SPEAKER_COLORS[index % SPEAKER_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Speaker Stats Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-soft-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Speaker</th>
                          <th className="p-3">Words Spoken</th>
                          <th className="p-3">Dialogue Share</th>
                          <th className="p-3">Speaking Turns</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(result.speaker_analytics || []).map((spk, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SPEAKER_COLORS[idx % SPEAKER_COLORS.length] }}></span>
                              {spk.speaker}
                            </td>
                            <td className="p-3 text-slate-600 font-mono">{spk.words}</td>
                            <td className="p-3 font-bold text-brand-700">{spk.percentage}%</td>
                            <td className="p-3 text-slate-600 font-mono">{spk.turns}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: Salient Topics & Keywords */}
            {activeTab === 'keywords' && (
              <div className="space-y-4">
                <div className="p-4 bg-tealAccent-50/60 border border-tealAccent-100 rounded-xl text-xs text-tealAccent-800">
                  <span className="font-bold">Keyphrase Extraction: </span>
                  <span>Extracted via Scikit-Learn TF-IDF N-Gram Vectorizer based on sublinear frequency and document salience.</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(result.keywords || []).map((kw, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Tag className="w-3.5 h-3.5 text-tealAccent-600" />
                        <span className="text-xs font-bold text-slate-800">{kw.keyword}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
                        {kw.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 9: ROUGE Evaluation Metric */}
            {activeTab === 'evaluation' && (
              <div className="space-y-4">
                <div className="p-4 bg-brand-50/60 border border-brand-100 rounded-xl text-xs text-brand-800">
                  <span className="font-bold">Academic Evaluation Benchmark: </span>
                  <span>Statistical evaluation of candidate extractive summary against the complete meeting discourse. Standard metrics for Natural Language Processing research.</span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-soft-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Evaluation Metric</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Precision</th>
                        <th className="p-3">Recall</th>
                        <th className="p-3">F1 Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      <tr>
                        <td className="p-3 font-bold text-slate-800 font-sans">ROUGE-1</td>
                        <td className="p-3 text-slate-500 font-sans">Unigram overlap between summary and discourse</td>
                        <td className="p-3">{result.evaluation?.rouge_1?.precision || '0.0000'}</td>
                        <td className="p-3">{result.evaluation?.rouge_1?.recall || '0.0000'}</td>
                        <td className="p-3 font-bold text-brand-700">{result.evaluation?.rouge_1?.f1 || '0.0000'}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800 font-sans">ROUGE-2</td>
                        <td className="p-3 text-slate-500 font-sans">Bigram overlap measuring phrase coherence</td>
                        <td className="p-3">{result.evaluation?.rouge_2?.precision || '0.0000'}</td>
                        <td className="p-3">{result.evaluation?.rouge_2?.recall || '0.0000'}</td>
                        <td className="p-3 font-bold text-brand-700">{result.evaluation?.rouge_2?.f1 || '0.0000'}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800 font-sans">ROUGE-L</td>
                        <td className="p-3 text-slate-500 font-sans">Longest Common Subsequence (sentence structure retention)</td>
                        <td className="p-3">{result.evaluation?.rouge_l?.precision || '0.0000'}</td>
                        <td className="p-3">{result.evaluation?.rouge_l?.recall || '0.0000'}</td>
                        <td className="p-3 font-bold text-brand-700">{result.evaluation?.rouge_l?.f1 || '0.0000'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
