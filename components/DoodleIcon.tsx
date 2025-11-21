import React from 'react';

export const DoodleIcon: React.FC<{ name: string; className?: string }> = ({ name, className = "w-6 h-6" }) => {
    const strokes = "stroke-black stroke-2 fill-none strokeLinecap-round strokeLinejoin-round";

    switch (name) {
        case 'camera':
            return (
                <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                </svg>
            );
        case 'gallery':
            return (
                <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
            );
        case 'pencil':
            return (
                <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
            );
        case 'gamepad':
            return (
                <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <path d="M6 12h4m-2-2v4" />
                    <line x1="15" y1="11" x2="15" y2="11" strokeWidth="3" />
                    <line x1="18" y1="13" x2="18" y2="13" strokeWidth="3" />
                </svg>
            );
        case 'hint':
            return (
                <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                    <path d="M12 2a7 7 0 0 0-7 7c0 2.386 1.194 4.49 3 5.758V18a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-3.242C17.806 13.49 19 11.386 19 9a7 7 0 0 0-7-7z" />
                </svg>
            );
        case 'check':
            return (
                <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            );
        case 'trash':
            return (
                <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
            );
        case 'close':
            return (
                <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            );
        case 'solve':
            return (
                <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
            );
        case 'info':
            return (
                <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
            );
        case 'help':
            return (
                <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            );
        case 'save':
            return (
                <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                </svg>
            );
        case 'settings':
            return (
                <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
            );
        default:
            return null;
    }
};
