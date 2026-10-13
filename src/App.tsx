import { useState, useEffect, useCallback, useMemo } from "react"
import { framer } from "@framer/plugin"
import { ReviewConfig, ReviewItem, ReviewLayout, CardStyle, ThemeMode } from "./core/types"
import { DEFAULT_CONFIG, calculateBlendedStats, getActiveReviews } from "./core/config"
import { loadReviewConfig, saveReviewConfig } from "./core/storage"
import { insertCanvasComponent, getCanvasInstancesCount } from "./framer/canvas-component-service"
import {
    IconGoogle,
    IconTrustpilot,
    IconStar,
    IconSparkles,
    IconLayoutCarousel,
    IconLayoutGrid,
    IconLayoutMasonry,
    IconLayoutMarquee,
    IconBadge,
    IconSun,
    IconMoon,
    IconRefresh,
    IconPlus,
    IconTrash,
    IconCrown,
    IconSliders,
    IconCheck,
} from "./ui/icons"
import { HeroCard } from "./ui/components/HeroCard"
import { Switch } from "./ui/components/Switch"
import { Field } from "./ui/components/Field"
import { Section } from "./ui/components/Section"
import { ProfilePage } from "./ui/components/ProfilePage"
import { ReviewCardPreview } from "./ui/components/ReviewCardPreview"
import "./ui/styles.css"

type TabId = "overview" | "builder" | "sources" | "settings"

