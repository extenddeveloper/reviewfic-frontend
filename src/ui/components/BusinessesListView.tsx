import React from "react"
import { ConnectedBusiness } from "../../core/types"
import { IconGoogle, IconTrustpilot, IconRefresh, IconPlus, IconExternalLink } from "../icons"

interface BusinessesListViewProps {
    businesses: ConnectedBusiness[]
    activeBusinessId: string
    onSelectBusiness: (biz: ConnectedBusiness) => void
    onManageBusinesses: () => void
    onAddBusiness: () => void
    onSyncBusiness: (biz: ConnectedBusiness) => void
    totalViews?: number
    maxMonthlyViews?: number
}

export function BusinessesListView({
    businesses,
    activeBusinessId,
    onSelectBusiness,
    onManageBusinesses,
    onAddBusiness,
    onSyncBusiness,
    totalViews = 82,
    maxMonthlyViews = 300,
}: BusinessesListViewProps) {
    const progressPercent = Math.min(100, Math.round((totalViews / maxMonthlyViews) * 100))

    return (
        <div className="cf-biz-container">
            <div className="cf-biz-header">
                <div>
                    <h2 className="cf-biz-title">Your businesses</h2>
                    <p className="cf-biz-subtitle">
                        Open one to build a widget from its reviews. Each keeps its own reviews, curation and rating.
                    </p>
                </div>
                <div className="cf-biz-header-actions">
                    <button
                        type="button"
                        className="cf-biz-btn-secondary"
                        onClick={onManageBusinesses}
                    >
                        Manage
                    </button>
                    <button
                        type="button"
                        className="cf-biz-btn-primary"
                        onClick={onAddBusiness}
                    >
                        <IconPlus size={14} /> Add a business
                    </button>
                </div>
            </div>

            <div className="cf-biz-card-list">
                {businesses.map((biz) => {
                    const isActive = biz.id === activeBusinessId

                    return (
                        <div
                            key={biz.id}
                            className={"cf-biz-item-card " + (isActive ? "is-active" : "")}
                        >
                            <div className="cf-biz-card-top">
                                <div className="cf-biz-card-name-group">
                                    <h4 className="cf-biz-card-name">{biz.name}</h4>
                                    {isActive && (
                                        <span className="cf-biz-current-pill">
                                            <span>CURRENT</span>
                                        </span>
                                    )}
                                </div>
                                <div className="cf-biz-card-actions">
                                    <button
                                        type="button"
                                        className="cf-biz-row-btn sync"
                                        title="Sync fresh reviews for this business"
                                        onClick={() => onSyncBusiness(biz)}
                                    >
                                        <IconRefresh size={13} />
                                        <span>Sync</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="cf-biz-row-btn open"
                                        onClick={() => onSelectBusiness(biz)}
                                    >
                                        <span>Open</span>
                                        <span className="cf-biz-arrow">→</span>
                                    </button>
                                </div>
                            </div>

                            <div className="cf-biz-card-sources">
                                {biz.googleEnabled && (
                                    <div className="cf-biz-chip google" title="Google Business Reviews">
                                        <IconGoogle size={14} />
                                        <span className="cf-biz-chip-count">{biz.googleReviewCount || 0}</span>
                                        <span className="cf-biz-chip-rating">{biz.googleRating?.toFixed(1) || "5.0"}★</span>
                                    </div>
                                )}
                                {biz.trustpilotEnabled && (
                                    <div className="cf-biz-chip trustpilot" title="Trustpilot Reviews">
                                        <IconTrustpilot size={14} />
                                        <span className="cf-biz-chip-count">{biz.trustpilotReviewCount || 0}</span>
                                        <span className="cf-biz-chip-rating">{biz.trustpilotRating?.toFixed(1) || "5.0"}★</span>
                                    </div>
                                )}
                            </div>

                            <div className="cf-biz-card-meta">
                                <span className="cf-biz-meta-sync">
                                    Last sync: <b>{biz.lastSync || "Just now"}</b>
                                </span>
                                <span className="cf-biz-meta-views">
                                    Views this month: <b>{biz.viewsThisMonth ?? 0}</b>
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="cf-biz-footer-meter">
                <div className="cf-biz-meter-top">
                    <span className="cf-biz-meter-label">Views this month, all businesses</span>
                    <span className="cf-biz-meter-count">{totalViews} / {maxMonthlyViews}</span>
                </div>
                <div className="cf-biz-meter-track">
                    <div
                        className="cf-biz-meter-bar"
                        role="progressbar"
                        aria-valuenow={totalViews}
                        aria-valuemin={0}
                        aria-valuemax={maxMonthlyViews}
                    />
                </div>
                <p className="cf-biz-meter-note">
                    Per-business numbers only count widgets inserted recently, so they can add up to less than this total.
                </p>
            </div>
        </div>
    )
}
