import { useState } from 'react';
import { FiMapPin, FiLink2, FiCopy, FiExternalLink, FiTrash2, FiX } from 'react-icons/fi';
import { useQRCode } from '../../hooks/useQRCode';

export default function ClientLocationWidget({ assistList, onCreateRequest, onDeleteRequest, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedAssist, setSelectedAssist] = useState(null);
  const { downloadQR } = useQRCode();

  const handleCreateRequest = async () => {
    await onCreateRequest();
    setShowModal(false);
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
  };

  const handleDownloadQR = async (assist) => {
    const qrData = JSON.stringify({
      type: 'assist_request',
      id: assist.id,
      url: assist.link
    });
    await downloadQR(qrData, `assist-${assist.id}`);
  };

  const handleViewDetail = (assist) => {
    setSelectedAssist(assist);
  };

  return (
    <>
      <div className="bg-[#1a2536] border border-[#243044] overflow-hidden h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#243044]">
          <div className="flex items-center gap-2">
            <FiMapPin className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-200">Posizione Cliente</h2>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-700 px-3 py-1.5 transition"
          >
            Nuova Richiesta
          </button>
        </div>

        <div className="p-4">
          {assistList.length === 0 ? (
            <div className="text-center py-6">
              <FiMapPin className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-xs text-slate-500 mb-3">Nessuna richiesta attiva</p>
              <button
                onClick={() => setShowModal(true)}
                className="text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-700 px-4 py-2 transition"
              >
                Crea Prima Richiesta
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {assistList.slice(0, 3).map(assist => (
                <div
                  key={assist.id}
                  className="bg-[#141c27] border border-[#243044] p-3 hover:bg-[#1a2536] transition"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200">
                        {assist.phone || 'Numero non specificato'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(assist.created_at).toLocaleString('it-IT')}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 ${
                      assist.location 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {assist.location ? 'Ricevuta' : 'In attesa'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyLink(assist.link)}
                      className="flex-1 text-[10px] font-medium text-slate-400 hover:text-slate-300 bg-[#1a2536] hover:bg-[#243044] px-2 py-1.5 transition flex items-center justify-center gap-1"
                      title="Copia link"
                    >
                      <FiCopy className="w-3 h-3" />
                      Copia
                    </button>
                    <button
                      onClick={() => window.open(assist.link, '_blank')}
                      className="flex-1 text-[10px] font-medium text-slate-400 hover:text-slate-300 bg-[#1a2536] hover:bg-[#243044] px-2 py-1.5 transition flex items-center justify-center gap-1"
                      title="Apri link"
                    >
                      <FiExternalLink className="w-3 h-3" />
                      Apri
                    </button>
                    {assist.location && (
                      <button
                        onClick={() => handleViewDetail(assist)}
                        className="flex-1 text-[10px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1.5 transition flex items-center justify-center gap-1"
                      >
                        <FiMapPin className="w-3 h-3" />
                        Mappa
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteRequest(assist.id)}
                      className="text-[10px] font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-1.5 transition"
                      title="Elimina"
                    >
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {assistList.length > 3 && (
                <button
                  onClick={onRefresh}
                  className="w-full text-xs text-slate-400 hover:text-slate-300 py-2 transition"
                >
                  Vedi tutte ({assistList.length})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal creazione richiesta */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2536] border border-[#243044] max-w-md w-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#243044]">
              <h3 className="text-sm font-semibold text-slate-200">Nuova Richiesta Posizione</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-300 transition"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-400">
                Verrà generato un link univoco da inviare al cliente. Il cliente potrà condividere la sua posizione cliccando sul link.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-xs font-medium text-slate-300 bg-[#141c27] border border-[#243044] hover:bg-[#1a2536] transition"
                >
                  Annulla
                </button>
                <button
                  onClick={handleCreateRequest}
                  className="flex-1 px-4 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-700 transition"
                >
                  Crea Richiesta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal dettaglio posizione */}
      {selectedAssist && selectedAssist.location && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2536] border border-[#243044] max-w-2xl w-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#243044]">
              <h3 className="text-sm font-semibold text-slate-200">Posizione Cliente</h3>
              <button
                onClick={() => setSelectedAssist(null)}
                className="text-slate-400 hover:text-slate-300 transition"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <iframe
                src={`https://www.google.com/maps?q=${selectedAssist.location.lat},${selectedAssist.location.lng}&output=embed`}
                className="w-full h-96 border-0"
                title="Mappa posizione cliente"
              />
              <div className="mt-3 text-xs text-slate-400">
                <p>Latitudine: {selectedAssist.location.lat}</p>
                <p>Longitudine: {selectedAssist.location.lng}</p>
                <p className="mt-2">Ricevuta: {new Date(selectedAssist.location_received_at).toLocaleString('it-IT')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
