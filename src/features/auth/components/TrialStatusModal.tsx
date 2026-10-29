import "./TrialStatusModal.css"

export type TrialStatusModalProps = {
  isOpen: boolean
  status: "started" | "expired" | null
  onClose: () => void
  onUpgrade: () => void
  onLogout: () => void
}

export function TrialStatusModal({ isOpen, status, onClose, onUpgrade, onLogout }: TrialStatusModalProps) {
  if (!isOpen || !status) return null

  const isStarted = status === "started"

  return (
    <div className="rf-trial-status-overlay" onClick={isStarted ? onClose : undefined}>
      <div className="rf-trial-status-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rf-trial-status-header">
          {isStarted && (
            <button
              type="button"
              className="rf-trial-status-close"
              onClick={onClose}
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        <div className="rf-trial-status-content">
          {isStarted ? (
            <>
              <div className="rf-trial-status-icon-bubble rf-trial-status-icon-bubble--success">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>

              <h3>You're all set!</h3>
              <p className="rf-trial-status-description">Your 7-day Reviewfic Pro trial has started</p>

              <button className="rf-trial-status-btn" onClick={onClose}>
                Start Building Widgets
              </button>

              <span className="rf-trial-status-footnote">
                Enjoy full access to Google Reviews, Trustpilot Sync & Canvas insertion
              </span>
            </>
          ) : (
            <>
              <div className="rf-trial-status-icon-bubble rf-trial-status-icon-bubble--locked">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>

              <h3>Your trial has ended</h3>
              <p className="rf-trial-status-description">
                Upgrade now to keep live review syncing and canvas widget updates active.
              </p>

              <button className="rf-trial-status-btn" onClick={onUpgrade}>
                Upgrade to Pro
              </button>

              <button className="rf-trial-status-logout-link" onClick={onLogout}>
                Log out
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

