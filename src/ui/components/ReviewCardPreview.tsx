import { useState } from "react"
import { ReviewConfig, ReviewItem } from "../../core/types"
import { IconGoogle, IconTrustpilot, IconStar, IconShieldCheck } from "../icons"

export interface ReviewCardPreviewProps {
    review: ReviewItem
    config: ReviewConfig
}

export function ReviewCardPreview({ review, config }: ReviewCardPreviewProps) {
    const { cardStyle, starColor, showStars, showSourceIcon, showAvatar, showDate, showVerifiedBadge, textClamp } = config
    const [isExpanded, setIsExpanded] = useState(false)

    const isLongText = Boolean(review.text && review.text.length > 120)
    const shouldClamp = textClamp && !isExpanded && isLongText

    return (
        <div className={`cf-review-card ${cardStyle}`}>
            <div className="cf-card-header">
                <div className="cf-card-author-group">
                    {showAvatar && (
                        <div className="cf-card-avatar">
                            {review.authorAvatar ? (
                                <img src={review.authorAvatar} alt={review.authorName} className="cf-avatar-img" />
                            ) : (
                                <div className="cf-avatar-fallback">
                                    {review.authorName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="cf-card-meta">
                        <div className="cf-card-author-row">
                            <span className="cf-card-author-name">{review.authorName}</span>
                            {showVerifiedBadge && review.verified && (
                                <span className="cf-verified-badge" title="Verified Customer">
                                    <IconShieldCheck size={12} />
                                </span>
                            )}
                        </div>
                        {showDate && <span className="cf-card-date">{review.date}</span>}
                    </div>
                </div>

                {showSourceIcon && (
                    <div className="cf-card-source-icon">
                        {review.source === "google" && <IconGoogle size={15} />}
                        {review.source === "trustpilot" && <IconTrustpilot size={15} />}
                        {review.source === "custom" && (
                            <span className="cf-custom-source-badge">Customer testimonial</span>
                        )}
                    </div>
                )}
            </div>

            {showStars && (
                <div className="cf-card-stars">
                    {review.source === "trustpilot" && (config.trustpilotStarStyle ?? true) ? (
                        <span className="vr-tp-stars-row">
                            {[1, 2, 3, 4, 5].map((s) => {
                                const isFilled = s <= Math.round(review.rating)
                                return (
                                    <span key={s} className={`vr-tp-star-box ${isFilled ? "filled" : "empty"}`}>
                                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                                            <rect width="24" height="24" rx="3" fill={isFilled ? "#00B67A" : "#DCDCE6"} />
                                            <g transform="translate(3.84, 3.87) scale(0.68)">
                                                <path
                                                    d="M24 9.286h-9.179L12 0.643 9.179 9.286H0l7.429 5.357-2.821 8.643 7.429-5.357 4.571-3.286L24 9.286z"
                                                    fill="#FFFFFF"
                                                />
                                                {isFilled && (
                                                    <path
                                                        d="M12 17.964l5.214-1.321 2.179 6.714L12 17.964z"
                                                        fill="#005128"
                                                        opacity="0.22"
                                                    />
                                                )}
                                            </g>
                                        </svg>
                                    </span>
                                )
                            })}
                        </span>
                    ) : (
                        [1, 2, 3, 4, 5].map((s) => (
                            <IconStar
                                key={s}
                                size={14}
                                filled={s <= review.rating}
                                color={starColor}
                            />
                        ))
                    )}
                </div>
            )}

            <p className={`cf-card-text ${shouldClamp ? "clamped" : ""}`}>{review.text}</p>

            {textClamp && isLongText && (
                <button
                    type="button"
                    className="cf-read-more-btn"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? "Show less" : "Read more"}
                </button>
            )}

            {review.source === "google" && (
                <span className="cf-card-footer-link">Read on Google ↗</span>
            )}
            {review.source === "trustpilot" && (
                <span className="cf-card-footer-link">Read on Trustpilot ↗</span>
            )}
        </div>
    )
}

