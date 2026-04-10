const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

function requireEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    console.error(
      `Missing ${name}. Copy .env.example to .env in this folder and set your Azure Service Bus connection string.`,
    );
    process.exit(1);
  }
  return v;
}

module.exports = { requireEnv };