export function App() {
    const [config, setConfig] = useState<ReviewConfig>(DEFAULT_CONFIG)
    const [tab, setTab] = useState<TabId>("overview")
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [canvasCount, setCanvasCount] = useState<number>(0)
    const [inserting, setInserting] = useState<boolean>(false)
    const [notice, setNotice] = useState<string | null>(null)

    // New custom review form state
    const [newAuthor, setNewAuthor] = useState("")
    const [newText, setNewText] = useState("")
    const [newRating, setNewRating] = useState(5)
    const [newVerified, setNewVerified] = useState(true)

    // Load initial config and check canvas instances
    useEffect(() => {
        let isMounted = true
        async function init() {
            const loaded = await loadReviewConfig()
            if (!isMounted) return
            setConfig(loaded)

            const count = await getCanvasInstancesCount()
            if (!isMounted) return
            setCanvasCount(count)
        }
        void init()
        return () => {
            isMounted = false
        }
    }, [])

    // Auto-save on config changes
    const updateConfig = useCallback((updater: (prev: ReviewConfig) => ReviewConfig) => {
        setConfig((prev) => {
            const updated = updater(prev)
            void saveReviewConfig(updated)
            return updated
        })
    }, [])

    const toggleTheme = useCallback(() => {
        updateConfig((prev) => {
            const nextMode: ThemeMode = prev.themeMode === "dark" ? "light" : "dark"
            return { ...prev, themeMode: nextMode }
        })
    }, [updateConfig])

    const activeReviews = useMemo(() => getActiveReviews(config), [config])
    const stats = useMemo(() => calculateBlendedStats(config, activeReviews), [config, activeReviews])

    const handleInsert = async () => {
        setInserting(true)
        setNotice(null)
        try {
            const result = await insertCanvasComponent(config)
            if (result.success) {
                setNotice("Reviewfic component inserted onto the canvas!")
                const count = await getCanvasInstancesCount()
                setCanvasCount(count)
            } else {
                setNotice(result.message || "Could not insert component.")
            }
        } catch (e: any) {
            setNotice(e?.message || "Failed to insert component.")
        } finally {
            setInserting(false)
            setTimeout(() => setNotice(null), 4000)
        }
    }

    const handleAddCustomReview = () => {
        if (!newAuthor.trim() || !newText.trim()) return

        const item: ReviewItem = {
            id: `custom-${Date.now()}`,
            source: "custom",
            authorName: newAuthor.trim(),
            rating: newRating,
            text: newText.trim(),
            date: "Just now",
            verified: newVerified,
        }

        updateConfig((prev) => ({
            ...prev,
            customReviews: [item, ...prev.customReviews],
        }))

        setNewAuthor("")
        setNewText("")
        setNewRating(5)
        setNewVerified(true)
        setNotice("Custom review added!")
        setTimeout(() => setNotice(null), 3000)
    }

    const handleDeleteCustomReview = (id: string) => {
        updateConfig((prev) => ({
            ...prev,
            customReviews: prev.customReviews.filter((r) => r.id !== id),
        }))
    }

    const resetDefaults = () => {
        updateConfig(() => ({ ...DEFAULT_CONFIG }))
        setNotice("Settings reset to defaults.")
        setTimeout(() => setNotice(null), 3000)
    }

    if (isProfileOpen) {
        return (
            <div className={`app ${config.themeMode}`}>
                <ProfilePage onBack={() => setIsProfileOpen(false)} />
            </div>
        )
    }

    return (
        <div className={`app ${config.themeMode}`}>
            {/* Header */}
            <header className="header">
                <div className="app-brand">
                    <div className="app-logo">
                        <IconStar size={18} color="#FFFFFF" />
                    </div>
                    <div className="app-brand-info">
                        <h1>Reviewfic</h1>
                        <p>Google &amp; Trustpilot Reviews</p>
                    </div>
                </div>

                <div className="header-actions">
                    <button
                        type="button"
                        className="cf-theme-toggle"
                        onClick={toggleTheme}
                        title={`Theme: ${config.themeMode}. Click to switch.`}
                    >
                        {config.themeMode === "dark" ? <IconMoon size={12} /> : <IconSun size={12} />}
                        <span>{config.themeMode === "dark" ? "Dark" : "Light"}</span>
                    </button>

                    <button
                        type="button"
                        className="cf-profile-btn"
                        onClick={() => setIsProfileOpen(true)}
                        title="Account & Profile"
                    >
                        <IconCrown size={12} />
                        <span>Pro</span>
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="cf-nav-tabs">
                <button
                    type="button"
                    className={`cf-tab-btn ${tab === "overview" ? "active" : ""}`}
                    onClick={() => setTab("overview")}
                >
                    <IconStar size={13} />
                    <span>Overview</span>
                </button>
                <button
                    type="button"
                    className={`cf-tab-btn ${tab === "builder" ? "active" : ""}`}
                    onClick={() => setTab("builder")}
                >
                    <IconSliders size={13} />
                    <span>Builder</span>
                </button>
                <button
                    type="button"
                    className={`cf-tab-btn ${tab === "sources" ? "active" : ""}`}
                    onClick={() => setTab("sources")}
                >
                    <IconGoogle size={13} />
                    <span>Sources</span>
                </button>
                <button
                    type="button"
                    className={`cf-tab-btn ${tab === "settings" ? "active" : ""}`}
                    onClick={() => setTab("settings")}
                >
                    <IconCheck size={13} />
                    <span>Settings</span>
                </button>
            </nav>

            {/* Main Tab Content */}
            <main className="content">
                {/* TAB 1: OVERVIEW */}
                {tab === "overview" && (
                    <>
                        <HeroCard
                            badgeText={config.isDemoMode ? "DEMO MODE ACTIVE" : "LIVE SOURCES"}
                            badgeType={config.isDemoMode ? "brand" : "success"}
                            badgeIcon={<IconSparkles size={11} />}
                            statusBadge={
                                <div className={`status-badge ${canvasCount > 0 ? "ok" : ""}`}>
                                    <span className="status-dot" />
                                    <span>{canvasCount > 0 ? `${canvasCount} on Canvas` : "Ready"}</span>
                                </div>
                            }
                            title={`${stats.averageRating} ★ Social Proof`}
                            description="Blended Google & Trustpilot ratings with 0 view cutoffs and pure native performance."
                            ctaLabel="Customize in Builder"
                            ctaIcon={<IconSliders size={14} />}
                            onCtaClick={() => setTab("builder")}
                        />

                        {/* Blended Stats Grid */}
                        <div className="cf-stats-grid">
                            <div className="cf-stat-card">
                                <span className="cf-stat-val">{stats.averageRating} ★</span>
                                <span className="cf-stat-label">Blended Score</span>
                            </div>
                            <div className="cf-stat-card">
                                <span className="cf-stat-val">{stats.totalReviews}</span>
                                <span className="cf-stat-label">Total Reviews</span>
                            </div>
                            <div className="cf-stat-card">
                                <span className="cf-stat-val">{activeReviews.length}</span>
                                <span className="cf-stat-label">Shown Cards</span>
                            </div>
                        </div>

                        {/* Demo Mode Toggle Banner */}
                        <div className="cf-hero-card">
                            <div className="cf-field-header">
                                <div>
                                    <h4 className="cf-section-title">Instant Wireframe Demo Mode</h4>
                                    <p className="cf-field-hint">Showcase realistic 5-star reviews on the canvas before connecting live API links.</p>
                                </div>
                                <Switch
                                    checked={config.isDemoMode}
                                    onChange={(checked) => updateConfig((prev) => ({ ...prev, isDemoMode: checked }))}
                                />
                            </div>
                        </div>

                        {/* Quick Layout Selection */}
                        <Section title="Quick Layout Preset" subtitle="Select how reviews render on your page" icon={<IconLayoutGrid size={15} />}>
                            <div className="cf-segmented-grid">
                                {(["carousel", "grid", "masonry", "marquee", "badge", "list"] as ReviewLayout[]).map((l) => (
                                    <button
                                        key={l}
                                        type="button"
                                        className={`cf-seg-btn ${config.layout === l ? "active" : ""}`}
                                        onClick={() => updateConfig((prev) => ({ ...prev, layout: l }))}
                                    >
                                        {l === "carousel" && <IconLayoutCarousel size={16} />}
                                        {l === "grid" && <IconLayoutGrid size={16} />}
                                        {l === "masonry" && <IconLayoutMasonry size={16} />}
                                        {l === "marquee" && <IconLayoutMarquee size={16} />}
                                        {l === "badge" && <IconBadge size={16} />}
                                        {l === "list" && <IconStar size={16} />}
                                        <span>{l.charAt(0).toUpperCase() + l.slice(1)}</span>
                                    </button>
                                ))}
                            </div>
                        </Section>
                    </>
                )}

                {/* TAB 2: BUILDER / CUSTOMIZER */}
                {tab === "builder" && (
                    <>
                        {/* Live Preview Container */}
                        <div className="cf-preview-container">
                            <div className="cf-preview-header">
                                <span className="cf-preview-title">Live Preview ({config.layout})</span>
                                <span className="cf-badge cf-badge-brand">{activeReviews.length} Reviews</span>
                            </div>

                            {activeReviews.length > 0 ? (
                                <ReviewCardPreview review={activeReviews[0]} config={config} />
                            ) : (
                                <p className="cf-field-hint">No reviews match current filters.</p>
                            )}
                        </div>

                        {/* Layout Selector */}
                        <Section title="Display Layout" subtitle="Configure widget layout engine" icon={<IconLayoutCarousel size={15} />}>
                            <div className="cf-segmented-grid">
                                {(["carousel", "grid", "masonry", "marquee", "badge", "list"] as ReviewLayout[]).map((l) => (
                                    <button
                                        key={l}
                                        type="button"
                                        className={`cf-seg-btn ${config.layout === l ? "active" : ""}`}
                                        onClick={() => updateConfig((prev) => ({ ...prev, layout: l }))}
                                    >
                                        {l === "carousel" && <IconLayoutCarousel size={16} />}
                                        {l === "grid" && <IconLayoutGrid size={16} />}
                                        {l === "masonry" && <IconLayoutMasonry size={16} />}
                                        {l === "marquee" && <IconLayoutMarquee size={16} />}
                                        {l === "badge" && <IconBadge size={16} />}
                                        {l === "list" && <IconStar size={16} />}
                                        <span>{l.charAt(0).toUpperCase() + l.slice(1)}</span>
                                    </button>
                                ))}
                            </div>

                            {config.layout === "carousel" && (
                                <>
                                    <Switch
                                        label="Autoplay Slides"
                                        checked={config.carouselAutoplay}
                                        onChange={(v) => updateConfig((prev) => ({ ...prev, carouselAutoplay: v }))}
                                    />
                                    <Field label={`Autoplay Interval: ${config.carouselSpeed}s`}>
                                        <input
                                            type="range"
                                            min="2"
                                            max="12"
                                            value={config.carouselSpeed}
                                            onChange={(e) => updateConfig((prev) => ({ ...prev, carouselSpeed: Number(e.target.value) }))}
                                        />
                                    </Field>
                                </>
                            )}

                            {(config.layout === "grid" || config.layout === "masonry") && (
                                <Field label={`Grid Columns: ${config.gridColumns}`}>
                                    <input
                                        type="range"
                                        min="1"
                                        max="4"
                                        value={config.gridColumns}
                                        onChange={(e) => updateConfig((prev) => ({ ...prev, gridColumns: Number(e.target.value) }))}
                                    />
                                </Field>
                            )}

                            {config.layout === "marquee" && (
                                <Field label="Ticker Scroll Speed">
                                    <select
                                        className="cf-select"
                                        value={config.marqueeSpeed}
                                        onChange={(e) => updateConfig((prev) => ({ ...prev, marqueeSpeed: e.target.value as any }))}
                                    >
                                        <option value="slow">Slow &amp; Subtle (50s)</option>
                                        <option value="normal">Normal (34s)</option>
                                        <option value="fast">Fast &amp; Dynamic (22s)</option>
                                    </select>
                                </Field>
                            )}
                        </Section>

                        {/* Card Style Presets */}
                        <Section title="Card Style & Aesthetics" subtitle="Choose card container design" icon={<IconSparkles size={15} />}>
                            <div className="cf-segmented-grid">
                                {(["elevated", "minimal", "glass", "bento"] as CardStyle[]).map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        className={`cf-seg-btn ${config.cardStyle === s ? "active" : ""}`}
                                        onClick={() => updateConfig((prev) => ({ ...prev, cardStyle: s }))}
                                    >
                                        <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                                    </button>
                                ))}
                            </div>

                            <Field label="Star Accent Color">
                                <div className="cf-color-swatches-row">
                                    {[
                                        { label: "Google Gold", color: "#FBBC05", class: "gold" },
                                        { label: "Trustpilot Green", color: "#00B67A", class: "green" },
                                        { label: "Vibrant Orange", color: "#FF9900", class: "orange" },
                                        { label: "Brand Blue", color: "#0099FF", class: "blue" },
                                    ].map((c) => (
                                        <button
                                            key={c.color}
                                            type="button"
                                            className={`cf-color-swatch-btn ${config.starColor === c.color ? "selected" : ""}`}
                                            onClick={() => updateConfig((prev) => ({ ...prev, starColor: c.color }))}
                                            title={c.label}
                                        >
                                            <span className={`cf-swatch-circle ${c.class}`} />
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            <Field label={`Corner Radius: ${config.cornerRadius}px`}>
                                <input
                                    type="range"
                                    min="0"
                                    max="32"
                                    value={config.cornerRadius}
                                    onChange={(e) => updateConfig((prev) => ({ ...prev, cornerRadius: Number(e.target.value) }))}
                                />
                            </Field>
                        </Section>

                        {/* Card Content Toggles */}
                        <Section title="Card Elements" subtitle="Toggle reviewer metadata" icon={<IconCheck size={15} />}>
                            <Switch
                                label="Show Star Rating"
                                checked={config.showStars}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, showStars: v }))}
                            />
                            <Switch
                                label="Show Reviewer Avatars"
                                checked={config.showAvatar}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, showAvatar: v }))}
                            />
                            <Switch
                                label="Show Review Date"
                                checked={config.showDate}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, showDate: v }))}
                            />
                            <Switch
                                label="Show Platform Source Badge (Google/Trustpilot)"
                                checked={config.showSourceIcon}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, showSourceIcon: v }))}
                            />
                            <Switch
                                label="Show Verified Customer Pill"
                                checked={config.showVerifiedBadge}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, showVerifiedBadge: v }))}
                            />
                            <Switch
                                label="Show 'Write a Review' Header CTA"
                                checked={config.showWriteReview}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, showWriteReview: v }))}
                            />
                        </Section>
                    </>
                )}

                {/* TAB 3: SOURCES */}
                {tab === "sources" && (
                    <>
                        {/* Source Mode Filter */}
                        <Section title="Source Filter" subtitle="Choose which platforms to display" icon={<IconGoogle size={15} />}>
                            <div className="cf-segmented-grid">
                                {[
                                    { id: "blend", label: "Blended Feed" },
                                    { id: "google_only", label: "Google Only" },
                                    { id: "trustpilot_only", label: "Trustpilot Only" },
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        className={`cf-seg-btn ${config.sourceMode === m.id ? "active" : ""}`}
                                        onClick={() => updateConfig((prev) => ({ ...prev, sourceMode: m.id as any }))}
                                    >
                                        <span>{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </Section>

                        {/* Google Profile Connection */}
                        <Section title="Google Business Profile" subtitle="Connect your Google Places reviews" icon={<IconGoogle size={15} />}>
                            <Switch
                                label="Enable Google Reviews"
                                checked={config.googleEnabled}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, googleEnabled: v }))}
                            />
                            <Field label="Google Business Name" hint="Displayed in trust headers">
                                <input
                                    type="text"
                                    className="cf-input"
                                    placeholder="e.g. Acme Studio London"
                                    value={config.googleBusinessName}
                                    onChange={(e) => updateConfig((prev) => ({ ...prev, googleBusinessName: e.target.value }))}
                                />
                            </Field>
                            <Field label="Google Maps URL / Place ID" hint="Used for authentic verification and Write Review CTA">
                                <input
                                    type="text"
                                    className="cf-input"
                                    placeholder="https://maps.google.com/?cid=..."
                                    value={config.googleMapsUrl}
                                    onChange={(e) => updateConfig((prev) => ({ ...prev, googleMapsUrl: e.target.value }))}
                                />
                            </Field>
                        </Section>

                        {/* Trustpilot Connection */}
                        <Section title="Trustpilot Profile" subtitle="Connect your Trustpilot reviews" icon={<IconTrustpilot size={15} />}>
                            <Switch
                                label="Enable Trustpilot Reviews"
                                checked={config.trustpilotEnabled}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, trustpilotEnabled: v }))}
                            />
                            <Field label="Trustpilot Domain / Profile URL">
                                <input
                                    type="text"
                                    className="cf-input"
                                    placeholder="e.g. company.com or trustpilot.com/review/company.com"
                                    value={config.trustpilotDomain}
                                    onChange={(e) => updateConfig((prev) => ({ ...prev, trustpilotDomain: e.target.value }))}
                                />
                            </Field>
                        </Section>

                        {/* Custom / Manual Reviews */}
                        <Section
                            title={`Custom Testimonials (${config.customReviews.length})`}
                            subtitle="Add bespoke client quotes or B2B reviews"
                            icon={<IconPlus size={15} />}
                        >
                            {config.customReviews.map((cr) => (
                                <div key={cr.id} className="cf-custom-item">
                                    <div className="cf-custom-item-info">
                                        <span className="cf-custom-item-name">{cr.authorName} ({cr.rating}★)</span>
                                        <span className="cf-custom-item-snippet">{cr.text}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="cf-btn-icon-del"
                                        onClick={() => handleDeleteCustomReview(cr.id)}
                                        title="Delete review"
                                    >
                                        <IconTrash size={13} />
                                    </button>
                                </div>
                            ))}

                            <Field label="Reviewer Name">
                                <input
                                    type="text"
                                    className="cf-input"
                                    placeholder="e.g. Michael Chen"
                                    value={newAuthor}
                                    onChange={(e) => setNewAuthor(e.target.value)}
                                />
                            </Field>
                            <Field label="Rating (1 to 5 Stars)">
                                <select
                                    className="cf-select"
                                    value={newRating}
                                    onChange={(e) => setNewRating(Number(e.target.value))}
                                >
                                    <option value={5}>5 Stars ★★★★★</option>
                                    <option value={4}>4 Stars ★★★★☆</option>
                                    <option value={3}>3 Stars ★★★☆☆</option>
                                </select>
                            </Field>
                            <Field label="Testimonial Quote">
                                <textarea
                                    className="cf-input"
                                    rows={3}
                                    placeholder="Share your client's quote or recommendation..."
                                    value={newText}
                                    onChange={(e) => setNewText(e.target.value)}
                                />
                            </Field>
                            <Switch
                                label="Mark as Verified Customer"
                                checked={newVerified}
                                onChange={(v) => setNewVerified(v)}
                            />
                            <button
                                type="button"
                                className="secondary-cta"
                                onClick={handleAddCustomReview}
                                disabled={!newAuthor.trim() || !newText.trim()}
                            >
                                <IconPlus size={13} />
                                <span>Add Testimonial</span>
                            </button>
                        </Section>
                    </>
                )}

                {/* TAB 4: SETTINGS */}
                {tab === "settings" && (
                    <>
                        <Section title="Curation & Filtering" subtitle="Control which reviews are rendered" icon={<IconSliders size={15} />}>
                            <Field label="Minimum Star Filter">
                                <select
                                    className="cf-select"
                                    value={config.minRatingFilter}
                                    onChange={(e) => updateConfig((prev) => ({ ...prev, minRatingFilter: Number(e.target.value) }))}
                                >
                                    <option value={0}>Show All Ratings (1 to 5 Stars)</option>
                                    <option value={4}>4+ Stars Only (Recommended)</option>
                                    <option value={5}>5 Stars Only (Top Tier)</option>
                                </select>
                            </Field>

                            <Switch
                                label="Hide Empty Ratings Without Written Comments"
                                checked={config.hideEmptyText}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, hideEmptyText: v }))}
                            />

                            <Field label={`Maximum Reviews to Render: ${config.maxReviews}`}>
                                <input
                                    type="range"
                                    min="3"
                                    max="24"
                                    step="3"
                                    value={config.maxReviews}
                                    onChange={(e) => updateConfig((prev) => ({ ...prev, maxReviews: Number(e.target.value) }))}
                                />
                            </Field>
                        </Section>

                        <Section title="SEO & Structured Data" subtitle="Boost organic search ranking" icon={<IconCheck size={15} />}>
                            <Switch
                                label="Emit JSON-LD AggregateRating Schema"
                                checked={config.enableJsonLdSchema}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, enableJsonLdSchema: v }))}
                            />
                            <p className="cf-field-hint">
                                Injects Google-compliant AggregateRating markup to unlock gold review stars on search engine result pages (SERPs).
                            </p>
                        </Section>
                    </>
                )}
            </main>

            {/* Bottom Actions */}
            <footer className="actions">
                {notice && (
                    <div className="cf-badge cf-badge-brand cf-notice-badge">
                        {notice}
                    </div>
                )}
                <div className="cf-footer-grid">
                    <button
                        type="button"
                        className="primary-cta"
                        onClick={handleInsert}
                        disabled={inserting}
                        title="Insert Reviewfic component onto canvas"
                    >
                        <IconSparkles size={16} />
                        <span>{inserting ? "Inserting..." : "Insert into Canvas"}</span>
                    </button>
                    <button
                        type="button"
                        className="secondary-cta"
                        onClick={resetDefaults}
                        disabled={inserting}
                        title="Reset all settings to defaults"
                    >
                        <IconRefresh size={13} />
                        <span>Reset</span>
                    </button>
                </div>
                <div className="cf-shell-status-bar">
                    <span className="status-badge ok">
                        <span className="status-dot" />
                        <span>Reviewfic v0.1.0 · Ready</span>
                    </span>
                    <span>{canvasCount} on Canvas</span>
                </div>
            </footer>
        </div>
    )
}
