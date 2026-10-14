import { framer } from "@framer/plugin"
import { ReviewConfig } from "../core/types"
import { calculateBlendedStats, getActiveReviews } from "../core/config"
import { WIDGET_BUNDLE_CSS } from "./widget-styles-const"

export function generateReviewficComponentCode(config: ReviewConfig): string {
    const activeReviews = getActiveReviews(config)
    const stats = calculateBlendedStats(config, activeReviews)

    const serializedConfig = JSON.stringify({
        ...config,
        activeReviews,
        stats,
    })

    const serializedCSS = JSON.stringify(WIDGET_BUNDLE_CSS)

    return `import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

export type ReviewLayout =
    | "grid" | "masonry" | "highlight" | "list"
    | "pinboard" | "duo" | "feature" | "band" | "spotlightgrid"
    | "carousel" | "ticker" | "wall" | "spotlight"
    | "compact" | "orbit" | "breakdown" | "ribbon" | "gallery" | "flow" | "split"
    | "badge" | "avatars" | "ratingcard" | "gbadge" | "trustpilot"

export type CardStyle =
    | "elevated" | "outline" | "gradient" | "glass" | "bento" | "spotlight" | "aurora" | "frame"
    | "google" | "gcompact" | "gdark" | "tp" | "tpstrip" | "tpc" | "verified" | "plain"
    | "quote" | "pull" | "mag" | "news" | "press" | "museum" | "ruled" | "broad"
    | "reveal" | "unfold" | "tilt" | "shine" | "trace" | "pop" | "unblur" | "liquid"
    | "brutal" | "neon" | "duo" | "sticker" | "neu" | "sheen" | "pearl" | "term" | "memphis"
    | "clay" | "linen" | "eink" | "sage" | "pebble" | "kraft" | "sunbaked" | "ceramic"
    | "noir" | "gilt" | "hotel" | "couture" | "onyx" | "platinum" | "velvet" | "atelier"

interface ReviewficProps {
    style?: React.CSSProperties
    layout?: ReviewLayout
    cardStyle?: CardStyle
    themeMode?: "auto" | "light" | "dark"
    containerBg?: string
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
    carouselInfinite?: boolean
    marqueeSpeed?: "slow" | "normal" | "fast"
    maxReviews?: number
    cornerRadius?: number
    sortOrder?: "newest" | "highest" | "random"
    textClamp?: boolean
    showBrandingBadge?: boolean
    reviewsData?: string
    statsData?: string
}

const DEFAULT_DATA = ${serializedConfig}
const WIDGET_BUNDLE_CSS = ${serializedCSS}

export default function Reviewfic(props: ReviewficProps) {
    const layout = props.layout ?? DEFAULT_DATA.layout ?? "carousel"
    const cardStyle = props.cardStyle ?? DEFAULT_DATA.cardStyle ?? "elevated"
    const themeMode = props.themeMode ?? DEFAULT_DATA.themeMode ?? "auto"
    const containerBg = props.containerBg || DEFAULT_DATA.containerBg || ""
    const starColor = props.starColor ?? DEFAULT_DATA.starColor ?? "#FBBC05"
    const gridColumns = props.gridColumns ?? DEFAULT_DATA.gridColumns ?? 3
    const showStars = props.showStars !== undefined ? props.showStars : (DEFAULT_DATA.showStars ?? true)
    const showSourceIcon = props.showSourceIcon !== undefined ? props.showSourceIcon : (DEFAULT_DATA.showSourceIcon ?? true)
    const showAvatar = props.showAvatar !== undefined ? props.showAvatar : (DEFAULT_DATA.showAvatar ?? true)
    const showDate = props.showDate !== undefined ? props.showDate : (DEFAULT_DATA.showDate ?? true)
    const showVerifiedBadge = props.showVerifiedBadge !== undefined ? props.showVerifiedBadge : (DEFAULT_DATA.showVerifiedBadge ?? true)
    const showWriteReview = props.showWriteReview !== undefined ? props.showWriteReview : (DEFAULT_DATA.showWriteReview ?? true)
    const minRating = props.minRating !== undefined ? props.minRating : (DEFAULT_DATA.minRatingFilter || 0)
    const carouselAutoplay = props.carouselAutoplay !== undefined ? props.carouselAutoplay : (DEFAULT_DATA.carouselAutoplay ?? true)
    const carouselSpeed = props.carouselSpeed || DEFAULT_DATA.carouselSpeed || 5
    const carouselInfinite = props.carouselInfinite !== undefined ? props.carouselInfinite : (DEFAULT_DATA.carouselInfinite ?? true)
    const marqueeSpeed = props.marqueeSpeed || DEFAULT_DATA.marqueeSpeed || "normal"
    const cornerRadius = props.cornerRadius !== undefined ? props.cornerRadius : (DEFAULT_DATA.cornerRadius || 16)
    const maxReviews = props.maxReviews !== undefined ? props.maxReviews : (DEFAULT_DATA.maxReviews ?? 24)
    const sortOrder = props.sortOrder || DEFAULT_DATA.sortOrder || "newest"
    const textClamp = props.textClamp !== undefined ? props.textClamp : (DEFAULT_DATA.textClamp ?? true)
    const showBrandingBadge = props.showBrandingBadge !== undefined ? props.showBrandingBadge : (DEFAULT_DATA.showBrandingBadge ?? true)

    const reviews = React.useMemo(() => {
        let list: any[] = []
        if (props.reviewsData) {
            try {
                const parsed = JSON.parse(props.reviewsData)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    list = parsed
                }
            } catch {}
        }
        if (list.length === 0 && Array.isArray(DEFAULT_DATA.activeReviews)) {
            list = [...DEFAULT_DATA.activeReviews]
        }
        if (minRating > 0) {
            list = list.filter((r: any) => r.rating >= minRating)
        }
        if (sortOrder === "highest") {
            list.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
        } else if (sortOrder === "random") {
            list.sort((a: any, b: any) => String(a.id || "").localeCompare(String(b.id || "")))
        }
        if (maxReviews > 0) {
            list = list.slice(0, maxReviews)
        }
        return list
    }, [props.reviewsData, minRating, sortOrder, maxReviews])

    const stats = React.useMemo(() => {
        if (props.statsData) {
            try {
                const parsed = JSON.parse(props.statsData)
                if (parsed && typeof parsed.averageRating === "number") {
                    return parsed
                }
            } catch {}
        }
        return DEFAULT_DATA.stats || {
            averageRating: 4.9,
            totalReviews: 230,
            googleCount: 142,
            trustpilotCount: 88,
        }
    }, [props.statsData])

    const [spotlightIndex, setSpotlightIndex] = React.useState(0)
    const [galleryIndex, setGalleryIndex] = React.useState(0)
    const [orbitIndex, setOrbitIndex] = React.useState(0)
    const [ribbonIndex, setRibbonIndex] = React.useState(0)
    const [isHovered, setIsHovered] = React.useState(false)
    const [expandedCards, setExpandedCards] = React.useState<Record<string, boolean>>({})

    const getInitials = (name: string) => {
        const parts = (name || "").trim().split(/\s+/).filter(Boolean)
        if (!parts.length) return "?"
        return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }

    const trackRef = React.useRef<HTMLDivElement>(null)
    const scrollTrack = React.useCallback((direction: number) => {
        if (!trackRef.current) return
        const firstCard = trackRef.current.firstElementChild as HTMLElement | null
        const cardWidth = firstCard?.clientWidth || 300
        const track = trackRef.current
        const maxScroll = track.scrollWidth - track.clientWidth
        if (carouselInfinite) {
            if (direction > 0 && track.scrollLeft >= maxScroll - 15) {
                track.scrollTo({ left: 0, behavior: "smooth" })
                return
            }
            if (direction < 0 && track.scrollLeft <= 15) {
                track.scrollTo({ left: maxScroll, behavior: "smooth" })
                return
            }
        }
        track.scrollBy({ left: direction * (cardWidth + 16), behavior: "smooth" })
    }, [carouselInfinite])

    const toggleExpand = React.useCallback((id: string) => {
        setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }))
    }, [])

    // Carousel autoplay
    React.useEffect(() => {
        if (layout !== "carousel" || !carouselAutoplay || isHovered || reviews.length <= 1) return
        const timer = setInterval(() => {
            if (!trackRef.current) return
            const track = trackRef.current
            const maxScroll = track.scrollWidth - track.clientWidth
            if (track.scrollLeft >= maxScroll - 15) {
                if (carouselInfinite) {
                    track.scrollTo({ left: 0, behavior: "smooth" })
                }
            } else {
                scrollTrack(1)
            }
        }, Math.max(2, carouselSpeed) * 1000)
        return () => clearInterval(timer)
    }, [layout, carouselAutoplay, carouselSpeed, isHovered, reviews.length, scrollTrack, carouselInfinite])

    // Spotlight autoplay
    React.useEffect(() => {
        if (layout !== "spotlight" || isHovered || reviews.length <= 1) return
        const timer = setInterval(() => {
            setSpotlightIndex((prev) => (prev + 1) % reviews.length)
        }, 4500)
        return () => clearInterval(timer)
    }, [layout, isHovered, reviews.length])

    // Ribbon autoplay
    React.useEffect(() => {
        if (layout !== "ribbon" || isHovered || reviews.length <= 1) return
        const timer = setInterval(() => {
            setRibbonIndex((prev) => (prev + 1) % reviews.length)
        }, 4200)
        return () => clearInterval(timer)
    }, [layout, isHovered, reviews.length])

    const breakdownRows = React.useMemo(() => {
        const total = reviews.length || 1
        return [5, 4, 3, 2, 1].map((s) => {
            const count = reviews.filter((r: any) => Math.round(r.rating) === s).length
            const pc = Math.round((count / total) * 100)
            return { stars: s, count, pc }
        })
    }, [reviews])

    const renderStars = (rating: number, size = 14) => {
        return (
            <div className="vr-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                    <svg
                        key={s}
                        width={size}
                        height={size}
                        viewBox="0 0 24 24"
                        fill={s <= Math.round(rating) ? starColor : "none"}
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

    const renderCard = (r: any, idx: number, extraClass = "") => {
        const cardId = String(r.id || idx)
        const isExpanded = Boolean(expandedCards[cardId])
        const isLongText = Boolean(r.text && r.text.length > 130)
        const shouldClamp = textClamp && !isExpanded && isLongText
        const displayText = shouldClamp ? r.text.slice(0, 125) + "..." : r.text

        return (
            <div
                key={cardId}
                className={"vr-card vrp-" + cardStyle + (extraClass ? " " + extraClass : "")}
            >
                <div className="vr-id">
                    {showAvatar && (
                        <div className="vr-avatar">
                            {r.authorAvatar ? (
                                <img src={r.authorAvatar} alt={r.authorName} />
                            ) : (
                                <div className="vr-avatar-fallback">
                                    {(r.authorName || "C").charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    )}
                    <span className="vr-name">{r.authorName}</span>
                </div>

                <span className="vr-src">
                    {showSourceIcon && (
                        <span className="vr-badge">
                            {r.source === "google" && (
                                <svg width="15" height="15" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                                </svg>
                            )}
                            {r.source === "trustpilot" && (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                    <rect width="24" height="24" rx="4" fill="#00B67A"/>
                                    <path d="M12 4.5l2.3 7.1h7.4l-6 4.4 2.3 7.1-6-4.4-6 4.4 2.3-7.1-6-4.4h7.4z" fill="#FFFFFF"/>
                                </svg>
                            )}
                            {r.source === "custom" && (
                                <span className="vr-custom-pill">Verified</span>
                            )}
                        </span>
                    )}
                </span>

                <div className="vr-mid">
                    <p className={"vr-body" + (shouldClamp ? " vr-clamped" : " vr-expanded")}>{displayText}</p>
                    {textClamp && isLongText && (
                        <button type="button" className="vr-more" onClick={() => toggleExpand(cardId)}>
                            {isExpanded ? "Show less" : "Read more"}
                        </button>
                    )}
                </div>

                <div className="vr-bl">
                    {showStars && renderStars(r.rating, 14)}
                </div>

                <div className="vr-br">
                    {showDate && <span className="vr-date">{r.date}</span>}
                </div>

                {showBrandingBadge && (
                    <span className="vr-stamp">
                        Powered by <b>Reviewfic</b>
                    </span>
                )}
            </div>
        )
    }

    const isDark = themeMode === "dark"
    const isBadge = ["badge", "avatars", "ratingcard", "gbadge", "trustpilot"].includes(layout)
    const defaultBg = isDark ? "#0F1117" : (isBadge ? "transparent" : "#FFFFFF")
    const rootStyleObj = {
        ["--vr-star" as any]: starColor,
        ["--vr-radius" as any]: cornerRadius + "px",
        ["--vr-accent" as any]: "#0099FF",
        ["--vr-card-min" as any]: "280px",
        ["--vr-card-pad" as any]: "20px",
        ["--vr-gap" as any]: "16px",
        ["--vr-clamp" as any]: textClamp ? 4 : 100,
        ["--vr-grid-cols" as any]: gridColumns || 3,
        ["--vr-ticker-speed" as any]: marqueeSpeed === "slow" ? "48s" : marqueeSpeed === "fast" ? "16s" : "30s",
        ["--vr-card-bg" as any]: isDark ? "#181A22" : "#FFFFFF",
        ["--vr-text-primary" as any]: isDark ? "#F3F4F6" : "#18181B",
        ["--vr-head-text" as any]: isDark ? "#F3F4F6" : "#18181B",
        ["--vr-card-border" as any]: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
        background: containerBg || defaultBg,
        border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : undefined,
        borderRadius: cornerRadius + "px",
        width: "100%",
        minWidth: "320px",
        boxSizing: "border-box" as any,
        ...props.style,
    }

    if (reviews.length === 0) {
        return (
            <div className={"vr-root vr-empty-box " + themeMode} style={rootStyleObj}>
                <style>{WIDGET_BUNDLE_CSS}</style>
                <p>No reviews match filters.</p>
            </div>
        )
    }

    return (
        <div
            className={"vr-root vrp-" + cardStyle + " " + themeMode}
            style={rootStyleObj}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <style>{WIDGET_BUNDLE_CSS}</style>

            {/* Header for non-badge layouts */}
            {![
                "badge",
                "avatars",
                "ratingcard",
                "gbadge",
                "trustpilot",
                "ribbon",
                "breakdown",
            ].includes(layout) && (
                <div className="vr-header">
                    <div className="vr-header-left">
                        <span className="vr-rating">{stats.averageRating}</span>
                        <div className="vr-header-meta">
                            {renderStars(stats.averageRating, 15)}
                            <span className="vr-count">Based on {stats.totalReviews}+ verified reviews</span>
                        </div>
                    </div>

                    <div className="vr-chips">
                        {stats.googleCount > 0 && (
                            <span className="vr-chip">
                                <svg width="12" height="12" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
                                <span>Google ({stats.googleCount})</span>
                            </span>
                        )}
                        {stats.trustpilotCount > 0 && (
                            <span className="vr-chip">
                                <svg width="12" height="12" viewBox="0 0 24 24"><path fill="#00B67A" d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21l1.18-6.88-5-4.87 7.1-1.01z"/></svg>
                                <span>Trustpilot ({stats.trustpilotCount})</span>
                            </span>
                        )}
                    </div>

                    {showWriteReview && (
                        <a
                            href={DEFAULT_DATA.writeReviewGoogleUrl || DEFAULT_DATA.writeReviewTrustpilotUrl || "https://google.com"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="vr-cta"
                        >
                            <span>Write a Review ↗</span>
                        </a>
                    )}
                </div>
            )}

            {/* 1. Card Blocks */}
            {layout === "grid" && (
                <div className="vr-grid">
                    {reviews.map((r: any, i: number) => renderCard(r, i))}
                </div>
            )}

            {layout === "masonry" && (
                <div className="vr-masonry">
                    {reviews.map((r: any, i: number) => renderCard(r, i))}
                </div>
            )}

            {layout === "highlight" && (
                <div className="vr-hl">
                    <div className="vr-hl-big">
                        {renderCard(reviews[0], 0, "hero-card")}
                    </div>
                    <div className="vr-hl-side">
                        {reviews.slice(1, 4).map((r: any, i: number) => renderCard(r, i + 1))}
                    </div>
                </div>
            )}

            {layout === "list" && (
                <div className="vr-list">
                    {reviews.map((r: any, i: number) => renderCard(r, i))}
                </div>
            )}

            {/* 2. Shapes & Arrangements */}
            {layout === "pinboard" && (
                <div className="vr-pin">
                    {reviews.map((r: any, i: number) => renderCard(r, i))}
                </div>
            )}

            {layout === "duo" && (
                <div className="vr-duo2">
                    {reviews.map((r: any, i: number) => renderCard(r, i))}
                </div>
            )}

            {layout === "feature" && (
                <div className="vr-feature">
                    {reviews.map((r: any, i: number) => renderCard(r, i, i === 0 ? "feature-lead" : ""))}
                </div>
            )}

            {layout === "band" && (
                <div className="vr-band">
                    {reviews.slice(0, 4).map((r: any, i: number) => renderCard(r, i))}
                </div>
            )}

            {layout === "spotlightgrid" && (
                <div className="vr-spotgrid">
                    <div className="vr-spotgrid-hero">
                        {renderCard(reviews[0], 0)}
                    </div>
                    <div className="vr-spotgrid-rest">
                        {reviews.slice(1, 5).map((r: any, i: number) => renderCard(r, i + 1))}
                    </div>
                </div>
            )}

            {/* 3. In Motion */}
            {layout === "carousel" && (
                <div className="vr-carousel-wrapper">
                    <div className="vr-track" ref={trackRef}>
                        {(carouselInfinite && reviews.length > 2 ? [...reviews, ...reviews] : reviews).map((r: any, i: number) => renderCard(r, i))}
                    </div>
                    {reviews.length > 1 && (
                        <div className="vr-arrows">
                            <button
                                type="button"
                                className="vr-arrow"
                                onClick={() => scrollTrack(-1)}
                                aria-label="Previous reviews"
                            >
                                ‹
                            </button>
                            <button
                                type="button"
                                className="vr-arrow"
                                onClick={() => scrollTrack(1)}
                                aria-label="Next reviews"
                            >
                                ›
                            </button>
                        </div>
                    )}
                </div>
            )}

            {layout === "ticker" && (
                <div className="vr-ticker">
                    <div className="vr-ticker-row">
                        {(reviews.length > 0 ? (reviews.length < 8 ? [...reviews, ...reviews, ...reviews, ...reviews] : [...reviews, ...reviews]) : []).map((r: any, i: number) => renderCard(r, i))}
                    </div>
                </div>
            )}

            {layout === "wall" && (
                <div className="vr-wall">
                    <div className="vr-wall-col">
                        {reviews.filter((_: any, i: number) => i % 3 === 0).map((r: any, i: number) => renderCard(r, i))}
                    </div>
                    <div className="vr-wall-col">
                        {reviews.filter((_: any, i: number) => i % 3 === 1).map((r: any, i: number) => renderCard(r, i))}
                    </div>
                    <div className="vr-wall-col">
                        {reviews.filter((_: any, i: number) => i % 3 === 2).map((r: any, i: number) => renderCard(r, i))}
                    </div>
                </div>
            )}

            {layout === "spotlight" && (
                <div className="vr-spot">
                    <div className="vr-spot-slot">
                        {renderCard(reviews[spotlightIndex] || reviews[0], spotlightIndex)}
                    </div>
                    {reviews.length > 1 && (
                        <div className="vr-dots">
                            {reviews.map((_: any, i: number) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={"vr-dot" + (i === spotlightIndex ? " vr-on" : "")}
                                    onClick={() => setSpotlightIndex(i)}
                                    aria-label={"Spotlight " + (i + 1)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 4. Reading & Dedicated */}
            {layout === "compact" && (
                <div className="vr-compact">
                    {reviews.map((r: any, i: number) => (
                        <div key={r.id || i} className="vr-crow">
                            <div className="vr-avatar">
                                <div className="vr-avatar-fallback">{r.authorName.charAt(0)}</div>
                            </div>
                            <div className="vr-cwho">
                                <span className="vr-name">{r.authorName}</span>
                                <span className="vr-cq">{r.text}</span>
                            </div>
                            <div className="vr-cmeta">
                                {renderStars(r.rating, 11)}
                                <span className="vr-date">{r.date}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {layout === "split" && (
                <div className="vr-split">
                    {reviews.map((r: any, i: number) => (
                        <div key={r.id || i} className="vr-split-row">
                            <div className="vr-split-who">
                                <div className="vr-avatar">
                                    <div className="vr-avatar-fallback">{r.authorName.charAt(0)}</div>
                                </div>
                                <span className="vr-name">{r.authorName}</span>
                                {renderStars(r.rating, 12)}
                                <span className="vr-date">{r.date}</span>
                            </div>
                            <p className="vr-split-b">{r.text}</p>
                        </div>
                    ))}
                </div>
            )}

            {layout === "flow" && (
                <div className="vr-flow">
                    <div className="vr-flow-row">
                        {[...reviews.slice(0, 4), ...reviews.slice(0, 4)].map((r: any, i: number) => (
                            <span key={i} className="vr-flow-item">
                                <span className="vr-flow-t">{r.text}</span>
                                <span className="vr-flow-w">
                                    <span className="vr-name">{r.authorName}</span>
                                    {renderStars(r.rating, 11)}
                                </span>
                            </span>
                        ))}
                    </div>
                    <div className="vr-flow-row r2">
                        {[...reviews.slice(4), ...reviews.slice(4)].map((r: any, i: number) => (
                            <span key={i} className="vr-flow-item">
                                <span className="vr-flow-t">{r.text}</span>
                                <span className="vr-flow-w">
                                    <span className="vr-name">{r.authorName}</span>
                                    {renderStars(r.rating, 11)}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {layout === "breakdown" && (
                <div className="vr-break">
                    <div className="vr-break-head">
                        <span className="vr-break-n">{stats.averageRating}</span>
                        {renderStars(stats.averageRating, 18)}
                        <span className="vr-break-c">Based on {stats.totalReviews}+ reviews</span>
                    </div>
                    <div className="vr-break-bars">
                        {breakdownRows.map((b: any) => {
                            const barFillStyle = { width: b.pc + "%" }
                            return (
                                <div key={b.stars} className="vr-break-row">
                                    <span>{b.stars} star</span>
                                    <span className="vr-break-track">
                                        <span className="vr-break-fill" style={barFillStyle} />
                                    </span>
                                    <span className="vr-break-pc">{b.pc}%</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {layout === "ribbon" && (
                <div className="vr-ribbon">
                    <div className="vr-ribbon-score">
                        <span className="vr-ribbon-n">{stats.averageRating}</span>
                        {renderStars(stats.averageRating, 13)}
                        <span className="vr-ribbon-c">{stats.totalReviews} reviews</span>
                    </div>
                    <div className="vr-ribbon-slot">
                        {reviews[ribbonIndex] && (
                            <div className="vr-ribbon-q">
                                <p className="vr-ribbon-t">{reviews[ribbonIndex].text}</p>
                                <span className="vr-ribbon-w">— {reviews[ribbonIndex].authorName}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {layout === "gallery" && (
                <div className="vr-gal">
                    <div className="vr-gal-slot">
                        {reviews[galleryIndex] && (
                            <div className="vr-gal-card">
                                <p className="vr-gal-q">"{reviews[galleryIndex].text}"</p>
                                <div className="vr-gal-who">
                                    <span className="vr-name">{reviews[galleryIndex].authorName}</span>
                                    {renderStars(reviews[galleryIndex].rating, 13)}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="vr-gal-faces">
                        {reviews.slice(0, 8).map((r: any, i: number) => (
                            <button
                                key={r.id || i}
                                type="button"
                                className={"vr-gal-face" + (i === galleryIndex ? " on" : "")}
                                onClick={() => setGalleryIndex(i)}
                                title={r.authorName}
                            >
                                <div className="vr-avatar">
                                    {r.authorAvatar ? (
                                        <img src={r.authorAvatar} alt={r.authorName} />
                                    ) : (
                                        <div className="vr-avatar-fallback">{r.authorName.charAt(0)}</div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {layout === "orbit" && (
                <div className="vr-orbit">
                    <div className="vr-orbit-ring" />
                    <div className="vr-orbit-mid">
                        <span className="vr-orbit-n">{(reviews[orbitIndex]?.rating || stats.averageRating).toFixed(1)}</span>
                        {renderStars(reviews[orbitIndex]?.rating || stats.averageRating, 16)}
                        {reviews[orbitIndex] && (
                            <p className="vr-orbit-q">"{reviews[orbitIndex].text}"</p>
                        )}
                        <span className="vr-orbit-who">{reviews[orbitIndex]?.authorName || "Customer"}</span>
                    </div>
                    <div className="vr-orbit-faces-row">
                        {reviews.slice(0, 8).map((r: any, i: number) => (
                            <button
                                key={r.id || i}
                                type="button"
                                className={"vr-orbit-face pos-" + (i % 8) + " color-" + (i % 8) + (i === orbitIndex ? " on" : "")}
                                onClick={() => setOrbitIndex(i)}
                                title={r.authorName}
                            >
                                <span className="vr-avatar">
                                    {r.authorAvatar ? (
                                        <img src={r.authorAvatar} alt={r.authorName} />
                                    ) : (
                                        getInitials(r.authorName)
                                    )}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 5. Badges & Social Proof */}
            {layout === "badge" && (
                <div className="vr-badge-preview-card">
                    <div className="vr-badge-top">
                        <span className="vr-badge-score">{stats.averageRating}</span>
                        <div className="vr-badge-meta">
                            {renderStars(stats.averageRating, 16)}
                            <span className="vr-badge-count">Rated {stats.averageRating}/5 on Google &amp; Trustpilot ({stats.totalReviews}+ reviews)</span>
                        </div>
                    </div>
                    <div className="vr-badge-chips">
                        <span className="vr-chip">
                            <svg width="13" height="13" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
                            <span>Google ({stats.googleCount})</span>
                        </span>
                        <span className="vr-chip">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#00B67A"/><path d="M12 4.5l2.3 7.1h7.4l-6 4.4 2.3 7.1-6-4.4-6 4.4 2.3-7.1-6-4.4h7.4z" fill="#FFFFFF"/></svg>
                            <span>Trustpilot ({stats.trustpilotCount})</span>
                        </span>
                    </div>
                </div>
            )}

            {layout === "avatars" && (
                <div className="vr-trustedby">
                    <div className="vr-tb-avatars">
                        {reviews.slice(0, 5).map((r: any, i: number) => (
                            <div key={r.id || i} className="vr-tb-av">
                                <div className="vr-avatar-fallback">{r.authorName.charAt(0)}</div>
                            </div>
                        ))}
                    </div>
                    <div className="vr-tb-info">
                        <div className="vr-tb-top">
                            {renderStars(stats.averageRating, 13)}
                            <span className="vr-tb-rating">{stats.averageRating} / 5</span>
                        </div>
                        <span className="vr-tb-count">Trusted by {stats.totalReviews}+ customers</span>
                    </div>
                </div>
            )}

            {layout === "ratingcard" && (
                <div className="vr-rc">
                    <span className="vr-rc-n">{stats.averageRating}</span>
                    {renderStars(stats.averageRating, 16)}
                    <span className="vr-rc-c">Based on {stats.totalReviews} reviews</span>
                    <div className="vr-rc-src">
                        <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#00B67A"/><path d="M12 4.5l2.3 7.1h7.4l-6 4.4 2.3 7.1-6-4.4-6 4.4 2.3-7.1-6-4.4h7.4z" fill="#FFFFFF"/></svg>
                    </div>
                </div>
            )}

            {layout === "gbadge" && (
                <div className="vr-gb">
                    <span className="vr-gb-n">{stats.averageRating}</span>
                    <div className="vr-gb-mid">
                        {renderStars(stats.averageRating, 15)}
                        <span className="vr-gb-c">Based on {stats.googleCount || stats.totalReviews} Google reviews</span>
                    </div>
                    <div className="vr-gb-mark">
                        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
                        <span>Google</span>
                    </div>
                </div>
            )}

            {layout === "trustpilot" && (
                <div className="vr-tp-badge">
                    <span className="vr-tp-rating">{stats.averageRating}</span>
                    <div className="vr-tp-mid">
                        {renderStars(stats.averageRating, 15)}
                        <span className="vr-tp-c">Based on {stats.trustpilotCount || stats.totalReviews} Trustpilot reviews</span>
                    </div>
                    <div className="vr-tp-mark">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#00B67A"/><path d="M12 4.5l2.3 7.1h7.4l-6 4.4 2.3 7.1-6-4.4-6 4.4 2.3-7.1-6-4.4h7.4z" fill="#FFFFFF"/></svg>
                        <span>Trustpilot</span>
                    </div>
                </div>
            )}

            {showBrandingBadge && (
                <div className="vr-powered">
                    <span>Verified reviews via Google &amp; Trustpilot · </span>
                    <a href="https://reviewfic.com" target="_blank" rel="noopener noreferrer">
                        <b>Reviewfic</b>
                    </a>
                </div>
            )}
        </div>
    )
}

Reviewfic.defaultProps = {
    layout: "carousel",
    cardStyle: "elevated",
    themeMode: "auto",
    containerBg: "",
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
    carouselInfinite: true,
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
        options: [
            "grid", "masonry", "highlight", "list",
            "pinboard", "duo", "feature", "band", "spotlightgrid",
            "carousel", "ticker", "wall", "spotlight",
            "compact", "orbit", "breakdown", "ribbon", "gallery", "flow", "split",
            "badge", "avatars", "ratingcard", "gbadge", "trustpilot"
        ],
        optionTitles: [
            "Grid (Cards)", "Masonry (Cards)", "Highlight Hero (Cards)", "Editorial List (Cards)",
            "Pinboard (Shapes)", "Two Columns (Shapes)", "Feature Wide (Shapes)", "Band Row (Shapes)", "Hero + Grid (Shapes)",
            "Carousel (Motion)", "Ticker Marquee (Motion)", "Wall 3-Col (Motion)", "Spotlight (Motion)",
            "Compact Feed (Reading)", "Orbit Ring (Reading)", "Breakdown Bars (Reading)", "Ribbon Quote (Reading)", "Gallery Faces (Reading)", "Stream Flow (Reading)", "Split Editorial (Reading)",
            "Trust Badge (Badges)", "Trusted Avatars (Badges)", "Rating Card (Badges)", "Google Badge (Badges)", "Trustpilot Badge (Badges)"
        ],
        defaultValue: "carousel",
    },
    cardStyle: {
        type: ControlType.Enum,
        title: "Card Style",
        options: [
            "elevated", "outline", "gradient", "glass", "bento", "spotlight", "aurora", "frame",
            "google", "gcompact", "gdark", "tp", "tpstrip", "tpc", "verified", "plain",
            "quote", "pull", "mag", "news", "press", "museum", "ruled", "broad",
            "reveal", "unfold", "tilt", "shine", "trace", "pop", "unblur", "liquid",
            "brutal", "neon", "duo", "sticker", "neu", "sheen", "pearl", "term", "memphis",
            "clay", "linen", "eink", "sage", "pebble", "kraft", "sunbaked", "ceramic",
            "noir", "gilt", "hotel", "couture", "onyx", "platinum", "velvet", "atelier"
        ],
        optionTitles: [
            "Elevated (Modern)", "Outline (Modern)", "Gradient Edge (Modern)", "Glassmorphic (Modern)", "Bento Box (Modern)", "Spotlight Hover (Modern)", "Aurora Glow (Modern)", "Outer Frame (Modern)",
            "Google Native (Basic)", "Google Compact (Basic)", "Google Dark (Basic)", "Trustpilot Native (Basic)", "Trustpilot Strip (Basic)", "Trustpilot Compact (Basic)", "Verified Pill (Basic)", "Plain Clean (Basic)",
            "Quote Mark (Editorial)", "Pull Quote (Editorial)", "Magazine Dropcap (Editorial)", "Newspaper Serif (Editorial)", "Press Ivory (Editorial)", "Museum Gallery (Editorial)", "Ruled Paper (Editorial)", "Broadsheet (Editorial)",
            "Cascade Reveal (Motion)", "Unfold 3D (Motion)", "Perspective Tilt (Motion)", "Shine Sweep (Motion)", "Border Trace (Motion)", "Spring Pop (Motion)", "Unblur Words (Motion)", "Liquid Edge (Motion)",
            "Neo-Brutalist (Bold)", "Cyber Neon (Bold)", "Duotone Contrast (Bold)", "Tilted Sticker (Bold)", "Neumorphic Soft (Bold)", "Brushed Sheen (Bold)", "Pearl Luster (Bold)", "Terminal CRT (Bold)", "Memphis Pop (Bold)",
            "Terracotta Clay (Warm)", "Woven Linen (Warm)", "E-Ink Paper (Warm)", "Sage Leaf (Warm)", "Pebble Stone (Warm)", "Kraft Card (Warm)", "Sunbaked Ochre (Warm)", "Studio Ceramic (Warm)",
            "Noir Pitch (Luxury)", "Gilt Gold Foil (Luxury)", "Hotel Boutique (Luxury)", "Couture Serif (Luxury)", "Onyx Metal (Luxury)", "Platinum Rim (Luxury)", "Plum Velvet (Luxury)", "Atelier Studio (Luxury)"
        ],
        defaultValue: "elevated",
    },
    themeMode: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["auto", "light", "dark"],
        optionTitles: ["Auto (Site Theme)", "Light Mode", "Dark Mode"],
        defaultValue: "auto",
    },
    containerBg: {
        type: ControlType.Color,
        title: "Container Bg",
        defaultValue: "",
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
    maxReviews: {
        type: ControlType.Number,
        title: "Max Reviews",
        min: 1,
        max: 50,
        step: 1,
        defaultValue: 24,
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
    carouselInfinite: {
        type: ControlType.Boolean,
        title: "Infinite Loop",
        defaultValue: true,
        hidden: (props: any) => props.layout !== "carousel",
    },
    marqueeSpeed: {
        type: ControlType.Enum,
        title: "Speed",
        options: ["slow", "normal", "fast"],
        optionTitles: ["Slow", "Normal", "Fast"],
        defaultValue: "normal",
        hidden: (props: any) => props.layout !== "ticker" && props.layout !== "marquee",
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
    reviewsData: {
        type: ControlType.String,
        title: "Reviews Data",
        defaultValue: "",
        hidden: () => true,
    },
    statsData: {
        type: ControlType.String,
        title: "Stats Data",
        defaultValue: "",
        hidden: () => true,
    },
})
`
}

