import { BLOOM_RARITY, SPELL_CARDS_CONFIG } from "../constants/gameConstants";

// Helper function to get first name from full name
export const getFirstName = (fullName) => {
  if (!fullName) return "Player";
  const nameParts = fullName.trim().split(" ");
  return nameParts[0] || "Player";
};

// Helper function to get a weighted random card
export const getWeightedRandomCard = (availableCards) => {
  if (availableCards.length === 0) return null;

  let totalWeight = 0;
  const weightedCards = availableCards.map((card) => {
    const rarity = BLOOM_RARITY[card.bloom_level] || 0.1; // Default rarity if not found
    totalWeight += rarity;
    return { card, weight: rarity };
  });

  // If totalWeight is 0, return a random card
  if (totalWeight === 0) {
    return availableCards[Math.floor(Math.random() * availableCards.length)];
  }

  let random = Math.random() * totalWeight;
  for (let i = 0; i < weightedCards.length; i++) {
    if (random < weightedCards[i].weight) {
      return weightedCards[i].card;
    }
    random -= weightedCards[i].weight;
  }
  // Fallback in case of floating point issues, return a random card
  return availableCards[Math.floor(Math.random() * availableCards.length)];
};

// Create Spell Card objects
export const createSpellCards = () => {
  const spellCards = Object.keys(SPELL_CARDS_CONFIG).map((spellType, index) => {
    const spellConfig = SPELL_CARDS_CONFIG[spellType];
    return {
      id: `spell_${index + 1000}`,
      spell_type: spellType,
      type: "spell",
      name: spellConfig.name,
      description: spellConfig.description,
      icon: spellConfig.icon,
      color: spellConfig.color,
      bgColor: spellConfig.bgColor,
      spellType: spellConfig.type,
    };
  });

  return spellCards;
};

// Normalize bloom level to match our game format
export const normalizeBloomLevel = (level) => {
  if (!level) return "Remembering";

  const levelStr = level.toString().toLowerCase();
  if (levelStr.includes("remember")) return "Remembering";
  if (levelStr.includes("understand")) return "Understanding";
  if (levelStr.includes("apply")) return "Applying";
  if (levelStr.includes("analyze")) return "Analyzing";
  if (levelStr.includes("evaluate")) return "Evaluating";
  if (levelStr.includes("create")) return "Creating";

  // Default fallback
  return "Remembering";
};

// Transform backend questions to match our game format
export const transformBackendQuestions = (questions) => {
  return questions.map((question, index) => {
    // Log bloom levels to debug
    console.log(`Question ${index}: bloomsLevel = "${question.bloomsLevel}"`);

    return {
      id: question._id || index,
      question: question.questionText,
      choices: question.choices || [],
      answer: question.correctAnswer,
      bloom_level: normalizeBloomLevel(question.bloomsLevel),
      subject: question.subject?.subject || "General",
      difficulty: question.difficulty || "medium",
    };
  });
};

// Validate if a card exists in player's hand
export const validateCardExists = (card, playerCards) => {
  return playerCards.some((c) => String(c.id) === String(card.id));
};

// Get card configuration with fallback
export const getCardConfig = (card, BLOOM_CONFIG) => {
  return (
    BLOOM_CONFIG[card.bloom_level] ||
    BLOOM_CONFIG["Remembering"] || {
      damage: 5,
      color: "#9ca3af",
      bgColor: "rgba(156, 163, 175, 0.2)",
      icon: null, // Will be set by the component
    }
  );
};

// Get spell card configuration with fallback
export const getSpellCardConfig = (spellCard) => {
  return {
    name:
      spellCard.name ||
      SPELL_CARDS_CONFIG[spellCard.spell_type]?.name ||
      "Unknown Spell",
    description:
      spellCard.description ||
      SPELL_CARDS_CONFIG[spellCard.spell_type]?.description ||
      "A mysterious spell card",
    icon:
      spellCard.icon || SPELL_CARDS_CONFIG[spellCard.spell_type]?.icon || null,
    color:
      spellCard.color ||
      SPELL_CARDS_CONFIG[spellCard.spell_type]?.color ||
      "#7c3aed",
    bgColor:
      spellCard.bgColor ||
      SPELL_CARDS_CONFIG[spellCard.spell_type]?.bgColor ||
      "rgba(124, 58, 237, 0.2)",
    type:
      spellCard.spellType ||
      SPELL_CARDS_CONFIG[spellCard.spell_type]?.type ||
      "utility",
  };
};


