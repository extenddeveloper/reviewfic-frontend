import { useCallback, useEffect, useRef, useState } from "react"
import "./AuthModal.css"
import {
  fetchSocialAuthStatus,
  AuthUser,
} from "../services/authService"
import { buildBackendUrl } from "../../../config/backend"
import { getSiteInfo } from "../../../lib/framer/project"

export type AuthModalProps = {
  isOpen: boolean
  initialMode?: "register" | "login"
  onRegister?: (data: any) => Promise<any>
  onVerifySignup?: (email: string, code: string) => Promise<any>
  onLogin?: (data: any) => Promise<any>
  onClose: () => void
  onSocialAuthSuccess: (data: { token: string; user: AuthUser; trial?: any }) => void
}

const TRIAL_FEATURES: string[] = [
  "Connect Google & Trustpilot Reviews",
  "Unlock All 24+ Layouts & Badges",
  "SEO AggregateRating Schema (JSON-LD)",
  "Direct Framer Canvas Insertion",
  "7 Days Free Trial (No Card Required)",
]

export function AuthModal({
  isOpen,
  initialMode = "register",
  onClose,
  onSocialAuthSuccess,
}: AuthModalProps) {
  const [authMode, setAuthMode] = useState<"register" | "login">(
    initialMode === "login" ? "login" : "register"
  )
  const [step, setStep] = useState<"features" | "waiting">("features")
  const [sessionId, setSessionId] = useState<string>("")
  const [authUrl, setAuthUrl] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const pollingIntervalRef = useRef<number | null>(null)
  const authCompletedRef = useRef<boolean>(false)

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    setStep("features")
    setError(null)
  }, [])

  // Reset modal state on open/close or initialMode change
  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode === "login" ? "login" : "register")
      setStep("features")
      setError(null)
      authCompletedRef.current = false
    } else {
      stopPolling()
    }
  }, [isOpen, initialMode, stopPolling])

  // Listen for escape key to close
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // PostMessage listener from popup / external tab
  useEffect(() => {
    if (!isOpen || step !== "waiting") return

    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.type !== "social-auth-success") return
      const { token, user, trial } = event.data
      if (token && user) {
        authCompletedRef.current = true
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        onSocialAuthSuccess({ token, user, trial })
        onClose()
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [isOpen, step, onSocialAuthSuccess, onClose])

  // Polling logic when step === "waiting"
  useEffect(() => {
    if (!isOpen || step !== "waiting" || !sessionId) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      return
    }

    authCompletedRef.current = false
    let attempts = 0
    const MAX_ATTEMPTS = 60 // ~120s
    let consecutiveErrors = 0

    const checkStatus = async () => {
      if (authCompletedRef.current) return
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return

      try {
        const res = await fetchSocialAuthStatus(sessionId)
        consecutiveErrors = 0
        if (res && res.status === "authenticated" && res.token && res.user) {
          authCompletedRef.current = true
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          onSocialAuthSuccess({ token: res.token, user: res.user, trial: (res as any).trial })
          onClose()
        }
      } catch {
        consecutiveErrors++
        if (consecutiveErrors >= 6 && pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }
    }

    // Trigger immediate check when user focuses window or returns to Framer
    const handleFocusOrVisible = () => {
      if (!authCompletedRef.current && typeof document !== "undefined" && document.visibilityState === "visible") {
        void checkStatus()
      }
    }

    window.addEventListener("focus", handleFocusOrVisible)
    document.addEventListener("visibilitychange", handleFocusOrVisible)

    const initialTimer = setTimeout(() => {
      void checkStatus()
    }, 400)

    pollingIntervalRef.current = window.setInterval(() => {
      attempts++
      if (attempts >= MAX_ATTEMPTS) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        return
      }
      void checkStatus()
    }, 2000)

    return () => {
      clearTimeout(initialTimer)
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      window.removeEventListener("focus", handleFocusOrVisible)
      document.removeEventListener("visibilitychange", handleFocusOrVisible)
    }
  }, [isOpen, step, sessionId, onSocialAuthSuccess, onClose])

  // Launch browser auth in new tab
  const handleOpenBrowserAuth = async () => {
    setError(null)
    authCompletedRef.current = false

    const newSessionId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    setSessionId(newSessionId)

    let siteId = ""
    try {
        const info = await getSiteInfo()
        siteId = info?.siteId || ""
    } catch {}

    let currentTheme = "dark"
    if (typeof document !== "undefined") {
      const t =
        document.documentElement.getAttribute("data-framer-theme") ||
        document.body.getAttribute("data-framer-theme") ||
        document.documentElement.getAttribute("data-theme") ||
        document.body.getAttribute("data-theme")
      if (t === "light") currentTheme = "light"
    }

    const authBase = buildBackendUrl("/auth")
    const params = new URLSearchParams()
    params.set("mode", authMode)
    params.set("sessionId", newSessionId)
    params.set("theme", currentTheme)
    params.set("app", "reviewfic")
    if (siteId) params.set("siteId", siteId)

    const fullUrl = `${authBase}?${params.toString()}`
    setAuthUrl(fullUrl)
    setStep("waiting")

    window.open(fullUrl, "_blank", "noopener,noreferrer")
  }

  const handleReopenBrowserAuth = () => {
    if (authUrl) {
      window.open(authUrl, "_blank", "noopener,noreferrer")
    } else {
      void handleOpenBrowserAuth()
    }
  }

  if (!isOpen) return null

  return (
    <div className="rf-auth-overlay" onClick={onClose}>
      <div
        className="rf-auth-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="rf-auth-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="rf-auth-icon-wrap">
          <div className="rf-auth-pulse-ring" />
          <div className="rf-auth-icon-box">
            <svg width="42" height="42" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="56" height="56" rx="14" fill="#5271FF" />
              <path d="M45.4675 19.8439L38.6549 28.2476L31.7678 36.7509L24.9553 45.1546C23.5878 46.8453 20.8777 45.8011 20.9772 43.638L21.4496 34.4635C21.4993 33.4938 20.9275 32.5987 20.0075 32.2506L11.4297 28.9687C9.41578 28.1979 9.56496 25.2889 11.6535 24.7171L20.5296 22.3302C21.4745 22.0816 22.1458 21.2611 22.1955 20.2914L22.6679 11.1169C22.7922 8.95377 25.6017 8.20788 26.7703 10.0229L31.7678 17.7305C32.29 18.551 33.2845 18.9239 34.2293 18.6753L43.1055 16.2884C45.194 15.7414 46.7852 18.178 45.4177 19.8687L45.4675 19.8439Z" fill="white" />
              <path d="M41.365 46C43.9054 46 45.9647 43.9406 45.9647 41.4003C45.9647 38.86 43.9054 36.8006 41.365 36.8006C38.8247 36.8006 36.7654 38.86 36.7654 41.4003C36.7654 43.9406 38.8247 46 41.365 46Z" fill="white" />
            </svg>
          </div>
        </div>

        <div className="rf-auth-header">
          <h3 className="rf-auth-title">
            {authMode === "register"
              ? "Start Your 7-Day Free Trial"
              : "Sign in to Reviewfic"}
          </h3>
          <p className="rf-auth-desc">
            {authMode === "register"
              ? "Reviewfic is a Pro plugin. Start your 7-day free trial to unlock live review widgets, custom badges, and instant canvas insertion."
              : "Sign in with your email or Google account in your browser to sync your license."}
          </p>
        </div>

        {authMode === "register" && (
          <div className="rf-auth-features-list">
            {TRIAL_FEATURES.map((feature, idx) => (
              <div key={idx} className="rf-auth-feature-row">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="rf-auth-feature-check"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="rf-auth-feature-text">{feature}</span>
              </div>
            ))}
          </div>
        )}

        {step === "waiting" && (
          <div className="rf-auth-waiting-card">
            <div className="rf-auth-waiting-spinner" />
            <div className="rf-auth-waiting-info">
              <div className="rf-auth-waiting-title">Waiting for browser completion...</div>
              <div className="rf-auth-waiting-desc">
                {authMode === "register"
                  ? "Complete your sign-up in the opened browser tab. Your plugin will automatically connect once finished."
                  : "Complete your sign-in in the opened browser tab. Your plugin will automatically connect once finished."}
              </div>
            </div>
          </div>
        )}

        {error && <div className="rf-auth-error">{error}</div>}

        <div className="rf-auth-actions-stack">
          {step === "features" ? (
            <button
              type="button"
              className="rf-auth-primary-btn primary-cta"
              onClick={handleOpenBrowserAuth}
            >
              {authMode === "register"
                ? "Start 7-Day Free Trial"
                : "Sign In with Browser"}
            </button>
          ) : (
            <button
              type="button"
              className="rf-auth-primary-btn primary-cta"
              onClick={handleReopenBrowserAuth}
            >
              Re-open Browser Window
            </button>
          )}

          <button
            type="button"
            className="rf-auth-cancel-btn"
            onClick={step === "waiting" ? stopPolling : onClose}
          >
            Cancel
          </button>
        </div>

        <div className="rf-auth-footer">
          <span className="rf-auth-footer-text">
            {authMode === "register"
              ? "Already have an account?"
              : "Don't have an account?"}
          </span>
          <button
            type="button"
            className="rf-auth-link-btn"
            onClick={() => {
              setError(null)
              stopPolling()
              setAuthMode(authMode === "register" ? "login" : "register")
            }}
          >
            {authMode === "register" ? "Sign in" : "Start Free Trial"}
          </button>
        </div>
      </div>
    </div>
  )
}

