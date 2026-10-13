import React, { useState } from "react"

export interface SectionProps {
    title: string
    subtitle?: string
    icon?: React.ReactNode
    children: React.ReactNode
    defaultOpen?: boolean
    action?: React.ReactNode
}

export function Section({
    title,
    subtitle,
    icon,
    children,
    defaultOpen = true,
    action,
}: SectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className={`cf-section ${isOpen ? "open" : "collapsed"}`}>
            <div className="cf-section-header" onClick={() => setIsOpen(!isOpen)}>
                <div className="cf-section-title-wrap">
                    {icon && <span className="cf-section-icon">{icon}</span>}
                    <div>
                        <h3 className="cf-section-title">{title}</h3>
                        {subtitle && <p className="cf-section-subtitle">{subtitle}</p>}
                    </div>
                </div>
                <div className="cf-section-actions" onClick={(e) => e.stopPropagation()}>
                    {action}
                    <button
                        type="button"
                        className="cf-section-toggle-btn"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label={isOpen ? "Collapse section" : "Expand section"}
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className={`cf-chevron ${isOpen ? "rotated" : ""}`}
                        >
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </button>
                </div>
            </div>
            {isOpen && <div className="cf-section-body">{children}</div>}
        </div>
    )
}
