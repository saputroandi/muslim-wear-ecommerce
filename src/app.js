const express = require("express");
const path = require("node:path");

const routes = require("./routes");

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "..", "public")));

  app.set("views", path.join(__dirname, "..", "views"));
  app.set("view engine", "hbs");

  app.use((req, res, next) => {
    res.locals.siteName = "Muslim Wear Ecommerce";
    res.locals.currentYear = new Date().getFullYear();
    next();
  });

  app.use(routes);

  app.use((req, res) => {
    res.status(404).render("404", {
      title: "Page not found"
    });
  });

  return app;
}

module.exports = { createApp };
