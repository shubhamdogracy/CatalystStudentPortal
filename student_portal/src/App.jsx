import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';

import { useAuth }           from './context/AuthContext';
import ProtectedRoute        from './routes/ProtectedRoute';
import PublicOnlyRoute       from './routes/PublicOnlyRoute';
import GuestBlockedRoute     from './routes/GuestBlockedRoute';

import SignIn        from './components/auth/SignIn';
import Layout        from './components/layout/Layout';
import Dashboard     from './pages/Dashboard/Dashboard';
import SATTests      from './pages/SATTests/SATTests';
import Communication from './pages/Communication/Communication';
import Profile       from './pages/Profile/Profile';
import NotFound      from './pages/NotFound/NotFound';
import InsightsPage  from './pages/Insights/InsightsPage';

export default function App() {
  const { student, loading, isGuest, login, logout, updateStudent } = useAuth();
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    setChatUnreadCount(0);
  };

  const satProps = (tab) => ({
    student,
    defaultTab: tab,
    onTestStart: () => setSidebarCollapsed(true),
    onTestEnd:   () => setSidebarCollapsed(false),
  });

  return (
    <Routes>
      {/* Public only — redirect to /dashboard if already authenticated */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/" element={<SignIn onLogin={login} />} />
      </Route>

      {/* Protected — requires authentication */}
      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <Layout
              onLogout={handleLogout}
              student={student}
              chatUnreadCount={chatUnreadCount}
              isGuest={isGuest}
              collapsed={sidebarCollapsed}
              onToggleCollapsed={() => setSidebarCollapsed(c => !c)}
            />
          }
        >
          <Route path="/dashboard"     element={<Dashboard student={student} />} />
          <Route path="/sat/diagnostic"          element={<SATTests {...satProps('diagnostic')} />} />
          <Route path="/sat/practice"            element={<SATTests {...satProps('practice')} />} />
          <Route path="/sat/practice/insights"   element={<InsightsPage />} />
          <Route path="/sat/mock"                element={<SATTests {...satProps('mock')} />} />
          <Route path="/profile"        element={<Profile student={student} onUpdateStudent={updateStudent} />} />

          {/* Guest-blocked routes */}
          <Route element={<GuestBlockedRoute />}>
            <Route
              path="/communication"
              element={<Communication student={student} onUnreadChange={setChatUnreadCount} />}
            />
          </Route>
        </Route>
      </Route>

      {/* 404 — catches everything else */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
