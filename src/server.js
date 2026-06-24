import app from "./app.js";
import { env } from "./config/env.js";
import { testDbConnection } from "./config/db.js";

const startServer = async () => {
  // 1. Verify database connectivity before accepting requests
  await testDbConnection();

  // 2. Start the HTTP server
  app.listen(env.port, () => {
    console.log(`🚀 Server running on http://localhost:${env.port}`);
    console.log(`🌍 Environment: ${env.nodeEnv}`);
  });
};

startServer().catch((error) => {
  console.error("💥 Failed to start server:", error.message);
  process.exit(1);
});
