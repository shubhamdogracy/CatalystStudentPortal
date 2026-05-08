import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Phone, User, GraduationCap } from 'lucide-react';
import { authService } from '../../services/api';
import catalystLogo from '../../assets/catalyst-logo.png';

const GRADES = ['6th', '7th', '8th', '9th', '10th', '11th', '12th', 'College Freshman', 'College Sophomore', 'College Junior', 'College Senior'];
const TARGET_YEARS = ['2025', '2026', '2027', '2028', '2029'];

function InputField({ icon: Icon, type = 'text', placeholder, value, onChange, required, rightElement }) {
  return (
    <div className="relative">
      <Icon size={16} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full pl-11 pr-4 py-3 border-[1.5px] border-slate-200 rounded-[10px] text-[15px] text-slate-900 outline-none bg-slate-50 transition-all focus:border-indigo-500 focus:bg-white focus:ring-[3px] focus:ring-indigo-600/10"
      />
      {rightElement}
    </div>
  );
}

function SignInForm({ onLogin }) {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login(form.email, form.password);
      onLogin(res.data);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-[14px] py-[10px] rounded-lg text-[13px] mb-4">
          {error}
        </div>
      )}
      <div className="mb-5">
        <label className="block text-[13px] font-semibold text-[#374151] mb-1.5 uppercase tracking-[0.5px]">Email Address</label>
        <InputField
          icon={Mail}
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>
      <div className="mb-5">
        <label className="block text-[13px] font-semibold text-[#374151] mb-1.5 uppercase tracking-[0.5px]">Password</label>
        <div className="relative">
          <Lock size={16} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="w-full pl-11 pr-11 py-3 border-[1.5px] border-slate-200 rounded-[10px] text-[15px] text-slate-900 outline-none bg-slate-50 transition-all focus:border-indigo-500 focus:bg-white focus:ring-[3px] focus:ring-indigo-600/10"
          />
          <button type="button" onClick={() => setShowPw((p) => !p)}
            className="absolute right-[14px] top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-[13px] bg-gradient-to-br from-indigo-600 to-violet-500 text-white border-none rounded-[10px] text-[15px] font-semibold mt-2 cursor-pointer transition-all hover:opacity-[0.92] hover:-translate-y-px active:translate-y-0 disabled:opacity-70">
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}

