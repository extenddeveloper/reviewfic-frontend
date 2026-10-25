import React from "react"
import { ConnectedBusiness, ReviewWidget, ReviewLayout } from "../../core/types"
import {
    IconSparkles,
    IconPlus,
    IconShieldCheck,
    IconGoogle,
    IconTrustpilot,
    IconStar,
    IconLayoutCarousel,
    IconLayoutGrid,
    IconLayoutMasonry,
    IconLayoutMarquee,
    IconBadge,
    IconSliders,
    IconExternalLink,
} from "../icons"
import { HelpRow } from "./HelpRow"
import { FrameficCard } from "./FrameficCard"

interface HomeViewProps {
    business: ConnectedBusiness | undefined
    businesses: ConnectedBusiness[]
    widgets: ReviewWidget[]
    stats: {
        totalReviews: number
        averageRating: number
        googleCount: number
        googleRating: number
        trustpilotCount: number
        trustpilotRating: number
    }
    onCreateNewWidget: () => void
    onCreateWithLayout: (layout: ReviewLayout, name: string) => void
    onOpenBusinesses: () => void
    onOpenWidgets: () => void
}

const POPULAR_LAYOUT_PRESETS: Array<{
    id: ReviewLayout
    name: string
    desc: string
    icon: React.ReactNode
}> = [
    {
        id: "carousel",
        name: "Infinite Carousel",
        desc: "Smooth auto-scrolling horizontal cards with pagination & touch drag.",
        icon: <IconLayoutCarousel size={16} />,
    },
    {
        id: "masonry",
        name: "Masonry Wall",
        desc: "Pinterest-style dynamic columns balancing varied comment heights.",
        icon: <IconLayoutMasonry size={16} />,
    },
    {
        id: "grid",
        name: "Responsive Grid",
        desc: "Structured multi-column card layout with crisp alignment.",
        icon: <IconLayoutGrid size={16} />,
    },
    {
        id: "marquee",
        name: "Continuous Marquee",
        desc: "Endless animated ticker showcasing active social proof.",
        icon: <IconLayoutMarquee size={16} />,
    },
    {
        id: "badge",
        name: "Floating Badge",
        desc: "Compact blended rating badge with review counter & star score.",
        icon: <IconBadge size={16} />,
    },
]

