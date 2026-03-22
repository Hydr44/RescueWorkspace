// src/lib/apiConfig.js
export const API = {
    LIC: import.meta.env.VITE_LIC_BASE || "https://rentri-test.rescuemanager.eu/lic",
    ASSIST: import.meta.env.VITE_ASSIST_BASE || "https://assist.rescuemanager.eu",
    SDI: import.meta.env.VITE_SDI_BASE || "https://rentri-test.rescuemanager.eu/sdi",
  };