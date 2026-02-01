const express = require("express");
const auth = require("../middleware/auth");
const loadUser = require("../middleware/loadUser");

const { aiSuggestCards } = require("../ai/aiSuggestCards");
const CardSuggestion = require("../models/CardSuggestion");
const Card = require("../models/Card");
const calculateCashback = require("../utils/calculateCashback");
const currencyToCountry = require("../utils/currencyToCountry");

const router = express.Router();

/* ======================================================
   POST /ai/card-suggestions
   ➜ Create OR overwrite suggestion (idempotent)
   ====================================================== */
router.post("/", auth, loadUser, async (req, res) => {
  try {
    const {
      category,
      scope = "all",
      cardId = null,
      currency,
      totalSpent = 0
    } = req.body;

    if (!category || !currency) {
      return res.status(400).json({
        error: "Category and currency are required"
      });
    }

    const userId = req.user._id;
    const country = currencyToCountry(currency);

    /* ======================================================
       BUILD USER CARD CONTEXT (FOR AI COMPARISON)
       ====================================================== */
    let userCards = [];
let allowComparison = false;

/* ---------- SINGLE CARD MODE ---------- */
if (scope === "single" && cardId) {
  const card = await Card.findOne({ _id: cardId, userId });

  if (card?.originalCard?.issuer && card?.originalCard?.product) {
    userCards.push({
      issuer: card.originalCard.issuer,
      product: card.originalCard.product,
      scope: "single"
    });
    allowComparison = true;
  }
}

/* ---------- ALL CARDS MODE ---------- */
if (scope === "all") {
  const cards = await Card.find({
    userId,
    originalCard: { $ne: null }
  });

  const validCards = cards.filter(
    c => c.originalCard?.issuer && c.originalCard?.product
  );

  if (validCards.length > 0) {
    userCards = validCards.map(c => ({
      issuer: c.originalCard.issuer,
      product: c.originalCard.product,
      scope: "all"
    }));
    allowComparison = true;
  }

      userCards = cards
        .filter(
          c =>
            c.originalCard?.issuer &&
            c.originalCard?.product
        )
        .map(c => ({
          issuer: c.originalCard.issuer,
          product: c.originalCard.product,
          scope: "all"
        }));
    }

    /* ======================================================
       AI PICK (NO MATH, PURE LOGIC)
       ====================================================== */
const aiResult = await aiSuggestCards({
  category,
  country,
  currency,
  totalSpent,
  scope,
  userCards,
  allowComparison
});

    if (!aiResult || !Array.isArray(aiResult.cards)) {
      throw new Error("AI returned invalid result");
    }

    /* ======================================================
       ENRICH + CALCULATE (AI CONTROLS RATES)
       ====================================================== */
    const cards = aiResult.cards.map(card => {
      const rate = Number(card.cashbackRate) || 0;

      const savings =
        totalSpent > 0 && rate > 0
          ? calculateCashback(totalSpent, rate)
          : 0;

      return {
        name: card.name,
        issuer: card.issuer,
        cardType: card.cardType,
        annualFee: card.annualFee ?? 0,
        cashbackRate: `${rate}%`,
        estimatedSavings: `${currency} ${savings.toFixed(2)}`,
        rotation: card.rotation ?? null,
        reason: card.reason
      };
    });

    const summary =
      aiResult.summary ||
      (totalSpent > 0
        ? `You spent ${currency} ${totalSpent.toFixed(
            2
          )} on ${category}.`
        : `You haven’t spent on ${category} yet.`);

    /* ======================================================
       SAVE / OVERWRITE (HISTORY SAFE)
       ====================================================== */
    const saved = await CardSuggestion.findOneAndUpdate(
      {
        userId,
        category,
        scope,
        cardId
      },
      {
        userId,
        category,
        scope,
        cardId,
        currency,
        country,
        totalSpent,
        summary,
        cards
      },
      {
        upsert: true,
        new: true
      }
    );

    res.json(saved);
  } catch (err) {
    console.error("❌ Card suggestion failed:", err);
    res.status(500).json({
      error: "Unable to generate card suggestions"
    });
  }
});

/* ======================================================
   GET /ai/card-suggestions
   ➜ Load history
   ====================================================== */
router.get("/", auth, loadUser, async (req, res) => {
  try {
    const suggestions = await CardSuggestion.find({
      userId: req.user._id
    }).sort({ updatedAt: -1 });

    res.json(suggestions);
  } catch (err) {
    console.error("❌ Load history failed:", err);
    res.status(500).json({
      error: "Failed to load card suggestion history"
    });
  }
});

/* ======================================================
   DELETE /ai/card-suggestions/:id
   ====================================================== */
router.delete("/:id", auth, loadUser, async (req, res) => {
  try {
    await CardSuggestion.deleteOne({
      _id: req.params.id,
      userId: req.user._id
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete failed:", err);
    res.status(500).json({
      error: "Failed to delete suggestion"
    });
  }
});

module.exports = router;