export function HomeView({
    business,
    businesses,
    widgets,
    stats,
    onCreateNewWidget,
    onCreateWithLayout,
    onOpenBusinesses,
    onOpenWidgets,
}: HomeViewProps) {
    const totalReviewsAcrossAll = businesses.reduce((acc, b) => {
        return acc + (b.googleReviews?.length || 0) + (b.trustpilotReviews?.length || 0) + (b.customReviews?.length || 0)
    }, 0)

    return (
        <div className="cf-home-container">
            {/* Hero Card */}
            <div className="cf-home-hero">
                <div className="cf-home-badge">
                    <IconSparkles size={13} />
                    <span>Official Reviewfic</span>
                </div>
                <h1 className="cf-home-title">Google &amp; Trustpilot Reviews for Framer</h1>
                <p className="cf-home-subtitle">
                    Aggregate verified social proof, customize responsive review layouts, and insert live-syncing widgets directly onto your canvas.
                </p>
                <div className="cf-home-hero-actions">
                    <button
                        type="button"
                        className="cf-home-cta-primary"
                        onClick={onCreateNewWidget}
                    >
                        <IconPlus size={14} />
                        <span>Create New Widget</span>
                    </button>
                    <button
                        type="button"
                        className="cf-home-cta-secondary"
                        onClick={onOpenBusinesses}
                    >
                        <IconShieldCheck size={14} />
                        <span>Manage Businesses</span>
                    </button>
                </div>
            </div>

            {/* Overview Stats Grid */}
            <div className="cf-home-stats-grid">
                <div className="cf-home-stat-card" onClick={onOpenWidgets} title="Click to view all widgets">
                    <div className="cf-home-stat-value">{widgets.length}</div>
                    <div className="cf-home-stat-label">Review Widgets</div>
                </div>
                <div className="cf-home-stat-card" onClick={onOpenBusinesses} title="Click to view businesses">
                    <div className="cf-home-stat-value">{businesses.length}</div>
                    <div className="cf-home-stat-label">Businesses</div>
                </div>
                <div className="cf-home-stat-card">
                    <div className="cf-home-stat-value">{Math.max(stats.totalReviews, totalReviewsAcrossAll)}</div>
                    <div className="cf-home-stat-label">Synced Reviews</div>
                </div>
                <div className="cf-home-stat-card">
                    <div className="cf-home-stat-value rating">
                        <span>{stats.averageRating ? stats.averageRating.toFixed(1) : "5.0"}</span>
                        <IconStar size={13} />
                    </div>
                    <div className="cf-home-stat-label">Average Score</div>
                </div>
            </div>

            {/* Active Business Summary Card */}
            {business && (
                <div className="cf-home-biz-card">
                    <div className="cf-home-biz-info">
                        <span className="cf-home-biz-label">ACTIVE BUSINESS</span>
                        <div className="cf-home-biz-name-row">
                            <span className="cf-home-biz-name">{business.name}</span>
                            <span className="cf-badge cf-badge-brand">Active</span>
                        </div>
                        <div className="cf-home-biz-sources">
                            <span className="cf-biz-source-badge google">
                                <IconGoogle size={11} />
                                <span>{business.googlePlaceId ? `${business.googleReviews?.length || 0} reviews` : "Not connected"}</span>
                            </span>
                            <span className="cf-biz-source-badge trustpilot">
                                <IconTrustpilot size={11} />
                                <span>{business.trustpilotDomain ? `${business.trustpilotReviews?.length || 0} reviews` : "Not connected"}</span>
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="cf-home-biz-btn"
                        onClick={onOpenBusinesses}
                    >
                        <span>Manage</span>
                        <IconExternalLink size={12} />
                    </button>
                </div>
            )}

            {/* Quick Layout Presets Section */}
            <div className="cf-home-section">
                <div className="cf-home-section-header">
                    <div>
                        <h3 className="cf-home-section-title">Quick Layout Presets</h3>
                        <p className="cf-home-section-subtitle">
                            Jump straight into customizing a layout preset for your canvas.
                        </p>
                    </div>
                </div>

                <div className="cf-home-presets-grid">
                    {POPULAR_LAYOUT_PRESETS.map((preset) => (
                        <div key={preset.id} className="cf-home-preset-card">
                            <div className="cf-home-preset-top">
                                <div className="cf-home-preset-icon">{preset.icon}</div>
                                <h4 className="cf-home-preset-name">{preset.name}</h4>
                            </div>
                            <p className="cf-home-preset-desc">{preset.desc}</p>
                            <button
                                type="button"
                                className="cf-home-preset-btn"
                                onClick={() => onCreateWithLayout(preset.id, preset.name)}
                            >
                                <IconSliders size={12} />
                                <span>Customize</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Help Row */}
            <HelpRow />

            {/* Framefic Ecosystem Cards */}
            <div className="help-section">
                <h3 className="help-section-title">More from Framefic</h3>
                <div className="help-products">
                    <FrameficCard
                        name="Before After Images Slider"
                        description="Advanced image slider fully customizable and responsive."
                        logoSrc="./Favicon.png"
                        marketplaceUrl="https://www.framer.com/marketplace/plugins/beaf/"
                    />
                    <FrameficCard
                        name="Chat Bubbles"
                        description="WhatsApp, Messenger & multi-channel chat widgets for Framer."
                        logoSrc="./chatbubbles-logo.png"
                        marketplaceUrl="https://www.framer.com/marketplace/plugins/chat-bubbles/"
                    />
                    <FrameficCard
                        name="Announcement Bar"
                        description="Create top bars, alerts & countdown timers to boost conversions."
                        logoSrc="./Crestbar.png"
                        marketplaceUrl="https://www.framer.com/community/marketplace/plugins/announcement-bar/"
                    />
                </div>
            </div>
        </div>
    )
}
