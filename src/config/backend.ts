/// <reference types="vite/client" />

export const BACKEND_BASE_URL: string =
    (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_BACKEND_URL)
        ? (import.meta as any).env.VITE_BACKEND_URL
        : "http://localhost:5001"

export const buildBackendUrl = (path: string): string => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    return `${BACKEND_BASE_URL.replace(/\/+$/, "")}${normalizedPath}`
}

