import { useState } from 'react';
import { Clock, User, CheckCircle, Zap } from 'lucide-react';
import { availableSlots as initialSlots } from '../../data/mockData';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { Button, Card, CardHeader, CardTitle } from '../../components/ui';

function getDay(d) { return new Date(d).getDate(); }
function getMon(d) { return new Date(d).toLocaleString('default', { month: 'short' }); }
function getInitials(name) { return name.split(' ').map((n) => n[0]).join(''); }

export default function Slots() {
  const [slots, setSlots]               = useState(initialSlots);
  const [confirmModal, setConfirmModal] = useState(null);
  const [bookedIds, setBookedIds]       = useState([]);
  const [successMsg, setSuccessMsg]     = useState('');

  const handleBook = () => {
    setBookedIds((prev) => [...prev, confirmModal.id]);
    setSlots((prev) =>
      prev.map((s) => (s.id === confirmModal.id ? { ...s, available: false } : s))
    );
    const msg = `Slot booked! ${confirmModal.mentor.name} will confirm shortly.`;
    setConfirmModal(null);
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const availableList = slots.filter((s) => s.available);
  const bookedList    = slots.filter((s) => bookedIds.includes(s.id));

  return (
    <div className="page-content">
      {/* Success banner */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 px-[18px] py-3 rounded-[10px] mb-5 text-sm font-semibold flex items-center gap-2">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle><Clock size={18} color="#4f46e5" /> Available Slots</CardTitle>
          <span className="text-[13px] text-slate-500">
            {availableList.length} slot{availableList.length !== 1 ? 's' : ''} available from your mentor
          </span>
        </CardHeader>

        {/* Info banner */}
        <div className="bg-indigo-600/[0.05] border border-indigo-600/15 rounded-[10px] px-4 py-3 mb-5 text-[13px] text-indigo-600 flex items-center gap-2">
          <Zap size={15} />
          Your mentor has posted available slots. Select one to book a one-on-one session.
        </div>

        {/* Slots grid */}
        {availableList.length === 0 ? (
          <EmptyState icon={Clock} message="No slots available right now. Your mentor will post new slots soon." />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {availableList.map((slot) => (
              <div
                key={slot.id}
                className="relative border-[1.5px] border-slate-200 rounded-[12px] p-[18px] bg-white overflow-hidden transition-all hover:border-indigo-600 hover:shadow-[0_4px_12px_rgba(79,70,229,0.1)]"
              >
                {/* Top accent stripe */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-600 to-violet-500" />

                {/* Mentor */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-[34px] h-[34px] bg-gradient-to-br from-indigo-600 to-violet-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {getInitials(slot.mentor.name)}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-slate-900">{slot.mentor.name}</div>
                    <div className="text-[11px] text-slate-500">{slot.mentor.specialisation}</div>
                  </div>
                </div>

                {/* Date + time */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-500 rounded-lg flex flex-col items-center justify-center text-white flex-shrink-0">
                    <span className="text-[15px] font-bold leading-none">{getDay(slot.date)}</span>
                    <span className="text-[9px] uppercase opacity-[0.85]">{getMon(slot.date)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[13px] text-slate-900 font-semibold mb-1">
                      <Clock size={13} /> {slot.time}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock size={11} /> {slot.duration}
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1 px-2 py-[3px] rounded-md text-[11px] font-semibold mb-3.5 bg-indigo-600/[0.08] text-indigo-600">
                  <User size={11} /> {slot.type}
                </div>

                <div className="text-[13px] text-slate-500 mb-3.5">
                  <strong className="text-slate-900">Topic:</strong> {slot.topic}
                </div>

                <Button variant="primary" className="w-full justify-center" onClick={() => setConfirmModal(slot)}>
                  <CheckCircle size={14} /> Book This Slot
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Booked slots section */}
        {bookedList.length > 0 && (
          <div className="mt-8">
            <div className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <CheckCircle size={16} color="#10b981" /> Booked Slots
            </div>
            <div className="flex flex-col gap-3.5">
              {bookedList.map((s) => (
                <div
                  key={s.id}
                  className="bg-white border border-slate-200 rounded-[12px] px-5 py-[18px] flex items-center gap-4"
                >
                  <div className="w-[52px] h-[52px] bg-gradient-to-br from-indigo-600 to-violet-500 rounded-[12px] flex flex-col items-center justify-center text-white flex-shrink-0">
                    <span className="text-[18px] font-bold leading-none">{getDay(s.date)}</span>
                    <span className="text-[10px] uppercase opacity-[0.85]">{getMon(s.date)}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[15px] font-semibold text-slate-900 mb-1">{s.topic}</h4>
                    <p className="text-[13px] text-slate-500 flex items-center gap-2">
                      <Clock size={13} /> {s.time} · {s.duration} · {s.type}
                    </p>
                    <p className="mt-1 text-[13px] text-slate-500">
                      Mentor: <strong className="text-indigo-600">{s.mentor.name}</strong>
                    </p>
                  </div>
                  <span className="px-2.5 py-[3px] rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500">
                    Pending Confirmation
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Confirm booking modal */}
      {confirmModal && (
        <Modal
          title="Confirm Booking"
          onClose={() => setConfirmModal(null)}
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleBook}>
                <CheckCircle size={14} /> Confirm Booking
              </Button>
            </>
          }
        >
          <div className="bg-slate-50 rounded-[10px] p-4 mb-5">
            {/* Mentor */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-500 rounded-full flex items-center justify-center text-[13px] font-bold text-white">
                {getInitials(confirmModal.mentor.name)}
              </div>
              <div>
                <div className="font-bold text-[15px] text-slate-900">{confirmModal.mentor.name}</div>
                <div className="text-xs text-slate-500">{confirmModal.mentor.specialisation}</div>
              </div>
            </div>

            {/* Details */}
            {[
              { label: 'Date',     value: confirmModal.date },
              { label: 'Time',     value: confirmModal.time },
              { label: 'Duration', value: confirmModal.duration },
              { label: 'Type',     value: confirmModal.type },
              { label: 'Topic',    value: confirmModal.topic },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-slate-100 last:border-b-0 text-[13px]">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-slate-500">
            By booking this slot, you confirm your availability. Your mentor will be notified.
          </p>
        </Modal>
      )}
    </div>
  );
}
