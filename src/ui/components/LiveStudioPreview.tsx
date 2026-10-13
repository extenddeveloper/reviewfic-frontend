import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { ReviewConfig, ReviewItem, BlendedStats, ReviewLayout, CardStyle } from "../../core/types"
import { IconGoogle, IconTrustpilot, IconStar } from "../icons"

export interface LiveStudioPreviewProps {
    layout: ReviewLayout
    cardStyle: CardStyle
    reviews: ReviewItem[]
    stats: BlendedStats
    config: ReviewConfig
    stageTheme?: "auto" | "light" | "dark"
}

const PASTELS = ["#fde68a", "#bfdbfe", "#c7d2fe", "#fbcfe8", "#bbf7d0", "#fed7aa"]

function getInitials(name: string): string {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return "?"
    return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getShortName(name: string): string {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean)
    return parts.length < 2 ? name || "Verified Customer" : parts[0] + " " + parts[parts.length - 1][0].toUpperCase() + "."
}

export function LiveStudioPreview({
    layout,
    cardStyle,
    reviews,
    stats,
    config,
    stageTheme = "auto",
}: LiveStudioPreviewProps) {
    const {
        starColor = "#FBBC05",
        showStars = true,
        showSourceIcon = true,
        showDate = true,
        showWriteReview = true,
        textClamp = true,
        cornerRadius = 16,
    } = config

    // Interactive state for rotators
    const [spotlightIdx, setSpotlightIdx] = useState(0)
    const [galleryIdx, setGalleryIdx] = useState(0)
    const [orbitIdx, setOrbitIdx] = useState(0)
    const [ribbonIdx, setRibbonIdx] = useState(0)
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

    const trackRef = useRef<HTMLDivElement>(null)
    const scrollTrack = useCallback((direction: number) => {
        if (!trackRef.current) return
        const firstCard = trackRef.current.firstElementChild as HTMLElement | null
        const cardWidth = firstCard?.clientWidth || 280
        trackRef.current.scrollBy({ left: direction * (cardWidth + 16), behavior: "smooth" })
    }, [])

    const toggleExpand = (id: string) => {
        setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }))
    }

    // Auto-rotate carousel
    useEffect(() => {
        if (layout !== "carousel" || !config.carouselAutoplay || reviews.length <= 1) return
        const t = setInterval(() => {
            if (!trackRef.current) return
            const maxScroll = trackRef.current.scrollWidth - trackRef.current.clientWidth
            if (trackRef.current.scrollLeft >= maxScroll - 15) {
                trackRef.current.scrollTo({ left: 0, behavior: "smooth" })
            } else {
                scrollTrack(1)
            }
        }, Math.max(2, config.carouselSpeed || 5) * 1000)
        return () => clearInterval(t)
    }, [layout, config.carouselAutoplay, config.carouselSpeed, reviews.length, scrollTrack])

    // Auto-rotate spotlight
    useEffect(() => {
        if (layout !== "spotlight" || reviews.length <= 1) return
        const t = setInterval(() => {
            setSpotlightIdx((prev) => (prev + 1) % reviews.length)
        }, 4500)
        return () => clearInterval(t)
    }, [layout, reviews.length])

    // Auto-rotate ribbon
    useEffect(() => {
        if (layout !== "ribbon" || reviews.length <= 1) return
        const t = setInterval(() => {
            setRibbonIdx((prev) => (prev + 1) % reviews.length)
        }, 4200)
        return () => clearInterval(t)
    }, [layout, reviews.length])

    // Rating breakdown distribution
    const breakdownRows = useMemo(() => {
        const total = reviews.length || 1
        return [5, 4, 3, 2, 1].map((s) => {
            const count = reviews.filter((r) => Math.round(r.rating) === s).length
            const pc = Math.round((count / total) * 100)
            return { stars: s, count, pc }
        })
    }, [reviews])

    const renderStars = (rating: number, size = 14) => {
        return (
            <span className="vr-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                    <IconStar
                        key={s}
                        size={size}
                        filled={s <= Math.round(rating)}
                        color={starColor}
                    />
                ))}
            </span>
        )
    }

    const renderCard = (r: ReviewItem, idx: number, extraClass = "") => {
        const cardId = r.id || `card-${idx}`
        const isExpanded = Boolean(expandedCards[cardId])
        const isLong = Boolean(r.text && r.text.length > 130)
        const shouldClamp = textClamp && !isExpanded && isLong
        const displayText = shouldClamp ? r.text.slice(0, 125) + "..." : r.text

        const avatarBgStyle = {
            background: PASTELS[idx % PASTELS.length],
        }

        return (
            <article key={cardId} className={`vr-card vrp-${cardStyle} ${extraClass}`}>
                <div className="vr-id">
                    <span className="vr-avatar" style={avatarBgStyle}>
                        {getInitials(r.authorName)}
                    </span>
                    <span className="vr-name">{getShortName(r.authorName)}</span>
                </div>

                <span className="vr-src">
                    {showSourceIcon && (
                        <span className="vr-badge">
                            {r.source === "google" && <IconGoogle size={14} />}
                            {r.source === "trustpilot" && <IconTrustpilot size={14} />}
                            {r.source === "custom" && <span className="vr-custom-pill">Verified</span>}
                        </span>
                    )}
                </span>

                <div className="vr-mid">
                    <p className={`vr-body ${shouldClamp ? "vr-clamped" : "vr-expanded"}`}>{displayText}</p>
                    {textClamp && isLong && (
                        <button
                            type="button"
                            className="vr-more"
                            onClick={() => toggleExpand(cardId)}
                        >
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

                {config.showBrandingBadge && (
                    <span className="vr-stamp">
                        Powered by <b>Reviewfic</b>
                    </span>
                )}
            </article>
        )
    }

    const isDark = stageTheme === "dark" || (stageTheme === "auto" && config.themeMode === "dark")
    const rootStyleObj = {
        ["--vr-star" as any]: starColor,
        ["--vr-radius" as any]: `${cornerRadius}px`,
        ["--vr-text-primary" as any]: isDark ? "#F3F4F6" : "#18181B",
        ["--vr-head-text" as any]: isDark ? "#F3F4F6" : "#18181B",
        ["--vr-card-bg" as any]: isDark ? "#181A22" : "#FFFFFF",
        ["--vr-card-border" as any]: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
        ["--vr-accent" as any]: "#0099FF",
        ["--vr-card-min" as any]: "280px",
        ["--vr-card-pad" as any]: "16px",
        ["--vr-gap" as any]: "14px",
        ["--vr-clamp" as any]: textClamp ? 4 : 100,
        ["--vr-grid-cols" as any]: config.gridColumns || 3,
        width: "100%",
        minWidth: "320px",
        boxSizing: "border-box" as any,
    }

    if (reviews.length === 0) {
        return (
            <div className={`vr-root vr-empty-box ${stageTheme}`} style={rootStyleObj}>
                <p>No reviews match your search or filters.</p>
            </div>
        )
    }

    return (
        <div className={`vr-root vrp-${cardStyle} ${stageTheme}`} style={rootStyleObj}>
            {/* Header for non-badge and non-rotator layouts */}
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
                        <span className="vr-chip">
                            <IconGoogle size={12} />
                            <span>Google ({stats.googleCount})</span>
                        </span>
                        <span className="vr-chip">
                            <IconTrustpilot size={12} />
                            <span>Trustpilot ({stats.trustpilotCount})</span>
                        </span>
                    </div>

                    {showWriteReview && (
                        <span className="vr-write-cta">Write a Review ↗</span>
                    )}
                </div>
            )}

            {/* 1. Card Blocks */}
            {layout === "grid" && (
                <div className="vr-grid">
                    {reviews.map((r, i) => renderCard(r, i))}
                </div>
            )}

            {layout === "masonry" && (
                <div className="vr-masonry">
                    {reviews.map((r, i) => renderCard(r, i))}
                </div>
            )}

            {layout === "highlight" && (
                <div className="vr-hl">
                    <div className="vr-hl-big">
                        {renderCard(reviews[0], 0, "hero-card")}
                    </div>
                    <div className="vr-hl-side">
                        {reviews.slice(1, 4).map((r, i) => renderCard(r, i + 1))}
                    </div>
                </div>
            )}

            {layout === "list" && (
                <div className="vr-list">
                    {reviews.map((r, i) => renderCard(r, i))}
                </div>
            )}

            {/* 2. Arrangements / Shapes */}
            {layout === "pinboard" && (
                <div className="vr-pin">
                    {reviews.map((r, i) => renderCard(r, i))}
                </div>
            )}

            {layout === "duo" && (
                <div className="vr-duo2">
                    {reviews.map((r, i) => renderCard(r, i))}
                </div>
            )}

            {layout === "feature" && (
                <div className="vr-feature">
                    {reviews.map((r, i) => renderCard(r, i, i === 0 ? "feature-lead" : ""))}
                </div>
            )}

            {layout === "band" && (
                <div className="vr-band">
                    {reviews.slice(0, 4).map((r, i) => renderCard(r, i))}
                </div>
            )}

            {layout === "spotlightgrid" && (
                <div className="vr-spotgrid">
                    <div className="vr-spotgrid-hero">
                        {renderCard(reviews[0], 0)}
                    </div>
                    <div className="vr-spotgrid-rest">
                        {reviews.slice(1, 5).map((r, i) => renderCard(r, i + 1))}
                    </div>
                </div>
            )}

            {/* 3. In Motion */}
            {layout === "carousel" && (
                <div className="vr-carousel-wrapper">
                    <div className="vr-track" ref={trackRef}>
                        {reviews.map((r, i) => renderCard(r, i))}
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
                        {[...reviews, ...reviews].map((r, i) => renderCard(r, i))}
                    </div>
                </div>
            )}

            {layout === "wall" && (
                <div className="vr-wall">
                    <div className="vr-wall-col">
                        {reviews.filter((_, i) => i % 3 === 0).map((r, i) => renderCard(r, i))}
                    </div>
                    <div className="vr-wall-col">
                        {reviews.filter((_, i) => i % 3 === 1).map((r, i) => renderCard(r, i))}
                    </div>
                    <div className="vr-wall-col">
                        {reviews.filter((_, i) => i % 3 === 2).map((r, i) => renderCard(r, i))}
                    </div>
                </div>
            )}

            {layout === "spotlight" && (
                <div className="vr-spot">
                    <div className="vr-spot-slot">
                        {renderCard(reviews[spotlightIdx] || reviews[0], spotlightIdx)}
                    </div>
                    {reviews.length > 1 && (
                        <div className="vr-dots">
                            {reviews.map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`vr-dot ${i === spotlightIdx ? "vr-on" : ""}`}
                                    onClick={() => setSpotlightIdx(i)}
                                    aria-label={`Spotlight ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 4. Dedicated Designs / Reading */}
            {layout === "compact" && (
                <div className="vr-compact">
                    {reviews.map((r, i) => {
                        const avStyle = { background: PASTELS[i % PASTELS.length] }
                        return (
                            <div key={r.id || i} className="vr-crow">
                                <span className="vr-avatar" style={avStyle}>
                                    {getInitials(r.authorName)}
                                </span>
                                <div className="vr-cwho">
                                    <span className="vr-name">{getShortName(r.authorName)}</span>
                                    <span className="vr-cq">{r.text}</span>
                                </div>
                                <div className="vr-cmeta">
                                    {renderStars(r.rating, 11)}
                                    <span className="vr-date">{r.date}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {layout === "split" && (
                <div className="vr-split">
                    {reviews.map((r, i) => {
                        const avStyle = { background: PASTELS[i % PASTELS.length] }
                        return (
                            <div key={r.id || i} className="vr-split-row">
                                <div className="vr-split-who">
                                    <span className="vr-split-id">
                                        <span className="vr-avatar" style={avStyle}>
                                            {getInitials(r.authorName)}
                                        </span>
                                        <span className="vr-name">{getShortName(r.authorName)}</span>
                                    </span>
                                    {renderStars(r.rating, 12)}
                                    <span className="vr-date">{r.date}</span>
                                </div>
                                <p className="vr-split-b">{r.text}</p>
                            </div>
                        )
                    })}
                </div>
            )}

            {layout === "flow" && (
                <div className="vr-flow">
                    <div className="vr-flow-row">
                        {[...reviews.slice(0, 4), ...reviews.slice(0, 4)].map((r, i) => (
                            <span key={i} className="vr-flow-item">
                                <span className="vr-flow-t">{r.text}</span>
                                <span className="vr-flow-w">
                                    <span className="vr-name">{getShortName(r.authorName)}</span>
                                    {renderStars(r.rating, 11)}
                                </span>
                            </span>
                        ))}
                    </div>
                    <div className="vr-flow-row r2">
                        {[...reviews.slice(4), ...reviews.slice(4)].map((r, i) => (
                            <span key={i} className="vr-flow-item">
                                <span className="vr-flow-t">{r.text}</span>
                                <span className="vr-flow-w">
                                    <span className="vr-name">{getShortName(r.authorName)}</span>
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
                        {breakdownRows.map((b) => {
                            const barFillStyle = { width: `${b.pc}%` }
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
                        {reviews[ribbonIdx] && (
                            <div className="vr-ribbon-q">
                                <span className="vr-ribbon-t">{reviews[ribbonIdx].text}</span>
                                <span className="vr-ribbon-w">— {getShortName(reviews[ribbonIdx].authorName)}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {layout === "gallery" && (
                <div className="vr-gal">
                    <div className="vr-gal-slot">
                        {reviews[galleryIdx] && (
                            <div className="vr-gal-card">
                                <p className="vr-gal-q">"{reviews[galleryIdx].text}"</p>
                                <div className="vr-gal-who">
                                    <span className="vr-name">{getShortName(reviews[galleryIdx].authorName)}</span>
                                    {renderStars(reviews[galleryIdx].rating, 13)}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="vr-gal-faces">
                        {reviews.slice(0, 8).map((r, i) => {
                            const avStyle = { background: PASTELS[i % PASTELS.length] }
                            return (
                                <button
                                    key={r.id || i}
                                    type="button"
                                    className={`vr-gal-face ${i === galleryIdx ? "on" : ""}`}
                                    onClick={() => setGalleryIdx(i)}
                                    title={r.authorName}
                                >
                                    <span className="vr-avatar" style={avStyle}>
                                        {getInitials(r.authorName)}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {layout === "orbit" && (
                <div className="vr-orbit">
                    <div className="vr-orbit-ring" />
                    <div className="vr-orbit-mid">
                        <span className="vr-orbit-n">{stats.averageRating}</span>
                        {renderStars(stats.averageRating, 15)}
                        {reviews[orbitIdx] && (
                            <div className="vr-orbit-slot">
                                <p className="vr-orbit-q">"{reviews[orbitIdx].text}"</p>
                                <span className="vr-orbit-who">— {getShortName(reviews[orbitIdx].authorName)}</span>
                            </div>
                        )}
                    </div>
                    <div className="vr-orbit-faces-row">
                        {reviews.slice(0, 8).map((r, i) => {
                            const avStyle = { background: PASTELS[i % PASTELS.length] }
                            return (
                                <button
                                    key={r.id || i}
                                    type="button"
                                    className={`vr-orbit-face ${i === orbitIdx ? "on" : ""}`}
                                    onClick={() => setOrbitIdx(i)}
                                    title={r.authorName}
                                >
                                    <span className="vr-avatar" style={avStyle}>
                                        {getInitials(r.authorName)}
                                    </span>
                                </button>
                            )
                        })}
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
                            <IconGoogle size={13} />
                            <span>Google ({stats.googleCount})</span>
                        </span>
                        <span className="vr-chip">
                            <IconTrustpilot size={13} />
                            <span>Trustpilot ({stats.trustpilotCount})</span>
                        </span>
                    </div>
                </div>
            )}

            {layout === "avatars" && (
                <div className="vr-trustedby">
                    <span className="vr-tb-avatars">
                        {reviews.slice(0, 5).map((r, i) => {
                            const avStyle = {
                                background: PASTELS[i % PASTELS.length],
                                zIndex: 10 - i,
                            }
                            return (
                                <span key={r.id || i} className="vr-tb-av">
                                    <span className="vr-avatar" style={avStyle}>
                                        {getInitials(r.authorName)}
                                    </span>
                                </span>
                            )
                        })}
                    </span>
                    <span className="vr-tb-info">
                        <span className="vr-tb-top">
                            {renderStars(stats.averageRating, 14)}
                            <span className="vr-tb-rating">{stats.averageRating} / 5</span>
                        </span>
                        <span className="vr-tb-count">Trusted by {stats.totalReviews}+ customers</span>
                    </span>
                </div>
            )}

            {layout === "ratingcard" && (
                <div className="vr-rc">
                    <span className="vr-rc-n">{stats.averageRating}</span>
                    {renderStars(stats.averageRating, 16)}
                    <span className="vr-rc-c">Based on {stats.totalReviews} reviews</span>
                    <div className="vr-rc-src">
                        <IconGoogle size={16} />
                        <IconTrustpilot size={16} />
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
                        <IconGoogle size={18} />
                        <span>Google</span>
                    </div>
                </div>
            )}

            {layout === "trustpilot" && (
                <div className="vr-tp-badge">
                    <span className="vr-tp-word">Excellent</span>
                    <div className="vr-tp-stars">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className="vr-tp-box">★</span>
                        ))}
                    </div>
                    <span className="vr-tp-label">
                        <u>{stats.totalReviews} reviews on</u>
                    </span>
                    <span className="vr-tp-brand">
                        <IconTrustpilot size={16} />
                        <b>Trustpilot</b>
                    </span>
                </div>
            )}
        </div>
    )
}
