import React from "react"

export interface FieldProps {
    label: string
    hint?: string
    children: React.ReactNode
    badge?: string
}

export function Field({ label, hint, children, badge }: FieldProps) {
    return (
        <div className="cf-field">
            <div className="cf-field-header">
                <label className="cf-field-label">{label}</label>
                {badge && <span className="cf-badge cf-badge-brand">{badge}</span>}
            </div>
            {hint && <p className="cf-field-hint">{hint}</p>}
            <div className="cf-field-control">{children}</div>
        </div>
    )
}
