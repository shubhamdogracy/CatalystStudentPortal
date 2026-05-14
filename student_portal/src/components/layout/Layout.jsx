import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import Sidebar from './Sidebar';

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

const PAGE_META = {
  '/dashboard':       { title: 'Dashboard',        subtitle: 'Welcome to your learning portal'              },
  '/sat/diagnostic':  { title: 'Diagnostic Tests', subtitle: 'Assess your current SAT readiness'           },
  '/sat/mock':        { title: 'Mock Tests',        subtitle: 'Full-length adaptive SAT mock exams'         },
  '/sat/practice':    { title: 'Practice Tests',    subtitle: 'Topic-focused practice with instant results' },
  '/communication':   { title: 'Chat',              subtitle: 'Chat with your mentor'                       },
  '/profile':         { title: 'My Profile',        subtitle: 'Manage your account information'             },
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
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-4 md:px-7 py-2.5 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-amber-800 min-w-0">
        <Sparkles size={15} className="text-amber-500 shrink-0" />
        <span className="text-[13px] font-semibold leading-snug">
          Guest Access — You have 1 diagnostic test available.
          <span className="hidden sm:inline"> Unlock the full platform after your trial.</span>
        </span>
      </div>
      <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full border border-amber-200 whitespace-nowrap shrink-0">
        Free Trial
      </span>
    </div>
  );
}

export default function Layout({ onLogout, student, chatUnreadCount, isGuest, collapsed, onToggleCollapsed }) {
  const { pathname }  = useLocation();
  const { title, subtitle } = PAGE_META[pathname] ?? { title: 'Student Portal', subtitle: '' };

  // < 700px → bottom nav bar; ≥ 700px → sidebar
  const isMobile  = useMediaQuery('(max-width: 699px)');
  const marginLeft = isMobile ? 0 : (collapsed ? 72 : 250);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        onLogout={onLogout}
        collapsed={collapsed}
        onToggle={onToggleCollapsed}
        student={student}
        chatUnreadCount={chatUnreadCount}
        isGuest={isGuest}
        bottomNav={isMobile}
      />

      <main
        className="flex-1 h-screen overflow-y-auto bg-gray-50 transition-all duration-300 relative"
        style={{ marginLeft, paddingBottom: isMobile ? 64 : 0 }}
      >
        {isGuest && <GuestBanner />}

        <div
          className="bg-white px-4 md:px-7 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <div className="min-w-0">
            <div className="text-lg md:text-xl font-bold text-gray-900 truncate">{title}</div>
            <div className="text-[13px] text-gray-400 mt-0.5 hidden sm:block">{subtitle}</div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {isGuest && (
              <span className="text-[12px] font-bold px-3 py-1 bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                Guest
              </span>
            )}
            <span className="text-[13px] text-gray-500 bg-gray-100 px-[14px] py-[6px] rounded-full hidden md:inline">
              {formatDate()}
            </span>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
