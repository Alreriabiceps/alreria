import React, { useEffect, useState } from 'react';
import './ParticleBurst.css';

const PARTICLE_COUNT = 18;

const getRandom = (min, max) => Math.random() * (max - min) + min;

const ParticleBurst = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const type = Math.random() < 0.5 ? 'circle' : 'star';
        return {
          angle: getRandom(0, 360),
          distance: getRandom(45, 80),
          size: getRandom(type === 'star' ? 12 : 7, type === 'star' ? 22 : 15),
          color: [
            '#f1c40f', '#fff', '#ffe066', '#f9e79f', '#f39c12', '#fffbe7', '#ffe066', '#fff'
          ][Math.floor(Math.random() * 8)],
          delay: getRandom(0, 0.12),
          scale: getRandom(0.8, 1.3),
          rotate: getRandom(0, 360),
          type,
          key: i + '-' + Math.random(),
        };
      })
    );
  }, []);

  return (
    <div className="particle-burst">
      {particles.map((p) =>
        p.type === 'circle' ? (
          <div
            key={p.key}
            className="particle circle"
            style={{
              background: p.color,
              width: p.size,
              height: p.size,
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) rotate(${p.angle}deg) scale(${p.scale})`,
              animationDelay: `${p.delay}s`,
              '--distance': `${p.distance}px`,
              '--particle-rotate': `${p.rotate}deg`,
            }}
          />
        ) : (
          <svg
            key={p.key}
            className="particle star"
            style={{
              width: p.size,
              height: p.size,
              left: '50%',
              top: '50%',
              fill: p.color,
              transform: `translate(-50%, -50%) rotate(${p.angle}deg) scale(${p.scale}) rotate(${p.rotate}deg)`,
              animationDelay: `${p.delay}s`,
              '--distance': `${p.distance}px`,
              '--particle-rotate': `${p.rotate}deg`,
            }}
            viewBox="0 0 24 24"
          >
            <polygon points="12,2 15,9 22,9.5 17,14.5 18.5,22 12,18 5.5,22 7,14.5 2,9.5 9,9" />
          </svg>
        )
      )}
    </div>
  );
};

export default ParticleBurst; 