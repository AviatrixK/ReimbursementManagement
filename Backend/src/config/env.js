import "dotenv/config";

const _required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  port: process.env.PORT || 7002,
  nodeEnv: process.env.NODE_ENV || "development",

  databaseUrl: _required("DATABASE_URL"),

  jwtSecret: _required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  cookieSecret: process.env.COOKIE_SECRET || "default_cookie_secret",
};
