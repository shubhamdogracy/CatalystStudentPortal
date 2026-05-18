import { useEffect } from 'react';
import confetti from 'canvas-confetti';

function fireConfetti() {
  confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#f97316', '#fbbf24', '#ef4444', '#a855f7', '#3b82f6'] });
}

export default function StreakCard({ streak }) {
  const current = streak?.current ?? 0;

  // Fires when we navigate to dashboard after a streak-incrementing submission.
  // PracticeTaker stores the new streak value in sessionStorage; we fire confetti
  // only when `current` matches that stored value (ensuring fresh data has loaded).
  useEffect(() => {
    if (current <= 0) return;
    const stored = sessionStorage.getItem('streakCelebrate');
    if (stored && parseInt(stored, 10) === current) {
      sessionStorage.removeItem('streakCelebrate');
      setTimeout(fireConfetti, 400);
    }
  }, [current]);


  // return (
  //   <div
  //     className="relative rounded-[18px] p-5 overflow-hidden"
  //     style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid #fed7aa' }}
  //   >
  //     <div className="pointer-events-none absolute -right-3 -bottom-3 w-20 h-20 rounded-full opacity-20" style={{ background: flameColor }} />
  //
  //     <div className="flex items-center justify-between relative z-10">
  //       <div>
  //         <div className="flex items-center gap-1.5 mb-1">
  //           <span style={{ fontSize: '15px' }}>🔥</span>
  //           <span className="text-[11px] font-extrabold text-orange-500 uppercase tracking-wider">Study Streak</span>
  //         </div>
  //         <div className="flex items-end gap-1.5">
  //           <span className="font-black leading-none" style={{ fontSize: '2.8rem', color: '#9a3412' }}>{current}</span>
  //           <span className="text-[13px] font-semibold text-orange-600 mb-2">days in a row</span>
  //         </div>
  //         {longest > 0 && (
  //           <p className="text-[11px] text-orange-500 font-semibold mt-0.5">Best: {longest} days</p>
  //         )}
  //         {current === 0 && (
  //           <p className="text-[11px] text-orange-400 font-medium mt-0.5">Complete a test to start your streak!</p>
  //         )}
  //       </div>
  //       <div className="text-5xl opacity-80 relative z-10">🏆</div>
  //     </div>
  //   </div>
  // );
}
