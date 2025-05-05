import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import CardDisplay from '../CardDisplay/CardDisplay';
import './ActiveCardDisplay.css';

const zoomIn = keyframes`
  from { 
    transform: translate(-50%, -50%) scale(0.5) rotateY(-30deg);
    opacity: 0;
  }
  to { 
    transform: translate(-50%, -50%) scale(1) rotateY(0deg);
    opacity: 1;
  }
`;

const zoomOut = keyframes`
  from { 
    transform: translate(-50%, -50%) scale(1) rotateY(0deg);
    opacity: 1;
  }
  to { 
    transform: translate(-50%, -50%) scale(0.5) rotateY(30deg);
    opacity: 0;
  }
`;

const fadeIn = keyframes`
  from { 
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to { 
    opacity: 1;
    backdrop-filter: blur(8px);
  }
`;

const rotateIn = keyframes`
  from { 
    transform: rotate(-180deg) scale(0);
    opacity: 0;
  }
  to { 
    transform: rotate(0) scale(1);
    opacity: 1;
  }
`;

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
  50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.6); }
  100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
`;

const ActiveCardContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.9);
  z-index: 1000;
  animation: ${zoomIn} 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  perspective: 2000px;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &.exiting {
    animation: ${zoomOut} 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  &.interactive {
    cursor: pointer;
    transform: translate(-50%, -50%) scale(0.9) rotateY(0deg);
    transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);

    &:hover {
      transform: translate(-50%, -50%) scale(1) rotateY(10deg);
    }
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle at center,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0.9) 100%
  );
  backdrop-filter: blur(8px);
  z-index: 999;
  animation: ${fadeIn} 0.4s ease-out;
  opacity: 0;
  animation-fill-mode: forwards;
`;

const CloseButton = styled.button`
  position: absolute;
  top: -25px;
  right: -25px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid rgba(255, 215, 0, 0.5);
  color: white;
  font-size: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s ease;
  z-index: 1001;
  animation: ${rotateIn} 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);

  &:hover {
    background: rgba(255, 215, 0, 0.2);
    transform: rotate(90deg) scale(1.1);
    border-color: rgba(255, 215, 0, 0.8);
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.4);
  }

  &::before {
    content: '×';
    line-height: 1;
  }
`;

const CardControls = styled.div`
  position: absolute;
  bottom: -70px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  z-index: 1001;
`;

const ControlButton = styled.button`
  padding: 12px 24px;
  border-radius: 25px;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid rgba(255, 215, 0, 0.5);
  color: white;
  cursor: pointer;
  transition: all 0.4s ease;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: bold;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);

  &:hover {
    background: rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.8);
    transform: translateY(-3px);
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.4);
    animation: ${pulseGlow} 2s infinite;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    animation: none;
  }
`;

const ActiveCardDisplay = ({ card, onClose, isInteractive = false, onAction }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 600);
    };

    const handleCardClick = () => {
        if (isInteractive) {
            setIsFlipped(!isFlipped);
        }
    };

    const handleAction = (action) => {
        if (onAction) {
            onAction(action);
        }
    };

    return (
        <>
            <Overlay onClick={handleClose} />
            <ActiveCardContainer
                className={`${isExiting ? 'exiting' : ''} ${isInteractive ? 'interactive' : ''}`}
                onClick={handleCardClick}
            >
                <CardDisplay
                    card={card}
                    isPlayable={isInteractive}
                    isDraggable={false}
                />
                <CloseButton onClick={handleClose} />
                {isInteractive && (
                    <CardControls>
                        <ControlButton onClick={() => handleAction('play')}>
                            Play Card
                        </ControlButton>
                        <ControlButton onClick={() => handleAction('discard')}>
                            Discard
                        </ControlButton>
                    </CardControls>
                )}
            </ActiveCardContainer>
        </>
    );
};

export default ActiveCardDisplay; 