function renderHealth(_req, res) {
  res.json({
    status: "ok",
    service: "muslim-wear-ecommerce"
  });
}

module.exports = { renderHealth };
