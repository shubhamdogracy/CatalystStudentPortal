import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import Sidebar from './Sidebar';

const PAGE_META = {
  dashboard:     { title: 'Dashboard',        subtitle: 'Welcome to your learning portal' },
  assignments:   { title: 'Assignments',       subtitle: 'Track and submit your assignments' },
  sessions:      { title: 'My Sessions',       subtitle: 'Upcoming and past mentor sessions' },
  slots:         { title: 'Book a Slot',       subtitle: 'Available one-on-one slots from your mentor' },
  communication: { title: 'Communication',     subtitle: 'Chat with your mentor' },
  profile:       { title: 'My Profile',        subtitle: 'Manage your account information' },
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
          Guest Access — You have 1 diagnostic test + 2 practice tests available.
          Unlock the full platform after your trial.
        </span>
      </div>
      <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full border border-amber-200 whitespace-nowrap">
        Free Trial
      </span>
    </div>
  );
}

export default function Layout({ page, onNavigate, onLogout, student, chatUnreadCount, isGuest, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { title, subtitle } = PAGE_META[page] ?? PAGE_META.dashboard;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        active={page}
        onNavigate={onNavigate}
        onLogout={onLogout}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        student={student}
        chatUnreadCount={chatUnreadCount}
        isGuest={isGuest}
      />

      <main
        className="flex-1 h-screen overflow-y-auto bg-slate-100 transition-all duration-300 relative"
        style={{ marginLeft: collapsed ? 72 : 250 }}
      >
        {isGuest && <GuestBanner />}

        {/* Top bar */}
        <div className="bg-white px-7 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-50">
          <div>
            <div className="text-xl font-bold text-slate-900">{title}</div>
            <div className="text-[13px] text-slate-500 mt-0.5">{subtitle}</div>
          </div>
          <div className="flex items-center gap-3">
            {isGuest && (
              <span className="text-[12px] font-bold px-3 py-1 bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                Guest
              </span>
            )}
            <span className="text-[13px] text-slate-500 bg-slate-100 px-[14px] py-[6px] rounded-full">
              {formatDate()}
            </span>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
