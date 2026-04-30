import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Clock,
  User,
  LogOut,
  Dumbbell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';
import BAvatar from 'boring-avatars';
import catalystLogo from '../../assets/catalyst-logo.png';

// ── Navigation groups — mirrors the mentor portal section structure ──
const NAV_GROUPS = [
  {
    label: 'Dashboard',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'My Modules',
    items: [
      { id: 'assignments',   label: 'Assignments',   icon: BookOpen },
      { id: 'sessions',      label: 'My Sessions',   icon: Calendar,       guestLocked: true },
      { id: 'slots',         label: 'Book a Slot',   icon: Clock,          guestLocked: true },
      { id: 'communication', label: 'Communication', icon: MessageSquare,  guestLocked: true, badgeKey: 'chat' },
      { id: 'practiceTime',  label: 'Practice Time', icon: Dumbbell,       guestLocked: true },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: 'profile', label: 'My Profile', icon: User },
    ],
  },
];

export default function Sidebar({ active, onNavigate, onLogout, collapsed, onToggle, student, chatUnreadCount = 0, isGuest = false }) {
  return (
    <aside
      className="bg-white flex flex-col fixed top-0 left-0 h-screen z-[100] transition-all duration-300 overflow-hidden border-r border-gray-100"
      style={{ width: collapsed ? 72 : 250, boxShadow: '2px 0 12px rgba(0,0,0,0.04)' }}
    >
      {/* ── Brand + collapse toggle ── */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-2 min-h-[72px]">
        {!collapsed && (
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <img src={catalystLogo} alt="Catalyst" className="h-7 w-auto object-contain self-start" />
            <p className="text-[10px] font-semibold text-teal-600 tracking-wide pl-0.5">Student Portal</p>
          </div>
        )}
        {collapsed && (
          <img src={catalystLogo} alt="Catalyst" className="h-7 w-auto object-contain mx-auto" />
        )}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors shrink-0 ${collapsed ? 'mx-auto mt-0' : 'ml-1'}`}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* ── Logged-in user card ── */}
      <div className={`border-b border-gray-100 flex items-center py-3.5 ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-4'}`}>
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-teal-100">
          <BAvatar size={36} name={student?.name || 'Student'} variant="beam" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
              {student?.name || ''}
            </p>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.5px]"
              style={{ color: isGuest ? '#d97706' : '#6b7280' }}
            >
              {isGuest ? 'Guest' : 'Student'}
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_GROUPS.map(({ label: groupLabel, items }) => (
          <div key={groupLabel} className="mb-1">
            {/* Group header — only when expanded */}
            {!collapsed && (
              <p className="text-[10px] font-extrabold text-teal-600 uppercase tracking-[1.2px] px-5 pt-3 pb-1.5">
                {groupLabel}
              </p>
            )}

            {items.map(({ id, label, icon: Icon, badgeKey, guestLocked }) => {
              const locked     = isGuest && guestLocked;
              const badgeCount = badgeKey === 'chat' ? chatUnreadCount : 0;
              const isActive   = active === id;

              return (
                <div
                  key={id}
                  onClick={() => !locked && onNavigate(id)}
                  title={collapsed ? (locked ? `${label} (Full access required)` : label) : locked ? 'Full access required' : ''}
                  className={`relative flex items-center transition-all text-sm font-medium select-none
                    ${collapsed ? 'justify-center px-2 py-3 mx-2 rounded-xl' : 'gap-3 pl-5 pr-3 py-2.5'}
                    ${locked
                      ? 'text-gray-300 cursor-not-allowed'
                      : isActive
                        ? collapsed
                          ? 'bg-teal-50 text-teal-700 cursor-pointer'
                          : 'bg-teal-50 text-teal-700 cursor-pointer border-l-[3px] border-l-teal-600 pl-[17px]'
                        : collapsed
                          ? 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 cursor-pointer rounded-xl mx-2'
                          : 'text-gray-500 border-l-[3px] border-l-transparent hover:bg-gray-50 hover:text-gray-800 cursor-pointer'
                    }`}
                >
                  <Icon
                    size={18}
                    className="shrink-0"
                    style={{ color: locked ? '#d1d5db' : isActive ? '#0d9488' : undefined }}
                  />
                  {!collapsed && <span className="flex-1 truncate">{label}</span>}
                  {!collapsed && locked && <Lock size={12} className="shrink-0 text-gray-300" />}
                  {!collapsed && !locked && badgeCount > 0 && (
                    <span className="ml-auto bg-teal-600 text-white text-[10px] font-bold px-[7px] py-[2px] rounded-[10px]">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                  {collapsed && badgeCount > 0 && !locked && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-teal-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Sign out ── */}
      <div className="py-3 border-t border-gray-100">
        <button
          onClick={onLogout}
          title={collapsed ? 'Sign Out' : ''}
          className={`flex items-center text-gray-400 cursor-pointer transition-all text-sm font-medium border-none bg-transparent w-full hover:text-red-500 hover:bg-red-50
            ${collapsed ? 'justify-center px-2 py-3 mx-auto' : 'gap-3 px-5 py-2.5'}`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
