import React from "react"

export interface SwitchProps {
    checked: boolean
    onChange: (checked: boolean) => void
    label?: string
    id?: string
    disabled?: boolean
}

export function Switch({ checked, onChange, label, id, disabled = false }: SwitchProps) {
    const inputId = id || (label ? `sw-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}` : undefined)

    return (
        <label className={`cf-switch-label ${disabled ? "disabled" : ""}`} htmlFor={inputId}>
            <input
                id={inputId}
                type="checkbox"
                className="cf-switch-input"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
            />
            <span className="cf-switch-slider" />
            {label && <span className="cf-switch-text">{label}</span>}
        </label>
    )
}
