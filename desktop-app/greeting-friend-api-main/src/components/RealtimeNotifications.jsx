/**
 * Componente per notifiche real-time
 * Mostra toast quando ci sono aggiornamenti ai trasporti
 */

import { useCallback, useState } from 'react';
import { FiTruck, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import { useRealtimeTransports } from '../hooks/useRealtimeTransports';

export default function RealtimeNotifications({ orgId, onTransportUpdate }) {
  const [notifications, setNotifications] = useState([]);

  // useCallback per evitare loop infinito
  const handleRealtimeUpdate = useCallback((payload) => {
    const { eventType, new: newData, old: oldData } = payload;
    
    // Crea notifica
    const notification = {
      id: Date.now(),
      type: eventType,
      transport: newData || oldData,
      timestamp: new Date()
    };

    // Aggiungi notifica
    setNotifications(prev => [...prev, notification]);

    // Rimuovi dopo 5 secondi
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);

    // Callback per aggiornare lista trasporti
    if (onTransportUpdate) {
      onTransportUpdate();
    }
  }, [onTransportUpdate]);

  const { isConnected } = useRealtimeTransports(orgId, handleRealtimeUpdate);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'INSERT':
        return <FiTruck className="w-5 h-5 text-blue-400" />;
      case 'UPDATE':
        return <FiCheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'DELETE':
        return <FiAlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <FiTruck className="w-5 h-5 text-slate-400" />;
    }
  };

  const getNotificationMessage = (notification) => {
    const { type, transport } = notification;
    const transportNumber = transport?.number ? `TR${String(transport.number).padStart(4, '0')}` : `#${transport?.id?.slice(0, 6)}`;

    switch (type) {
      case 'INSERT':
        return `Nuovo trasporto ${transportNumber} creato`;
      case 'UPDATE':
        return `Trasporto ${transportNumber} aggiornato`;
      case 'DELETE':
        return `Trasporto ${transportNumber} eliminato`;
      default:
        return `Trasporto ${transportNumber} modificato`;
    }
  };

  return (
    <>
      {/* Notifications Toast Stack */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="flex items-start gap-3 p-4 bg-[#1a2536] border border-[#243044] rounded-xl shadow-lg animate-slide-in-right"
          >
            <div className="flex-shrink-0 mt-0.5">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200">
                {getNotificationMessage(notification)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {notification.timestamp.toLocaleTimeString('it-IT', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 p-1 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
