// Dati di esempio per vedere le pagine senza backend. Nell'app vanno sostituiti dalle query vere.
export const TRASPORTI = [
  { id: 'TR0001', ora: '14:30', targa: 'GA 512 PM', cliente: 'Mario Bianchi', tipo: 'Soccorso', da: 'Via dello Smeraldo 18, Gela', a: 'Officina Manzoni, Gela', autista: '', mezzo: '', stato: 'Da assegnare', tono: 'new' },
  { id: 'TR0002', ora: '09:10', targa: 'FR 220 KA', cliente: 'Mario Rossi', tipo: 'Trasporto', da: 'Via Roma 12, Gela', a: 'Via Lauria 3, Niscemi', autista: 'S. Greco', mezzo: 'EX 812 CN', stato: 'Parte 15:10', tono: 'muted' },
  { id: 'TR0000', ora: 'ieri 17:45', targa: 'CT 118 MM', cliente: 'Autofficina Vella', tipo: 'Soccorso', da: 'SS 117bis km 4', a: 'Deposito Piazzale', autista: 'G. Russo', mezzo: 'FN 245 KL', stato: '16 min', sotto: 'in viaggio', tono: 'run' },
  { id: 'TR0003', ora: 'ieri 11:20', targa: 'EV 901 LP', cliente: 'Europ Assistance', tipo: 'Trasporto', da: 'A19 km 62, Catania-Palermo', a: 'Piazzale, settore B', autista: 'S. Greco', mezzo: 'EX 812 CN', stato: 'Ritardo 12 min', tono: 'late' },
  { id: 'TR0004', ora: '20 set', targa: 'DA 331 HG', cliente: 'Carrozzeria Di Dio', tipo: 'Soccorso', da: 'Via Venezia 21, Gela', a: 'Via Butera 8, Gela', autista: 'M. Ferro', mezzo: 'DA 331 HG', stato: 'Completato', tono: 'muted' },
  { id: 'TR0005', ora: '19 set', targa: 'FZ 097 PR', cliente: 'F. Amato (privato)', tipo: 'Trasporto', da: 'Contrada Manfria', a: 'Via dello Smeraldo 18', autista: '', mezzo: '', stato: 'Annullato', tono: 'muted' },
];
export const STATI = [['Tutti', 7], ['Da assegnare', 2], ['In viaggio', 2], ['In ritardo', 1], ['Completati', 2]];
export const DETTAGLIO = {
  targa: 'CT 118 MM', cliente: 'Autofficina Vella', righe: ['Soccorso per incidente', 'Pratica TR0000'],
  metriche: [['Arrivo previsto', '16 min', 'mancano 9,8 km'], ['In viaggio da', '14:20', '21 minuti fa']],
  coppie: [['Autista', 'Giuseppe Russo'], ['Telefono', '333 000 0000'], ['Mezzo', 'FN 245 KL, carro 3,5 t'], ['Da', 'SS 117bis km 4 (Gela)'], ['A', 'Deposito Piazzale, Gela'], ['Cliente avvisato', '14:03 via WhatsApp']],
  attivita: [['14:20', 'Partito dal deposito'], ['14:03', 'Cliente avvisato via WhatsApp'], ['13:58', 'Assegnato a Giuseppe Russo'], ['13:52', 'Chiamata ricevuta']],
};
export const KPI = [['Trasporti oggi', '7', '2 in più di ieri'], ['Presa in carico media', '6 min', 'obiettivo 8 min'], ['Da fatturare', '3.180 euro', '9 pratiche chiuse'], ['Carri disponibili', '3 di 5', '1 in officina, 1 in ritardo']];
export const DA_SISTEMARE = [['Europ Assistance', 'in ritardo di 12 minuti sulla A19', '12 min', 'late'], ['Mario Bianchi', 'richiesta alle 14:30, senza autista', 'da assegnare', 'new'], ['Carrozzeria Di Dio', 'entro le 16:00, senza autista', 'da assegnare', 'new']];
export const SCADENZE = [['Revisione FN 245 KL', 'venerdì 26 settembre', '2 giorni', 'muted'], ['Registro RENTRI', 'chiusura mensile', '6 giorni', 'muted'], ['Fattura Europ Assistance', 'pratica PR-104, 1.240 euro', 'scaduta', 'late']];
export const ANDAMENTO = [38, 52, 44, 61, 70, 58, 66, 49, 73, 80, 64, 71, 55, 62];
export const CLIENTI = [
  { codice: 'VELLA', nome: 'Autofficina Vella S.r.l.', tipo: 'Azienda, officina', tel: '0933 123456', email: 'info@autofficinavella.it', citta: 'Gela', pratiche: 14, ultimo: 'ieri' },
  { codice: 'EUROP', nome: 'Europ Assistance', tipo: 'Convenzione', tel: '800 000 000', email: 'centrale@europassistance.it', citta: 'Milano', pratiche: 61, ultimo: 'ieri' },
  { codice: 'DIDIO', nome: 'Carrozzeria Di Dio', tipo: 'Azienda, carrozzeria', tel: '0933 654321', email: 'carrozzeriadidio@pec.it', citta: 'Gela', pratiche: 9, ultimo: '20 set' },
  { codice: 'BIANCHIM', nome: 'Mario Bianchi', tipo: 'Privato', tel: '333 0000000', email: '', citta: 'Gela', pratiche: 1, ultimo: 'oggi' },
  { codice: 'ROSSIM', nome: 'Mario Rossi', tipo: 'Privato', tel: '333 1111111', email: 'mario.rossi@gmail.com', citta: 'Niscemi', pratiche: 3, ultimo: 'oggi' },
  { codice: 'AMATOF', nome: 'Francesco Amato', tipo: 'Privato', tel: '333 2222222', email: '', citta: 'Gela', pratiche: 2, ultimo: '19 set' },
];
