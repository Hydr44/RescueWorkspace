/**
 * Calendar Page
 * Visualizzazione calendario con eventi e trasporti - Vista settimanale e mensile
 * 
 * @author haxies
 * @created 2025
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { FiChevronLeft, FiChevronRight, FiPlus, FiX, FiSave, FiTrash2, FiExternalLink, FiCalendar, FiTruck, FiList, FiGrid, FiMail, FiUser, FiCheck } from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";
import { sendAppointmentEmail } from "../lib/emailNotifications";
import PropTypes from "prop-types";

/* Calendar events stored in Supabase calendar_events table */

/* ---------- util ---------- */
const fmtDMY = (d) => `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
const fmtTime = (d) => `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
const fmtISO = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fmtMonthYear = (d) => `${d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}`;

function startOfWeek(date){ const d=new Date(date); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); d.setHours(0,0,0,0); return d; }
function endOfWeek(date){ const d=startOfWeek(date); d.setDate(d.getDate()+7); d.setHours(23,59,59,999); return d; }
function startOfMonth(date){ const d=new Date(date); d.setDate(1); d.setHours(0,0,0,0); return d; }
function endOfMonth(date){ const d=new Date(date); d.setMonth(d.getMonth()+1); d.setDate(0); d.setHours(23,59,59,999); return d; }
function addDays(date,n){ const d=new Date(date); d.setDate(d.getDate()+n); return d; }
function addMonths(date,n){ const d=new Date(date); d.setMonth(d.getMonth()+n); return d; }
function sameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function sameMonth(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth(); }

// Componente Field riutilizzabile
function Field({ label, children, required = false, tooltip = null, error = null }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-slate-400">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {tooltip && (
          <div className="group relative">
            <FiExternalLink className="w-4 h-4 text-slate-500 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#141c27] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      {children}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <FiExternalLink className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
  tooltip: PropTypes.string,
  error: PropTypes.string
};

