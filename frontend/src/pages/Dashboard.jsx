import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckSquare, 
  Sparkles, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  Plus, 
  Award,
  TrendingUp,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Smile
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
import StatCard from '../components/StatCard';
import { getDashboardStats, getMeetingDetails } from '../api/client';
import { generatePdfMinutes } from '../utils/exportUtils';

export default function Dashboard({ onNavigateToAnalyze, onViewMeeting }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error("Dashboard stats error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPdfDownload = async (meetingId, e) => {
    e.stopPropagation();
    try {
      const details = await getMeetingDetails(meetingId);
      generatePdfMinutes(details);
    } catch (err) {
      alert("Failed to export PDF: " + err.message);
    }
  };

  const totalMeetings = stats?.total_meetings || 0;
  const totalActions = stats?.total_action_items || 0;
  const totalDecisions = stats?.total_decisions || 0;
  const completedActions = stats?.completed_action_items || 0;
  const pendingActions = stats?.pending_action_items || 0;
  const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  // Pie chart data for Action Item Status
  const actionChartData = [
    { name: 'Pending', value: pendingActions || 0, color: '#f59e0b' },
    { name: 'Completed', value: completedActions || 0, color: '#10b981' }
  ];

  // Bar chart data for Recent Meetings content density
  const meetingDensityData = (stats?.recent_meetings || []).slice(0, 5).map((m) => ({
    name: m.title.length > 15 ? m.title.substring(0, 15) + '...' : m.title,
    actions: m.action_items_count,
    decisions: m.decisions_count
  })).reverse();

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-tealAccent-600 p-7 sm:p-8 text-white shadow-soft-lg">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-md mb-4 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-tealAccent-200" />
            <span>AI & NLP Meeting Intelligence Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-outfit text-white">
            Smart Meeting Minutes Analyzer
          </h2>
          <p className="mt-2 text-sm sm:text-base text-brand-100 font-normal leading-relaxed">
            Eliminate manual documentation overhead. Automatically transform raw audio transcripts into executive summaries, key decisions, speaker participation, and tracked action items using explainable TF-IDF & TextRank NLP.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onNavigateToAnalyze}
              className="flex items-center space-x-2 bg-white text-brand-800 hover:bg-brand-50 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4 text-brand-600" />
              <span>Analyze New Transcript</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Meetings"
          value={totalMeetings}
          subtext="Saved in SQLite archive"
          icon={FileText}
          color="brand"
        />

        <StatCard
          title="Tracked Tasks"
          value={totalActions}
          subtext={`${pendingActions} pending, ${completedActions} done`}
          icon={CheckCircle2}
          color="teal"
        />

        <StatCard
          title="Confirmed Decisions"
          value={totalDecisions}
          subtext="High-precision linguistic consensus"
          icon={Sparkles}
          color="indigo"
        />

        <StatCard
          title="Task Completion Rate"
          value={`${completionRate}%`}
          subtext={`${completedActions} of ${totalActions} items resolved`}
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Task Completion Donut Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-outfit">Action Item Fulfillment</h3>
                <p className="text-xs text-slate-500">Pending vs. Completed commitments</p>
              </div>
            </div>

            {totalActions > 0 ? (
              <div className="h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={actionChartData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {actionChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900 font-outfit block">{completionRate}%</span>
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Completed</span>
                </div>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center p-4">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs text-slate-500 font-medium">No action items recorded yet.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-around text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-slate-600 font-medium">Pending: <b>{pendingActions}</b></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 font-medium">Completed: <b>{completedActions}</b></span>
            </div>
          </div>
        </div>

        {/* Meeting Deliverables Density Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-outfit">Meeting Deliverables Density</h3>
                <p className="text-xs text-slate-500">Decisions vs Action items per recent meeting</p>
              </div>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>

            {meetingDensityData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={meetingDensityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="actions" name="Action Items" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="decisions" name="Decisions" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center p-4">
                <FileText className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs text-slate-500 font-medium">No meeting history data yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Start by analyzing your first meeting transcript.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-center space-x-6 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-tealAccent-600"></span>
              <span className="text-slate-600 font-medium">Action Items</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-brand-600"></span>
              <span className="text-slate-600 font-medium">Decisions</span>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Meeting Analyses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-outfit">Recent Meeting Analyses</h3>
            <p className="text-xs text-slate-500">Recently processed meeting minutes and extracted takeaways</p>
          </div>
          <button
            onClick={() => onNavigateToAnalyze()}
            className="flex items-center space-x-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100/70 px-3 py-1.5 rounded-xl border border-brand-100 transition-colors self-start sm:self-auto"
          >
            <span>Analyze New Meeting</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats?.recent_meetings && stats.recent_meetings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Meeting Title & Summary</th>
                  <th className="py-3 px-4 w-36">Date</th>
                  <th className="py-3 px-4 w-44">Participants</th>
                  <th className="py-3 px-4 w-32 text-center">Deliverables</th>
                  <th className="py-3 px-6 w-36 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {stats.recent_meetings.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => onViewMeeting(m.id)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                          {m.title}
                        </span>
                        {m.sentiment_tone && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                            {m.sentiment_tone}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {m.summary_snippet}
                      </p>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-600">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{m.date}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {m.participants.slice(0, 2).map((p, i) => (
                          <span key={i} className="inline-block text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/60">
                            {p.split(' ')[0]}
                          </span>
                        ))}
                        {m.participants.length > 2 && (
                          <span className="text-[10px] text-slate-400 font-semibold self-center">
                            +{m.participants.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex items-center space-x-2 text-xs">
                        <span className="px-2 py-0.5 rounded-full font-semibold bg-tealAccent-50 text-tealAccent-700 border border-tealAccent-200/80" title="Action Items">
                          {m.action_items_count} tasks
                        </span>
                        <span className="px-2 py-0.5 rounded-full font-semibold bg-brand-50 text-brand-700 border border-brand-200/80" title="Decisions">
                          {m.decisions_count} dec.
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewMeeting(m.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="View Full Report"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleQuickPdfDownload(m.id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-tealAccent-600 hover:bg-tealAccent-50 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 font-outfit">No Meeting Analyses Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Paste or upload a meeting transcript to extract executive minutes, confirmed decisions, and assigned tasks.
            </p>
            <button
              onClick={onNavigateToAnalyze}
              className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-brand-500/20"
            >
              Analyze Your First Meeting
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