function GuestSignupForm({ onLogin }) {
  const [form, setForm]       = useState({ name: '', email: '', phone: '', password: '', grade: '', targetYear: '', city: '', parentName: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = await authService.guestSignup(form);
      onLogin(res.data);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-[14px] py-[10px] rounded-lg text-[13px]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-1 uppercase tracking-[0.5px]">Full Name *</label>
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="John Doe" value={form.name} onChange={set('name')} required
              className="w-full pl-9 pr-3 py-2.5 border-[1.5px] border-slate-200 rounded-[10px] text-[14px] text-slate-900 outline-none bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-[3px] focus:ring-indigo-600/10 transition-all" />
          </div>
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-1 uppercase tracking-[0.5px]">Phone *</label>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={set('phone')} required
              className="w-full pl-9 pr-3 py-2.5 border-[1.5px] border-slate-200 rounded-[10px] text-[14px] text-slate-900 outline-none bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-[3px] focus:ring-indigo-600/10 transition-all" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[12px] font-semibold text-slate-500 mb-1 uppercase tracking-[0.5px]">Email Address *</label>
        <div className="relative">
          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required
            className="w-full pl-9 pr-3 py-2.5 border-[1.5px] border-slate-200 rounded-[10px] text-[14px] text-slate-900 outline-none bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-[3px] focus:ring-indigo-600/10 transition-all" />
        </div>
      </div>

      <div>
        <label className="block text-[12px] font-semibold text-slate-500 mb-1 uppercase tracking-[0.5px]">Password *</label>
        <div className="relative">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required
            className="w-full pl-9 pr-10 py-2.5 border-[1.5px] border-slate-200 rounded-[10px] text-[14px] text-slate-900 outline-none bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-[3px] focus:ring-indigo-600/10 transition-all" />
          <button type="button" onClick={() => setShowPw((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-1 uppercase tracking-[0.5px]">Current Grade *</label>
          <div className="relative">
            <GraduationCap size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select value={form.grade} onChange={set('grade')} required
              className="w-full pl-9 pr-3 py-2.5 border-[1.5px] border-slate-200 rounded-[10px] text-[14px] text-slate-900 outline-none bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-[3px] focus:ring-indigo-600/10 transition-all appearance-none">
              <option value="">Select grade</option>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-1 uppercase tracking-[0.5px]">SAT Target Year</label>
          <select value={form.targetYear} onChange={set('targetYear')}
            className="w-full px-3 py-2.5 border-[1.5px] border-slate-200 rounded-[10px] text-[14px] text-slate-900 outline-none bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-[3px] focus:ring-indigo-600/10 transition-all appearance-none">
            <option value="">Select year</option>
            {TARGET_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-1 uppercase tracking-[0.5px]">City</label>
          <input type="text" placeholder="New York" value={form.city} onChange={set('city')}
            className="w-full px-3 py-2.5 border-[1.5px] border-slate-200 rounded-[10px] text-[14px] text-slate-900 outline-none bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-[3px] focus:ring-indigo-600/10 transition-all" />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-1 uppercase tracking-[0.5px]">Parent Name</label>
          <input type="text" placeholder="Parent / Guardian" value={form.parentName} onChange={set('parentName')}
            className="w-full px-3 py-2.5 border-[1.5px] border-slate-200 rounded-[10px] text-[14px] text-slate-900 outline-none bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-[3px] focus:ring-indigo-600/10 transition-all" />
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-[13px] bg-gradient-to-br from-indigo-600 to-violet-500 text-white border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all hover:opacity-[0.92] hover:-translate-y-px active:translate-y-0 disabled:opacity-70">
        {loading ? 'Creating account…' : 'Start Free Exploration'}
      </button>

      <p className="text-center text-[11px] text-slate-400 leading-relaxed">
        Free guest access includes 1 diagnostic test to see where you stand.
        Our team will reach out to help you unlock the full platform.
      </p>
    </form>
  );
}

export default function SignIn({ onLogin }) {
  const [tab, setTab] = useState('signin');

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0f172a]">
      {/* Left Panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-[60px] text-white">
        <div className="flex items-center mb-6">
          <img src={catalystLogo} alt="Catalyst" className="h-11 w-auto object-contain" />
        </div>
        <div className="mb-6">
          <h2 className="text-[42px] font-bold leading-tight mb-4 text-white">Learn. Grow. Succeed.</h2>
          <p className="text-base text-slate-400 leading-relaxed max-w-[400px]">
            Your personalized learning portal to track progress, connect with mentors, and achieve your goals.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {[
            'Track your assignments and sessions in real-time',
            'Book one-on-one slots with your mentor',
            'Chat directly with your mentor anytime',
            'Monitor your course progress effortlessly',
          ].map((feat) => (
            <div className="flex items-center gap-3 text-[#cbd5e1] text-[15px]" key={feat}>
              <span className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0" />
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-[520px] bg-white flex flex-col justify-center px-12 py-[40px] overflow-y-auto">
        {/* Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-7">
          <button
            onClick={() => setTab('signin')}
            className={`flex-1 py-2 rounded-lg text-[14px] font-semibold transition-all ${tab === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 py-2 rounded-lg text-[14px] font-semibold transition-all ${tab === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Free Exploration
          </button>
        </div>

        {tab === 'signin' ? (
          <>
            <div className="mb-7">
              <h2 className="text-[26px] font-bold text-slate-900 mb-1">Welcome back</h2>
              <p className="text-sm text-slate-500">Sign in to your student portal to continue learning</p>
            </div>
            <SignInForm onLogin={onLogin} />
            <div className="mt-6 text-center text-[13px] text-slate-400">
              <p className="mb-1.5">Demo: <strong>arjun.mehta@example.com</strong> / <strong>student123</strong></p>
              <p>Having trouble? Contact your operations team.</p>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-[26px] font-bold text-slate-900 mb-1">Explore for free</h2>
              <p className="text-sm text-slate-500">Sign up for guest access and take a diagnostic test to see where you stand.</p>
            </div>
            <GuestSignupForm onLogin={onLogin} />
            <p className="mt-4 text-center text-[13px] text-slate-400">
              Already have an account?{' '}
              <button onClick={() => setTab('signin')} className="text-indigo-600 font-semibold hover:underline">Sign In</button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
