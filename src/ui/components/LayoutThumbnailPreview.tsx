import React from "react"
import { ReviewLayout } from "../../core/catalogue"

interface LayoutThumbnailPreviewProps {
    layout: ReviewLayout
}

export function LayoutThumbnailPreview({ layout }: LayoutThumbnailPreviewProps) {
    switch (layout) {
        // --- 1. PINBOARD ---
        // 6 tilted rectangular cards in 2 rows of 3
        case "pinboard":
            return (
                <div className="cf-wf-pinboard">
                    <div className="cf-wf-card t-left" />
                    <div className="cf-wf-card t-right" />
                    <div className="cf-wf-card t-left-sm" />
                    <div className="cf-wf-card t-right-sm" />
                    <div className="cf-wf-card t-left" />
                    <div className="cf-wf-card t-right" />
                </div>
            )

        // --- 2. TWO COLUMNS (DUO) ---
        // 2 columns, each with 2 wide horizontal cards
        case "duo":
            return (
                <div className="cf-wf-duo">
                    <div className="cf-wf-col">
                        <div className="cf-wf-card wide" />
                        <div className="cf-wf-card wide" />
                    </div>
                    <div className="cf-wf-col">
                        <div className="cf-wf-card wide" />
                        <div className="cf-wf-card wide" />
                    </div>
                </div>
            )

        // --- 3. FEATURE ---
        // 1 wide card on top, 3 cards on bottom
        case "feature":
            return (
                <div className="cf-wf-feature">
                    <div className="cf-wf-card full-hero" />
                    <div className="cf-wf-row">
                        <div className="cf-wf-card" />
                        <div className="cf-wf-card" />
                        <div className="cf-wf-card" />
                    </div>
                </div>
            )

        // --- 4. BAND ---
        // 1 row of 4 horizontal cards side by side
        case "band":
            return (
                <div className="cf-wf-band">
                    <div className="cf-wf-card band-pill" />
                    <div className="cf-wf-card band-pill" />
                    <div className="cf-wf-card band-pill" />
                    <div className="cf-wf-card band-pill" />
                </div>
            )

        // --- 5. HERO + GRID (SPOTLIGHTGRID) & HIGHLIGHT ---
        // 1 large square card on left, 2x2 grid on right
        case "spotlightgrid":
        case "highlight":
            return (
                <div className="cf-wf-spotlightgrid">
                    <div className="cf-wf-card hero-square" />
                    <div className="cf-wf-subgrid">
                        <div className="cf-wf-card sm" />
                        <div className="cf-wf-card sm" />
                        <div className="cf-wf-card sm" />
                        <div className="cf-wf-card sm" />
                    </div>
                </div>
            )

        // --- 6. CAROUSEL ---
        // Horizontal row of vertical cards gliding smoothly back and forth
        case "carousel":
            return (
                <div className="cf-wf-carousel-wrapper">
                    <div className="cf-wf-carousel-track">
                        <div className="cf-wf-card vert" />
                        <div className="cf-wf-card vert" />
                        <div className="cf-wf-card vert" />
                        <div className="cf-wf-card vert" />
                        <div className="cf-wf-card vert" />
                    </div>
                </div>
            )

        // --- 7. TICKER ---
        // Marquee row of horizontal cards continuously gliding in infinite loop
        case "ticker":
            return (
                <div className="cf-wf-ticker-wrapper">
                    <div className="cf-wf-ticker-track">
                        <div className="cf-wf-card ticker-pill" />
                        <div className="cf-wf-card ticker-pill" />
                        <div className="cf-wf-card ticker-pill" />
                        {/* Duplicate for seamless infinite loop */}
                        <div className="cf-wf-card ticker-pill" />
                        <div className="cf-wf-card ticker-pill" />
                        <div className="cf-wf-card ticker-pill" />
                    </div>
                </div>
            )

        // --- 8. LIVING WALL ---
        // 3 columns of cards with middle column vertically drifting
        case "wall":
            return (
                <div className="cf-wf-wall">
                    <div className="cf-wf-wall-col col-1">
                        <div className="cf-wf-card wall-card" />
                        <div className="cf-wf-card wall-card" />
                        <div className="cf-wf-card wall-card" />
                    </div>
                    <div className="cf-wf-wall-col col-2 drifting">
                        <div className="cf-wf-card wall-card" />
                        <div className="cf-wf-card wall-card" />
                        <div className="cf-wf-card wall-card" />
                    </div>
                    <div className="cf-wf-wall-col col-3">
                        <div className="cf-wf-card wall-card" />
                        <div className="cf-wf-card wall-card" />
                        <div className="cf-wf-card wall-card" />
                    </div>
                </div>
            )

        // --- 9. SPOTLIGHT ---
        // Avatar circle on top, wide quote block in middle, 3 dots below
        case "spotlight":
            return (
                <div className="cf-wf-spotlight">
                    <div className="cf-wf-avatar-circle" />
                    <div className="cf-wf-card spotlight-bar" />
                    <div className="cf-wf-dots">
                        <span className="cf-wf-dot active" />
                        <span className="cf-wf-dot" />
                        <span className="cf-wf-dot" />
                    </div>
                </div>
            )

        // --- 10. FLOW ---
        // Two rows of cards flowing in opposite directions
        case "flow":
            return (
                <div className="cf-wf-flow">
                    <div className="cf-wf-flow-row flow-left">
                        <div className="cf-wf-card flow-card" />
                        <div className="cf-wf-card flow-card" />
                        <div className="cf-wf-card flow-card" />
                    </div>
                    <div className="cf-wf-flow-row flow-right">
                        <div className="cf-wf-card flow-card" />
                        <div className="cf-wf-card flow-card" />
                        <div className="cf-wf-card flow-card" />
                    </div>
                </div>
            )

        // --- 11. GRID ---
        // Uniform 3x2 grid of cards
        case "grid":
            return (
                <div className="cf-wf-grid">
                    <div className="cf-wf-card" />
                    <div className="cf-wf-card" />
                    <div className="cf-wf-card" />
                    <div className="cf-wf-card" />
                    <div className="cf-wf-card" />
                    <div className="cf-wf-card" />
                </div>
            )

        // --- 12. MASONRY ---
        // 3 columns of staggered heights
        case "masonry":
            return (
                <div className="cf-wf-masonry">
                    <div className="cf-wf-col">
                        <div className="cf-wf-card tall" />
                        <div className="cf-wf-card short" />
                    </div>
                    <div className="cf-wf-col">
                        <div className="cf-wf-card short" />
                        <div className="cf-wf-card tall" />
                    </div>
                    <div className="cf-wf-col">
                        <div className="cf-wf-card med" />
                        <div className="cf-wf-card med" />
                    </div>
                </div>
            )

        // --- 13. EDITORIAL / LIST / COMPACT / SPLIT ---
        case "list":
        case "compact":
        case "split":
            return (
                <div className="cf-wf-list">
                    <div className="cf-wf-list-row">
                        <div className="cf-wf-avatar-mini" />
                        <div className="cf-wf-line full" />
                    </div>
                    <div className="cf-wf-list-row">
                        <div className="cf-wf-avatar-mini" />
                        <div className="cf-wf-line med" />
                    </div>
                    <div className="cf-wf-list-row">
                        <div className="cf-wf-avatar-mini" />
                        <div className="cf-wf-line full" />
                    </div>
                </div>
            )

        // --- 14. TRUST BADGES / RATINGS ---
        case "badge":
        case "gbadge":
        case "trustpilot":
        case "ratingcard":
            return (
                <div className="cf-wf-badge">
                    <div className="cf-wf-badge-pill">
                        <div className="cf-wf-star-mini" />
                        <div className="cf-wf-score-bar" />
                        <div className="cf-wf-stars-row" />
                    </div>
                </div>
            )

        // --- 15. AVATARS ("TRUSTED BY") ---
        case "avatars":
            return (
                <div className="cf-wf-avatars">
                    <div className="cf-wf-avatar-stack">
                        <div className="cf-wf-avatar-mini av-1" />
                        <div className="cf-wf-avatar-mini av-2" />
                        <div className="cf-wf-avatar-mini av-3" />
                    </div>
                    <div className="cf-wf-line med" />
                </div>
            )

        // --- 16. BREAKDOWN ---
        case "breakdown":
            return (
                <div className="cf-wf-breakdown">
                    <div className="cf-wf-score-box" />
                    <div className="cf-wf-bars">
                        <div className="cf-wf-bar b-5" />
                        <div className="cf-wf-bar b-4" />
                        <div className="cf-wf-bar b-3" />
                        <div className="cf-wf-bar b-2" />
                    </div>
                </div>
            )

        // --- 17. ORBIT ---
        case "orbit":
            return (
                <div className="cf-wf-orbit">
                    <div className="cf-wf-avatar-center" />
                    <div className="cf-wf-orbit-dot od-1" />
                    <div className="cf-wf-orbit-dot od-2" />
                    <div className="cf-wf-orbit-dot od-3" />
                    <div className="cf-wf-orbit-dot od-4" />
                </div>
            )

        // --- 18. RIBBON & GALLERY ---
        case "ribbon":
        case "gallery":
        default:
            return (
                <div className="cf-wf-default">
                    <div className="cf-wf-card ribbon-hero" />
                    <div className="cf-wf-dots">
                        <span className="cf-wf-dot" />
                        <span className="cf-wf-dot" />
                        <span className="cf-wf-dot" />
                    </div>
                </div>
            )
    }
}
