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

    useEffect(() => {
        socketRef.current = socket;

        // Only update hand from private events
        const handlePlayerHandUpdate = (data) => {
            if (data && data.playerHand) {
                const updatedHand = Array.isArray(data.playerHand) ? data.playerHand.slice(0, 5).map(card => ({
                    ...card,
                    type: card.type || (card.questionText ? 'question' : undefined)
                })) : [];
                if (JSON.stringify(myHand) !== JSON.stringify(updatedHand)) {
                    setMyHand(updatedHand);
                    setDisplayedHand(updatedHand);
                    console.log('Hand updated:', updatedHand.length, 'cards');
                }
            }
        };
        const handleDealCards = (data) => {
            console.log('[DEBUG] Received deal_cards event:', data);
            if (data && data.playerHand) {
                const updatedHand = Array.isArray(data.playerHand) ? data.playerHand.slice(0, 5).map(card => ({
                    ...card,
                    type: card.type || (card.questionText ? 'question' : undefined)
                })) : [];
                setMyHand(updatedHand);
                setDisplayedHand(updatedHand);
                console.log('[DEBUG] Initial hand set from deal_cards:', updatedHand);
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

    useEffect(() => {
        if (!socketRef.current) return;
        const handleGameUpdate = (data) => {
            setIsCardActionPending(false);
            // Only update hand counts, deck counts, turn, message, HP, etc. Never update myHand here.
            if (data.player1HandCount !== undefined) setOpponentHandCount(data.player1HandCount);
            if (data.player1DeckCount !== undefined) setMyDeckCount(data.player1DeckCount);
            if (data.player2HandCount !== undefined) setOpponentHandCount(data.player2HandCount);
            if (data.player2DeckCount !== undefined) setOpponentDeckCount(data.player2DeckCount);
            if (data.currentTurn) setCurrentTurnId(data.currentTurn);
            if (data.gameMessage) setGameMessage(data.gameMessage);
            if (data.player1Id && data.player1Hp !== undefined) {
                if (data.player1Id === myPlayerId) setMyInfo(prev => ({ ...prev, hp: data.player1Hp }));
                else {
                    setOpponentPlayerId(data.player1Id);
                    setOpponentInfo(prev => ({ ...prev, name: data.player1Name || prev.name, hp: data.player1Hp }));
                }
            }
            if (data.player2Id && data.player2Hp !== undefined) {
                if (data.player2Id === myPlayerId) setMyInfo(prev => ({ ...prev, hp: data.player2Hp }));
                else {
                    setOpponentPlayerId(data.player2Id);
                    setOpponentInfo(prev => ({ ...prev, name: data.player2Name || prev.name, hp: data.player2Hp }));
                }
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