import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, Star, CheckCircle } from 'lucide-react';
import { sessions as initialSessions } from '../../data/mockData';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { Button, Card, CardHeader, CardTitle } from '../../components/ui';

function getDay(d) { return new Date(d).getDate(); }
function getMon(d) { return new Date(d).toLocaleString('default', { month: 'short' }); }

export default function Sessions() {
  const navigate = useNavigate();
  const [tab, setTab]                     = useState('upcoming');
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [sessions]                        = useState(initialSessions);
  const [feedbackText, setFeedbackText]   = useState('');
  const [rating, setRating]               = useState(5);

  const list = sessions.filter((s) => s.status === tab);

  return (
    <div className="page-content">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <StatCard icon={Calendar}    count={sessions.length}                                      label="Total Sessions" colorClass="indigo" />
        <StatCard icon={Clock}       count={sessions.filter(s => s.status === 'upcoming').length}  label="Upcoming"      colorClass="purple" />
        <StatCard icon={CheckCircle} count={sessions.filter(s => s.status === 'completed').length} label="Completed"     colorClass="green"  />
      </div>

      <Card>
        <CardHeader>
          <CardTitle><Calendar size={18} color="#4f46e5" /> My Sessions</CardTitle>
          <Button variant="primary" size="sm" onClick={() => navigate('/slots')}>
            <Clock size={13} /> Book New Slot
          </Button>
        </CardHeader>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-[10px] mb-6 w-fit">
          {['upcoming', 'completed'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-[13px] font-semibold border-none cursor-pointer transition-all
                ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'bg-transparent text-slate-500'}`}
            >
              {t === 'upcoming' ? 'Upcoming' : 'Past Sessions'} ({sessions.filter(s => s.status === t).length})
            </button>
          ))}
        </div>

        {/* Session list */}
        <div className="flex flex-col gap-3.5">
          {list.length === 0 ? (
            <EmptyState
              icon={Calendar}
              message={tab === 'upcoming' ? 'No upcoming sessions. Book a slot with your mentor!' : 'No past sessions yet.'}
              action={
                tab === 'upcoming' && (
                  <Button variant="primary" size="sm" onClick={() => navigate('/slots')}>
                    Book a Slot
                  </Button>
                )
              }
            />
          ) : (
            list.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-slate-200 rounded-[12px] px-5 py-[18px] flex items-center gap-4 transition-all hover:border-indigo-200"
              >
                {/* Date box */}
                <div className="w-[52px] h-[52px] bg-gradient-to-br from-indigo-600 to-violet-500 rounded-[12px] flex flex-col items-center justify-center text-white flex-shrink-0">
                  <span className="text-[18px] font-bold leading-none">{getDay(s.date)}</span>
                  <span className="text-[10px] uppercase opacity-[0.85]">{getMon(s.date)}</span>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h4 className="text-[15px] font-semibold text-slate-900 mb-1">{s.title}</h4>
                  <p className="text-[13px] text-slate-500 flex items-center gap-2">
                    <Clock size={13} /> {s.time}&nbsp;·&nbsp;{s.duration}&nbsp;·&nbsp;{s.type}
                  </p>
                  <p className="mt-1 text-[13px] text-slate-500">
                    Mentor: <strong className="text-indigo-600">{s.mentor}</strong>
                  </p>
                  {s.notes && (
                    <p className="mt-1 text-xs text-slate-400 italic">{s.notes}</p>
                  )}
                  {s.feedback && (
                    <div className="mt-2 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-emerald-600">
                      <strong>Mentor feedback:</strong> {s.feedback}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-[3px] rounded-full text-[11px] font-semibold ${tab === 'upcoming' ? 'bg-indigo-600/10 text-indigo-600' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {tab === 'upcoming' ? 'Upcoming' : 'Completed'}
                  </span>
                  {tab === 'upcoming' && s.meetLink && (
                    <a href={s.meetLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                      <Video size={13} /> Join
                    </a>
                  )}
                  {tab === 'completed' && (
                    <Button variant="outline" size="sm" onClick={() => setFeedbackModal(s)}>
                      <Star size={13} /> Rate Session
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Feedback modal */}
      {feedbackModal && (
        <Modal
          title="Rate Your Session"
          onClose={() => setFeedbackModal(null)}
          footer={
            <>
              <Button variant="outline" onClick={() => setFeedbackModal(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => setFeedbackModal(null)}>
                <Star size={14} /> Submit Rating
              </Button>
            </>
          }
        >
          <div className="mb-5">
            <div className="font-bold text-slate-900 text-[15px] mb-1">{feedbackModal.title}</div>
            <div className="text-[13px] text-slate-500">
              {feedbackModal.date} · {feedbackModal.time} · {feedbackModal.mentor}
            </div>
          </div>

          <div className="mb-5">
            <div className="text-[13px] font-semibold text-slate-500 uppercase tracking-[0.5px] mb-2.5">
              Your Rating
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => setRating(r)}
                  className="bg-none border-none cursor-pointer p-0"
                >
                  <Star size={28} fill={r <= rating ? '#f59e0b' : 'none'} color={r <= rating ? '#f59e0b' : '#d1d5db'} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-[0.5px]">
              Your Feedback
            </label>
            <textarea
              rows={3}
              placeholder="Share your thoughts about this session..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-lg text-sm text-slate-900 outline-none transition-all resize-y min-h-[80px] focus:border-indigo-600"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
