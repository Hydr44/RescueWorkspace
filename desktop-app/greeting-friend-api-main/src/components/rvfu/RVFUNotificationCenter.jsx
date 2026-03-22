import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  FiBell, FiX, FiCheckCircle, FiAlertCircle, FiInfo, 
  FiAlertTriangle, FiRefreshCw, FiClock, FiShield 
} from 'react-icons/fi';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';

const RVFUNotificationCenter = ({ orgId, className = '' }) => {
  const { showSuccess, showError } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Carica notifiche
  const loadNotifications = useCallback(async () => {
    if (!orgId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/rvfu-notifications?orgId=${orgId}`);
      const result = await response.json();

      if (result.success) {
        setNotifications(result.notifications || []);
      } else {
        showError('Errore nel caricamento delle notifiche');
      }
    } catch (error) {
      logger.error('Error loading RVFU notifications:', error);
      showError('Errore nel caricamento delle notifiche');
    } finally {
      setLoading(false);
    }
  }, [orgId, showError]);

  // Marca notifica come letta
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await fetch(`/api/rvfu-notifications/${notificationId}/read`, {
        method: 'PUT'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          )
        );
      }
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  }, []);

  // Elimina notifica
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await fetch(`/api/rvfu-notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        showSuccess('Notifica eliminata');
      } else {
        showError('Errore durante l\'eliminazione della notifica');
      }
    } catch (error) {
      logger.error('Error deleting notification:', error);
      showError('Errore durante l\'eliminazione della notifica');
    }
  }, [showSuccess, showError]);

  // Marca tutte come lette
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(`/api/rvfu-notifications/mark-all-read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true, readAt: new Date().toISOString() }))
        );
        showSuccess('Tutte le notifiche sono state marcate come lette');
      }
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      showError('Errore durante l\'operazione');
    }
  }, [orgId, showSuccess, showError]);

  // Carica notifiche al mount e ogni 30 secondi
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Statistiche notifiche
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.isRead).length;

  // Get icon per tipo notifica
  const getNotificationIcon = (type, priority) => {
    if (priority === 'critical') {
      return FiAlertCircle;
    }
    
    switch (type) {
      case 'sync_success': return FiCheckCircle;
      case 'sync_error': return FiAlertTriangle;
      case 'document_uploaded': return FiShield;
      case 'deadline_approaching': return FiClock;
      case 'system_update': return FiRefreshCw;
      default: return FiInfo;
    }
  };

  // Get color per priorità
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-600 bg-orange-500/10 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-500/10 border-blue-500/20';
      case 'low': return 'text-slate-400 bg-[#141c27] border-[#243044]';
      default: return 'text-slate-400 bg-[#141c27] border-[#243044]';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Pulsante Notifiche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-200   transition-colors animate-fade-in"
      >
        <FiBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500/10 text-white text-xs rounded-full flex items-center justify-center animate-bounce-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {criticalCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            !
          </span>
        )}
      </button>

      {/* Dropdown Notifiche */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#141c27] rounded-lg shadow-lg border border-[#243044] z-50 modal-content animate-scale-in">
          {/* Header */}
          <div className="p-4 border-b border-[#243044]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Notifiche RVFU</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-600 hover:text-blue-400 transition-colors"
                  >
                    Marca tutte lette
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-500 hover:text-slate-400 transition-colors"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Lista Notifiche */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-sm text-slate-500 mt-2">Caricamento...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                <FiBell className="h-8 w-8 mx-auto mb-2 text-slate-500" />
                <p className="text-sm">Nessuna notifica</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification, index) => {
                  const IconComponent = getNotificationIcon(notification.type, notification.priority);
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 border-l-4 transition-all duration-200 ease-out animate-fade-in ${
                        notification.isRead 
                          ? 'bg-[#141c27]  border-[#243044]' 
                          : 'bg-[#141c27] border-indigo-500'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start gap-3">
                        <IconComponent className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          notification.isRead ? 'text-slate-500' : 'text-indigo-600'
                        }`} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`text-sm font-medium ${
                              notification.isRead ? 'text-slate-400' : 'text-slate-200'
                            }`}>
                              {notification.title}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </span>
                          </div>
                          
                          <p className={`text-xs ${
                            notification.isRead ? 'text-slate-500' : 'text-slate-300'
                          }`}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-slate-500">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                            
                            <div className="flex gap-1">
                              {!notification.isRead && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-indigo-600 hover:text-blue-400 transition-colors"
                                >
                                  Marca letta
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="text-xs text-red-600 hover:text-red-400 transition-colors"
                              >
                                Elimina
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-[#243044] bg-[#141c27] ">
              <button
                onClick={loadNotifications}
                className="w-full text-xs text-indigo-600 hover:text-blue-400 transition-colors flex items-center justify-center gap-1"
              >
                <FiRefreshCw className="h-3 w-3" />
                Aggiorna notifiche
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

RVFUNotificationCenter.propTypes = {
  orgId: PropTypes.string,
  className: PropTypes.string,
};

export default RVFUNotificationCenter;
