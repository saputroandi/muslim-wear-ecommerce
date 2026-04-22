const { getFeaturedProducts } = require("../models/catalogModel");

function renderHome(_req, res) {
  res.render("home", {
    title: "Home",
    featuredProducts: getFeaturedProducts()
  });
}

module.exports = { renderHome };
