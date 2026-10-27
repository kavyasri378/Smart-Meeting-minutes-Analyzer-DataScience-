import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Analyze from './pages/Analyze';
import History from './pages/History';
import Settings from './pages/Settings';
import MinutesReportModal from './components/MinutesReportModal';
import Toast from './components/Toast';
import { checkHealth, getMeetingDetails } from './api/client';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [backendStatus, setBackendStatus] = useState({ status: 'checking' });
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Check backend health on initial mount and every 30 seconds
  useEffect(() => {
    let isMounted = true;
    const verifyHealth = async () => {
      const res = await checkHealth();
      if (isMounted) setBackendStatus(res);
    };
    verifyHealth();
    const interval = setInterval(verifyHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleViewMeetingDetails = async (meetingId) => {
    setLoadingModal(true);
    try {
      const details = await getMeetingDetails(meetingId);
      setSelectedMeeting(details);
    } catch (err) {
      showToast(err.message || 'Failed to fetch meeting record', 'error');
    } finally {
      setLoadingModal(false);
    }
  };

  const handleActionItemStatusUpdated = (itemIndex, newStatus) => {
    if (selectedMeeting) {
      const updated = { ...selectedMeeting };
      if (updated.action_items && updated.action_items[itemIndex]) {
        updated.action_items[itemIndex].status = newStatus;
        setSelectedMeeting(updated);
      }
    }
    showToast(`Task status updated to ${newStatus}`, 'info');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        backendStatus={backendStatus}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onNewAnalysis={() => setCurrentTab('analyze')}
        />

        {/* Dynamic Page View */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              onNavigateToAnalyze={() => setCurrentTab('analyze')}
              onViewMeeting={handleViewMeetingDetails}
            />
          )}

          {currentTab === 'analyze' && (
            <Analyze onShowToast={showToast} />
          )}

          {currentTab === 'history' && (
            <History
              onViewMeeting={handleViewMeetingDetails}
              onShowToast={showToast}
            />
          )}

          {currentTab === 'settings' && (
            <Settings onShowToast={showToast} />
          )}
        </main>
      </div>

      {/* Structured Minutes Modal */}
      {selectedMeeting && (
        <MinutesReportModal
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          onActionItemStatusChange={handleActionItemStatusUpdated}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
}
