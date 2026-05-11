import { useState } from 'react';
import {
  LayoutDashboard,  // Dashboard
  MessageSquare,    // Chat
  User,             // My Profile
  LogOut,
  GraduationCap,    // Structured Tests (parent)
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Lock,
  ClipboardList,    // Diagnostic Tests
  BookOpenCheck,    // Practice Tests
  BarChart2,        // Mock Tests
} from 'lucide-react';
import BAvatar from 'boring-avatars';
import catalystLogo from '../../assets/catalyst-logo.png';

// ── Color tokens per nav item ──────────────────────────────────────────────────
// Each item carries its own icon color + light background so icons are always
// colorful and recognisable, regardless of active/hover state (matching the
// mentor and ops portal visual style).
const NAV_GROUPS = [
  {
    label: 'Dashboard',
    items: [
      {
        id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard,
        iconColor: '#6366f1', iconBg: '#eef2ff',   // indigo
      },
    ],
  },
  {
    label: 'SAT Tests',
    items: [
      {
        id: 'structuredTests', label: 'Structured Tests', icon: GraduationCap,
        iconColor: '#7c3aed', iconBg: '#ede9fe',          // violet
        guestLocked: true,
        // Order: Diagnostic → Practice → Mock
        subItems: [
          {
            id: 'satDiagnostic', label: 'Diagnostic Tests', icon: ClipboardList,
            iconColor: '#0d9488', iconBg: '#f0fdfa',        // teal
          },
          {
            id: 'satPractice', label: 'Practice Tests', icon: BookOpenCheck,
            iconColor: '#16a34a', iconBg: '#f0fdf4',        // green
          },
          {
            id: 'satMock', label: 'Mock Tests', icon: BarChart2,
            iconColor: '#d97706', iconBg: '#fffbeb',        // amber
          },
        ],
      },
    ],
  },
  {
    label: 'Communication',
    items: [
      {
        id: 'communication', label: 'Chat', icon: MessageSquare,
        iconColor: '#db2777', iconBg: '#fdf2f8',            // pink
        guestLocked: true, badgeKey: 'chat',
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        id: 'profile', label: 'My Profile', icon: User,
        iconColor: '#2563eb', iconBg: '#eff6ff',            // blue
      },
    ],
  },
];

// ── Helper: find expandable parent that contains the currently active sub-page ─
function getParentOfActive(activeId) {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.subItems?.some(s => s.id === activeId)) return item;
    }
  }
  return null;
}

// ── Coloured icon container ────────────────────────────────────────────────────
// Wraps the Lucide icon in a small rounded square with a tinted background,
// replicating the visual style seen in the mentor / ops portals.
function IconBox({ icon: Icon, iconColor, iconBg, size = 18, boxSize = 32, locked = false }) {
  return (
    <span
      className="shrink-0 flex items-center justify-center rounded-xl transition-colors"
      style={{
        width:           boxSize,
        height:          boxSize,
        backgroundColor: locked ? '#f3f4f6' : iconBg,
      }}
    >
      <Icon size={size} style={{ color: locked ? '#d1d5db' : iconColor }} />
    </span>
  );
}

