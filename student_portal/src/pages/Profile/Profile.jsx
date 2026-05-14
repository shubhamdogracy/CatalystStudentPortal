import { useState } from 'react';
import {
  User, Mail, Phone, BookOpen,
  Calendar, Star, CheckCircle, Edit2, Save, X,
} from 'lucide-react';
import { authService } from '../../services/api';
import { Button, Card, CardHeader, CardTitle } from '../../components/ui';

export default function Profile({ student, onUpdateStudent }) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(student?.name || '');
  const [saved, setSaved]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const initials   = name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const progress   = student?.progress ?? 0;
  const allMentors = student?.mentors || [];
  const course     = allMentors.length > 0
    ? allMentors.map(m => m.batch?.subject || '').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' · ')
    : '—';
  const batchName  = allMentors.length === 1
    ? (allMentors[0].batch?.name || '—')
    : allMentors.length > 1
    ? `${allMentors.length} batches`
    : '—';

  const enrollDate = student?.enrollmentDate
    ? new Date(student.enrollmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await authService.updateName(name);
      onUpdateStudent?.(res.data);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(student?.name || '');
    setEditing(false);
    setError('');
  };

  return (
    <div className="page-content">
      {saved && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 px-[18px] py-3 rounded-[10px] mb-5 text-sm font-semibold flex items-center gap-2">
          <CheckCircle size={16} /> Profile updated successfully!
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-[18px] py-3 rounded-[10px] mb-5 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-5">
        {/* ── Left column ── */}
        <div>
          <div className="bg-white rounded-[14px] border border-slate-200 px-6 py-7 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-500 rounded-full flex items-center justify-center text-[28px] font-bold text-white mx-auto mb-4">
              {initials}
            </div>
            <div className="text-xl font-bold text-slate-900 mb-1">{name}</div>
            <div className="text-[13px] text-slate-500 mb-5">Student · {course}</div>
            <span className="inline-flex items-center gap-1.5 bg-indigo-600/[0.08] text-indigo-600 px-2.5 py-1 rounded-full text-xs font-semibold mb-5">
              <Star size={11} /> {batchName}
            </span>

            <div>
              {[
                { icon: Mail,     label: 'Email',    value: student?.email || '—' },
                { icon: Phone,    label: 'Phone',    value: student?.phone || '—' },
                { icon: BookOpen, label: 'Course',   value: course },
                { icon: Calendar, label: 'Enrolled', value: enrollDate },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2.5 py-2.5 border-b border-slate-100 last:border-b-0 text-[13px] text-slate-500 text-left">
                  <Icon size={15} color="#94a3b8" className="flex-shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.5px] text-slate-400 mb-0.5">{label}</div>
                    <strong className="text-slate-900 text-[13px]">{value}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-[13px] mb-1.5">
                <span className="text-slate-500">Course Progress</span>
                <span className="font-bold text-indigo-600">{progress}%</span>
              </div>
              <div className="bg-slate-200 rounded-[10px] h-1.5">
                <div
                  className="h-full rounded-[10px] bg-gradient-to-r from-indigo-600 to-violet-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-5">
          {/* Personal info */}
          <Card>
            <CardHeader>
              <CardTitle><User size={18} color="#4f46e5" /> Personal Information</CardTitle>
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit2 size={13} /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                    <X size={13} /> Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                    <Save size={13} /> {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-[10px] p-4">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.5px] mb-1.5">Full Name</div>
                {editing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border-[1.5px] border-indigo-600 rounded-md text-sm outline-none text-slate-900"
                  />
                ) : (
                  <div className="text-sm font-semibold text-slate-900">{name}</div>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-[10px] p-4">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.5px] mb-1.5">Email Address</div>
                <div className="text-sm font-semibold text-slate-900">{student?.email || '—'}</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-[10px] p-4">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.5px] mb-1.5">Phone Number</div>
                <div className="text-sm font-semibold text-slate-900">{student?.phone || '—'}</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-[10px] p-4">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.5px] mb-1.5">Batch</div>
                <div className="text-sm font-semibold text-slate-900">{batchName}</div>
              </div>
            </div>
          </Card>

          {/* Enrollment details */}
          <Card>
            <CardHeader>
              <CardTitle><BookOpen size={18} color="#4f46e5" /> Enrollment Details</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {[
                { label: 'Enrollment Date',    value: enrollDate },
                { label: 'Total Sessions',     value: String(student?.totalSessions ?? '—') },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white border border-slate-200 rounded-[10px] p-4">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.5px] mb-1.5">{label}</div>
                  <div className="text-sm font-semibold text-slate-900">{value}</div>
                </div>
              ))}
            </div>
            {allMentors.length > 0 && (
              <div className="flex flex-col gap-3">
                {allMentors.map(({ batch }, idx) => batch && (
                  <div key={batch._id || idx} className="bg-slate-50 border border-slate-200 rounded-[10px] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-[0.5px] capitalize">{batch.subject}</span>
                      <span className="text-slate-300">·</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${batch.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{batch.status}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{batch.name}</div>
                    <div className="text-[12px] text-slate-500 mt-0.5">
                      {batch.completedSessions ?? 0} / {batch.totalSessions ?? 0} sessions
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Mentor details */}
          <Card>
            <CardHeader>
              <CardTitle><Star size={18} color="#4f46e5" /> My Mentors</CardTitle>
            </CardHeader>
            {allMentors.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">No mentor assigned yet.</p>
            ) : (
              <div className="flex flex-col gap-5">
                {allMentors.map(({ mentor, batch }, idx) => (
                  <div key={mentor?._id || idx}>
                    {allMentors.length > 1 && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-[0.5px] bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full capitalize">
                          {batch?.subject || 'Batch'} · {batch?.name || '—'}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-500 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                        {mentor?.name?.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-base text-slate-900 mb-0.5">{mentor?.name}</div>
                        <div className="text-[13px] text-slate-500">{mentor?.specialization || mentor?.specialisation || '—'}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: 'Specialisation', value: mentor?.specialization || mentor?.specialisation || '—' },
                        { label: 'Experience',     value: mentor?.experience ? `${mentor.experience} yrs` : '—' },
                        { label: 'Email',          value: mentor?.email || '—' },
                        { label: 'Phone',          value: mentor?.phone || '—' },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-white border border-slate-200 rounded-[10px] p-4">
                          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.5px] mb-1.5">{label}</div>
                          <div className="text-[13px] font-semibold text-slate-900">{value}</div>
                        </div>
                      ))}
                    </div>
                    {idx < allMentors.length - 1 && <div className="border-t border-slate-100 mt-5" />}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