export function buildControlPayload(config: ReviewConfig) {
    const activeReviews = getActiveReviews(config)
    const stats = calculateBlendedStats(config, activeReviews)

    return {
        layout: config.layout || "carousel",
        cardStyle: config.cardStyle || "elevated",
        themeMode: config.themeMode || "auto",
        containerBg: config.containerBg || "",
        starColor: config.starColor || "#FBBC05",
        gridColumns: config.gridColumns || 3,
        showStars: config.showStars !== undefined ? config.showStars : true,
        showSourceIcon: config.showSourceIcon !== undefined ? config.showSourceIcon : true,
        showAvatar: config.showAvatar !== undefined ? config.showAvatar : true,
        showDate: config.showDate !== undefined ? config.showDate : true,
        showVerifiedBadge: config.showVerifiedBadge !== undefined ? config.showVerifiedBadge : true,
        showWriteReview: config.showWriteReview !== undefined ? config.showWriteReview : true,
        minRating: config.minRatingFilter || 0,
        carouselAutoplay: config.carouselAutoplay !== undefined ? config.carouselAutoplay : true,
        carouselSpeed: config.carouselSpeed || 5,
        carouselInfinite: config.carouselInfinite !== undefined ? config.carouselInfinite : true,
        marqueeSpeed: config.marqueeSpeed || "normal",
        cornerRadius: config.cornerRadius || 16,
        maxReviews: config.maxReviews || 24,
        sortOrder: config.sortOrder || "newest",
        textClamp: config.textClamp !== undefined ? config.textClamp : true,
        showBrandingBadge: config.showBrandingBadge !== undefined ? config.showBrandingBadge : true,
        reviewsData: JSON.stringify(activeReviews),
        statsData: JSON.stringify(stats),
    }
}

