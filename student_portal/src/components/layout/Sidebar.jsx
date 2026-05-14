import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  User,
  LogOut,
  GraduationCap,
  Menu,
  ChevronDown,
  Lock,
  ClipboardList,
  BookOpenCheck,
  BarChart2,
} from 'lucide-react';
import BAvatar from 'boring-avatars';
import catalystLogo from '../../assets/catalyst-logo.png';

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      {
        id: 'dashboard', label: 'Dashboard', shortLabel: 'Home',
        icon: LayoutDashboard, path: '/dashboard',
        iconColor: '#6366f1', iconBg: '#eef2ff',
      },
    ],
  },
  {
    label: 'SAT Tests',
    items: [
      {
        id: 'structuredTests', label: 'Structured Tests', shortLabel: 'Tests',
        icon: GraduationCap, iconColor: '#7c3aed', iconBg: '#ede9fe',
        subItems: [
          { id: 'satDiagnostic', label: 'Diagnostic', icon: ClipboardList, path: '/sat/diagnostic', iconColor: '#0d9488', iconBg: '#f0fdfa' },
          { id: 'satPractice',   label: 'Practice',   icon: BookOpenCheck,  path: '/sat/practice',   iconColor: '#16a34a', iconBg: '#f0fdf4' },
          { id: 'satMock',       label: 'Mock Tests', icon: BarChart2,      path: '/sat/mock',       iconColor: '#d97706', iconBg: '#fffbeb' },
        ],
      },
    ],
  },
  {
    label: 'Communication',
    items: [
      {
        id: 'communication', label: 'Chat', shortLabel: 'Chat',
        icon: MessageSquare, path: '/communication',
        iconColor: '#db2777', iconBg: '#fdf2f8',
        guestLocked: true, badgeKey: 'chat',
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        id: 'profile', label: 'My Profile', shortLabel: 'Profile',
        icon: User, path: '/profile',
        iconColor: '#2563eb', iconBg: '#eff6ff',
      },
    ],
  },
];

const BOTTOM_NAV_ITEMS = [
  { id: 'dashboard', label: 'Home',    icon: LayoutDashboard, path: '/dashboard',     iconColor: '#6366f1', iconBg: '#eef2ff', activePaths: ['/dashboard'] },
  { id: 'tests',     label: 'Tests',   icon: GraduationCap,   path: '/sat/diagnostic', iconColor: '#7c3aed', iconBg: '#ede9fe', activePaths: ['/sat/diagnostic', '/sat/practice', '/sat/mock'] },
  { id: 'chat',      label: 'Chat',    icon: MessageSquare,   path: '/communication', iconColor: '#db2777', iconBg: '#fdf2f8', activePaths: ['/communication'], guestLocked: true },
  { id: 'profile',   label: 'Profile', icon: User,            path: '/profile',       iconColor: '#2563eb', iconBg: '#eff6ff', activePaths: ['/profile'] },
];

function getParentOfActive(pathname) {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.subItems?.some(s => s.path === pathname)) return item;
    }
  }
  return null;
}

// Colored icon box (restored)
function IconBox({ icon: Icon, iconColor, iconBg, size = 18, boxSize = 34, locked = false }) {
  return (
    <span
      className="shrink-0 flex items-center justify-center rounded-xl transition-colors"
      style={{
        width: boxSize, height: boxSize,
        backgroundColor: locked ? '#f3f4f6' : iconBg,
      }}
    >
      <Icon size={size} style={{ color: locked ? '#d1d5db' : iconColor }} />
    </span>
  );
}

