import { ReviewConfig, ReviewItem } from "../../core/types"
import { IconGoogle, IconTrustpilot, IconStar, IconShieldCheck } from "../icons"

export interface ReviewCardPreviewProps {
    review: ReviewItem
    config: ReviewConfig
}

export function ReviewCardPreview({ review, config }: ReviewCardPreviewProps) {
    const { cardStyle, starColor, showStars, showSourceIcon, showAvatar, showDate, showVerifiedBadge } = config

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
                            <span className="cf-custom-source-badge">Direct</span>
                        )}
                    </div>
                )}
            </div>

            {showStars && (
                <div className="cf-card-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <IconStar
                            key={s}
                            size={14}
                            filled={s <= review.rating}
                            color={starColor}
                        />
                    ))}
                </div>
            )}

            <p className="cf-card-text">{review.text}</p>
        </div>
    )
}
