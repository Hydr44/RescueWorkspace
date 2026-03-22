// src/components/NotificationDropdown.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell, FiX, FiCheck, FiCheckCircle, FiAlertTriangle,
  FiAlertCircle, FiInfo, FiTruck, FiFileText, FiUser,
  FiMapPin, FiShield, FiChevronRight, FiRefreshCw
} from "react-icons/fi";
import { useNotifications } from "@/hooks/useNotifications";

const iconMap = {
  truck: FiTruck,
  file: FiFileText,
  user: FiUser,
  mappin: FiMapPin,
  shield: FiShield,
  alert: FiAlertTriangle,
  bell: FiBell,
};

const levelConfig = {
  error: {
    border: "border-l-red-500",
    icon: FiAlertCircle,
    iconColor: "text-red-400",
    bg: "bg-red-500/5",
    badge: "bg-red-500/15 text-red-400",
  },
  warn: {
    border: "border-l-amber-500",
    icon: FiAlertTriangle,
    iconColor: "text-amber-400",
    bg: "bg-amber-500/5",
    badge: "bg-amber-500/15 text-amber-400",
  },
  info: {
    border: "border-l-blue-500",
    icon: FiInfo,
    iconColor: "text-blue-400",
    bg: "bg-blue-500/5",
    badge: "bg-blue-500/15 text-blue-400",
  },
  success: {
    border: "border-l-emerald-500",
    icon: FiCheckCircle,
    iconColor: "text-emerald-400",
    bg: "bg-emerald-500/5",
    badge: "bg-emerald-500/15 text-emerald-400",
  },
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    refresh,
  } = useNotifications();

  // Click outside per chiudere
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Escape per chiudere
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleNotificationClick = useCallback((notif) => {
    markAsRead(notif.id);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
      setIsOpen(false);
    }
  }, [markAsRead, navigate]);

  const handleDismiss = useCallback((e, id) => {
    e.stopPropagation();
    dismiss(id);
  }, [dismiss]);

  const handleMarkRead = useCallback((e, id) => {
    e.stopPropagation();
    markAsRead(id);
  }, [markAsRead]);

  return (
    <div className="relative">
      {/* Bottone campanella */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition"
        title="Notifiche"
      >
        <FiBell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center ring-2 ring-[#1a2536]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown mini-finestra */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] bg-[#1a2536] rounded-xl shadow-2xl shadow-black/40 border border-[#243044] z-50 flex flex-col overflow-hidden"
          style={{ animation: "notifSlideIn 0.15s ease-out" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#243044] flex-shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-200">Notifiche</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
                  {unreadCount} nuov{unreadCount === 1 ? "a" : "e"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-blue-400 hover:text-blue-300 px-2 py-1 rounded-md hover:bg-white/5 transition"
                  title="Segna tutte come lette"
                >
                  <FiCheck className="w-3.5 h-3.5 inline mr-1" />
                  Tutte lette
                </button>
              )}
              <button
                onClick={refresh}
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-md transition"
                title="Aggiorna"
              >
                <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-md transition"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Lista notifiche */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <FiBell className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">Nessuna notifica</p>
              </div>
            ) : (
              <div className="py-1">
                {notifications.map((notif) => {
                  const config = levelConfig[notif.level] || levelConfig.info;
                  const IconComp = iconMap[notif.icon] || config.icon;

                  return (
                    <div
                      key={notif.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleNotificationClick(notif)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleNotificationClick(notif); }}
                      className={`
                        group relative flex items-start gap-3 px-4 py-3 border-l-[3px] outline-none
                        ${config.border}
                        ${notif.read ? "opacity-60" : ""}
                        ${notif.actionUrl ? "cursor-pointer" : ""}
                        hover:bg-white/[0.03] focus-visible:bg-white/[0.03] transition-all duration-150
                      `}
                    >
                      {/* Icona */}
                      <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${config.bg}`}>
                        <IconComp className={`w-3.5 h-3.5 ${config.iconColor}`} />
                      </div>

                      {/* Contenuto */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-[13px] font-medium truncate ${notif.read ? "text-slate-400" : "text-slate-200"}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                        {notif.actionLabel && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] text-blue-400 mt-1 group-hover:text-blue-300">
                            {notif.actionLabel}
                            <FiChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      {/* Azioni hover */}
                      <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-0.5">
                        {!notif.read && (
                          <button
                            onClick={(e) => handleMarkRead(e, notif.id)}
                            className="p-1 rounded-md text-slate-500 hover:text-blue-400 hover:bg-white/5 transition"
                            title="Segna come letta"
                          >
                            <FiCheck className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDismiss(e, notif.id)}
                          className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-white/5 transition"
                          title="Rimuovi"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-[#243044] px-4 py-2.5 bg-[#141c27]/50">
            <button
              onClick={() => {
                navigate("/notifiche");
                setIsOpen(false);
              }}
              className="w-full text-center text-[11px] text-slate-500 hover:text-blue-400 transition font-medium"
            >
              Vedi tutte le notifiche
            </button>
          </div>
        </div>
      )}

      {/* CSS animation inline */}
      <style>{`
        @keyframes notifSlideIn {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
