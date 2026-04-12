/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_EMAILS?: string;
  /** When "true", use client-side Gemini (dev only; requires GEMINI_API_KEY at build time). */
  readonly VITE_GEMINI_CLIENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  Capacitor?: { getPlatform?: () => string };
}