export default function Sidebar({
  active,
  onNavigate,
  onLogout,
  collapsed,
  onToggle,
  student,
  chatUnreadCount = 0,
  isGuest = false,
}) {
  // Sections manually toggled open/closed by the user.
  const [manualSections, setManualSections] = useState(() => new Set());

  // The parent of the active page is always kept open — derived, not stored in state.
  // This avoids calling setState inside an effect (which triggers cascading renders).
  const activeParentId = getParentOfActive(active)?.id;
  const openSections   = activeParentId
    ? new Set([...manualSections, activeParentId])
    : manualSections;

  const toggleSection = (id) =>
    setManualSections(prev => {
      const next = new Set(prev);
      // If this section is forced open by the active page, toggling just adds it
      // to manualSections so it can be explicitly closed by the user.
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <aside
      className="bg-white flex flex-col fixed top-0 left-0 h-screen z-[100] transition-all duration-300 overflow-hidden border-r border-gray-100"
      style={{ width: collapsed ? 72 : 250, boxShadow: '2px 0 12px rgba(0,0,0,0.04)' }}
    >
      {/* ── Brand + collapse toggle ────────────────────────────────────────── */}
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
          className={`w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 text-gray-500
            hover:bg-gray-200 hover:text-gray-700 transition-colors shrink-0
            ${collapsed ? 'mx-auto mt-0' : 'ml-1'}`}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* ── User card ─────────────────────────────────────────────────────── */}
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

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_GROUPS.map(({ label: groupLabel, items }) => (
          <div key={groupLabel} className="mb-1">
            {/* Group label — hidden when collapsed */}
            {!collapsed && (
              <p className="text-[10px] font-extrabold text-teal-600 uppercase tracking-[1.2px] px-5 pt-3 pb-1.5">
                {groupLabel}
              </p>
            )}

            {items.map((item) => {
              const { id, label, icon, iconColor, iconBg, badgeKey, guestLocked, subItems } = item;
              const locked      = isGuest && guestLocked;
              const badgeCount  = badgeKey === 'chat' ? chatUnreadCount : 0;
              const isActive    = active === id;
              const hasSubItems  = Boolean(subItems?.length);
              const anySubActive = hasSubItems && subItems.some(s => s.id === active);
              const isExpanded   = openSections.has(id);

              // ── Expandable parent item (Structured Tests) ───────────────
              if (hasSubItems) {
                return (
                  <div key={id}>
                    {/* Parent row */}
                    <div
                      onClick={() => {
                        if (locked) return;
                        // Collapsed: jump to first sub-item; expanded: toggle accordion
                        if (collapsed) { onNavigate(subItems[0].id); return; }
                        toggleSection(id);
                      }}
                      title={
                        collapsed
                          ? (locked ? `${label} (Full access required)` : subItems[0].label)
                          : locked ? 'Full access required' : ''
                      }
                      className={`relative flex items-center transition-all text-sm font-medium select-none
                        ${collapsed ? 'justify-center px-2 py-2.5 mx-2 rounded-xl' : 'gap-3 pl-4 pr-3 py-2'}
                        ${locked
                          ? 'cursor-not-allowed opacity-50'
                          : anySubActive
                            ? collapsed
                              ? 'bg-violet-50 cursor-pointer'
                              : 'bg-violet-50 cursor-pointer border-l-[3px] border-l-violet-500 pl-[13px]'
                            : collapsed
                              ? 'hover:bg-gray-50 cursor-pointer rounded-xl'
                              : 'border-l-[3px] border-l-transparent hover:bg-gray-50 cursor-pointer'
                        }`}
                    >
                      <IconBox icon={icon} iconColor={iconColor} iconBg={iconBg} size={22} boxSize={40} locked={locked} />
                      {!collapsed && (
                        <span className={`flex-1 truncate text-[13px] font-semibold ${anySubActive ? 'text-violet-700' : 'text-gray-600'}`}>
                          {label}
                        </span>
                      )}
                      {!collapsed && locked && <Lock size={12} className="shrink-0 text-gray-300" />}
                      {/* Animated chevron */}
                      {!collapsed && !locked && (
                        <ChevronDown
                          size={14}
                          className={`shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          style={{ color: anySubActive ? '#7c3aed' : '#9ca3af' }}
                        />
                      )}
                    </div>

                    {/* Sub-items accordion — visible only when expanded & not collapsed */}
                    {!collapsed && isExpanded && !locked && (
                      <div className="flex flex-col pb-1">
                        {subItems.map(({ id: subId, label: subLabel, icon: subIcon, iconColor: subColor, iconBg: subBg }) => {
                          const isSubActive = active === subId;
                          return (
                            <div
                              key={subId}
                              onClick={() => onNavigate(subId)}
                              className={`relative flex items-center gap-2.5 pr-3 py-1.5 text-[13px] font-medium
                                select-none cursor-pointer transition-all
                                ${isSubActive
                                  ? 'border-l-[3px] pl-[29px]'
                                  : 'border-l-[3px] border-l-transparent pl-8 hover:bg-gray-50'
                                }`}
                              style={isSubActive ? { borderLeftColor: subColor, backgroundColor: subBg } : {}}
                            >
                              {/* Slightly smaller icon box for sub-items */}
                              <IconBox icon={subIcon} iconColor={subColor} iconBg={subBg} size={18} boxSize={34} />
                              <span style={{ color: isSubActive ? subColor : '#6b7280' }}>{subLabel}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // ── Regular flat item ───────────────────────────────────────
              return (
                <div
                  key={id}
                  onClick={() => !locked && onNavigate(id)}
                  title={
                    collapsed
                      ? (locked ? `${label} (Full access required)` : label)
                      : locked ? 'Full access required' : ''
                  }
                  className={`relative flex items-center transition-all text-sm font-medium select-none
                    ${collapsed ? 'justify-center px-2 py-2.5 mx-2 rounded-xl' : 'gap-3 pl-4 pr-3 py-2'}
                    ${locked
                      ? 'cursor-not-allowed opacity-50'
                      : isActive
                        ? collapsed
                          ? 'cursor-pointer'
                          : 'cursor-pointer border-l-[3px] pl-[13px]'
                        : collapsed
                          ? 'hover:bg-gray-50 cursor-pointer rounded-xl'
                          : 'border-l-[3px] border-l-transparent hover:bg-gray-50 cursor-pointer'
                    }`}
                  style={
                    !locked && isActive && !collapsed
                      ? { borderLeftColor: iconColor, backgroundColor: iconBg }
                      : {}
                  }
                >
                  <IconBox icon={icon} iconColor={iconColor} iconBg={iconBg} size={22} boxSize={40} locked={locked} />
                  {!collapsed && (
                    <span
                      className="flex-1 truncate text-[13px] font-semibold"
                      style={{ color: isActive ? iconColor : '#6b7280' }}
                    >
                      {label}
                    </span>
                  )}
                  {!collapsed && locked && <Lock size={12} className="shrink-0 text-gray-300" />}
                  {/* Unread badge for Chat */}
                  {!collapsed && !locked && badgeCount > 0 && (
                    <span className="ml-auto bg-pink-500 text-white text-[10px] font-bold px-[7px] py-[2px] rounded-[10px]">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                  {collapsed && !locked && badgeCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Sign out ──────────────────────────────────────────────────────── */}
      <div className="py-3 border-t border-gray-100">
        <button
          onClick={onLogout}
          title={collapsed ? 'Sign Out' : ''}
          className={`flex items-center text-gray-400 cursor-pointer transition-all text-sm font-medium
            border-none bg-transparent w-full hover:text-red-500 hover:bg-red-50
            ${collapsed ? 'justify-center px-2 py-3 mx-auto' : 'gap-3 px-5 py-2.5'}`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
