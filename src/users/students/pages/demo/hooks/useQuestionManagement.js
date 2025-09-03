import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  transformBackendQuestions,
  createSpellCards,
} from "../utils/cardUtils";
import { ERROR_MESSAGES, LOADING_STATES } from "../constants/uiConstants";

// Custom hook for managing questions and deck
export const useQuestionManagement = ({ backendUrl }) => {
  const [realQuestions, setRealQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Fetch questions from backend
  const fetchRealQuestions = useCallback(async () => {
    try {
      setLoadingQuestions(true);
      const token = localStorage.getItem("token");

      if (!token) {
        console.warn(ERROR_MESSAGES.NO_AUTH_TOKEN);
        setLoadingQuestions(false);
        return;
      }

      const response = await fetch(`${backendUrl}/api/questions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(ERROR_MESSAGES.FAILED_FETCH_QUESTIONS);
      }

      const data = await response.json();
      const transformedQuestions = transformBackendQuestions(data);

      setRealQuestions(transformedQuestions);
      console.log("✅ Questions loaded:", transformedQuestions.length);
    } catch (error) {
      console.error(ERROR_MESSAGES.FAILED_FETCH_QUESTIONS, error);
      toast.error(ERROR_MESSAGES.FAILED_FETCH_QUESTIONS, { autoClose: 3000 });
    } finally {
      setLoadingQuestions(false);
    }
  }, [backendUrl]);

  // Create fallback deck with sample questions and spell cards
  const createFallbackDeck = useCallback(() => {
    if (realQuestions.length === 0) return [];

    const fallbackDeck = [...realQuestions, ...createSpellCards()];
    console.log("🃏 Fallback deck created:", fallbackDeck.length, "cards");
    return fallbackDeck;
  }, [realQuestions]);

  // Initialize questions on mount
  useEffect(() => {
    fetchRealQuestions();
  }, [fetchRealQuestions]);

  return {
    realQuestions,
    loadingQuestions,
    fetchRealQuestions,
    createFallbackDeck,
  };
};


