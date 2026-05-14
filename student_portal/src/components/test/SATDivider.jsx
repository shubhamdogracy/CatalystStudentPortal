const SEGMENTS = ['#2A2A2A', '#80AF81', '#22d3ee', '#fbbf24', '#2A2A2A', '#80AF81', '#22d3ee', '#fbbf24', '#2A2A2A'];

export default function SATDivider() {
  return (
    <div className="flex h-[3px]">
      {SEGMENTS.map((color, i) => (
        <div key={i} className="flex-1 border-t-2 border-dashed" style={{ borderColor: color }} />
      ))}
    </div>
  );
}
