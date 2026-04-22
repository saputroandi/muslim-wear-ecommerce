const express = require("express");

const { renderHome } = require("../controllers/homeController");
const { renderProducts } = require("../controllers/productController");
const { renderHealth } = require("../controllers/healthController");

const router = express.Router();

router.get("/", renderHome);
router.get("/products", renderProducts);
router.get("/health", renderHealth);

module.exports = router;
