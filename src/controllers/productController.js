const { getAllProducts } = require("../models/catalogModel");

function renderProducts(_req, res) {
  res.render("products", {
    title: "Products",
    products: getAllProducts()
  });
}

module.exports = { renderProducts };
