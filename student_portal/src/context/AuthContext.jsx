import { createContext, useContext, useState, useEffect } from 'react';
import { authService, studentService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const login = async (data) => {
    try {
      const mentorRes = await studentService.getMentor(data._id);
      const mentors = mentorRes.data || [];
      setStudent({ ...data, mentors, mentor: mentors[0]?.mentor || null, batchInfo: mentors[0]?.batch || null });
    } catch {
      setStudent({ ...data, mentors: [] });
    }
  };

  const logout = async () => {
    await authService.logout();
    setStudent(null);
  };

  const updateStudent = (updated) =>
    setStudent(s => ({ ...s, ...updated, mentors: s.mentors, mentor: s.mentor, batchInfo: s.batchInfo }));

  const isGuest = student?.role === 'guest' || student?.accountType === 'guest';

  return (
    <AuthContext.Provider value={{ student, loading, isGuest, login, logout, updateStudent }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
