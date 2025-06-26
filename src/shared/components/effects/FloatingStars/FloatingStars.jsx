import React, { useEffect, useRef } from 'react';
import styles from './FloatingStars.module.css';

const FloatingStars = ({ count = 50, speed = 0.5 }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear existing stars
    container.innerHTML = '';

    // Create stars
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = styles.star;
      
      // Random size
      const size = Math.random() * 3 + 1;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      
      // Random position
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      
      // Random animation delay
      star.style.animationDelay = `${Math.random() * 3}s`;
      star.style.animationDuration = `${3 + Math.random() * 2}s`;
      
      container.appendChild(star);
    }

    // Cleanup function
    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [count]);

  return <div ref={containerRef} className={styles.floatingStars}></div>;
};

export default FloatingStars; 