export default function CalendarPage() {
  const { orgId, orgName } = useOrg();
  const supabase = supabaseBrowser();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week"); // "week" | "month" | "list"
  const [events, setEvents] = useState([]);
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [editingTransport, setEditingTransport] = useState(null);
  const [saving, setSaving] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState([]);
  const [searchingClients, setSearchingClients] = useState(false);
  
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    location: "",
    type: "appuntamento",
    client_id: null,
    client_name: "",
    client_email: "",
    client_phone: "",
    send_email: false,
  });
  
  const [transportForm, setTransportForm] = useState({
    client_name: "",
    pickup_address: "",
    dropoff_address: "",
    scheduled_date: "",
    scheduled_time: "",
    price: "",
    notes: ""
  });

  // Cerca clienti per autocomplete
  const searchClientsDB = useCallback(async (query) => {
    if (!query || query.length < 2 || !orgId) {
      setClientResults([]);
      return;
    }
    setSearchingClients(true);
    try {
      const { data } = await supabase
        .from("clients")
        .select("id, name, email, phone")
        .eq("org_id", orgId)
        .ilike("name", `%${query}%`)
        .limit(8);
      setClientResults(data || []);
    } catch (err) {
      console.error("Client search error:", err);
    } finally {
      setSearchingClients(false);
    }
  }, [orgId, supabase]);

  // Carica eventi e trasporti
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        if (orgId) {
          // Carica eventi dal calendario (Supabase)
          const { data: eventsData, error: evErr } = await supabase
            .from("calendar_events")
            .select("*")
            .eq("org_id", orgId)
            .order("start_at", { ascending: true });
          
          if (evErr) throw evErr;
          setEvents(eventsData || []);
          
          // Carica trasporti
          const { data: transportsData, error: trErr } = await supabase
            .from("transports")
            .select("*")
            .eq("org_id", orgId)
            .order("created_at", { ascending: true });
          
          if (trErr) throw trErr;
          setTransports(transportsData || []);
        }
      } catch (err) {
        console.error("Error loading calendar data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [orgId, supabase]);

  // Genera giorni della settimana
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  // Genera giorni del mese
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startWeek = startOfWeek(start);
    const endWeek = endOfWeek(end);
    
    const days = [];
    let current = new Date(startWeek);
    
    while (current <= endWeek) {
      days.push(new Date(current));
      current = addDays(current, 1);
    }
    
    return days;
  }, [currentDate]);

  // Filtra eventi per giorno
  const getEventsForDay = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_at);
      return sameDay(eventDate, date);
    });
  };

  // Filtra trasporti per giorno
  const getTransportsForDay = (date) => {
    return transports.filter(transport => {
      if (!transport.created_at) return false;
      const transportDate = new Date(transport.created_at);
      return sameDay(transportDate, date);
    });
  };

  // Prossimi eventi (lista)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allItems = [
      ...events.map(event => ({
        ...event,
        _kind: 'event',
        _date: new Date(event.start_at),
        _title: event.title,
        _subtitle: event.client_name || event.location || event.description
      })),
      ...transports.map(transport => ({
        ...transport,
        _kind: 'transport',
        _date: new Date(transport.created_at),
        _title: transport.client_name || `Trasporto #${transport.id}`,
        _subtitle: transport.pickup_address || transport.dropoff_address
      }))
    ];
    
    return allItems
      .filter(item => item._date >= today)
      .sort((a, b) => a._date - b._date)
      .slice(0, 10);
  }, [events, transports]);

  // Navigazione
  const goToPrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(prev => addMonths(prev, -1));
    } else {
      setCurrentDate(prev => addDays(prev, -7));
    }
  };

  const goToNext = () => {
    if (viewMode === "month") {
      setCurrentDate(prev => addMonths(prev, 1));
    } else {
      setCurrentDate(prev => addDays(prev, 7));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Gestione eventi
  const handleCreateEvent = () => {
    setEventForm({
      title: "",
      description: "",
      start_date: fmtISO(currentDate),
      start_time: "09:00",
      end_date: fmtISO(currentDate),
      end_time: "10:00",
      location: "",
      type: "appuntamento",
      client_id: null,
      client_name: "",
      client_email: "",
      client_phone: "",
      send_email: false,
    });
    setClientSearch("");
    setClientResults([]);
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleEditEvent = (event) => {
    const start = new Date(event.start_at);
    const end = event.end_at ? new Date(event.end_at) : start;
    setEventForm({
      title: event.title || "",
      description: event.description || "",
      start_date: fmtISO(start),
      start_time: fmtTime(start),
      end_date: fmtISO(end),
      end_time: fmtTime(end),
      location: event.location || "",
      type: event.type || "appuntamento",
      client_id: event.client_id || null,
      client_name: event.client_name || "",
      client_email: event.client_email || "",
      client_phone: event.client_phone || "",
      send_email: false,
    });
    setClientSearch(event.client_name || "");
    setClientResults([]);
    setEditingEvent(event);
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    try {
      setSaving(true);
      const startAt = new Date(`${eventForm.start_date}T${eventForm.start_time}`);
      const endAt = new Date(`${eventForm.end_date}T${eventForm.end_time}`);

      const eventData = {
        org_id: orgId,
        title: eventForm.title,
        description: eventForm.description || null,
        location: eventForm.location || null,
        type: eventForm.type,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        client_id: eventForm.client_id || null,
        client_name: eventForm.client_name || null,
        client_email: eventForm.client_email || null,
        client_phone: eventForm.client_phone || null,
      };

      let savedEvent;
      if (editingEvent) {
        const { data, error: upErr } = await supabase
          .from("calendar_events")
          .update(eventData)
          .eq("id", editingEvent.id)
          .select()
          .single();
        if (upErr) throw upErr;
        savedEvent = data;
      } else {
        const { data, error: inErr } = await supabase
          .from("calendar_events")
          .insert(eventData)
          .select()
          .single();
        if (inErr) throw inErr;
        savedEvent = data;
      }

      // Invio email conferma se richiesto
      if (eventForm.send_email && eventForm.client_email) {
        try {
          setEmailSending(true);
          const dateStr = startAt.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
          const timeStr = `${eventForm.start_time} - ${eventForm.end_time}`;
          await sendAppointmentEmail({
            to: eventForm.client_email,
            customerName: eventForm.client_name || 'Cliente',
            eventTitle: eventForm.title,
            eventDate: dateStr,
            eventTime: timeStr,
            eventLocation: eventForm.location,
            eventDescription: eventForm.description,
            orgName: orgName || 'RescueManager',
          });
          // Aggiorna flag email_sent
          await supabase
            .from("calendar_events")
            .update({ email_sent: true, email_sent_at: new Date().toISOString() })
            .eq("id", savedEvent.id);
        } catch (emailErr) {
          console.error("Errore invio email:", emailErr);
        } finally {
          setEmailSending(false);
        }
      }

      // Ricarica eventi
      const { data: updatedEvents } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("org_id", orgId)
        .order("start_at", { ascending: true });
      setEvents(updatedEvents || []);
      
      setShowEventModal(false);
      setEditingEvent(null);
    } catch (err) {
      console.error("Error saving event:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const { error: delErr } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", eventId);
      if (delErr) throw delErr;
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setShowEventModal(false);
      setEditingEvent(null);
    } catch (err) {
      console.error("Error deleting event:", err);
      setError(err.message);
    }
  };

  // Gestione trasporti
  const handleCreateTransport = () => {
    setTransportForm({
      client_name: "",
      pickup_address: "",
      dropoff_address: "",
      scheduled_date: fmtDMY(currentDate),
      scheduled_time: "09:00",
      price: "",
      notes: ""
    });
    setEditingTransport(null);
    setShowTransportModal(true);
  };

  const handleEditTransport = (transport) => {
    setTransportForm({
      client_name: transport.client_name || "",
      pickup_address: transport.pickup_address || "",
      dropoff_address: transport.dropoff_address || "",
      scheduled_date: transport.created_at ? fmtDMY(new Date(transport.created_at)) : "",
      scheduled_time: transport.scheduled_time || "",
      price: transport.price || "",
      notes: transport.notes || ""
    });
    setEditingTransport(transport);
    setShowTransportModal(true);
  };

  const handleSaveTransport = async () => {
    try {
      const transportData = {
        org_id: orgId,
        client_name: transportForm.client_name,
        pickup_address: transportForm.pickup_address,
        dropoff_address: transportForm.dropoff_address,
        scheduled_date: transportForm.scheduled_date,
        scheduled_time: transportForm.scheduled_time,
        price: transportForm.price ? Number.parseFloat(transportForm.price) : null,
        notes: transportForm.notes,
        status: "new"
      };

      if (editingTransport) {
        const { error } = await supabase
          .from("transports")
          .update(transportData)
          .eq("id", editingTransport.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("transports")
          .insert(transportData);
        
        if (error) throw error;
      }

      // Ricarica trasporti
      const { data: updatedTransports } = await supabase
        .from("transports")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: true });
      
      setTransports(updatedTransports || []);
      setShowTransportModal(false);
      setEditingTransport(null);
    } catch (err) {
      console.error("Error saving transport:", err);
      setError(err.message);
    }
  };

  const handleDeleteTransport = async (transportId) => {
    try {
      const { error } = await supabase
        .from("transports")
        .delete()
        .eq("id", transportId);
      
      if (error) throw error;
      
      const updatedTransports = transports.filter(t => t.id !== transportId);
      setTransports(updatedTransports);
    } catch (err) {
      console.error("Error deleting transport:", err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-slate-400">Caricamento calendario...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Calendario</h1>
            <p className="text-xs text-slate-500 mt-0.5">Eventi e trasporti programmati</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateEvent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-3.5 h-3.5" />
              Evento
            </button>
            <button
              onClick={handleCreateTransport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <FiTruck className="w-3.5 h-3.5" />
              Trasporto
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-3 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-4 h-4 text-red-400 mr-3">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-red-400">
                <strong>Errore:</strong> {error}
              </div>
            </div>
        </div>
      )}

        {/* Controlli Navigazione e Vista */}
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button onClick={goToPrevious} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded-lg transition-colors">
                <FiChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={goToToday} className="px-2.5 py-1 text-xs font-medium text-blue-400 bg-blue-500/10 rounded-md hover:bg-blue-500/15 transition-colors">
                Oggi
              </button>
              <button onClick={goToNext} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded-lg transition-colors">
                <FiChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-sm font-medium text-slate-200 capitalize">
              {viewMode === "month" ? fmtMonthYear(currentDate) : `${fmtDMY(weekDays[0])} – ${fmtDMY(weekDays[6])}`}
            </p>

            <div className="flex items-center gap-1 bg-[#141c27] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("week")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === "week" ? "bg-blue-500/15 text-blue-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <FiGrid className="w-3 h-3" /> Settimana
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === "month" ? "bg-blue-500/15 text-blue-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <FiCalendar className="w-3 h-3" /> Mese
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === "list" ? "bg-blue-500/15 text-blue-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <FiList className="w-3 h-3" /> Lista
              </button>
            </div>
          </div>
        </div>

        {/* Vista Lista */}
        {viewMode === "list" && (
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Prossimi Eventi e Trasporti
            </h2>
            <div className="space-y-3">
              {upcomingEvents.map((item, index) => (
                <button
                  key={`${item._kind}-${item.id}-${index}`}
                  onClick={() => item._kind === 'event' ? handleEditEvent(item) : handleEditTransport(item)}
                  className={`w-full p-4 rounded-lg border  transition-all text-left ${
                    item._kind === 'event'
                      ? "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/10"
                      : "bg-emerald-500/10 border-green-500/20 hover:bg-green-500/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item._kind === 'event' ? (
                      <FiCalendar className="w-4 h-4 text-blue-400" />
                    ) : (
                      <FiTruck className="w-4 h-4 text-emerald-400" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-slate-200">
                        {item._title}
                      </div>
                      <div className="text-sm text-slate-400">
                        {item._subtitle}
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      {fmtDMY(item._date)} {fmtTime(item._date)}
                    </div>
                  </div>
                </button>
              ))}
              {upcomingEvents.length === 0 && (
                <div className="text-center py-6 text-slate-500">
                  <FiCalendar className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  <p>Nessun evento o trasporto programmato</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vista Settimanale */}
        {viewMode === "week" && (
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            {/* Header Giorni */}
            <div className="grid grid-cols-7 bg-[#141c27]">
              {weekDays.map((day, index) => (
                <div key={`day-header-${day.getTime()}`} className="p-2.5 text-center border-r border-[#243044] last:border-r-0">
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'][index]}
                  </div>
                  <div className={`text-sm font-semibold mt-0.5 ${
                    sameDay(day, new Date()) 
                      ? "text-blue-400" 
                      : "text-slate-200"
                  }`}>
                    {day.getDate()}
                  </div>
                </div>
              ))}
            </div>

            {/* Contenuto Giorni */}
            <div className="grid grid-cols-7 min-h-[300px]">
              {weekDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const dayTransports = getTransportsForDay(day);
                
                return (
                  <div key={`day-content-${day.getTime()}`} className="p-3 border-r border-[#243044] last:border-r-0 min-h-[300px]">
                    <div className="space-y-2">
                      {/* Eventi */}
                      {dayEvents.map(event => (
                        <button
                          key={`event-${event.id}`}
                          onClick={() => handleEditEvent(event)}
                          className="w-full p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/15 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <FiCalendar className="w-3 h-3 text-blue-400" />
                            <div className="text-xs font-medium text-blue-400 truncate">
                              {event.title}
                            </div>
                          </div>
                          <div className="text-xs text-blue-400 mt-1">
                            {fmtTime(new Date(event.start_at))}
                          </div>
                        </button>
                      ))}
                      
                      {/* Trasporti */}
                      {dayTransports.map(transport => (
                        <button
                          key={`transport-${transport.id}`}
                          onClick={() => handleEditTransport(transport)}
                          className="w-full p-2 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-emerald-500/15 transition-colors text-left"
                        >
        <div className="flex items-center gap-2">
                            <FiTruck className="w-3 h-3 text-emerald-400" />
                            <div className="text-xs font-medium text-emerald-400 truncate">
                              {transport.client_name || `Trasporto #${transport.id}`}
                            </div>
                          </div>
                          <div className="text-xs text-emerald-400 mt-1">
                            {transport.pickup_address}
                          </div>
          </button>
                      ))}
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
        )}

        {/* Vista Mensile */}
        {viewMode === "month" && (
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            {/* Header Giorni */}
            <div className="grid grid-cols-7 bg-[#141c27]">
              {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day, index) => (
                <div key={day} className="p-2 text-center border-r border-[#243044] last:border-r-0">
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    {day}
                  </div>
                </div>
              ))}
      </div>

            {/* Griglia Mese */}
            <div className="grid grid-cols-7">
              {monthDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const dayTransports = getTransportsForDay(day);
                const isCurrentMonth = sameMonth(day, currentDate);
                const isToday = sameDay(day, new Date());
                
                return (
                  <div
                    key={`month-day-${day.getTime()}`}
                    className={`min-h-[90px] p-2 border-r border-[#243044] last:border-r-0 ${
                      isCurrentMonth ? "bg-[#1a2536]" : "bg-[#141c27]/50"
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      (() => {
                        if (isToday) return "text-blue-400 font-bold";
                        if (isCurrentMonth) return "text-slate-200";
                        return "text-slate-500";
                      })()
                    }`}>
                      {day.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {/* Eventi */}
                      {dayEvents.slice(0, 2).map(event => (
                        <button
                          key={`event-${event.id}`}
                          onClick={() => handleEditEvent(event)}
                          className="w-full p-1 bg-blue-500/10 border border-blue-500/20 rounded text-left"
                        >
                          <div className="text-xs text-blue-400 truncate">
                            {event.title}
                          </div>
                        </button>
                      ))}
                      
                      {/* Trasporti */}
                      {dayTransports.slice(0, 2).map(transport => (
                        <button
                          key={`transport-${transport.id}`}
                          onClick={() => handleEditTransport(transport)}
                          className="w-full p-1 bg-green-500/10 border border-green-500/20 rounded text-left"
                        >
                          <div className="text-xs text-emerald-400 truncate">
                            {transport.client_name || `T#${transport.id}`}
                          </div>
                        </button>
                      ))}
                      
                      {/* Indicatore se ci sono più elementi */}
                      {(dayEvents.length + dayTransports.length) > 4 && (
                        <div className="text-xs text-slate-500 text-center">
                          +{(dayEvents.length + dayTransports.length) - 4} altri
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legenda compatta */}
        <div className="flex items-center gap-4 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-500/40"></div>
            <span className="text-[10px] text-slate-500">Eventi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40"></div>
            <span className="text-[10px] text-slate-500">Trasporti</span>
          </div>
        </div>

      {/* Modal Evento */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEventModal(false)} aria-label="Chiudi modal" />
          <div className="relative w-full max-w-lg bg-[#1a2536] rounded-xl border border-[#243044] p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-200">
                {editingEvent ? "Modifica Evento" : "Nuovo Evento"}
              </h2>
              <button
                onClick={() => setShowEventModal(false)}
                className="p-2 text-slate-500 hover:text-slate-400 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="Titolo" required>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Titolo dell'evento"
                      className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors"
                    />
                  </Field>
                </div>
                <Field label="Tipo">
                  <select
                    value={eventForm.type}
                    onChange={(e) => setEventForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors"
                  >
                    <option value="appuntamento">Appuntamento</option>
                    <option value="scadenza">Scadenza</option>
                    <option value="promemoria">Promemoria</option>
                    <option value="personale">Personale</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Data Inizio" required>
                  <input
                    type="date"
                    value={eventForm.start_date}
                    onChange={(e) => setEventForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors"
                  />
                </Field>
                <Field label="Ora Inizio" required>
                  <input
                    type="time"
                    value={eventForm.start_time}
                    onChange={(e) => setEventForm(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Data Fine" required>
                  <input
                    type="date"
                    value={eventForm.end_date}
                    onChange={(e) => setEventForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors"
                  />
                </Field>
                <Field label="Ora Fine" required>
                  <input
                    type="time"
                    value={eventForm.end_time}
                    onChange={(e) => setEventForm(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors"
                  />
                </Field>
              </div>

              <Field label="Luogo">
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Luogo dell'evento"
                  className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors"
                />
              </Field>

              <Field label="Descrizione">
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrizione dell'evento"
                  rows={2}
                  className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors resize-none"
                />
              </Field>

              {/* Sezione Cliente */}
              <div className="border border-[#243044] rounded-lg p-3 space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <FiUser className="w-3.5 h-3.5" />
                  Cliente (opzionale)
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      searchClientsDB(e.target.value);
                    }}
                    placeholder="Cerca cliente per nome..."
                    className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors"
                  />
                  {searchingClients && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">...</div>
                  )}
                  {clientResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-[#141c27] border border-[#243044] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {clientResults.map(client => (
                        <button
                          key={client.id}
                          onClick={() => {
                            setEventForm(prev => ({
                              ...prev,
                              client_id: client.id,
                              client_name: client.name,
                              client_email: client.email || "",
                              client_phone: client.phone || "",
                            }));
                            setClientSearch(client.name);
                            setClientResults([]);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-blue-500/10 transition-colors"
                        >
                          <div className="text-xs font-medium text-slate-200">{client.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {client.email && <span>{client.email}</span>}
                            {client.email && client.phone && <span> &middot; </span>}
                            {client.phone && <span>{client.phone}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {eventForm.client_name && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <FiUser className="w-3.5 h-3.5 text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-blue-300">{eventForm.client_name}</div>
                      {eventForm.client_email && (
                        <div className="text-[10px] text-blue-400/70">{eventForm.client_email}</div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setEventForm(prev => ({ ...prev, client_id: null, client_name: "", client_email: "", client_phone: "", send_email: false }));
                        setClientSearch("");
                      }}
                      className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {eventForm.client_email && (
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventForm.send_email}
                      onChange={() => setEventForm(prev => ({ ...prev, send_email: !prev.send_email }))}
                      className="rounded border-[#243044] text-blue-500 focus:ring-blue-500/40"
                    />
                    <FiMail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-300">Invia conferma via email a {eventForm.client_email}</span>
                  </label>
                )}
              </div>

              {/* Badge email già inviata */}
              {editingEvent?.email_sent && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-emerald-400">
                    Email inviata {editingEvent.email_sent_at ? `il ${new Date(editingEvent.email_sent_at).toLocaleString('it-IT')}` : ''}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowEventModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors"
              >
                Annulla
              </button>
              {editingEvent && (
                <button
                  onClick={() => handleDeleteEvent(editingEvent.id)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FiTrash2 className="w-3.5 h-3.5 inline mr-1.5" />
                  Elimina
                </button>
              )}
              <button
                onClick={handleSaveEvent}
                disabled={saving || emailSending || !eventForm.title}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving || emailSending ? (
                  <span>{emailSending ? 'Invio email...' : 'Salvataggio...'}</span>
                ) : (
                  <><FiSave className="w-3.5 h-3.5 inline mr-1.5" />Salva{eventForm.send_email ? ' e Invia Email' : ''}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Trasporto */}
      {showTransportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTransportModal(false)} aria-label="Chiudi modal" />
          <div className="relative w-full max-w-lg bg-[#1a2536] rounded-xl border border-[#243044] p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-200">
                {editingTransport ? "Modifica Trasporto" : "Nuovo Trasporto"}
              </h2>
              <button
                onClick={() => setShowTransportModal(false)}
                className="p-2 text-slate-500 hover:text-slate-400 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Cliente" required>
                <input
                  type="text"
                  value={transportForm.client_name}
                  onChange={(e) => setTransportForm(prev => ({ ...prev, client_name: e.target.value }))}
                  placeholder="Nome del cliente"
                  className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Data Programmata" required>
                  <input
                    type="date"
                    value={transportForm.scheduled_date}
                    onChange={(e) => setTransportForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors"
                  />
                </Field>
                <Field label="Ora Programmata" required>
                  <input
                    type="time"
                    value={transportForm.scheduled_time}
                    onChange={(e) => setTransportForm(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors"
                  />
                </Field>
              </div>

              <Field label="Indirizzo di Partenza" required>
                <input
                  type="text"
                  value={transportForm.pickup_address}
                  onChange={(e) => setTransportForm(prev => ({ ...prev, pickup_address: e.target.value }))}
                  placeholder="Indirizzo di partenza"
                  className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors"
                />
              </Field>

              <Field label="Indirizzo di Arrivo" required>
                <input
                  type="text"
                  value={transportForm.dropoff_address}
                  onChange={(e) => setTransportForm(prev => ({ ...prev, dropoff_address: e.target.value }))}
                  placeholder="Indirizzo di arrivo"
                  className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors"
                />
              </Field>

              <Field label="Prezzo (€)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm font-medium">€</span>
                  <input
                    type="number"
                    step="0.01"
                    value={transportForm.price}
                    onChange={(e) => setTransportForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors"
                  />
                </div>
              </Field>

              <Field label="Note">
                <textarea
                  value={transportForm.notes}
                  onChange={(e) => setTransportForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Note aggiuntive"
                  rows={3}
                  className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors resize-none"
                />
              </Field>
      </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowTransportModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors"
              >
                Annulla
              </button>
              {editingTransport && (
                <button
                  onClick={() => handleDeleteTransport(editingTransport.id)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FiTrash2 className="w-3.5 h-3.5 inline mr-1.5" />
                  Elimina
                </button>
              )}
              <button
                onClick={handleSaveTransport}
                className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <FiSave className="w-3.5 h-3.5 inline mr-1.5" />
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}