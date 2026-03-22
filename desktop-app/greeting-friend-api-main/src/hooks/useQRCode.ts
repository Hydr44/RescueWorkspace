// src/hooks/useQRCode.ts
import { useCallback } from 'react';
import QRCode from 'qrcode';

export const useQRCode = () => {
  const generateQR = useCallback(async (data: string): Promise<string> => {
    try {
      const qrDataUrl = await QRCode.toDataURL(data, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }, []);

  const downloadQR = useCallback(async (data: string, filename: string) => {
    const qrDataUrl = await generateQR(data);
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generateQR]);

  return { generateQR, downloadQR };
};
