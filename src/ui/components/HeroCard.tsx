import React from "react"

export interface HeroCardProps {
    badgeText?: string
    badgeType?: "brand" | "trial" | "success"
    badgeIcon?: React.ReactNode
    statusBadge?: React.ReactNode
    title: string
    description?: string
    ctaLabel?: string
    ctaIcon?: React.ReactNode
    onCtaClick?: () => void
    children?: React.ReactNode
}

export function HeroCard({
    badgeText,
    badgeType = "brand",
    badgeIcon,
    statusBadge,
    title,
    description,
    ctaLabel,
    ctaIcon,
    onCtaClick,
    children,
}: HeroCardProps) {
    return (
        <div className="cf-hero-card">
            <div className="cf-hero-top">
                <div className="cf-hero-badges">
                    {badgeText && (
                        <span className={`cf-badge cf-badge-${badgeType}`}>
                            {badgeIcon && <span className="cf-badge-icon">{badgeIcon}</span>}
                            <span>{badgeText}</span>
                        </span>
                    )}
                </div>
                {statusBadge}
            </div>

            <div className="cf-hero-body">
                <h2 className="cf-hero-title">{title}</h2>
                {description && <p className="cf-hero-desc">{description}</p>}
            </div>

            {ctaLabel && (
                <div className="cf-hero-cta-wrap">
                    <button type="button" className="primary-cta cf-hero-cta" onClick={onCtaClick}>
                        {ctaIcon}
                        <span>{ctaLabel}</span>
                    </button>
                </div>
            )}

            {children && <div className="cf-hero-extra">{children}</div>}
        </div>
    )
}
