import React from "react"
import { ConnectedBusiness } from "../../core/types"
import { IconGoogle, IconTrustpilot, IconRefresh, IconPlus } from "../icons"

interface BusinessesListViewProps {
    businesses: ConnectedBusiness[]
    activeBusinessId: string
    onSelectBusiness: (biz: ConnectedBusiness) => void
    onManageBusinesses: () => void
    onAddBusiness: () => void
    onSyncBusiness: (biz: ConnectedBusiness) => void
}

export function BusinessesListView({
    businesses,
    activeBusinessId,
    onSelectBusiness,
    onManageBusinesses,
    onAddBusiness,
    onSyncBusiness,
}: BusinessesListViewProps) {
    return (
        <div className="cf-biz-container">
            {/* Header: Title, Description & Action Buttons */}
            <div className="cf-biz-header">
                <div className="cf-biz-header-text">
                    <h2 className="cf-biz-title">Your businesses</h2>
                    <p className="cf-biz-subtitle">
                        Open one to build a widget from its reviews. Each keeps its own reviews, curation and rating.
                    </p>
                </div>
                <div className="cf-biz-header-actions">
                    <button
                        type="button"
                        className="secondary-cta cf-biz-head-btn"
                        onClick={onManageBusinesses}
                    >
                        Manage
                    </button>
                    <button
                        type="button"
                        className="primary-cta cf-biz-head-btn"
                        onClick={onAddBusiness}
                    >
                        <IconPlus size={13} />
                        <span>Add a business</span>
                    </button>
                </div>
            </div>

            {/* List of Business Cards */}
            <div className="cf-biz-card-list">
                {businesses.map((biz) => {
                    const isActive = biz.id === activeBusinessId

                    return (
                        <div
                            key={biz.id}
                            className={"cf-biz-item-card " + (isActive ? "is-active" : "")}
                        >
                            {/* Card Header: Business Name & CURRENT Status */}
                            <div className="cf-biz-card-header">
                                <h3 className="cf-biz-card-name" title={biz.name}>
                                    {biz.name}
                                </h3>
                                {isActive && (
                                    <span className="cf-biz-current-pill">
                                        CURRENT
                                    </span>
                                )}
                            </div>

                            {/* Source Badges Row: Google & Trustpilot */}
                            <div className="cf-biz-card-sources">
                                {biz.googleEnabled ? (
                                    <div className="cf-biz-chip google" title="Google Business Reviews">
                                        <IconGoogle size={14} />
                                        <span className="cf-biz-chip-count">{biz.googleReviewCount || 0}</span>
                                        <span className="cf-biz-chip-rating">{biz.googleRating?.toFixed(1) || "5.0"}★</span>
                                    </div>
                                ) : (
                                    <div className="cf-biz-chip inactive" title="Google not connected">
                                        <IconGoogle size={14} />
                                        <span className="cf-biz-chip-count">Not connected</span>
                                    </div>
                                )}
                                {biz.trustpilotEnabled ? (
                                    <div className="cf-biz-chip trustpilot" title="Trustpilot Reviews">
                                        <IconTrustpilot size={14} />
                                        <span className="cf-biz-chip-count">{biz.trustpilotReviewCount || 0}</span>
                                        <span className="cf-biz-chip-rating">{biz.trustpilotRating?.toFixed(1) || "5.0"}★</span>
                                    </div>
                                ) : (
                                    <div className="cf-biz-chip inactive" title="Trustpilot not connected">
                                        <IconTrustpilot size={14} />
                                        <span className="cf-biz-chip-count">Not connected</span>
                                    </div>
                                )}
                            </div>

                            {/* Metadata Row: Last sync */}
                            <div className="cf-biz-card-meta">
                                <span className="cf-biz-meta-sync">
                                    Last sync: <b>{biz.lastSync || "Just now"}</b>
                                </span>
                            </div>

                            {/* Actions Row: Sync and Open Business buttons */}
                            <div className="cf-biz-card-actions-row">
                                <button
                                    type="button"
                                    className="secondary-cta cf-biz-action-btn"
                                    title="Sync fresh reviews for this business"
                                    onClick={() => onSyncBusiness(biz)}
                                >
                                    <IconRefresh size={13} />
                                    <span>Sync</span>
                                </button>
                                <button
                                    type="button"
                                    className="primary-cta cf-biz-action-btn"
                                    onClick={() => onSelectBusiness(biz)}
                                    title="Open this business and customize review widgets"
                                >
                                    <span>Open</span>
                                    <span className="cf-biz-arrow">→</span>
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
