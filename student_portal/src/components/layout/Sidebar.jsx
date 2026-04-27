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
} from 'lucide-react';
import BAvatar from 'boring-avatars';
import catalystLogo from '../../assets/catalyst-logo.png';

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'sessions',      label: 'My Sessions',  icon: Calendar },
  { id: 'slots',         label: 'Book a Slot',  icon: Clock },
  { id: 'assignments',   label: 'Assignments',  icon: BookOpen },
  { id: 'communication', label: 'Communication',icon: MessageSquare, badgeKey: 'chat' },
  { id: 'practiceTime',  label: 'Practice Time',icon: Dumbbell },
  { id: 'profile',       label: 'My Profile',   icon: User },
];

export default function Sidebar({ active, onNavigate, onLogout, collapsed, onToggle, student, chatUnreadCount = 0 }) {
  return (
    <aside
      className="bg-[#0f172a] flex flex-col fixed top-0 left-0 h-screen z-[100] transition-all duration-300 overflow-hidden"
      style={{ width: collapsed ? 72 : 250 }}
    >
      {/* Brand + toggle */}
      <div className="px-4 py-5 border-b border-[#1e293b] flex items-center gap-2 min-h-[72px]">
        {!collapsed && (
          <img src={catalystLogo} alt="Catalyst" className="h-9 w-auto object-contain flex-1 min-w-0" />
        )}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`w-7 h-7 rounded-lg flex items-center justify-center bg-[#1e293b] text-slate-400 hover:bg-[#334155] hover:text-white transition-colors shrink-0 ${collapsed ? 'mx-auto' : 'ml-auto'}`}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Logged-in user */}
      <div className={`border-b border-[#1e293b] flex items-center py-4 ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-5'}`}>
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
          <BAvatar size={36} name={student?.name || 'Student'} variant="beam" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-[13px] font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis">
              {student?.name || ''}
            </div>
            <div className="text-[11px] text-slate-500 uppercase tracking-[0.5px]">Student</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {!collapsed && (
          <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-[1px] px-5 pt-2 pb-1">
            Main Menu
          </div>
        )}
        {NAV_ITEMS.map(({ id, label, icon: Icon, badgeKey }) => {
          const badgeCount = badgeKey === 'chat' ? chatUnreadCount : 0;
          return (
            <div
              key={id}
              onClick={() => onNavigate(id)}
              title={collapsed ? label : ''}
              className={`relative flex items-center cursor-pointer transition-all border-l-[3px] text-sm font-medium
                ${collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-5 py-2.5'}
                ${active === id
                  ? 'bg-[rgba(79,70,229,0.15)] border-l-indigo-600 text-white'
                  : 'border-l-transparent text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
                }`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="flex-1">{label}</span>}
              {!collapsed && badgeCount > 0 && (
                <span className="ml-auto bg-indigo-600 text-white text-[10px] font-bold px-[7px] py-[2px] rounded-[10px]">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
              {collapsed && badgeCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="py-3 border-t border-[#1e293b]">
        <button
          onClick={onLogout}
          title={collapsed ? 'Sign Out' : ''}
          className={`flex items-center text-slate-400 cursor-pointer transition-all text-sm font-medium border-none bg-transparent w-full hover:text-red-400 hover:bg-red-500/10
            ${collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-5 py-2.5'}`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
