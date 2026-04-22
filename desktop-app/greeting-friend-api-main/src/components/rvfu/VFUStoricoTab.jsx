import React from 'react';
import { FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { getStatoLabel, getStatoColors } from '@/lib/vfu-state-machine';

const VFUStoricoTab = ({ vfuData }) => {
  const eventi = [];

  // Build timeline from VFU data
  if (vfuData) {
    if (vfuData.dataRegistrazione) {
      eventi.push({
        tipo: 'INSERITO',
        data: vfuData.dataRegistrazione,
        descrizione: 'VFU registrato nel sistema',
        icon: 'check',
      });
    }

    if (vfuData.dataRitiro) {
      eventi.push({
        tipo: 'CONFERITO',
        data: vfuData.dataRitiro,
        descrizione: 'Veicolo ritirato',
        icon: 'check',
      });
    }

    if (vfuData.dataConferimento) {
      eventi.push({
        tipo: 'CONFERITO',
        data: vfuData.dataConferimento,
        descrizione: 'VFU conferito al CR',
        icon: 'check',
      });
    }

    if (vfuData.dataPresaInCarico) {
      eventi.push({
        tipo: 'PRESO_IN_CARICO',
        data: vfuData.dataPresaInCarico,
        descrizione: 'VFU preso in carico dal CR',
        icon: 'check',
      });
    }

    if (vfuData.dataChiusuraFascicolo) {
      eventi.push({
        tipo: 'FASCICOLO_CHIUSO',
        data: vfuData.dataChiusuraFascicolo,
        descrizione: 'Fascicolo chiuso',
        icon: 'check',
      });
    }

    if (vfuData.dataNotificaInoltroSTA) {
      eventi.push({
        tipo: 'INVIATO_A_STA',
        data: vfuData.dataNotificaInoltroSTA,
        descrizione: 'Inoltrato a STA per radiazione',
        icon: 'check',
      });
    }

    if (vfuData.dataRadiazione) {
      eventi.push({
        tipo: 'RADIATO',
        data: vfuData.dataRadiazione,
        descrizione: 'Veicolo radiato dal PRA',
        icon: 'check',
      });
    }

    if (vfuData.dataEmissioneCertificato) {
      eventi.push({
        tipo: 'CDR_GENERATO',
        data: vfuData.dataEmissioneCertificato,
        descrizione: 'Certificato di rottamazione generato',
        icon: 'check',
      });
    }

    if (vfuData.dataDemolizione) {
      eventi.push({
        tipo: 'DEMOLITO',
        data: vfuData.dataDemolizione,
        descrizione: 'Veicolo demolito',
        icon: 'check',
      });
    }

    if (vfuData.dataBonifica) {
      eventi.push({
        tipo: 'BONIFICA',
        data: vfuData.dataBonifica,
        descrizione: 'Bonifica completata',
        icon: 'check',
      });
    }

    if (vfuData.dataUltimoAggiornamento && eventi.length > 0) {
      eventi.push({
        tipo: 'AGGIORNAMENTO',
        data: vfuData.dataUltimoAggiornamento,
        descrizione: 'Ultimo aggiornamento dati',
        icon: 'info',
      });
    }
  }

  // Sort by date descending
  eventi.sort((a, b) => new Date(b.data) - new Date(a.data));

  if (eventi.length === 0) {
    return (
      <div className="text-center py-12">
        <FiClock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <div className="text-gray-400 mb-2">Nessun evento registrato</div>
        <div className="text-sm text-gray-500">
          Gli eventi verranno visualizzati qui dopo le prime azioni
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#1a2536]/90 backdrop-blur-sm rounded-xl border border-[#243044] p-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-6">
          Timeline eventi VFU
        </h3>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-[#243044]" />

          {/* Events */}
          <div className="space-y-6">
            {eventi.map((evento, idx) => {
              const colors = getStatoColors(evento.tipo);
              const IconComponent = evento.icon === 'check' ? FiCheckCircle : FiAlertCircle;

              return (
                <div key={idx} className="relative flex gap-4 items-start">
                  {/* Icon */}
                  <div className={`relative z-10 w-10 h-10 rounded-full ${colors.bgLight} border-2 ${colors.bg} flex items-center justify-center`}>
                    <IconComponent className={`w-5 h-5 ${colors.text}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-white font-medium text-sm">
                          {evento.descrizione}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(evento.data).toLocaleString('it-IT', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${colors.badge} whitespace-nowrap`}>
                        {getStatoLabel(evento.tipo)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VFUStoricoTab;
