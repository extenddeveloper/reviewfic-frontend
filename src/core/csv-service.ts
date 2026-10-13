import { ReviewItem } from "./types"

/**
 * Escapes a cell value for standard RFC 4180 CSV.
 */
function escapeCSVCell(val: any): string {
    if (val === null || val === undefined) return '""'
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
}

/**
 * Converts a list of ReviewItem objects into a clean CSV string.
 */
export function reviewsToCSVString(reviews: ReviewItem[]): string {
    const headers = ["Author", "Rating", "Review Text", "Date", "Source", "Verified", "Avatar URL"]
    const rows = reviews.map((r) => [
        escapeCSVCell(r.authorName),
        escapeCSVCell(r.rating),
        escapeCSVCell(r.text),
        escapeCSVCell(r.date),
        escapeCSVCell(r.source),
        escapeCSVCell(r.verified ? "true" : "false"),
        escapeCSVCell(r.authorAvatar || ""),
    ])

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n")
}

/**
 * Triggers a client-side download of a CSV file.
 */
export function downloadCSV(filename: string, content: string): void {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.display = "none"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Generates a clean sample CSV string for users to download as a template.
 */
export function generateSampleCSV(): string {
    const sampleReviews: ReviewItem[] = [
        {
            id: "sample-1",
            authorName: "Sarah Jenkins",
            rating: 5,
            text: "Exceptional quality and attentive service. The team delivered ahead of schedule!",
            date: "2 days ago",
            source: "custom",
            verified: true,
            authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
        },
        {
            id: "sample-2",
            authorName: "David Thornton",
            rating: 5,
            text: "Reliable, transparent, and prompt. Would recommend to anyone seeking genuine excellence.",
            date: "1 week ago",
            source: "custom",
            verified: true,
            authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
        },
        {
            id: "sample-3",
            authorName: "Elena Rostova",
            rating: 4,
            text: "Very good experience overall. Quick communication and friendly staff.",
            date: "2 weeks ago",
            source: "custom",
            verified: false,
            authorAvatar: "",
        },
    ]

    return reviewsToCSVString(sampleReviews)
}

/**
 * Splits a CSV line handling quoted fields containing commas and escaped quotes.
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"'
                i++ // Skip escaped quote
            } else {
                inQuotes = !inQuotes
            }
        } else if (char === "," && !inQuotes) {
            result.push(current.trim())
            current = ""
        } else {
            current += char
        }
    }

    result.push(current.trim())
    return result
}

export interface CSVParseResult {
    success: boolean
    reviews: ReviewItem[]
    errors: string[]
    totalRows: number
}

/**
 * Parses raw CSV string into validated ReviewItem objects.
 */
export function parseCSVToReviews(csvContent: string): CSVParseResult {
    const rawLines = csvContent
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)

    if (rawLines.length < 2) {
        return {
            success: false,
            reviews: [],
            errors: ["CSV must contain at least a header row and one data row."],
            totalRows: 0,
        }
    }

    const headerLine = rawLines[0]
    const headerCols = parseCSVLine(headerLine).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""))

    // Map column indices
    let authorIdx = headerCols.findIndex((h) => h.includes("author") || h.includes("name") || h.includes("reviewer") || h.includes("user"))
    let ratingIdx = headerCols.findIndex((h) => h.includes("rating") || h.includes("star") || h.includes("score"))
    let textIdx = headerCols.findIndex((h) => h.includes("text") || h.includes("review") || h.includes("body") || h.includes("content") || h.includes("comment") || h.includes("message"))
    let dateIdx = headerCols.findIndex((h) => h.includes("date") || h.includes("time") || h.includes("created"))
    let sourceIdx = headerCols.findIndex((h) => h.includes("source") || h.includes("platform") || h.includes("channel"))
    let verifiedIdx = headerCols.findIndex((h) => h.includes("verified") || h.includes("isverified"))
    let avatarIdx = headerCols.findIndex((h) => h.includes("avatar") || h.includes("image") || h.includes("photo") || h.includes("pic"))

    // Fallback if headers are not recognized by name
    if (authorIdx === -1 && headerCols.length > 0) authorIdx = 0
    if (ratingIdx === -1 && headerCols.length > 1) ratingIdx = 1
    if (textIdx === -1 && headerCols.length > 2) textIdx = 2
    if (dateIdx === -1 && headerCols.length > 3) dateIdx = 3

    const reviews: ReviewItem[] = []
    const errors: string[] = []
    const now = Date.now()

    for (let i = 1; i < rawLines.length; i++) {
        const line = rawLines[i]
        const cols = parseCSVLine(line)

        if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue

        const authorName = (authorIdx >= 0 && cols[authorIdx] ? cols[authorIdx] : "").trim()
        const rawRating = ratingIdx >= 0 && cols[ratingIdx] ? parseFloat(cols[ratingIdx]) : 5
        const rating = !isNaN(rawRating) ? Math.min(5, Math.max(1, Math.round(rawRating))) : 5
        const text = (textIdx >= 0 && cols[textIdx] ? cols[textIdx] : "").trim()
        const date = (dateIdx >= 0 && cols[dateIdx] ? cols[dateIdx] : "Recently").trim() || "Recently"

        let source: "google" | "trustpilot" | "custom" = "custom"
        if (sourceIdx >= 0 && cols[sourceIdx]) {
            const rawSource = cols[sourceIdx].toLowerCase()
            if (rawSource.includes("google")) source = "google"
            else if (rawSource.includes("trust") || rawSource.includes("pilot")) source = "trustpilot"
        }

        const isVerified = verifiedIdx >= 0 && cols[verifiedIdx]
            ? ["true", "1", "yes", "verified"].includes(cols[verifiedIdx].toLowerCase().trim())
            : true

        const authorAvatar = avatarIdx >= 0 && cols[avatarIdx] ? cols[avatarIdx].trim() : ""

        if (!authorName && !text) {
            errors.push(`Row ${i + 1}: Skipped (empty author name and review text).`)
            continue
        }

        reviews.push({
            id: `csv-${now}-${i}`,
            source,
            authorName: authorName || "Anonymous Customer",
            authorAvatar: authorAvatar.startsWith("http") ? authorAvatar : undefined,
            rating,
            text: text || "Verified experience.",
            date,
            verified: isVerified,
        })
    }

    return {
        success: reviews.length > 0,
        reviews,
        errors,
        totalRows: rawLines.length - 1,
    }
}
