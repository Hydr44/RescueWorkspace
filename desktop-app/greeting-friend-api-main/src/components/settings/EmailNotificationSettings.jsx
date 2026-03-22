/**
 * EmailNotificationSettings
 * Componente per configurare notifiche email: preferenze, SMTP, test e log.
 */

import { useState, useEffect, useCallback } from "react";
import { FiSend, FiRefreshCw, FiCheck, FiAlertCircle } from "react-icons/fi";
import { Card, Field, Toggle } from "../ui/SettingsUI";

const api = window.electronAPI?.notifications;

export default function EmailNotificationSettings({ showToast }) {
    const [prefs, setPrefs] = useState({
        email: "",
        emailEnabled: false,
        emailTypes: { scadenzeVeicoli: true, scadenzeEventi: true },
    });
    const [smtp, setSmtp] = useState({
        host: "smtp.ionos.com",
        port: 587,
        user: "noreply@rescuemanager.eu",
        pass: "",
        from: '"RescueManager" <noreply@rescuemanager.eu>',
    });
    const [emailLog, setEmailLog] = useState([]);
    const [testing, setTesting] = useState(false);
    const [checking, setChecking] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load settings on mount
    useEffect(() => {
        if (!api) return;
        api.getEmailPrefs().then(setPrefs).catch(console.error);
        api.getSmtp().then(setSmtp).catch(console.error);
        api.emailLog().then(setEmailLog).catch(console.error);
    }, []);

    const saveAll = useCallback(async () => {
        if (!api) return;
        setSaving(true);
        try {
            await api.saveEmailPrefs(prefs);
            await api.saveSmtp(smtp);
            showToast("success", "Impostazioni email salvate");
        } catch (e) {
            showToast("error", "Errore salvataggio: " + e.message);
        } finally {
            setSaving(false);
        }
    }, [prefs, smtp, showToast]);

    const testEmail = useCallback(async () => {
        if (!api) return;
        setTesting(true);
        try {
            // Save first
            await api.saveSmtp(smtp);
            const result = await api.testSmtp({
                ...smtp,
                testTo: prefs.email || smtp.user,
            });
            if (result.success) {
                showToast("success", `Email di test inviata a ${prefs.email || smtp.user}`);
                api.emailLog().then(setEmailLog).catch(() => { });
            } else {
                showToast("error", result.error || "Errore invio email di test");
            }
        } catch (e) {
            showToast("error", e.message);
        } finally {
            setTesting(false);
        }
    }, [smtp, prefs.email, showToast]);

    const checkNow = useCallback(async () => {
        if (!api) return;
        setChecking(true);
        try {
            await api.checkNow();
            showToast("success", "Controllo scadenze completato");
            api.emailLog().then(setEmailLog).catch(() => { });
        } catch (e) {
            showToast("error", e.message);
        } finally {
            setChecking(false);
        }
    }, [showToast]);

    return (
        <div className="space-y-4">
            {/* Email destinatario */}
            <Card title="Il tuo indirizzo email">
                <div className="space-y-3">
                    <Field label="Email per le notifiche" tooltip="L'indirizzo dove ricevere le email di scadenza">
                        <input
                            type="email"
                            className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none"
                            placeholder="la-tua-email@esempio.it"
                            value={prefs.email}
                            onChange={(e) => setPrefs((p) => ({ ...p, email: e.target.value }))}
                        />
                    </Field>

                    <Toggle
                        label="Abilita notifiche email"
                        checked={prefs.emailEnabled}
                        onChange={(checked) => setPrefs((p) => ({ ...p, emailEnabled: checked }))}
                    />
                </div>
            </Card>

            {/* Tipi di notifiche email */}
            {prefs.emailEnabled && (
                <>
                    <Card title="Quali email ricevere">
                        <p className="text-[10px] text-slate-500 mb-3">
                            Scegli per quali eventi ricevere un riepilogo via email. Il controllo avviene ogni 6 ore quando l'app è aperta.
                        </p>
                        <div className="space-y-3">
                            <Toggle
                                label="Scadenze veicoli (assicurazione, revisione, ecc.)"
                                checked={prefs.emailTypes?.scadenzeVeicoli !== false}
                                onChange={(checked) =>
                                    setPrefs((p) => ({
                                        ...p,
                                        emailTypes: { ...p.emailTypes, scadenzeVeicoli: checked },
                                    }))
                                }
                            />
                            <Toggle
                                label="Scadenze calendario (eventi di tipo scadenza)"
                                checked={prefs.emailTypes?.scadenzeEventi !== false}
                                onChange={(checked) =>
                                    setPrefs((p) => ({
                                        ...p,
                                        emailTypes: { ...p.emailTypes, scadenzeEventi: checked },
                                    }))
                                }
                            />
                        </div>
                    </Card>

                    {/* Configurazione SMTP */}
                    <Card title="Configurazione SMTP">
                        <p className="text-[10px] text-slate-500 mb-3">
                            Credenziali del server SMTP per l'invio delle email.
                        </p>
                        <div className="grid md:grid-cols-2 gap-3">
                            <Field label="Host SMTP">
                                <input
                                    type="text"
                                    className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none"
                                    value={smtp.host}
                                    onChange={(e) => setSmtp((s) => ({ ...s, host: e.target.value }))}
                                />
                            </Field>
                            <Field label="Porta">
                                <input
                                    type="number"
                                    className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none"
                                    value={smtp.port}
                                    onChange={(e) => setSmtp((s) => ({ ...s, port: parseInt(e.target.value) || 587 }))}
                                />
                            </Field>
                            <Field label="Username SMTP">
                                <input
                                    type="text"
                                    className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none"
                                    value={smtp.user}
                                    onChange={(e) => setSmtp((s) => ({ ...s, user: e.target.value }))}
                                />
                            </Field>
                            <Field label="Password SMTP">
                                <input
                                    type="password"
                                    className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none"
                                    value={smtp.pass}
                                    onChange={(e) => setSmtp((s) => ({ ...s, pass: e.target.value }))}
                                />
                            </Field>
                        </div>
                    </Card>

                    {/* Azioni */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={saveAll}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {saving ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
                            Salva impostazioni
                        </button>

                        <button
                            onClick={testEmail}
                            disabled={testing || !prefs.email}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-200 bg-[#243044] rounded-lg hover:bg-[#2d3d54] transition-colors disabled:opacity-50"
                        >
                            {testing ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiSend className="w-3.5 h-3.5" />}
                            Invia email di test
                        </button>

                        <button
                            onClick={checkNow}
                            disabled={checking}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-200 bg-[#243044] rounded-lg hover:bg-[#2d3d54] transition-colors disabled:opacity-50"
                        >
                            {checking ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiAlertCircle className="w-3.5 h-3.5" />}
                            Controlla scadenze ora
                        </button>
                    </div>

                    {/* Log email inviate */}
                    {emailLog.length > 0 && (
                        <Card title="Ultime email inviate">
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {emailLog.slice(0, 10).map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex items-center justify-between p-2 bg-[#141c27] rounded text-[10px]"
                                    >
                                        <span className="text-slate-300">
                                            <span className="font-medium text-slate-200">{log.type}</span>
                                            {" → "}
                                            {log.recipient}
                                        </span>
                                        <span className="text-slate-500">
                                            {log.sent_at ? new Date(log.sent_at).toLocaleString("it-IT") : "—"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