export function isBadgeLayout(layout?: string): boolean {
    return ["badge", "avatars", "ratingcard", "gbadge", "trustpilot"].includes(layout || "")
}

export async function insertCanvasComponent(config: ReviewConfig): Promise<{ success: boolean; message: string }> {
    const code = generateReviewficComponentCode(config)
    const fileName = "Reviewfic.tsx"
    const isBadge = isBadgeLayout(config.layout)
    const targetWidth = isBadge ? "420px" : "1100px"
    const controlPayload = buildControlPayload(config)

    try {
        if (typeof (framer as any).isAllowedTo === "function") {
            try {
                await (framer as any).isAllowedTo("createCodeFile", "addComponentInstance", "setSelection", "getNodesWithType")
            } catch {}
        }

        const files = await framer.getCodeFiles()
        let file = files.find((f) => f.name === fileName || f.name === "Reviewfic")

        if (file) {
            await file.setFileContent(code)
        } else {
            file = await framer.createCodeFile(fileName, code, { editViaPlugin: true })
        }

        // Query existing canvas component instances
        const instances = (await framer.getNodesWithType("ComponentInstanceNode")) as any[]
        const existingReviewficNodes = instances?.filter(isReviewficInstance) || []

        if (existingReviewficNodes.length > 0) {
            // Update all existing Reviewfic nodes on canvas so changes take effect immediately
            for (const node of existingReviewficNodes) {
                if (typeof node.setAttributes === "function") {
                    await node.setAttributes({
                        controls: controlPayload,
                        width: targetWidth,
                    })
                }
            }

            if (existingReviewficNodes[0]?.id) {
                try {
                    await framer.setSelection([existingReviewficNodes[0].id])
                } catch {}
            }

            return {
                success: true,
                message: `Updated existing Reviewfic component on canvas (${config.layout} layout, ${config.cardStyle} style)!`,
            }
        }

        // If no instance exists on canvas yet, insert a new one
        const componentExport = file.exports.find((exp) => exp.type === "component")
        if (componentExport && "insertURL" in componentExport) {
            const instance = (await framer.addComponentInstance({
                url: componentExport.insertURL,
                attributes: {
                    controls: controlPayload,
                    width: targetWidth,
                    minWidth: "320px",
                    name: "Reviewfic - Social Proof Reviews",
                },
            })) as any

            if (instance?.id) {
                try {
                    await framer.setSelection([instance.id])
                } catch {}
            }

            return {
                success: true,
                message: "Reviewfic component inserted onto the canvas!",
            }
        }

        return {
            success: true,
            message: "Reviewfic component code updated! Drag it onto your page from Assets.",
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to insert component onto canvas.",
        }
    }
}

/**
 * Live updates any existing Reviewfic canvas instance immediately as the user tweaks controls in the studio.
 */
export async function syncCanvasInstance(config: ReviewConfig): Promise<boolean> {
    try {
        const code = generateReviewficComponentCode(config)
        const fileName = "Reviewfic.tsx"

        // Update underlying code file content in Framer project
        try {
            const files = await framer.getCodeFiles()
            const file = files.find((f) => f.name === fileName || f.name === "Reviewfic")
            if (file) {
                await file.setFileContent(code)
            }
        } catch (e) {
            console.warn("[Reviewfic] Failed to update code file in syncCanvasInstance:", e)
        }

        const instances = (await framer.getNodesWithType("ComponentInstanceNode")) as any[]
        const reviewficNodes = instances?.filter(isReviewficInstance) || []
        if (reviewficNodes.length === 0) return true

        const isBadge = isBadgeLayout(config.layout)
        const targetWidth = isBadge ? "420px" : "1100px"
        const controlPayload = buildControlPayload(config)

        for (const node of reviewficNodes) {
            if (typeof node.setAttributes === "function") {
                await node.setAttributes({
                    controls: controlPayload,
                    width: targetWidth,
                })
            }
        }
        return true
    } catch {
        return false
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
