import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { GAME_STATE } from '../../constants';
import { socket } from '../../services/socket';
import { setMyInfo, setOpponentInfo } from '../../redux/actions/playerActions';

const Pvp = () => {
    const location = useLocation();
    const dispatch = useDispatch();
    const socketRef = useRef(null);
    const [myHand, setMyHand] = React.useState([]);
    const [displayedHand, setDisplayedHand] = React.useState([]);
    const [myPlayerId, setMyPlayerId] = React.useState(null);
    const [currentTurnId, setCurrentTurnId] = React.useState(null);
    const [gameState, setGameState] = React.useState(GAME_STATE.AWAITING_CARD_SUMMON);
    const [myInfo, setMyInfo] = React.useState({});
    const [opponentInfo, setOpponentInfo] = React.useState({});
    const [myDeckCount, setMyDeckCount] = React.useState(0);
    const [opponentHandCount, setOpponentHandCount] = React.useState(0);
    const [opponentDeckCount, setOpponentDeckCount] = React.useState(0);
    const [gameMessage, setGameMessage] = React.useState('');
    const [isCardActionPending, setIsCardActionPending] = React.useState(false);
    const [lobbyId, setLobbyId] = React.useState(null);

    // Initialize lobbyId from location state when component mounts
    useEffect(() => {
        if (location.state?.lobbyId) {
            console.log('[Pvp] Setting lobbyId from location state:', location.state.lobbyId);
            setLobbyId(location.state.lobbyId);
        }
    }, [location.state]);

    useEffect(() => {
        socketRef.current = socket;

        // Set myPlayerId from the authenticated user on mount
        if (socket && socket.auth && socket.auth.token) {
            try {
                // Extract user ID from JWT token
                const token = socket.auth.token;
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const decoded = JSON.parse(jsonPayload);
                if (decoded.id) {
                    console.log('[Pvp] Setting myPlayerId from token:', decoded.id);
                    setMyPlayerId(decoded.id);
                }
            } catch (error) {
                console.error('[Pvp] Error decoding token:', error);
            }
        }

        // Only update hand from private events
        const handlePlayerHandUpdate = (data) => {
            console.log('[DEBUG] Received player_hand_update:', data);
            if (data && data.playerHand) {
                // Handle initial hand (when myHand is empty)
                if (myHand.length === 0) {
                    console.log('[DEBUG] Setting initial hand from player_hand_update');
                    // For initial hand, take exactly 5 cards, no more
                    const initialHand = Array.isArray(data.playerHand)
                        ? data.playerHand.slice(0, 5).map(card => ({
                            ...card,
                            type: card.type || (card.questionText ? 'question' : undefined)
                        }))
                        : [];
                    setMyHand(initialHand);
                    setDisplayedHand(initialHand);
                    console.log('[DEBUG] Initial hand set:', initialHand.length, 'cards');
                }
                // Handle single card draw (hand not empty, playerHand has 1 card)
                else if (Array.isArray(data.playerHand) && data.playerHand.length === 1) {
                    // Check if we can fit one more card (hand must be less than 5)
                    if (myHand.length < 5) {
                        const newCard = {
                            ...data.playerHand[0],
                            type: data.playerHand[0].type || (data.playerHand[0].questionText ? 'question' : undefined)
                        };

                        // Check if the card is not already in hand (by text)
                        const newCardText = newCard.text?.trim().toLowerCase();
                        const cardExists = myHand.some(c =>
                            (c.text?.trim().toLowerCase() === newCardText) ||
                            (c.questionText?.trim().toLowerCase() === newCardText)
                        );

                        if (!cardExists && newCardText) {
                            // Add the new card and ensure total is still max 5
                            setMyHand(prev => [...prev.slice(0, 4), newCard].slice(0, 5));
                            setDisplayedHand(prev => [...prev.slice(0, 4), newCard].slice(0, 5));
                            console.log('[DEBUG] Added new card to hand. Hand size:', myHand.length + 1);
                        } else {
                            console.log('[DEBUG] Card already exists in hand or invalid. Not adding:', newCardText);
                        }
                    } else {
                        console.log('[DEBUG] Hand already at max capacity (5). Not adding new card.');
                    }
                }
                // Handle full hand update (replacing entire hand)
                else if (Array.isArray(data.playerHand) && data.playerHand.length > 1) {
                    console.log('[DEBUG] Received full hand update with', data.playerHand.length, 'cards');
                    // Ensure unique by text and max 5 cards
                    const uniqueCards = [];
                    const seenTexts = new Set();

                    for (const card of data.playerHand) {
                        const textKey = (card.text || card.questionText || '').trim().toLowerCase();
                        if (textKey && !seenTexts.has(textKey) && uniqueCards.length < 5) {
                            uniqueCards.push({
                                ...card,
                                type: card.type || (card.questionText ? 'question' : undefined)
                            });
                            seenTexts.add(textKey);
                        }
                        if (uniqueCards.length >= 5) break;
                    }

                    if (JSON.stringify(myHand) !== JSON.stringify(uniqueCards)) {
                        setMyHand(uniqueCards);
                        setDisplayedHand(uniqueCards);
                        console.log('[DEBUG] Updated hand with unique cards:', uniqueCards.length);
                    } else {
                        console.log('[DEBUG] Hand unchanged - same cards as before');
                    }
                }
            }
        };
        const handleDealCards = (data) => {
            console.log('[DEBUG] Received deal_cards event:', data);
            if (data && data.playerHand) {
                // Always limit to exactly 5 cards, uniquely by text
                const uniqueCards = [];
                const seenTexts = new Set();

                for (const card of data.playerHand) {
                    const textKey = (card.text || card.questionText || '').trim().toLowerCase();
                    if (textKey && !seenTexts.has(textKey) && uniqueCards.length < 5) {
                        uniqueCards.push({
                            ...card,
                            type: card.type || (card.questionText ? 'question' : undefined)
                        });
                        seenTexts.add(textKey);
                    }
                    if (uniqueCards.length >= 5) break;
                }

                setMyHand(uniqueCards);
                setDisplayedHand(uniqueCards);
                console.log('[DEBUG] Initial hand set from deal_cards:', uniqueCards.length, 'cards');
            } else {
                console.warn('[DEBUG] deal_cards event received but no playerHand data:', data);
            }
        };
        socketRef.current.on('player_hand_update', handlePlayerHandUpdate);
        socketRef.current.on('deal_cards', handleDealCards);
        return () => {
            if (socketRef.current) {
                socketRef.current.off('player_hand_update', handlePlayerHandUpdate);
                socketRef.current.off('deal_cards', handleDealCards);
            }
        };
    }, [myHand]);

    // Add new effect to request initial cards when game state changes to certain states
    useEffect(() => {
        // Only request cards when socket is connected and we have a lobby ID and player ID
        if (!socketRef.current || !lobbyId || !myPlayerId) return;

        if (gameState === GAME_STATE.AWAITING_CARD_SUMMON || gameState === GAME_STATE.DICE_ROLL) {
            console.log(`[Pvp] Game state changed to ${gameState}. Requesting initial cards...`);
            // Add a small delay to ensure socket has properly registered all handlers
            setTimeout(() => {
                if (socketRef.current && socketRef.current.connected) {
                    console.log('[Pvp] Emitting request_initial_cards event');
                    socketRef.current.emit('request_initial_cards', {
                        lobbyId: lobbyId,
                        playerId: myPlayerId
                    });
                }
            }, 500); // 500ms delay before requesting cards
        }
    }, [gameState, lobbyId, myPlayerId]);

    useEffect(() => {
        if (!socketRef.current) return;

        const handleGameUpdate = (data) => {
            setIsCardActionPending(false);

            // Only update hand counts, deck counts, turn, message, HP, etc. 
            // NEVER update myHand from game_update broadcasts
            if (data.gameState) setGameState(data.gameState);
            if (data.currentTurn) setCurrentTurnId(data.currentTurn);
            if (data.gameMessage) setGameMessage(data.gameMessage);

            // Update player hands and deck counts - but not hand contents
            if (data.player1Id === myPlayerId) {
                if (data.player1HandCount !== undefined) setOpponentHandCount(data.player1HandCount);
                if (data.player1DeckCount !== undefined) setMyDeckCount(data.player1DeckCount);
                if (data.player2HandCount !== undefined) setOpponentHandCount(data.player2HandCount);
                if (data.player2DeckCount !== undefined) setOpponentDeckCount(data.player2DeckCount);
            } else if (data.player2Id === myPlayerId) {
                if (data.player1HandCount !== undefined) setOpponentHandCount(data.player1HandCount);
                if (data.player1DeckCount !== undefined) setOpponentDeckCount(data.player1DeckCount);
                if (data.player2HandCount !== undefined) setOpponentHandCount(data.player2HandCount);
                if (data.player2DeckCount !== undefined) setMyDeckCount(data.player2DeckCount);
            }

            // Update HP
            if (data.player1Id && data.player1Hp !== undefined) {
                if (data.player1Id === myPlayerId) {
                    setMyInfo(prev => ({ ...prev, hp: data.player1Hp }));
                } else {
                    setOpponentPlayerId(data.player1Id);
                    setOpponentInfo(prev => ({ ...prev, name: data.player1Name || prev.name, hp: data.player1Hp }));
                }
            }
            if (data.player2Id && data.player2Hp !== undefined) {
                if (data.player2Id === myPlayerId) {
                    setMyInfo(prev => ({ ...prev, hp: data.player2Hp }));
                } else {
                    setOpponentPlayerId(data.player2Id);
                    setOpponentInfo(prev => ({ ...prev, name: data.player2Name || prev.name, hp: data.player2Hp }));
                }
            }

            // Update Field State if needed
            if (data.lastCardSummoned !== undefined) {
                setLastSummonedCardOnField(data.lastCardSummoned);
                setLastPlayedSpellEffect(null);
            }
            if (data.lastCardPlayed && data.lastCardPlayed.type === 'spellEffect') {
                setLastPlayedSpellEffect(data.lastCardPlayed);
            }
        };

        socketRef.current.on('game_update', handleGameUpdate);
        return () => {
            if (socketRef.current) {
                socketRef.current.off('game_update', handleGameUpdate);
            }
        };
    }, [myPlayerId]);

    return (
        <div>
            {/* Render your component content here */}
        </div>
    );
};

export default Pvp; 