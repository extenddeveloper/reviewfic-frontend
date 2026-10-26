import { useState, useCallback } from "react"
import { ConnectedBusiness, ReviewItem } from "../../core/types"
import { createDefaultBusiness } from "../../core/config"
import { searchGooglePlaces, parseGoogleMapsInput, generateReviewsForBusiness, GooglePlaceResult } from "../../core/google-places"
import { resolveTrustpilotProfile, generateReviewsForTrustpilot, parseTrustpilotInput } from "../../core/trustpilot"
import { IconGoogle, IconTrustpilot, IconStar, IconCheck, IconSearch, IconRefresh } from "../icons"

interface ConnectReviewsViewProps {
    onComplete: (business: ConnectedBusiness) => void
    onCancel?: () => void
    initialBusiness?: ConnectedBusiness | null
}

export function ConnectReviewsView({ onComplete, onCancel, initialBusiness }: ConnectReviewsViewProps) {
    // Google state
    const [googleQuery, setGoogleQuery] = useState(initialBusiness?.googleBusinessName || "")
    const [isSearchingGoogle, setIsSearchingGoogle] = useState(false)
    const [googleResults, setGoogleResults] = useState<GooglePlaceResult[]>([])
    const [connectedGoogle, setConnectedGoogle] = useState<{
        name: string
        placeId: string
        mapsUrl?: string
        rating: number
        reviewCount: number
        reviews: ReviewItem[]
    } | null>(
        initialBusiness?.googleBusinessName
            ? {
                  name: initialBusiness.googleBusinessName,
                  placeId: initialBusiness.googlePlaceId || "",
                  mapsUrl: initialBusiness.googleMapsUrl,
                  rating: initialBusiness.googleRating ?? 4.9,
                  reviewCount: initialBusiness.googleReviewCount ?? 156,
                  reviews: initialBusiness.googleReviews || [],
              }
            : null
    )
    const [isChangingGoogle, setIsChangingGoogle] = useState(!initialBusiness?.googleBusinessName)

    // Trustpilot state
    const [tpUrlInput, setTpUrlInput] = useState(initialBusiness?.trustpilotDomain || "")
    const [isVerifyingTp, setIsVerifyingTp] = useState(false)
    const [tpError, setTpError] = useState<string | null>(null)
    const [connectedTp, setConnectedTp] = useState<{
        domain: string
        rating: number
        reviewCount: number
        reviews: ReviewItem[]
    } | null>(
        initialBusiness?.trustpilotDomain
            ? {
                  domain: initialBusiness.trustpilotDomain,
                  rating: initialBusiness.trustpilotRating ?? 4.8,
                  reviewCount: initialBusiness.trustpilotReviewCount ?? 120,
                  reviews: initialBusiness.trustpilotReviews || [],
              }
            : null
    )
    const [isChangingTp, setIsChangingTp] = useState(!initialBusiness?.trustpilotDomain)

    // Handle Google search
    const handleGoogleSearch = useCallback((val: string) => {
        setGoogleQuery(val)
        if (!val.trim()) {
            setGoogleResults([])
            return
        }

        const parsed = parseGoogleMapsInput(val)
        if (parsed.isMapsUrl) {
            const placeName = parsed.placeName || "Google Verified Business"
            setConnectedGoogle({
                name: placeName,
                placeId: parsed.placeId || `ChIJ_${Date.now()}`,
                mapsUrl: parsed.mapsUrl || val,
                rating: 4.9,
                reviewCount: 156,
                reviews: generateReviewsForBusiness(placeName),
            })
            setIsChangingGoogle(false)
            setGoogleResults([])
            return
        }

        setIsSearchingGoogle(true)
        searchGooglePlaces(val)
            .then((res) => setGoogleResults(res))
            .catch(() => setGoogleResults([]))
            .finally(() => setIsSearchingGoogle(false))
    }, [])

    const handleSelectGooglePlace = (place: GooglePlaceResult) => {
        const reviews = place.reviews?.length ? place.reviews : generateReviewsForBusiness(place.name, place.category, place.address)
        setConnectedGoogle({
            name: place.name,
            placeId: place.placeId,
            mapsUrl: place.mapsUrl,
            rating: place.rating,
            reviewCount: place.reviewCount,
            reviews,
        })
        setIsChangingGoogle(false)
        setGoogleResults([])
    }

    // Handle Trustpilot verify
    const handleVerifyTrustpilot = async () => {
        if (!tpUrlInput.trim()) return
        setIsVerifyingTp(true)
        setTpError(null)

        try {
            const parsed = parseTrustpilotInput(tpUrlInput)
            const domain = parsed.domain || tpUrlInput.trim()
            const profile = await resolveTrustpilotProfile(domain)
            const reviews = generateReviewsForTrustpilot(domain, 24)

            setConnectedTp({
                domain,
                rating: profile.rating,
                reviewCount: profile.reviewCount,
                reviews,
            })
            setIsChangingTp(false)
        } catch {
            setTpError("Could not resolve Trustpilot business. Please check URL.")
        } finally {
            setIsVerifyingTp(false)
        }
    }

    const canContinue = Boolean(connectedGoogle || connectedTp || tpUrlInput.trim())

    const handleContinue = async () => {
        let tp = connectedTp
        if (!tp && tpUrlInput.trim()) {
            try {
                const parsed = parseTrustpilotInput(tpUrlInput)
                const domain = parsed.domain || tpUrlInput.trim()
                const profile = await resolveTrustpilotProfile(domain)
                const reviews = generateReviewsForTrustpilot(domain, 24)
                tp = {
                    domain,
                    rating: profile.rating,
                    reviewCount: profile.reviewCount,
                    reviews,
                }
            } catch {}
        }

        if (!connectedGoogle && !tp) return

        const tpName = tp?.domain ? parseTrustpilotInput(tp.domain).businessName : ""
        const displayName = connectedGoogle?.name || tpName || "My Business"
        const business = createDefaultBusiness(
            displayName,
            connectedGoogle ? {
                name: connectedGoogle.name,
                placeId: connectedGoogle.placeId,
                mapsUrl: connectedGoogle.mapsUrl,
                rating: connectedGoogle.rating,
                reviewCount: connectedGoogle.reviewCount,
                reviews: connectedGoogle.reviews,
            } : undefined,
            tp ? {
                domain: tp.domain,
                rating: tp.rating,
                reviewCount: tp.reviewCount,
                reviews: tp.reviews,
            } : undefined
        )

        if (initialBusiness?.id) {
            business.id = initialBusiness.id
            business.createdAt = initialBusiness.createdAt
            business.customReviews = initialBusiness.customReviews || []
        }

        onComplete(business)
    }

    return (
        <div className="cf-connect-container">
            <div className="cf-connect-header">
                <div>
                    <h2 className="cf-connect-title">Connect your reviews</h2>
                    <p className="cf-connect-subtitle">
                        {canContinue ? "Connect at least one platform to continue." : "Search for your business — we'll find its reviews on Google and Trustpilot."}
                    </p>
                </div>
                {onCancel && (
                    <button type="button" className="cf-connect-back-btn" onClick={onCancel}>
                        ← Back
                    </button>
                )}
            </div>

            <div className="cf-connect-platforms">
                {/* 1. Google Business Connection Card */}
                {connectedGoogle && !isChangingGoogle ? (
                    <div className="cf-connect-card cf-connect-card-connected">
                        <div className="cf-connect-card-top">
                            <div className="cf-connect-card-brand">
                                <div className="cf-connect-badge-icon google">
                                    <IconGoogle size={16} />
                                </div>
                                <span className="cf-connect-brand-title">Google</span>
                            </div>
                            <span className="cf-connect-status-pill">
                                <IconCheck size={12} /> Connected
                            </span>
                        </div>
                        <h4 className="cf-connect-biz-name">{connectedGoogle.name}</h4>
                        <div className="cf-connect-biz-rating">
                            <div className="cf-connect-stars">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <IconStar
                                        key={s}
                                        size={13}
                                        fill={s <= Math.round(connectedGoogle.rating) ? "#FBBC05" : "#444"}
                                    />
                                ))}
                            </div>
                            <span className="cf-connect-rating-score">{connectedGoogle.rating.toFixed(1)}</span>
                            <span className="cf-connect-review-count">· {connectedGoogle.reviewCount} reviews</span>
                        </div>
                        <button
                            type="button"
                            className="cf-connect-change-btn"
                            onClick={() => setIsChangingGoogle(true)}
                        >
                            Change
                        </button>
                    </div>
                ) : (
                    <div className="cf-connect-card">
                        <div className="cf-connect-card-top">
                            <div className="cf-connect-card-brand">
                                <div className="cf-connect-badge-icon google">
                                    <IconGoogle size={16} />
                                </div>
                                <span className="cf-connect-brand-title">Google Business</span>
                            </div>
                            {connectedGoogle && (
                                <button
                                    type="button"
                                    className="cf-connect-cancel-change-btn"
                                    onClick={() => setIsChangingGoogle(false)}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                        <div className="cf-connect-input-box">
                            <div className="cf-connect-input-wrapper">
                                <IconSearch size={14} className="cf-connect-input-icon" />
                                <input
                                    type="text"
                                    className="cf-connect-input"
                                    placeholder="e.g. Nike House of Innovation Paris (or Maps URL)"
                                    value={googleQuery}
                                    onChange={(e) => handleGoogleSearch(e.target.value)}
                                />
                                {isSearchingGoogle && (
                                    <div className="cf-connect-loading-spinner" />
                                )}
                            </div>
                            <p className="cf-connect-field-desc">
                                Search by business name or paste any Google Maps share link.
                            </p>

                            {/* Autocomplete Results */}
                            {googleResults.length > 0 && (
                                <div className="cf-connect-results-dropdown">
                                    {googleResults.map((p) => (
                                        <div
                                            key={p.placeId}
                                            className="cf-connect-result-row"
                                            onClick={() => handleSelectGooglePlace(p)}
                                        >
                                            <div className="cf-connect-result-info">
                                                <div className="cf-connect-result-name">{p.name}</div>
                                                <div className="cf-connect-result-meta">
                                                    ★ {p.rating} ({p.reviewCount} reviews) · {p.address}
                                                </div>
                                            </div>
                                            <span className="cf-connect-result-select">Select →</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. Trustpilot Connection Card */}
                {connectedTp && !isChangingTp ? (
                    <div className="cf-connect-card cf-connect-card-connected">
                        <div className="cf-connect-card-top">
                            <div className="cf-connect-card-brand">
                                <div className="cf-connect-badge-icon trustpilot">
                                    <IconTrustpilot size={16} />
                                </div>
                                <span className="cf-connect-brand-title">Trustpilot</span>
                            </div>
                            <span className="cf-connect-status-pill">
                                <IconCheck size={12} /> Connected
                            </span>
                        </div>
                        <h4 className="cf-connect-biz-name">{connectedTp.domain}</h4>
                        <div className="cf-connect-biz-rating">
                            <div className="cf-connect-stars">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <IconStar
                                        key={s}
                                        size={13}
                                        fill={s <= Math.round(connectedTp.rating) ? "#00B67A" : "#444"}
                                    />
                                ))}
                            </div>
                            <span className="cf-connect-rating-score">{connectedTp.rating.toFixed(1)}</span>
                            <span className="cf-connect-review-count">· {connectedTp.reviewCount} reviews</span>
                        </div>
                        <button
                            type="button"
                            className="cf-connect-change-btn"
                            onClick={() => setIsChangingTp(true)}
                        >
                            Change
                        </button>
                    </div>
                ) : (
                    <div className="cf-connect-card">
                        <div className="cf-connect-card-top">
                            <div className="cf-connect-card-brand">
                                <div className="cf-connect-badge-icon trustpilot">
                                    <IconTrustpilot size={16} />
                                </div>
                                <span className="cf-connect-brand-title">Trustpilot</span>
                            </div>
                            {connectedTp && (
                                <button
                                    type="button"
                                    className="cf-connect-cancel-change-btn"
                                    onClick={() => setIsChangingTp(false)}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                        <div className="cf-connect-input-box">
                            <label className="cf-connect-input-label">Trustpilot page URL</label>
                            <input
                                type="text"
                                className="cf-connect-input"
                                placeholder="trustpilot.com/review/yourbusiness.com"
                                value={tpUrlInput}
                                onChange={(e) => setTpUrlInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        void handleVerifyTrustpilot()
                                    }
                                }}
                            />
                            <p className="cf-connect-field-desc">
                                Paste the link to your Trustpilot profile.
                            </p>
                            {tpError && <div className="cf-connect-error-msg">{tpError}</div>}
                            <button
                                type="button"
                                className="cf-connect-verify-btn"
                                onClick={handleVerifyTrustpilot}
                                disabled={!tpUrlInput.trim() || isVerifyingTp}
                            >
                                {isVerifyingTp ? (
                                    <>
                                        <IconRefresh size={13} className="spin" /> Verifying...
                                    </>
                                ) : (
                                    "Verify"
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="cf-connect-footer">
                <button
                    type="button"
                    className="cf-connect-continue-btn"
                    disabled={!canContinue}
                    onClick={handleContinue}
                >
                    Continue
                </button>
            </div>
        </div>
    )
}
