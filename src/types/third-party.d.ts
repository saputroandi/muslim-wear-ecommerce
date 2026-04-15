declare module "connect-pg-simple" {
  import session = require("express-session");
  function PgSession(options?: any): any;
  namespace PgSession {}
  export = PgSession;
}

// fallback for any other untyped third-party libs used
declare module "bcryptjs";
