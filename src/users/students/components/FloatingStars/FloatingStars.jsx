import React, { useEffect, useRef } from 'react';
import styles from './FloatingStars.module.css';

const FloatingStars = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasDimensions();

    // Star properties
    const numStars = 100; // Number of stars
    const stars = [];
    const starColor = 'rgba(255, 255, 255, 0.8)'; // White with some transparency

    class Star {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.5; // Star size: 0.5px to 2px
        this.speedX = (Math.random() - 0.5) * 0.3; // Slow horizontal drift
        this.speedY = (Math.random() - 0.5) * 0.3; // Slow vertical drift
        this.opacity = Math.random() * 0.5 + 0.3; // Opacity: 0.3 to 0.8
        this.twinkleSpeed = Math.random() * 0.02 + 0.005;
        this.twinkleDirection = 1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();
      }

      update() {
        // Move star
        this.x += this.speedX;
        this.y += this.speedY;

        // Twinkle effect
        this.opacity += this.twinkleSpeed * this.twinkleDirection;
        if (this.opacity > 0.8 || this.opacity < 0.2) {
          this.twinkleDirection *= -1;
          // Ensure opacity stays within bounds if speed is high
          this.opacity = Math.max(0.2, Math.min(0.8, this.opacity)); 
        }

        // Boundary conditions (wrap around screen)
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        this.draw();
      }
    }

    const initStars = () => {
      stars.length = 0; // Clear existing stars if any (e.g., on resize)
      for (let i = 0; i < numStars; i++) {
        stars.push(new Star());
      }
    };

    initStars();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(star => star.update());
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      setCanvasDimensions();
      initStars(); // Re-initialize stars for new dimensions
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.starsCanvas} />;
};

export default FloatingStars; 