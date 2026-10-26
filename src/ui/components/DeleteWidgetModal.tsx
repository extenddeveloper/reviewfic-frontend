import React from "react"
import { IconTrash, IconX } from "../icons"

interface DeleteWidgetModalProps {
    widgetName: string
    canvasCount: number
    isDeleting?: boolean
    onConfirm: () => void
    onCancel: () => void
}

export function DeleteWidgetModal({
    widgetName,
    canvasCount,
    isDeleting = false,
    onConfirm,
    onCancel,
}: DeleteWidgetModalProps) {
    return (
        <div className="cf-modal-backdrop" onClick={isDeleting ? undefined : onCancel}>
            <div className="cf-modal-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="cf-modal-header">
                    <div className="cf-modal-icon-wrap danger">
                        <IconTrash size={14} />
                    </div>
                    <button
                        type="button"
                        className="cf-modal-close-btn"
                        onClick={onCancel}
                        disabled={isDeleting}
                        aria-label="Close modal"
                    >
                        <IconX size={12} />
                    </button>
                </div>

                <div className="cf-modal-body">
                    <h3 className="cf-modal-title">Delete Widget</h3>
                    <p className="cf-modal-desc">
                        Are you sure you want to delete <strong className="cf-modal-highlight">"{widgetName}"</strong>? This will remove the widget from Reviewfic and delete any active instance(s) from your canvas.
                    </p>
                    {canvasCount > 0 && (
                        <div className="cf-modal-canvas-warning">
                            ⚠️ <strong>{canvasCount}</strong> active instance(s) found on your Framer canvas will also be deleted.
                        </div>
                    )}
                </div>

                <div className="cf-modal-footer">
                    <button
                        type="button"
                        className="cf-modal-btn cancel"
                        onClick={onCancel}
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="cf-modal-btn danger"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete Widget"}
                    </button>
                </div>
            </div>
        </div>
    )
}
