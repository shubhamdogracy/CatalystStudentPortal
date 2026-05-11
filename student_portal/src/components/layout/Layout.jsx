import { Sparkles } from 'lucide-react';
import Sidebar from './Sidebar';

const PAGE_META = {
  dashboard:     { title: 'Dashboard',         subtitle: 'Welcome to your learning portal'              },
  satDiagnostic: { title: 'Diagnostic Tests',  subtitle: 'Assess your current SAT readiness'           },
  satMock:       { title: 'Mock Tests',        subtitle: 'Full-length adaptive SAT mock exams'         },
  satPractice:   { title: 'Practice Tests',    subtitle: 'Topic-focused practice with instant results' },
  communication: { title: 'Chat',              subtitle: 'Chat with your mentor'                       },
  profile:       { title: 'My Profile',        subtitle: 'Manage your account information'             },
};

function formatDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function GuestBanner() {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-7 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-amber-800">
        <Sparkles size={15} className="text-amber-500 shrink-0" />
        <span className="text-[13px] font-semibold">
          Guest Access — You have 1 diagnostic test available.
          Unlock the full platform after your trial.
        </span>
      </div>
      <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full border border-amber-200 whitespace-nowrap">
        Free Trial
      </span>
    </div>
  );
}

export default function Layout({ page, onNavigate, onLogout, student, chatUnreadCount, isGuest, collapsed, onToggleCollapsed, children }) {
  const { title, subtitle } = PAGE_META[page] ?? PAGE_META.dashboard;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        active={page}
        onNavigate={onNavigate}
        onLogout={onLogout}
        collapsed={collapsed}
        onToggle={onToggleCollapsed}
        student={student}
        chatUnreadCount={chatUnreadCount}
        isGuest={isGuest}
      />

      <main
        className="flex-1 h-screen overflow-y-auto bg-gray-50 transition-all duration-300 relative"
        style={{ marginLeft: collapsed ? 72 : 250 }}
      >
        {isGuest && <GuestBanner />}

        {/* Top bar — matches mentor portal header style */}
        <div className="bg-white px-7 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div>
            <div className="text-xl font-bold text-gray-900">{title}</div>
            <div className="text-[13px] text-gray-400 mt-0.5">{subtitle}</div>
          </div>
          <div className="flex items-center gap-3">
            {isGuest && (
              <span className="text-[12px] font-bold px-3 py-1 bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                Guest
              </span>
            )}
            <span className="text-[13px] text-gray-500 bg-gray-100 px-[14px] py-[6px] rounded-full">
              {formatDate()}
            </span>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
