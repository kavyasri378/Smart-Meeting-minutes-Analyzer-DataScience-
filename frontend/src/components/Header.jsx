import React from 'react';
import { Sparkles, Calendar, Search } from 'lucide-react';

export default function Header({ currentTab, onNewAnalysis }) {
  const getTitles = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Analytics Dashboard',
          subtitle: 'Overview of meeting intelligence, decisions, and action item commitments'
        };
      case 'analyze':
        return {
          title: 'Analyze Transcript',
          subtitle: 'Convert unstructured meeting transcripts into structured minutes using NLP'
        };
      case 'history':
        return {
          title: 'Meeting History',
          subtitle: 'Search and inspect previously analyzed meetings and stored minutes'
        };
      case 'settings':
        return {
          title: 'NLP Architecture & Settings',
          subtitle: 'Inspect explainable summarization models and API configuration'
        };
      default:
        return { title: 'MinuteFlow', subtitle: 'Smart Meeting Minutes Analyzer' };
    }
  };

  const { title, subtitle } = getTitles();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight font-outfit">{title}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center space-x-3">
        <div className="hidden md:flex items-center space-x-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/60 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{today}</span>
        </div>

        {currentTab !== 'analyze' && (
          <button
            onClick={onNewAnalysis}
            className="flex items-center space-x-2 bg-gradient-to-r from-brand-600 to-tealAccent-600 hover:from-brand-700 hover:to-tealAccent-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm shadow-brand-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analyze Meeting</span>
          </button>
        )}
      </div>
    </header>
  );
}
