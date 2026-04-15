declare module "connect-pg-simple" {
  import type * as session from "express-session";
  // lightweight typing: factory that returns a constructor-like function for store
  function ConnectPgSimple(s: typeof session): (opts?: Record<string, unknown>) => unknown;
  export = ConnectPgSimple;
}

// fallback for any other untyped third-party libs used
declare module "bcryptjs";
