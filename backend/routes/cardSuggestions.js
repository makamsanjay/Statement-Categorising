const express = require("express");
const auth = require("../middleware/auth");
const loadUser = require("../middleware/loadUser");
const { aiSuggestCards } = require("../ai/aiSuggestCards");
const calculateCashback = require("../utils/calculateCashback");
const currencyToCountry = require("../utils/currencyToCountry");

const router = express.Router();

/**
 * POST /ai/card-suggestions
 */
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

    const country = currencyToCountry(currency);

    /* ---------- AI (SOURCE OF TRUTH) ---------- */
    const aiResult = await aiSuggestCards({
      category,
      currency,
      country,
      totalSpent
    });

    if (!aiResult || !Array.isArray(aiResult.cards)) {
      throw new Error("AI returned invalid card data");
    }

    /* ---------- VALIDATE + CALCULATE ---------- */
    const cards = aiResult.cards.slice(0, 2).map(card => {
      const rate = Number(card.cashbackRate);

      if (!rate || rate <= 0) {
        throw new Error(
          `Invalid cashback rate from AI for card ${card.name}`
        );
      }

      const estimated =
        totalSpent > 0
          ? calculateCashback(totalSpent, rate)
          : 0;

      return {
        name: card.name,
        issuer: card.issuer,
        cardType: card.cardType,
        annualFee: card.annualFee ?? 0,
        cashbackRate: `${rate}%`,
        estimatedSavings: `${currency} ${estimated.toFixed(2)}`,
        rateNote:
          rate >= 3
            ? "Category-specific cashback"
            : "Flat-rate cashback",
        rotation: card.rotation ?? null,
        reason: card.reason
      };
    });

    /* ---------- SUMMARY ---------- */
    const summary =
      totalSpent > 0
        ? `You spent ${currency} ${totalSpent.toFixed(
            2
          )} on ${category}. Using the best card below could have earned you up to ${cards[0].estimatedSavings}.`
        : `You haven’t spent on ${category} yet. These are the best cards to use next time.`;

    /* ---------- RESPONSE ---------- */
    res.json({
      category,
      currency,
      totalSpent,
      summary,
      cards
    });

  } catch (err) {
    console.error("❌ Card suggestion failed:", err);
    res.status(500).json({
      error: "Unable to generate card suggestions"
    });
  }
});

module.exports = router;
