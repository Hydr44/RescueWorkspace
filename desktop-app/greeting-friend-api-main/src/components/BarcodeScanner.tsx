// src/components/BarcodeScanner.tsx
import { useState, useCallback } from 'react';
import { FiCamera, FiX } from 'react-icons/fi';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose?: () => void;
}

export const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleManualSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  }, [manualCode, onScan]);

  const startCamera = useCallback(async () => {
    setIsScanning(true);
    // TODO: Integrazione vera con camera e libreria barcode scanner
    // Per ora mostriamo solo l'interfaccia
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a2536]  rounded-lg p-6 w-full max-w-md space-y-4 border border-[#243044] ">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Scansiona Barcode</h3>
          {onClose && (
            <button className="btn btn-ghost px-2 py-1" onClick={onClose}>
              <FiX className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Camera placeholder */}
        {isScanning ? (
          <div className="aspect-video bg-[#141c27]  rounded-lg flex items-center justify-center">
            <div className="text-center">
              <FiCamera className="h-12 w-12 mx-auto mb-2 text-slate-500" />
              <p className="text-sm text-slate-500">
                Inquadra il barcode
              </p>
            </div>
          </div>
        ) : (
          <button 
            onClick={startCamera} 
            className="btn btn-outline w-full"
          >
            <FiCamera className="h-4 w-4" />
            Attiva Camera
          </button>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#243044] " />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#1a2536]  px-2 text-slate-500">
              oppure
            </span>
          </div>
        </div>

        {/* Inserimento manuale */}
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">Inserisci codice manualmente</label>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="ES. 7891234567890"
              className="rounded-md border px-3 py-2 w-full text-sm"
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={!manualCode.trim()}>
            Conferma Codice
          </button>
        </form>
      </div>
    </div>
  );
};
