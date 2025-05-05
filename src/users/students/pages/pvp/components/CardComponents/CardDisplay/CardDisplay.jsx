import React, { useState } from 'react';
import './CardDisplay.css';

// Simple 8-bit diamond SVG for card back
const PixelDiamond = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ display: 'block' }}>
        <rect x="8" y="2" width="2" height="2" fill="#ffd700" />
        <rect x="6" y="4" width="6" height="2" fill="#ffd700" />
        <rect x="4" y="6" width="10" height="2" fill="#ffd700" />
        <rect x="2" y="8" width="14" height="2" fill="#ffd700" />
        <rect x="4" y="10" width="10" height="2" fill="#ffd700" />
        <rect x="6" y="12" width="6" height="2" fill="#ffd700" />
        <rect x="8" y="14" width="2" height="2" fill="#ffd700" />
    </svg>
);

function truncateText(text, maxLength = 40) {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

const CardDisplay = ({ card, onClick }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleClick = () => {
        if (onClick) {
            onClick(card);
        } else {
            setIsFlipped(!isFlipped);
        }
    };

    return (
        <div className={`pixel-card-8bit${isFlipped ? ' flipped' : ''}`} onClick={handleClick}>
            {/* Pixel border corners */}
            <div className="pixel-corner pixel-corner-tl" />
            <div className="pixel-corner pixel-corner-tr" />
            <div className="pixel-corner pixel-corner-bl" />
            <div className="pixel-corner pixel-corner-br" />
            {/* Card front */}
            {!isFlipped ? (
                <>
                    <div className="pixel-card-title">{card.title}</div>
                    <div className="pixel-card-content">{truncateText(card.content)}</div>
                    {card.rarity && <div className="pixel-card-footer">{card.rarity.toUpperCase()}</div>}
                </>
            ) : (
                <div className="pixel-card-back">
                    <PixelDiamond />
                    <div className="pixel-card-back-label">CARD BACK</div>
                </div>
            )}
        </div>
    );
};

export default CardDisplay; 