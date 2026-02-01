import { useState, useEffect } from "react";
import { updateOriginalCardName } from "../api";
import "./OriginalCardEditor.css";

export default function OriginalCardEditor({ card, onSaved }) {
  const hasOriginal =
  Boolean(
    card.originalCard?.issuer &&
    card.originalCard?.product
  );


  const [editing, setEditing] = useState(false);
  const [issuer, setIssuer] = useState("");
  const [product, setProduct] = useState("");
  const [error, setError] = useState("");

useEffect(() => {
  if (
    card.originalCard?.issuer &&
    card.originalCard?.product
  ) {
    setIssuer(card.originalCard.issuer);
    setProduct(card.originalCard.product);
  } else {
    setIssuer("");
    setProduct("");
  }
  setEditing(false);
}, [card._id, card.originalCard?.issuer, card.originalCard?.product]);


  const handleSave = async () => {
    if (!issuer.trim() || !product.trim()) {
      setError("Both fields are required");
      return;
    }

    try {
      const updated = await updateOriginalCardName(card._id, {
        issuer: issuer.trim(),
        product: product.trim()
      });

      onSaved?.(updated);
      setEditing(false);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };

  /* ================= DISPLAY MODE ================= */

  if (hasOriginal && !editing) {
    return (
      <div className="original-card-row">
        <div className="original-card-text">
          <strong>
            {card.originalCard.issuer} {card.originalCard.product}
          </strong>
        </div>

        <button
          className="icon-btn"
          title="Edit original card name"
          onClick={() => setEditing(true)}
        >
          ✎
        </button>
      </div>
    );
  }

  /* ================= ADD BUTTON MODE ================= */

  if (!hasOriginal && !editing) {
    return (
      <div className="original-card-row">
        <button
          className="add-original-btn"
          onClick={() => setEditing(true)}
        >
          Add original card name
        </button>

        <span className="info-icon" title="Adding the official card name helps us generate more accurate cashback and card recommendations.">
          i
        </span>
      </div>
    );
  }

  /* ================= EDIT / ADD FORM ================= */

  return (
    <div className="original-card-form">
      <div className="field">
        <label>Card Provider</label>
        <input
          placeholder="Chase"
          value={issuer}
          onChange={e => setIssuer(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Product Name</label>
        <input
          placeholder="Freedom Unlimited"
          value={product}
          onChange={e => setProduct(e.target.value)}
        />
      </div>

      {error && <div className="inline-error">{error}</div>}

      <div className="actions">
        <button className="primary" onClick={handleSave}>
          Save
        </button>
        <button
          className="secondary"
          onClick={() => setEditing(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
