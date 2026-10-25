import React from "react"
import { ConnectedBusiness, ReviewWidget } from "../../core/types"
import {
    IconSparkles,
    IconPlus,
    IconShieldCheck,
    IconStar,
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
    onOpenBusinesses: () => void
    onOpenWidgets: () => void
}

export function HomeView({
    businesses,
    widgets,
    stats,
    onCreateNewWidget,
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
                        className="primary-cta cf-home-hero-btn"
                        onClick={onCreateNewWidget}
                    >
                        <IconPlus size={14} />
                        <span>Create New Widget</span>
                    </button>
                    <button
                        type="button"
                        className="secondary-cta cf-home-hero-btn"
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
