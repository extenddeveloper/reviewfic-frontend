import { framer } from "@framer/plugin"
import { ReviewConfig } from "../core/types"
import { calculateBlendedStats, getActiveReviews } from "../core/config"

export function generateReviewficComponentCode(config: ReviewConfig): string {
    const activeReviews = getActiveReviews(config)
    const stats = calculateBlendedStats(config, activeReviews)

    const serializedConfig = JSON.stringify({
        ...config,
        activeReviews,
        stats,
    })

    return `import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

interface ReviewficProps {
    style?: React.CSSProperties
    layout?: "carousel" | "grid" | "masonry" | "marquee" | "list" | "badge"
    cardStyle?: "elevated" | "minimal" | "glass" | "bento"
    themeMode?: "auto" | "light" | "dark"
    starColor?: string
    gridColumns?: number
    showStars?: boolean
    showSourceIcon?: boolean
    showAvatar?: boolean
    showDate?: boolean
    showVerifiedBadge?: boolean
    showWriteReview?: boolean
    minRating?: number
    carouselAutoplay?: boolean
    carouselSpeed?: number
    marqueeSpeed?: "slow" | "normal" | "fast"
    cornerRadius?: number
    sortOrder?: "newest" | "highest" | "random"
    textClamp?: boolean
    showBrandingBadge?: boolean
}

const DEFAULT_DATA = ${serializedConfig}

export default function Reviewfic(props: ReviewficProps) {
    const {
        layout = DEFAULT_DATA.layout || "carousel",
        cardStyle = DEFAULT_DATA.cardStyle || "elevated",
        themeMode = DEFAULT_DATA.themeMode || "auto",
        starColor = props.starColor || DEFAULT_DATA.starColor || "#FBBC05",
        gridColumns = props.gridColumns || DEFAULT_DATA.gridColumns || 3,
        showStars = props.showStars !== undefined ? props.showStars : DEFAULT_DATA.showStars,
        showSourceIcon = props.showSourceIcon !== undefined ? props.showSourceIcon : DEFAULT_DATA.showSourceIcon,
        showAvatar = props.showAvatar !== undefined ? props.showAvatar : DEFAULT_DATA.showAvatar,
        showDate = props.showDate !== undefined ? props.showDate : DEFAULT_DATA.showDate,
        showVerifiedBadge = props.showVerifiedBadge !== undefined ? props.showVerifiedBadge : DEFAULT_DATA.showVerifiedBadge,
        showWriteReview = props.showWriteReview !== undefined ? props.showWriteReview : DEFAULT_DATA.showWriteReview,
        minRating = props.minRating !== undefined ? props.minRating : (DEFAULT_DATA.minRatingFilter || 0),
        carouselAutoplay = props.carouselAutoplay !== undefined ? props.carouselAutoplay : DEFAULT_DATA.carouselAutoplay,
        carouselSpeed = props.carouselSpeed || DEFAULT_DATA.carouselSpeed || 5,
        marqueeSpeed = props.marqueeSpeed || DEFAULT_DATA.marqueeSpeed || "normal",
        cornerRadius = props.cornerRadius !== undefined ? props.cornerRadius : (DEFAULT_DATA.cornerRadius || 16),
        sortOrder = props.sortOrder || DEFAULT_DATA.sortOrder || "newest",
        textClamp = props.textClamp !== undefined ? props.textClamp : (DEFAULT_DATA.textClamp ?? true),
        showBrandingBadge = props.showBrandingBadge !== undefined ? props.showBrandingBadge : (DEFAULT_DATA.showBrandingBadge ?? true),
    } = props

    const reviews = React.useMemo(() => {
        let list = Array.isArray(DEFAULT_DATA.activeReviews) ? [...DEFAULT_DATA.activeReviews] : []
        if (minRating > 0) {
            list = list.filter((r: any) => r.rating >= minRating)
        }
        if (sortOrder === "highest") {
            list.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
        } else if (sortOrder === "random") {
            list.sort((a: any, b: any) => String(a.id || "").localeCompare(String(b.id || "")))
        }
        return list
    }, [minRating, sortOrder])

    const stats = DEFAULT_DATA.stats || {
        averageRating: 4.9,
        totalReviews: 230,
        googleCount: 142,
        trustpilotCount: 88,
    }

    const [carouselIndex, setCarouselIndex] = React.useState(0)
    const [isHovered, setIsHovered] = React.useState(false)
    const [expandedCards, setExpandedCards] = React.useState<Record<string, boolean>>({})

    const toggleExpand = React.useCallback((id: string) => {
        setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }))
    }, [])

    // Carousel autoplay timer
    React.useEffect(() => {
        if (layout !== "carousel" || !carouselAutoplay || isHovered || reviews.length <= 1) return
        const timer = setInterval(() => {
            setCarouselIndex((prev) => (prev + 1) % reviews.length)
        }, Math.max(2, carouselSpeed) * 1000)
        return () => clearInterval(timer)
    }, [layout, carouselAutoplay, carouselSpeed, isHovered, reviews.length])

    const handlePrev = React.useCallback(() => {
        setCarouselIndex((prev) => (prev - 1 + reviews.length) % reviews.length)
    }, [reviews.length])

    const handleNext = React.useCallback(() => {
        setCarouselIndex((prev) => (prev + 1) % reviews.length)
    }, [reviews.length])

    const renderStars = (rating: number) => {
        return (
            <div className="rf-stars-row">
                {[1, 2, 3, 4, 5].map((s) => (
                    <svg
                        key={s}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill={s <= rating ? starColor : "none"}
                        stroke={starColor}
                        strokeWidth="1.5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                        />
                    </svg>
                ))}
            </div>
        )
    }

    const renderCard = (r: any, idx: number) => {
        const cardInlineStyle = { borderRadius: cornerRadius + "px" }
        const cardId = String(r.id || idx)
        const isExpanded = Boolean(expandedCards[cardId])
        const isLongText = Boolean(r.text && r.text.length > 120)
        const shouldClamp = textClamp && !isExpanded && isLongText
        const displayText = shouldClamp ? r.text.slice(0, 115) + "..." : r.text

        return (
            <div
                key={cardId}
                className={"rf-card " + cardStyle}
                style={cardInlineStyle}
            >
                <div className="rf-card-top">
                    <div className="rf-card-author">
                        {showAvatar && (
                            <div className="rf-avatar">
                                {r.authorAvatar ? (
                                    <img src={r.authorAvatar} alt={r.authorName} className="rf-avatar-img" />
                                ) : (
                                    <div className="rf-avatar-fallback">
                                        {(r.authorName || "C").charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="rf-author-meta">
                            <div className="rf-author-name-row">
                                <span className="rf-author-name">{r.authorName}</span>
                                {showVerifiedBadge && r.verified && (
                                    <span className="rf-verified-pill" title="Verified Customer">
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                    </span>
                                )}
                            </div>
                            {showDate && <span className="rf-date">{r.date}</span>}
                        </div>
                    </div>

                    {showSourceIcon && (
                        <div className="rf-source-icon">
                            {r.source === "google" && (
                                <svg width="15" height="15" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                                </svg>
                            )}
                            {r.source === "trustpilot" && (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                    <rect width="24" height="24" rx="4" fill="#00B67A" />
                                    <path d="M12 4.5l2.3 7.1h7.4l-6 4.4 2.3 7.1-6-4.4-6 4.4 2.3-7.1-6-4.4h7.4z" fill="#FFFFFF" />
                                </svg>
                            )}
                            {r.source === "custom" && (
                                <span className="rf-custom-pill">Customer testimonial</span>
                            )}
                        </div>
                    )}
                </div>

                {showStars && renderStars(r.rating)}

                <p className={"rf-card-text" + (shouldClamp ? " clamped" : "")}>{displayText}</p>

                {textClamp && isLongText && (
                    <button
                        type="button"
                        className="rf-read-more-btn"
                        onClick={() => toggleExpand(cardId)}
                    >
                        {isExpanded ? "Show less" : "Read more"}
                    </button>
                )}

                {r.source === "google" && (
                    <a
                        href={r.originalUrl || DEFAULT_DATA.googleMapsUrl || "https://google.com"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rf-platform-link"
                        title="Read on Google"
                    >
                        <span>Read on Google</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                    </a>
                )}

                {r.source === "trustpilot" && (
                    <a
                        href={r.originalUrl || (DEFAULT_DATA.trustpilotDomain ? ("https://trustpilot.com/review/" + DEFAULT_DATA.trustpilotDomain) : "https://trustpilot.com")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rf-platform-link"
                        title="Read on Trustpilot"
                    >
                        <span>Read on Trustpilot</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                    </a>
                )}
            </div>
        )
    }

    const gridStyleObj = { ["--rf-cols" as any]: gridColumns }
    const carouselTrackStyleObj = { transform: "translateX(-" + (carouselIndex * 100) + "%)" }
    const marqueeTrackStyleObj = {
        ["--rf-marquee-dur" as any]: marqueeSpeed === "slow" ? "50s" : marqueeSpeed === "fast" ? "22s" : "34s",
    }
    const badgeStyleObj = { borderRadius: cornerRadius + "px" }

    return (
        <div className={"rf-widget " + themeMode} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <style>{\`
                .rf-widget {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    width: 100%;
                    box-sizing: border-box;
                    color: #111827;
                    --rf-bg: #FFFFFF;
                    --rf-card-bg: #FFFFFF;
                    --rf-border: rgba(0, 0, 0, 0.08);
                    --rf-text-muted: #6B7280;
                    --rf-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.06);
                }
                .rf-widget.dark {
                    color: #F9FAFB;
                    --rf-bg: #111827;
                    --rf-card-bg: #1F2937;
                    --rf-border: rgba(255, 255, 255, 0.1);
                    --rf-text-muted: #9CA3AF;
                    --rf-shadow: 0 4px 24px -2px rgba(0, 0, 0, 0.35);
                }
                @media (prefers-color-scheme: dark) {
                    .rf-widget.auto {
                        color: #F9FAFB;
                        --rf-bg: #111827;
                        --rf-card-bg: #1F2937;
                        --rf-border: rgba(255, 255, 255, 0.1);
                        --rf-text-muted: #9CA3AF;
                        --rf-shadow: 0 4px 24px -2px rgba(0, 0, 0, 0.35);
                    }
                }

                .rf-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 20px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--rf-border);
                }
                .rf-header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .rf-rating-score {
                    font-size: 26px;
                    font-weight: 700;
                    line-height: 1;
                }
                .rf-header-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .rf-review-count {
                    font-size: 13px;
                    color: var(--rf-text-muted);
                }
                .rf-sources-pill {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    padding: 3px 8px;
                    background: rgba(0, 0, 0, 0.04);
                    border-radius: 999px;
                    color: var(--rf-text-muted);
                }
                .rf-widget.dark .rf-sources-pill,
                .rf-widget.auto .rf-sources-pill {
                    background: rgba(255, 255, 255, 0.08);
                }

                .rf-btn-write {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    background: #0077E6;
                    color: #FFFFFF;
                    font-size: 13px;
                    font-weight: 600;
                    border-radius: 8px;
                    text-decoration: none;
                    transition: opacity 0.2s;
                }
                .rf-btn-write:hover {
                    opacity: 0.9;
                }

                .rf-card {
                    box-sizing: border-box;
                    padding: 20px;
                    background: var(--rf-card-bg);
                    border: 1px solid var(--rf-border);
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    min-height: 140px;
                }
                .rf-card.elevated {
                    box-shadow: var(--rf-shadow);
                }
                .rf-card.glass {
                    backdrop-filter: blur(12px);
                    background: rgba(255, 255, 255, 0.05);
                }
                .rf-card.bento {
                    border: 1px solid var(--rf-border);
                    background: linear-gradient(180deg, var(--rf-card-bg) 0%, rgba(0, 119, 230, 0.03) 100%);
                }
                .rf-card-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .rf-card-author {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .rf-avatar {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    overflow: hidden;
                    flex-shrink: 0;
                }
                .rf-avatar-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .rf-avatar-fallback {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #0099FF, #0055B3);
                    color: #FFFFFF;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 14px;
                }
                .rf-author-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .rf-author-name-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .rf-author-name {
                    font-size: 14px;
                    font-weight: 600;
                }
                .rf-verified-pill {
                    color: #10B981;
                    display: flex;
                    align-items: center;
                }
                .rf-date {
                    font-size: 12px;
                    color: var(--rf-text-muted);
                }
                .rf-stars-row {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                }
                .rf-card-text {
                    font-size: 13.5px;
                    line-height: 1.55;
                    margin: 0;
                    color: inherit;
                }
                .rf-card-text.clamped {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .rf-read-more-btn {
                    background: none;
                    border: none;
                    padding: 0;
                    color: #0077E6;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    text-align: left;
                    margin-top: 2px;
                    align-self: flex-start;
                }
                .rf-read-more-btn:hover {
                    text-decoration: underline;
                }
                .rf-platform-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    font-weight: 500;
                    color: var(--rf-text-muted);
                    text-decoration: none;
                    margin-top: auto;
                    padding-top: 6px;
                    transition: color 0.15s ease;
                }
                .rf-platform-link:hover {
                    color: #0077E6;
                    text-decoration: underline;
                }
                .rf-custom-pill {
                    display: inline-flex;
                    align-items: center;
                    padding: 2px 7px;
                    border-radius: 999px;
                    font-size: 10px;
                    font-weight: 600;
                    background: rgba(0, 119, 230, 0.08);
                    color: #0077E6;
                }
                .rf-badge-brand-link {
                    color: inherit;
                    font-weight: 600;
                    text-decoration: none;
                }
                .rf-badge-brand-link:hover {
                    text-decoration: underline;
                }
                @media (prefers-reduced-motion: reduce) {
                    .rf-marquee-track {
                        animation: none !important;
                    }
                    .rf-carousel-track {
                        transition: none !important;
                    }
                }

                /* Layout: Grid */
                .rf-grid {
                    display: grid;
                    grid-template-columns: repeat(var(--rf-cols, 3), 1fr);
                    gap: 16px;
                }
                @media (max-width: 900px) {
                    .rf-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 600px) {
                    .rf-grid { grid-template-columns: 1fr !important; }
                }

                /* Layout: Masonry */
                .rf-masonry {
                    column-count: var(--rf-cols, 3);
                    column-gap: 16px;
                }
                .rf-masonry .rf-card {
                    break-inside: avoid;
                    margin-bottom: 16px;
                }
                @media (max-width: 900px) {
                    .rf-masonry { column-count: 2 !important; }
                }
                @media (max-width: 600px) {
                    .rf-masonry { column-count: 1 !important; }
                }

                /* Layout: Carousel */
                .rf-carousel-wrap {
                    position: relative;
                }
                .rf-carousel-viewport {
                    overflow: hidden;
                    width: 100%;
                }
                .rf-carousel-track {
                    display: flex;
                    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .rf-carousel-slide {
                    flex: 0 0 100%;
                    max-width: 100%;
                    box-sizing: border-box;
                    padding: 0 4px;
                }
                .rf-carousel-nav {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    margin-top: 14px;
                }
                .rf-carousel-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 1px solid var(--rf-border);
                    background: var(--rf-card-bg);
                    color: inherit;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: opacity 0.2s;
                }
                .rf-carousel-btn:hover { opacity: 0.7; }
                .rf-carousel-dots {
                    display: flex;
                    gap: 6px;
                }
                .rf-carousel-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: var(--rf-border);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .rf-carousel-dot.active {
                    background: #0077E6;
                    width: 18px;
                    border-radius: 4px;
                }

                /* Layout: Marquee */
                .rf-marquee-container {
                    overflow: hidden;
                    width: 100%;
                    position: relative;
                }
                .rf-marquee-track {
                    display: flex;
                    gap: 16px;
                    width: max-content;
                    animation: rfMarqueeScroll var(--rf-marquee-dur, 35s) linear infinite;
                }
                .rf-marquee-track:hover {
                    animation-play-state: paused;
                }
                .rf-marquee-container .rf-card {
                    width: 300px;
                    flex-shrink: 0;
                }
                @keyframes rfMarqueeScroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }

                /* Layout: Badge */
                .rf-badge-mode {
                    display: inline-flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 18px;
                    border-radius: 999px;
                    background: var(--rf-card-bg);
                    border: 1px solid var(--rf-border);
                    box-shadow: var(--rf-shadow);
                }
                .rf-badge-score {
                    font-size: 16px;
                    font-weight: 700;
                }
                .rf-badge-text {
                    font-size: 12px;
                    color: var(--rf-text-muted);
                }

                .rf-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                /* Footer */
                .rf-footer {
                    margin-top: 18px;
                    font-size: 11px;
                    color: var(--rf-text-muted);
                    text-align: center;
                    opacity: 0.7;
                }
            \`}</style>

            {layout !== "badge" && (
                <div className="rf-header">
                    <div className="rf-header-left">
                        <span className="rf-rating-score">{stats.averageRating}</span>
                        <div className="rf-header-meta">
                            {renderStars(Math.round(stats.averageRating))}
                            <span className="rf-review-count">Based on {stats.totalReviews}+ verified reviews</span>
                        </div>
                    </div>

                    <div className="rf-sources-pill">
                        <span>Google ({stats.googleCount})</span>
                        <span>•</span>
                        <span>Trustpilot ({stats.trustpilotCount})</span>
                    </div>

                    {showWriteReview && (
                        <a
                            href={DEFAULT_DATA.writeReviewGoogleUrl || DEFAULT_DATA.writeReviewTrustpilotUrl || "https://google.com"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rf-btn-write"
                        >
                            <span>Write a Review</span>
                        </a>
                    )}
                </div>
            )}

            {layout === "grid" && (
                <div className="rf-grid" style={gridStyleObj}>
                    {reviews.map((r: any, idx: number) => renderCard(r, idx))}
                </div>
            )}

            {layout === "masonry" && (
                <div className="rf-masonry" style={gridStyleObj}>
                    {reviews.map((r: any, idx: number) => renderCard(r, idx))}
                </div>
            )}

            {layout === "carousel" && (
                <div className="rf-carousel-wrap">
                    <div className="rf-carousel-viewport">
                        <div
                            className="rf-carousel-track"
                            style={carouselTrackStyleObj}
                        >
                            {reviews.map((r: any, idx: number) => (
                                <div key={r.id || idx} className="rf-carousel-slide">
                                    {renderCard(r, idx)}
                                </div>
                            ))}
                        </div>
                    </div>
                    {reviews.length > 1 && (
                        <div className="rf-carousel-nav">
                            <button type="button" className="rf-carousel-btn" onClick={handlePrev} aria-label="Previous review">
                                ‹
                            </button>
                            <div className="rf-carousel-dots">
                                {reviews.map((_: any, dotIdx: number) => (
                                    <span
                                        key={dotIdx}
                                        className={"rf-carousel-dot " + (dotIdx === carouselIndex ? "active" : "")}
                                        onClick={() => setCarouselIndex(dotIdx)}
                                    />
                                ))}
                            </div>
                            <button type="button" className="rf-carousel-btn" onClick={handleNext} aria-label="Next review">
                                ›
                            </button>
                        </div>
                    )}
                </div>
            )}

            {layout === "marquee" && (
                <div className="rf-marquee-container">
                    <div
                        className="rf-marquee-track"
                        style={marqueeTrackStyleObj}
                    >
                        {[...reviews, ...reviews].map((r: any, idx: number) => renderCard(r, idx))}
                    </div>
                </div>
            )}

            {layout === "list" && (
                <div className="rf-list">
                    {reviews.map((r: any, idx: number) => renderCard(r, idx))}
                </div>
            )}

            {layout === "badge" && (
                <div className="rf-badge-mode" style={badgeStyleObj}>
                    {renderStars(Math.round(stats.averageRating))}
                    <span className="rf-badge-score">{stats.averageRating}</span>
                    <span className="rf-badge-text">Rated {stats.averageRating}/5 on Google & Trustpilot ({stats.totalReviews}+ reviews)</span>
                </div>
            )}

            {showBrandingBadge && (
                <div className="rf-footer">
                    <span>Verified reviews via Google &amp; Trustpilot · </span>
                    <a href="https://reviewfic.com" target="_blank" rel="noopener noreferrer" className="rf-badge-brand-link">Reviews by Reviewfic</a>
                </div>
            )}
        </div>
    )
}

Reviewfic.defaultProps = {
    layout: "carousel",
    cardStyle: "elevated",
    themeMode: "auto",
    starColor: "#FBBC05",
    gridColumns: 3,
    showStars: true,
    showSourceIcon: true,
    showAvatar: true,
    showDate: true,
    showVerifiedBadge: true,
    showWriteReview: true,
    minRating: 0,
    carouselAutoplay: true,
    carouselSpeed: 5,
    marqueeSpeed: "normal",
    cornerRadius: 16,
    sortOrder: "newest",
    textClamp: true,
    showBrandingBadge: true,
}

addPropertyControls(Reviewfic, {
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["carousel", "grid", "masonry", "marquee", "list", "badge"],
        optionTitles: ["Carousel", "Grid", "Masonry", "Marquee Ticker", "List", "Trust Badge"],
        defaultValue: "carousel",
    },
    cardStyle: {
        type: ControlType.Enum,
        title: "Card Style",
        options: ["elevated", "minimal", "glass", "bento"],
        optionTitles: ["Elevated Card", "Minimal Border", "Glassmorphic", "Bento Box"],
        defaultValue: "elevated",
    },
    themeMode: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["auto", "light", "dark"],
        optionTitles: ["Auto (Site Theme)", "Light Mode", "Dark Mode"],
        defaultValue: "auto",
    },
    starColor: {
        type: ControlType.Color,
        title: "Star Color",
        defaultValue: "#FBBC05",
    },
    minRating: {
        type: ControlType.Enum,
        title: "Min Rating",
        options: [0, 4, 5],
        optionTitles: ["All Reviews", "4+ Stars Only", "5 Stars Only"],
        defaultValue: 0,
    },
    gridColumns: {
        type: ControlType.Number,
        title: "Columns",
        min: 1,
        max: 4,
        step: 1,
        defaultValue: 3,
        hidden: (props: any) => props.layout !== "grid" && props.layout !== "masonry",
    },
    carouselAutoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        hidden: (props: any) => props.layout !== "carousel",
    },
    carouselSpeed: {
        type: ControlType.Number,
        title: "Interval (s)",
        min: 2,
        max: 15,
        step: 1,
        defaultValue: 5,
        hidden: (props: any) => props.layout !== "carousel",
    },
    marqueeSpeed: {
        type: ControlType.Enum,
        title: "Speed",
        options: ["slow", "normal", "fast"],
        optionTitles: ["Slow", "Normal", "Fast"],
        defaultValue: "normal",
        hidden: (props: any) => props.layout !== "marquee",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 32,
        step: 2,
        defaultValue: 16,
    },
    showStars: {
        type: ControlType.Boolean,
        title: "Show Stars",
        defaultValue: true,
    },
    showAvatar: {
        type: ControlType.Boolean,
        title: "Show Avatars",
        defaultValue: true,
    },
    showDate: {
        type: ControlType.Boolean,
        title: "Show Date",
        defaultValue: true,
    },
    showSourceIcon: {
        type: ControlType.Boolean,
        title: "Source Badges",
        defaultValue: true,
    },
    showVerifiedBadge: {
        type: ControlType.Boolean,
        title: "Verified Pill",
        defaultValue: true,
    },
    showWriteReview: {
        type: ControlType.Boolean,
        title: "Write Review",
        defaultValue: true,
    },
    sortOrder: {
        type: ControlType.Enum,
        title: "Sort Order",
        options: ["newest", "highest", "random"],
        optionTitles: ["Newest First", "Highest Rating", "Random Shuffle"],
        defaultValue: "newest",
    },
    textClamp: {
        type: ControlType.Boolean,
        title: "Clamp Long Text",
        defaultValue: true,
    },
    showBrandingBadge: {
        type: ControlType.Boolean,
        title: "Reviewfic Badge",
        defaultValue: true,
    },
})
`
}

