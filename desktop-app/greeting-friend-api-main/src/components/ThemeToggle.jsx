// src/components/ThemeToggle.jsx
import { useEffect, useState } from "react";
import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { getThemeMode, setThemeMode } from "../hooks/useTheme";

export default function ThemeToggle({ compact }) {
  const [mode, setModeLocal] = useState(getThemeMode());

  // sincronizza con useTheme
  useEffect(() => {
    const onCustom = (e) => setModeLocal(e.detail?.mode ?? getThemeMode());
    const onStorage = (e) => {
      if (e.key === "rm-theme") setModeLocal(getThemeMode());
    };
    window.addEventListener("rm-theme-change", onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("rm-theme-change", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const handleSetMode = (value) => {
    setThemeMode(value);
    setModeLocal(value);
  };

  const Btn = ({ value, title, Icon }) => (
    <button
      onClick={() => handleSetMode(value)}
      title={title}
      className={`h-9 w-9 grid place-items-center rounded-lg border transition
        ${mode === value
          ? "border-indigo-500 text-indigo-600"
          : "border-[#243044]  hover:bg-[#141c27] "
        }`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );

  return (
    <div className={`flex items-center gap-2 ${compact ? "text-xs" : ""}`}>
      <Btn value="light"   title="Tema chiaro" Icon={SunIcon} />
      <Btn value="dark"    title="Tema scuro"  Icon={MoonIcon} />
      <Btn value="system"  title="Segui sistema" Icon={ComputerDesktopIcon} />
    </div>
  );
}