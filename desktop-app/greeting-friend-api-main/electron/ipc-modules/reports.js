// electron/ipc-modules/reports.js
// IPC handlers for Reports
const { BrowserWindow } = require('electron');

function registerReportsIpc(handleSafe, db) {
  handleSafe('reports:summary', () => {
    const transports30 = db.prepare(
      `SELECT COUNT(*) AS c FROM transports WHERE created_at >= datetime('now','-30 days')`
    ).get().c;

    const autistiAttivi = db.prepare(
      `SELECT COUNT(*) AS c FROM autisti WHERE stato <> 'offline'`
    ).get().c;

    return {
      transportsUltimi30: transports30,
      autistiAttivi,
      tempoMedioInterventoMin: null,
    };
  });

  handleSafe('reports:export:transports', () => {
    const rows = db.prepare(
      `SELECT id, cliente, indirizzo, stato, orario, autista, mezzo, note, created_at
       FROM transports ORDER BY id DESC`
    ).all();

    const header = ['id','cliente','indirizzo','stato','orario','autista','mezzo','note','created_at'];
    const esc = (v='') => `"${String(v).replace(/"/g,'""')}"`;
    const csv = [
      header.join(','),
      ...rows.map(r => header.map(k => esc(r[k] ?? '')).join(','))
    ].join('\n');

    return { filename: `transports_${Date.now()}.csv`, mime: 'text/csv', content: csv };
  });

  handleSafe('print:quote-pdf', async ({ html, options = {} }) => {
    const bw = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
    try {
      await bw.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      const pdf = await bw.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        marginsType: 0,
        ...options,
      });
      return pdf.toString('base64');
    } finally {
      try { bw.close(); } catch {}
    }
  });
}

module.exports = { registerReportsIpc };
