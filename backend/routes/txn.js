router.get("/", async (req, res) => {
  const { cardId } = req.query;

  const filter = cardId ? { cardId } : {};
  const transactions = await Transaction.find(filter).sort({ date: -1 });

  res.json(transactions);
});
