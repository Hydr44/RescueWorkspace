// Segnaposto della mappa: nell'app qui va Leaflet o Mapbox (TransportMap.jsx). Disegna strade, un percorso e i mezzi.
export default function FakeMap({ route = true, markers = [], height = '100%', label }) {
  return (
    <div style={{ position: 'relative', height, background: '#0d1520', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
        <defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#141c27" strokeWidth="1" /></pattern></defs>
        <rect width="800" height="520" fill="url(#g)" />
        <g stroke="#243044" strokeWidth="6" fill="none" strokeLinecap="round">
          <path d="M0 300 C 120 280, 200 340, 320 300 S 520 220, 640 260 S 760 300, 800 280" />
          <path d="M120 0 C 140 120, 100 220, 180 320 S 260 460, 240 520" />
          <path d="M480 0 C 470 100, 520 180, 500 260 S 440 420, 470 520" />
          <path d="M0 140 L 800 120" strokeWidth="3" />
          <path d="M0 430 L 800 410" strokeWidth="3" />
          <path d="M650 0 L 690 520" strokeWidth="3" />
        </g>
        <g fill="#1a2536" stroke="#243044"><rect x="30" y="170" width="70" height="40" /><rect x="220" y="150" width="40" height="30" /><rect x="360" y="330" width="60" height="50" /><rect x="560" y="140" width="50" height="60" /><rect x="700" y="330" width="60" height="40" /></g>
        {route && <path d="M160 320 C 260 330, 330 290, 420 280 S 560 250, 640 258" fill="none" stroke="#005dfa" strokeWidth="4" strokeLinecap="round" />}
        {markers.map((m, i) => (
          <g key={i} transform={`translate(${m.x} ${m.y})`}>
            <rect x="-7" y="-7" width="14" height="14" fill={m.late ? '#e5484d' : m.dim ? '#3b4d6b' : '#005dfa'} stroke="#fff" strokeWidth="2" />
            {m.t && <text x="12" y="4" fontSize="12" fontFamily="Inter" fontWeight="600" fill="#e2e8f0">{m.t}</text>}
          </g>
        ))}
      </svg>
      {label && <div style={{ position: 'absolute', left: 12, bottom: 10, fontSize: 11, color: 'var(--text-secondary)' }}>{label}</div>}
    </div>
  );
}
