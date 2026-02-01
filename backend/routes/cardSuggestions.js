const express = require("express");
const auth = require("../middleware/auth");
const loadUser = require("../middleware/loadUser");

const { aiSuggestCards } = require("../ai/aiSuggestCards");
const CardSuggestion = require("../models/CardSuggestion");
const calculateCashback = require("../utils/calculateCashback");
const currencyToCountry = require("../utils/currencyToCountry");
const BASE_CASHBACK = require("../utils/cardCashbackRates");

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

    /* ---------- AI PICK (NO MATH) ---------- */
    const aiResult = await aiSuggestCards({
      category,
      country
    });

    if (!aiResult || !Array.isArray(aiResult.cards)) {
      throw new Error("AI returned invalid result");
    }

    /* ---------- ENRICH + CALCULATE ---------- */
    const cards = aiResult.cards.map(card => {
      const rate = BASE_CASHBACK[card.name] ?? 1.5; // hard fallback

      const savings =
        totalSpent > 0
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
      totalSpent > 0
        ? `You spent ${currency} ${totalSpent.toFixed(
            2
          )} on ${category}. Using the best card below could have earned you up to ${cards[0].estimatedSavings}.`
        : `You haven’t spent on ${category} yet. These are the best cards to use next time.`;

    /* ---------- SAVE / OVERWRITE ---------- */
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


/**
 * DELETE /ai/card-suggestions/:id
 */
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
