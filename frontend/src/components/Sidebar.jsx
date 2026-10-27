import React from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  History, 
  Settings, 
  FileText,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, backendStatus }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analyze', label: 'Analyze Meeting', icon: Sparkles, badge: 'NLP' },
    { id: 'history', label: 'Meeting History', icon: History },
    { id: 'settings', label: 'NLP Engine & Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Logo Header */}
        <div className="p-5 border-b border-slate-100 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-tealAccent-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-base font-outfit">MinuteFlow</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-100 text-brand-700">AI</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Smart Minutes Analyzer</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-50 to-tealAccent-50/40 text-brand-700 font-semibold shadow-sm border border-brand-100/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-brand-600 text-white' 
                      : 'bg-tealAccent-100 text-tealAccent-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Backend Status & Footer */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                {backendStatus?.status === 'online' ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tealAccent-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-tealAccent-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                )}
              </span>
              <span className="text-xs font-semibold text-slate-700">NLP Backend</span>
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              backendStatus?.status === 'online' ? 'text-tealAccent-600' : 'text-rose-500'
            }`}>
              {backendStatus?.status === 'online' ? 'Active' : 'Offline'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
            {backendStatus?.status === 'online' ? 'TF-IDF Extractive Model Ready' : 'Backend not reachable on :8000'}
          </p>
        </div>

        <div className="px-1 text-center">
          <p className="text-[11px] text-slate-400">
            Smart Meeting Minutes v1.0 • NLP Demo
          </p>
        </div>
      </div>
    </aside>
  );
}