export async function insertCanvasComponent(config: ReviewConfig): Promise<{ success: boolean; message: string }> {
    const code = generateReviewficComponentCode(config)
    const fileName = "Reviewfic.tsx"

    try {
        if (typeof (framer as any).isAllowedTo === "function") {
            try {
                await (framer as any).isAllowedTo("createCodeFile", "addComponentInstance", "setSelection")
            } catch {}
        }

        const files = await framer.getCodeFiles()
        let file = files.find((f) => f.name === fileName || f.name === "Reviewfic")

        if (file) {
            await file.setFileContent(code)
        } else {
            file = await framer.createCodeFile(fileName, code, { editViaPlugin: true })
        }

        const componentExport = file.exports.find((exp) => exp.type === "component")
        if (componentExport && "insertURL" in componentExport) {
            const instance = (await framer.addComponentInstance({
                url: componentExport.insertURL,
                attributes: {
                    controls: {
                        layout: config.layout || "carousel",
                        cardStyle: config.cardStyle || "elevated",
                        themeMode: config.themeMode || "auto",
                        starColor: config.starColor || "#FBBC05",
                        gridColumns: config.gridColumns || 3,
                        showStars: config.showStars,
                        showSourceIcon: config.showSourceIcon,
                        showAvatar: config.showAvatar,
                        showDate: config.showDate,
                        showVerifiedBadge: config.showVerifiedBadge,
                        showWriteReview: config.showWriteReview,
                        minRating: config.minRatingFilter || 0,
                        carouselAutoplay: config.carouselAutoplay,
                        carouselSpeed: config.carouselSpeed || 5,
                        marqueeSpeed: config.marqueeSpeed || "normal",
                        cornerRadius: config.cornerRadius || 16,
                        sortOrder: config.sortOrder || "newest",
                        textClamp: config.textClamp !== undefined ? config.textClamp : true,
                        showBrandingBadge: config.showBrandingBadge !== undefined ? config.showBrandingBadge : true,
                    },
                },
            })) as any

            if (instance?.id) {
                try {
                    await framer.setSelection([instance.id])
                } catch {}
            }

            return {
                success: true,
                message: "Reviewfic component inserted onto the canvas! Customize it in the property panel as needed.",
            }
        }

        return {
            success: true,
            message: "Reviewfic component updated in your Code Assets! You can drag it onto any page.",
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to insert component onto canvas.",
        }
    }
}

export function isReviewficInstance(node: any): boolean {
    if (!node) return false
    if (node.componentName === "Reviewfic") return true
    if (typeof node.name === "string" && node.name.includes("Reviewfic")) return true
    if (typeof node.insertURL === "string" && node.insertURL.includes("Reviewfic")) return true
    if (typeof node.componentIdentifier === "string" && node.componentIdentifier.includes("Reviewfic")) return true
    return false
}

export async function getCanvasInstancesCount(): Promise<number> {
    try {
        const instances = (await framer.getNodesWithType("ComponentInstanceNode")) as any[]
        if (!instances) return 0
        return instances.filter(isReviewficInstance).length
    } catch {
        return 0
    }
}

export async function removeAllCanvasInstances(): Promise<number> {
    try {
        const instances = (await framer.getNodesWithType("ComponentInstanceNode")) as any[]
        if (!instances || instances.length === 0) return 0
        let removed = 0
        for (const inst of instances) {
            if (isReviewficInstance(inst)) {
                if (typeof inst.remove === "function") {
                    await inst.remove()
                    removed++
                }
            }
        }
        return removed
    } catch {
        return 0
    }
}
