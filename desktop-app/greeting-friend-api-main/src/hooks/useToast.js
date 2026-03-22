// src/hooks/useToast.js
import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toast, setToast] = useState({
    show: false,
    text: '',
    type: 'info',
    duration: 5000,
  });

  const showToast = useCallback((text, type = 'info', duration = 5000) => {
    setToast({
      show: true,
      text,
      type,
      duration,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  const showSuccess = useCallback((text, duration) => {
    showToast(text, 'success', duration);
  }, [showToast]);

  const showError = useCallback((text, duration) => {
    showToast(text, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback((text, duration) => {
    showToast(text, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((text, duration) => {
    showToast(text, 'info', duration);
  }, [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
