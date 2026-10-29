import { GooglePlaceResult } from "./google-places"
import { ReviewItem } from "./types"

// Default local development backend URL; in production, this can point to https://api.framefic.com/reviewfic
export const BACKEND_API_BASE = "http://localhost:5001/api/v1"

/**
 * Fetch Google Places autocomplete predictions from Reviewfic backend
 */
export async function fetchGooglePlacesPredictions(query: string): Promise<GooglePlaceResult[] | null> {
    const q = (query || "").trim()
    if (!q) return []

    try {
        const res = await fetch(`${BACKEND_API_BASE}/places/predictions?input=${encodeURIComponent(q)}`, {
            headers: { Accept: "application/json" },
        })

        if (!res.ok) return null
        const data = await res.json()

        if (Array.isArray(data?.results) && data.results.length > 0) {
            return data.results.map((r: any) => ({
                placeId: r.placeId || r.place_id,
                name: r.name,
                address: r.address || "",
                rating: Number(r.rating || 5.0),
                reviewCount: Number(r.totalCount || r.reviewCount || 20),
                mapsUrl: `https://maps.google.com/?cid=${r.placeId || ""}`,
                category: "Business",
                reviews: [],
            }))
        }

        if (Array.isArray(data?.predictions) && data.predictions.length > 0) {
            return data.predictions.map((p: any) => ({
                placeId: p.place_id,
                name: p.structured_formatting?.main_text || p.description,
                address: p.structured_formatting?.secondary_text || p.description,
                rating: 5.0,
                reviewCount: 20,
                mapsUrl: `https://maps.google.com/?cid=${p.place_id}`,
                category: "Business",
                reviews: [],
            }))
        }

        return []
    } catch {
        return null // Indicates backend not reachable, triggers graceful fallback
    }
}

/**
 * Fetch full place details and real reviews from Reviewfic backend
 */
export async function fetchGooglePlaceDetails(placeId: string): Promise<{
    name: string
    address: string
    rating: number
    reviewCount: number
    mapsUrl: string
    reviews: ReviewItem[]
} | null> {
    if (!placeId) return null

    try {
        const res = await fetch(`${BACKEND_API_BASE}/places/details?place_id=${encodeURIComponent(placeId)}`, {
            headers: { Accept: "application/json" },
        })

        if (!res.ok) return null
        const data = await res.json()
        const p = data?.place

        if (!p) return null

        const reviews: ReviewItem[] = (p.reviews || []).map((r: any, idx: number) => ({
            id: `g-rev-${placeId.slice(-6)}-${idx + 1}`,
            source: "google" as const,
            authorName: r.author_name || "Google Reviewer",
            authorAvatar: r.profile_photo_url || "",
            rating: Number(r.rating || 5),
            date: r.relative_time_description || "Recently",
            text: r.text || "",
            verified: true,
            originalUrl: r.review_url || r.author_url || p.maps_url || "https://maps.google.com",
            pinned: idx === 0,
        }))

        return {
            name: p.name,
            address: p.formatted_address || "",
            rating: Number(p.rating || 5.0),
            reviewCount: Number(p.user_ratings_total || reviews.length),
            mapsUrl: p.maps_url || `https://maps.google.com/?cid=${placeId}`,
            reviews,
        }
    } catch {
        return null
    }
}

/**
 * Fetch verified Trustpilot profile and reviews from Reviewfic backend
 */
export async function fetchTrustpilotLiveReviews(domain: string, limit = 20): Promise<{
    domain: string
    businessName: string
    rating: number
    reviewCount: number
    reviews: ReviewItem[]
} | null> {
    if (!domain) return null

    try {
        const res = await fetch(`${BACKEND_API_BASE}/trustpilot/reviews?domain=${encodeURIComponent(domain)}&limit=${limit}`, {
            headers: { Accept: "application/json" },
        })

        if (!res.ok) return null
        const data = await res.json()

        if (!data || !Array.isArray(data.reviews)) return null

        const reviews: ReviewItem[] = data.reviews.map((r: any, idx: number) => ({
            id: r.id || `tp-rev-${idx + 1}`,
            source: "trustpilot" as const,
            authorName: r.authorName || "Verified Customer",
            authorAvatar: r.authorPhoto || "",
            rating: Number(r.rating || 5),
            date: r.date ? new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recently",
            text: r.text || r.title || "",
            verified: Boolean(r.verified),
            originalUrl: r.sourceUrl || `https://www.trustpilot.com/review/${domain}`,
            pinned: idx === 0,
        }))

        return {
            domain: data.domain || domain,
            businessName: data.businessName || domain.split(".")[0],
            rating: Number(data.averageRating || 5.0),
            reviewCount: Number(data.totalCount || reviews.length),
            reviews,
        }
    } catch {
        return null
    }
}

