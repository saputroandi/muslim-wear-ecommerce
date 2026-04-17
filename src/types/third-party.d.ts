declare module "connect-pg-simple" {
  import type session from "express-session";
  type StoreConstructor = new (opts?: Record<string, unknown>) => session.Store;
  type ConnectPgSimpleFactory = (s: typeof session) => StoreConstructor;
  const connectPgSimple: ConnectPgSimpleFactory;
  export default connectPgSimple;
}

// fallback for any other untyped third-party libs used
declare module "bcryptjs";
