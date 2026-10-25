import type { ReactNode } from "react"

export interface SectionProps {
    title: string
    subtitle?: string
    description?: string
    badge?: ReactNode
    action?: ReactNode
    children?: ReactNode
    icon?: ReactNode
    defaultOpen?: boolean
}

export function Section({
    title,
    subtitle,
    description,
    badge,
    action,
    children,
    icon,
}: SectionProps) {
    const descText = description || subtitle

    return (
        <section className="cf-section">
            <div className={`cf-section-header${action ? " has-action" : ""}`}>
                <div className="cf-section-header-info">
                    <div className="cf-section-title-row">
                        {icon && <span className="cf-section-header-icon">{icon}</span>}
                        <h2 className="cf-section-title">{title}</h2>
                        {badge}
                    </div>
                    {descText ? <p className="cf-section-desc">{descText}</p> : null}
                </div>
                {action ? <div className="cf-section-action">{action}</div> : null}
            </div>
            {children ? <div className="cf-section-body">{children}</div> : null}
        </section>
    )
}
