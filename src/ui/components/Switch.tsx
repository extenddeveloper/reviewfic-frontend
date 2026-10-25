export interface SwitchProps {
    checked: boolean
    onChange: (checked: boolean) => void
    label?: string
    description?: string
    id?: string
    disabled?: boolean
}

export function Switch({
    checked,
    onChange,
    label,
    description,
    id,
    disabled = false,
}: SwitchProps) {
    const button = (
        <button
            id={id}
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            className={`cf-switch ${checked ? "is-on" : ""}`}
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!disabled) onChange(!checked)
            }}
        >
            <span className="cf-switch-thumb" />
        </button>
    )

    if (label) {
        return (
            <div className="cf-flex-between cf-switch-row">
                <div className="cf-setting-info">
                    <div className="cf-text-sm-semibold">{label}</div>
                    {description ? <div className="cf-text-xs-secondary">{description}</div> : null}
                </div>
                {button}
            </div>
        )
    }

    return button
}
