import { useState, useEffect } from 'react';
import { authService, studentService } from './services/api';

import SignIn        from './components/auth/SignIn';
import Layout        from './components/layout/Layout';
import Dashboard     from './pages/Dashboard/Dashboard';
import Communication from './pages/Communication/Communication';
import Profile       from './pages/Profile/Profile';
import SATTests      from './pages/SATTests/SATTests';

export default function App() {
  const [student, setStudent]                 = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [page, setPage]                       = useState('dashboard');
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // On mount: validate cookie with server — restores session after refresh
  useEffect(() => {
    authService.me()
      .then(async (res) => {
        const base = res.data;
        try {
          const mentorRes = await studentService.getMentor(base._id);
          const mentors = mentorRes.data || [];
          setStudent({ ...base, mentors, mentor: mentors[0]?.mentor || null, batchInfo: mentors[0]?.batch || null });
        } catch {
          setStudent({ ...base, mentors: [] });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  const handleLogin = async (data) => {
    try {
      const mentorRes = await studentService.getMentor(data._id);
      const mentors = mentorRes.data || [];
      setStudent({ ...data, mentors, mentor: mentors[0]?.mentor || null, batchInfo: mentors[0]?.batch || null });
    } catch {
      setStudent({ ...data, mentors: [] });
    }
  };

  if (!student) {
    return <SignIn onLogin={handleLogin} />;
  }

  const handleLogout = async () => {
    await authService.logout();
    setStudent(null);
    setPage('dashboard');
    setChatUnreadCount(0);
  };

  const isGuest = student?.role === 'guest' || student?.accountType === 'guest';

  // Redirect guests away from paid-only pages; SAT test pages are accessible to guests.
  const GUEST_ALLOWED = ['dashboard', 'profile', 'satDiagnostic', 'satPractice', 'satMock'];
  const safePage = isGuest && !GUEST_ALLOWED.includes(page) ? 'dashboard' : page;

  // Shared props for every SATTests instance (collapses sidebar during a test).
  const satTestProps = {
    student,
    onTestStart: () => setSidebarCollapsed(true),
    onTestEnd:   () => setSidebarCollapsed(false),
  };

  const renderPage = () => {
    switch (safePage) {
      case 'dashboard':
        return <Dashboard student={student} onNavigate={setPage} />;

      // ── SAT Tests sub-pages (each pre-selects its tab via defaultTab) ──
      case 'satDiagnostic':
        return <SATTests {...satTestProps} defaultTab="diagnostic" />;
      case 'satMock':
        return <SATTests {...satTestProps} defaultTab="mock" />;
      case 'satPractice':
        return <SATTests {...satTestProps} defaultTab="practice" />;

      // ── Communication ──
      case 'communication':
        return <Communication student={student} onUnreadChange={setChatUnreadCount} />;

      // ── Account ──
      case 'profile':
        return (
          <Profile
            student={student}
            onUpdateStudent={(updated) =>
              setStudent(s => ({ ...s, ...updated, mentors: s.mentors, mentor: s.mentor, batchInfo: s.batchInfo }))
            }
          />
        );

      default:
        return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <Layout page={safePage} onNavigate={setPage} onLogout={handleLogout} student={student} chatUnreadCount={chatUnreadCount} isGuest={isGuest} collapsed={sidebarCollapsed} onToggleCollapsed={() => setSidebarCollapsed(c => !c)}>
      {renderPage()}
    </Layout>
  );
}