// ─── Bottom nav bar (mobile < 700px) ──────────────────────────────────────────
function BottomNavBar({ pathname, navigate, isGuest, chatUnreadCount }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-100"
      style={{ boxShadow: '0 -2px 12px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center justify-around px-1 py-1">
        {BOTTOM_NAV_ITEMS.map(({ id, label, icon: Icon, path, iconColor, iconBg, activePaths, guestLocked }) => {
          const locked   = isGuest && guestLocked;
          const isActive = activePaths.some(p => p === pathname);
          const badge    = id === 'chat' ? chatUnreadCount : 0;
          return (
            <button
              key={id}
              onClick={() => !locked && navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl relative transition-colors
                ${locked ? 'opacity-50' : 'active:bg-gray-100'}`}
            >
              <div className="relative">
                <span
                  className="flex items-center justify-center rounded-xl"
                  style={{ width: 34, height: 34, backgroundColor: isActive ? iconBg : '#f3f4f6' }}
                >
                  <Icon size={18} style={{ color: isActive ? iconColor : '#9ca3af' }} />
                </span>
                {badge > 0 && !locked && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[8px] font-bold flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold" style={{ color: isActive ? iconColor : '#9ca3af' }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Main sidebar ──────────────────────────────────────────────────────────────
export default function Sidebar({
  onLogout,
  collapsed,
  onToggle,
  student,
  chatUnreadCount = 0,
  isGuest         = false,
  bottomNav       = false,
}) {
  const navigate     = useNavigate();
  const { pathname } = useLocation();
  const [manualSections, setManualSections] = useState(() => new Set());

  const activeParentId = getParentOfActive(pathname)?.id;
  const openSections   = activeParentId
    ? new Set([...manualSections, activeParentId])
    : manualSections;

  const toggleSection = (id) =>
    setManualSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (bottomNav) {
    return (
      <BottomNavBar
        pathname={pathname}
        navigate={navigate}
        isGuest={isGuest}
        chatUnreadCount={chatUnreadCount}
      />
    );
  }

  return (
    <aside
      className={[
        'bg-white flex flex-col fixed top-0 left-0 h-screen z-[100]',
        'transition-all duration-300 overflow-hidden border-r border-gray-100',
        collapsed ? 'w-[72px]' : 'w-[250px]',
      ].join(' ')}
      style={{ boxShadow: '2px 0 12px rgba(0,0,0,0.04)' }}
    >
      {/* ── Header: ☰ menu → logo (YouTube style) ── */}
      {collapsed ? (
        <div className="flex items-center justify-center py-4 px-2 border-b border-gray-100">
          <button
            onClick={onToggle}
            title="Expand sidebar"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600
              hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 py-4 px-3 border-b border-gray-100">
          <button
            onClick={onToggle}
            title="Collapse sidebar"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600
              hover:bg-gray-100 transition-colors shrink-0"
          >
            <Menu size={20} />
          </button>
          <div className="flex flex-col gap-0.5 min-w-0">
            <img src={catalystLogo} alt="Catalyst" className="h-6 w-auto object-contain self-start" />
            <p className="text-[10px] font-semibold text-teal-600 tracking-wide">Student Portal</p>
          </div>
        </div>
      )}

      {/* ── User card ── */}
      <div className={`border-b border-gray-100 flex items-center py-3
        ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-4'}`}>
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-teal-100">
          <BAvatar size={32} name={student?.name || 'Student'} variant="beam" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
              {student?.name || ''}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.5px]"
              style={{ color: isGuest ? '#d97706' : '#6b7280' }}>
              {isGuest ? 'Guest' : 'Student'}
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_GROUPS.map(({ label: groupLabel, items }) => (
          <div key={groupLabel} className={collapsed ? 'pt-3' : 'mb-0.5'}>
            {!collapsed && (
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[1.2px] px-5 pt-3 pb-1">
                {groupLabel}
              </p>
            )}

            {items.map((item) => {
              const { id, label, shortLabel, icon: Icon, iconColor, iconBg, badgeKey, guestLocked, subItems, path } = item;
              const locked       = isGuest && guestLocked;
              const badgeCount   = badgeKey === 'chat' ? chatUnreadCount : 0;
              const isActive     = pathname === path;
              const hasSubItems  = Boolean(subItems?.length);
              const anySubActive = hasSubItems && subItems.some(s => s.path === pathname);
              const isExpanded   = openSections.has(id);
              const active       = isActive || anySubActive;

              // ── Mini/collapsed mode: colored box + tiny label below ──
              if (collapsed) {
                return (
                  <div
                    key={id}
                    onClick={() => {
                      if (locked) return;
                      navigate(hasSubItems ? subItems[0].path : path);
                    }}
                    title={locked ? `${label} (Full access required)` : label}
                    className={`relative flex flex-col items-center gap-1 py-2.5 rounded-xl select-none transition-colors
                      ${locked ? 'opacity-50 cursor-not-allowed' : active ? 'bg-gray-50 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'}`}
                    style={{ margin: '0 6px' }}
                  >
                    <IconBox icon={Icon} iconColor={iconColor} iconBg={active ? iconBg : '#f3f4f6'} size={18} boxSize={34} locked={locked} />
                    <span className="text-[9.5px] font-semibold text-center leading-none px-0.5"
                      style={{ color: active ? iconColor : '#9ca3af' }}>
                      {shortLabel || label}
                    </span>
                    {!locked && badgeCount > 0 && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-pink-500 text-white text-[8px] font-bold flex items-center justify-center">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </div>
                );
              }

              // ── Expanded: parent with sub-items ──
              if (hasSubItems) {
                return (
                  <div key={id}>
                    <div
                      onClick={() => { if (!locked) toggleSection(id); }}
                      className={`flex items-center gap-3 px-3 py-2 mx-2 rounded-xl select-none transition-colors
                        ${locked ? 'opacity-50 cursor-not-allowed' : anySubActive ? 'bg-gray-50 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'}`}
                    >
                      <IconBox icon={Icon} iconColor={iconColor} iconBg={anySubActive ? iconBg : '#f3f4f6'} size={18} boxSize={34} locked={locked} />
                      <span className={`flex-1 truncate text-[13.5px]
                        ${anySubActive ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {label}
                      </span>
                      {locked
                        ? <Lock size={12} className="shrink-0 text-gray-300" />
                        : <ChevronDown size={14}
                            className={`shrink-0 transition-transform duration-200 text-gray-400 ${isExpanded ? 'rotate-180' : ''}`} />
                      }
                    </div>

                    {isExpanded && !locked && (
                      <div className="flex flex-col mt-0.5 pb-1">
                        {subItems.map(({ id: subId, label: subLabel, icon: SubIcon, iconColor: subColor, iconBg: subBg, path: subPath }) => {
                          const isSubActive = pathname === subPath;
                          return (
                            <div
                              key={subId}
                              onClick={() => navigate(subPath)}
                              className={`flex items-center gap-2.5 pl-10 pr-3 py-1.5 mx-2 rounded-xl select-none cursor-pointer transition-colors
                                ${isSubActive ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                            >
                              <IconBox icon={SubIcon} iconColor={subColor} iconBg={isSubActive ? subBg : '#f3f4f6'} size={15} boxSize={28} />
                              <span className="text-[13px]"
                                style={{ color: isSubActive ? subColor : '#6b7280', fontWeight: isSubActive ? 600 : 500 }}>
                                {subLabel}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // ── Expanded: regular flat item ──
              return (
                <div
                  key={id}
                  onClick={() => !locked && navigate(path)}
                  title={locked ? 'Full access required' : ''}
                  className={`relative flex items-center gap-3 px-3 py-2 mx-2 rounded-xl select-none transition-colors
                    ${locked ? 'opacity-50 cursor-not-allowed' : isActive ? 'bg-gray-50 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'}`}
                >
                  <IconBox icon={Icon} iconColor={iconColor} iconBg={isActive ? iconBg : '#f3f4f6'} size={18} boxSize={34} locked={locked} />
                  <span className={`flex-1 truncate text-[13.5px]
                    ${isActive ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {label}
                  </span>
                  {locked && <Lock size={12} className="shrink-0 text-gray-300" />}
                  {!locked && badgeCount > 0 && (
                    <span className="bg-pink-500 text-white text-[10px] font-bold px-[7px] py-[2px] rounded-[10px]">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Sign out ── */}
      <div className="py-2 border-t border-gray-100">
        {collapsed ? (
          <div
            onClick={onLogout}
            title="Sign Out"
            className="flex flex-col items-center gap-1 py-2.5 rounded-xl cursor-pointer transition-colors
              hover:bg-red-50 text-gray-400 hover:text-red-500"
            style={{ margin: '0 6px' }}
          >
            <span className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, backgroundColor: '#f3f4f6' }}>
              <LogOut size={16} />
            </span>
            <span className="text-[9.5px] font-semibold">Out</span>
          </div>
        ) : (
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2.5 mx-2 w-[calc(100%-16px)] rounded-xl text-[13.5px] font-medium
              text-gray-500 hover:text-red-500 hover:bg-red-50 bg-transparent border-none cursor-pointer transition-colors"
          >
            <span className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 34, height: 34, backgroundColor: '#f3f4f6' }}>
              <LogOut size={16} />
            </span>
            Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}
