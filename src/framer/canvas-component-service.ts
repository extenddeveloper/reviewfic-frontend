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
const WIDGET_BUNDLE_CSS = ${serializedCSS}

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
    const [spotlightIndex, setSpotlightIndex] = React.useState(0)
    const [galleryIndex, setGalleryIndex] = React.useState(0)
    const [orbitIndex, setOrbitIndex] = React.useState(0)
    const [ribbonIndex, setRibbonIndex] = React.useState(0)
    const [isHovered, setIsHovered] = React.useState(false)
    const [expandedCards, setExpandedCards] = React.useState<Record<string, boolean>>({})

    const toggleExpand = React.useCallback((id: string) => {
        setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }))
    }, [])

    // Carousel autoplay
    React.useEffect(() => {
        if (layout !== "carousel" || !carouselAutoplay || isHovered || reviews.length <= 1) return
        const timer = setInterval(() => {
            setCarouselIndex((prev) => (prev + 1) % reviews.length)
        }, Math.max(2, carouselSpeed) * 1000)
        return () => clearInterval(timer)
    }, [layout, carouselAutoplay, carouselSpeed, isHovered, reviews.length])

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
                <div className="vr-card-head">
                    <div className="vr-card-author-wrap">
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
                        <div className="vr-card-author-meta">
                            <span className="vr-name">{r.authorName}</span>
                            {showVerifiedBadge && r.verified && (
                                <span className="vr-verified-pill" title="Verified Customer">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                                    <span>Verified</span>
                                </span>
                            )}
                            {showDate && <span className="vr-date">{r.date}</span>}
                        </div>
                    </div>

                    {showSourceIcon && (
                        <div className="vr-card-source">
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
                                <span className="vr-custom-pill">Customer testimonial</span>
                            )}
                        </div>
                    )}
                </div>

                {showStars && renderStars(r.rating)}

                <p className={"vr-body" + (shouldClamp ? " vr-clamped" : " vr-expanded")}>{displayText}</p>

                {textClamp && isLongText && (
                    <button type="button" className="vr-more" onClick={() => toggleExpand(cardId)}>
                        {isExpanded ? "Show less" : "Read more"}
                    </button>
                )}

                {r.source === "google" && (
                    <a
                        href={r.originalUrl || DEFAULT_DATA.googleMapsUrl || "https://google.com"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vr-stamp"
                    >
                        <span>Read on Google ↗</span>
                    </a>
                )}
                {r.source === "trustpilot" && (
                    <a
                        href={r.originalUrl || (DEFAULT_DATA.trustpilotDomain ? ("https://trustpilot.com/review/" + DEFAULT_DATA.trustpilotDomain) : "https://trustpilot.com")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vr-stamp"
                    >
                        <span>Read on Trustpilot ↗</span>
                    </a>
                )}
            </div>
        )
    }

    const rootStyleObj = {
        ["--vr-star" as any]: starColor,
        ["--vr-radius" as any]: cornerRadius + "px",
    }

    const carouselTrackStyle = {
        transform: "translateX(-" + (carouselIndex * 100) + "%)",
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
                        <span className="vr-chip">Google ({stats.googleCount})</span>
                        <span className="vr-chip">Trustpilot ({stats.trustpilotCount})</span>
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
                <div className="vr-carousel-container">
                    <div className="vr-carousel-viewport">
                        <div className="vr-carousel-slider" style={carouselTrackStyle}>
                            {reviews.map((r: any, i: number) => (
                                <div key={r.id || i} className="vr-carousel-slide">
                                    {renderCard(r, i)}
                                </div>
                            ))}
                        </div>
                    </div>
                    {reviews.length > 1 && (
                        <div className="vr-carousel-controls">
                            <button
                                type="button"
                                className="vr-carousel-arrow"
                                onClick={() => setCarouselIndex((p) => (p - 1 + reviews.length) % reviews.length)}
                                aria-label="Previous review"
                            >
                                ‹
                            </button>
                            <div className="vr-carousel-indicators">
                                {reviews.map((_: any, i: number) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className={"vr-carousel-dot" + (i === carouselIndex ? " active" : "")}
                                        onClick={() => setCarouselIndex(i)}
                                        aria-label={"Slide " + (i + 1)}
                                    />
                                ))}
                            </div>
                            <button
                                type="button"
                                className="vr-carousel-arrow"
                                onClick={() => setCarouselIndex((p) => (p + 1) % reviews.length)}
                                aria-label="Next review"
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
                        {[...reviews, ...reviews].map((r: any, i: number) => renderCard(r, i))}
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
                                <span className="vr-ribbon-t">{reviews[ribbonIndex].text}</span>
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
                        <span className="vr-orbit-n">{stats.averageRating}</span>
                        {renderStars(stats.averageRating, 15)}
                        {reviews[orbitIndex] && (
                            <div className="vr-orbit-slot">
                                <p className="vr-orbit-q">"{reviews[orbitIndex].text}"</p>
                                <span className="vr-orbit-who">— {reviews[orbitIndex].authorName}</span>
                            </div>
                        )}
                    </div>
                    <div className="vr-orbit-faces-row">
                        {reviews.slice(0, 8).map((r: any, i: number) => (
                            <button
                                key={r.id || i}
                                type="button"
                                className={"vr-orbit-face" + (i === orbitIndex ? " on" : "")}
                                onClick={() => setOrbitIndex(i)}
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

            {/* 5. Badges & Social Proof */}
            {layout === "badge" && (
                <div className="vr-badge">
                    {renderStars(stats.averageRating, 14)}
                    <span className="vr-badge-score">{stats.averageRating}</span>
                    <span className="vr-badge-text">
                        Rated {stats.averageRating}/5 on Google &amp; Trustpilot ({stats.totalReviews}+ reviews)
                    </span>
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
