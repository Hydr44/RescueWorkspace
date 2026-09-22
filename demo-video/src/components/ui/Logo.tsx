import React from "react";
import { Img, staticFile } from "remotion";

/** Simbolo ufficiale RescueManager (cometa/goccia, blu #005dfa + teal #29b7ae). */
export const LogoMark: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <Img
    src={staticFile("logo-mark.svg")}
    style={{ width: size, height: size, objectFit: "contain" }}
  />
);

const FULL_RATIO = 5522.75 / 1080;

/** Logo ufficiale completo (simbolo + wordmark RESCUEMANAGER). Su fondo scuro. */
export const FullLogo: React.FC<{ height?: number }> = ({ height = 44 }) => (
  <Img
    src={staticFile("logo-full.svg")}
    style={{ height, width: height * FULL_RATIO, objectFit: "contain" }}
  />
);

/** Compat: rende il logo ufficiale completo. */
export const Wordmark: React.FC<{ size?: number; withMark?: boolean }> = ({
  size = 22,
}) => <FullLogo height={size * 1.5} />;
