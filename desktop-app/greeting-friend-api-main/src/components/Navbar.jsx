import { Link, useLocation } from "react-router-dom";

export default function Navbar({ onToggleSidebar }) {
  const { pathname } = useLocation();

  return (
    <header className="h-14 border-b border-[#243044]  bg-[#1a2536]/90backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl h-full mx-auto px-3 md:px-6 flex items-center justify-between">
        {/* Left: burger + logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="inline-flex md:hidden items-center justify-center w-9 h-9 rounded-lg border border-[#243044]  hover:bg-[#141c27] "
            aria-label="Apri menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {/* Logo SVG Rescue Manager */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" className="h-8 w-auto">
              <path d="M60 20 C45 20, 30 35, 30 50 C30 65, 45 80, 60 80 C75 80, 90 65, 90 50 C90 35, 75 20, 60 20Z M60 35 A15 15 0 1 1 59.9 35Z" fill="#2563EB"/>
              <text x="110" y="45" fontSize="32" fontFamily="Inter, sans-serif" fill="#2563EB" fontWeight="600">
                Rescue
              </text>
              <text x="110" y="80" fontSize="32" fontFamily="Inter, sans-serif" fill="#1F2937" fontWeight="600">
                Manager
              </text>
            </svg>
          </Link>
        </div>

        {/* Right: stato pagina (facoltativo) */}
        <div className="text-xs md:text-sm text-slate-500 ">
          {pathname.replace("/", "") || "dashboard"}
        </div>
      </div>
    </header>
  );
}