const session = require("express-session");
const mod = require("connect-pg-simple");

console.log("typeof mod:", typeof mod);
console.log("mod keys:", Object.keys(mod || {}));
console.log("has default factory:", Boolean(mod && typeof mod.default === "function"));
console.log("is callable:", typeof mod === "function");

let storeCtor = null;
try {
  if (typeof mod === "function") {
    storeCtor = mod(session);
  } else if (mod && typeof mod.default === "function") {
    storeCtor = mod.default(session);
  }
  console.log("resolved ctor type:", typeof storeCtor);
  console.log("resolved ctor keys:", Object.keys(storeCtor || {}));
} catch (error) {
  console.error("failed resolving ctor:", error);
}
