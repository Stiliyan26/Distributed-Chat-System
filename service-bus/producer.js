// Azure Service Bus — send test message
// Run: npm install && node producer.js
// Set AZURE_SERVICE_BUS_CONNECTION_STRING in .env (see .env.example)

const { ServiceBusClient } = require("@azure/service-bus");
const { requireEnv } = require("./load-env");

const CONNECTION_STRING = requireEnv("AZURE_SERVICE_BUS_CONNECTION_STRING");

// ── Change this to an existing queue or topic name in your namespace ──
const QUEUE_NAME = "test-topic";

function namespaceHost(connectionString) {
  const m = String(connectionString).match(/Endpoint=sb:\/\/([^/;]+)/i);
  return m ? m[1] : "(unknown)";
}

async function testConnection() {
  console.log("🔌 Connecting to Azure Service Bus...");
  console.log(`   Namespace : ${namespaceHost(CONNECTION_STRING)}`);
  console.log(`   Queue     : ${QUEUE_NAME}\n`);

  const client = new ServiceBusClient(CONNECTION_STRING);

  try {
    // ── 1. Send a test message ────────────────────────────────────────────────
    const sender = client.createSender(QUEUE_NAME);

    const message = {
      body: {
        text: "Hello from the other side!",
        timestamp: new Date().toISOString(),
      },
      contentType: "application/json",
      subject: "ConnectionTest",
    };

    await sender.sendMessages(message);
    console.log("✅ SEND   — Message sent successfully:", message.body);
    await sender.close();

    console.log(
      "\n🎉 Connection test PASSED — Azure Service Bus is working correctly!",
    );
  } catch (err) {
    console.error("\n❌ Connection test FAILED:");
    console.error("   Error code   :", err.code ?? "N/A");
    console.error("   Error message:", err.message);

    if (err.message?.includes("Unauthorized")) {
      console.error("\n   👉 Hint: Check your SharedAccessKey or KeyName.");
    } else if (err.message?.includes("does not exist")) {
      console.error(
        `\n   👉 Hint: Queue "${QUEUE_NAME}" was not found. Update QUEUE_NAME in the script.`,
      );
    } else if (
      err.message?.includes("ENOTFOUND") ||
      err.message?.includes("getaddrinfo")
    ) {
      console.error(
        "\n   👉 Hint: DNS resolution failed — check your network / namespace name.",
      );
    }
  } finally {
    await client.close();
    console.log("\n🔒 Client closed.");
  }
}

testConnection();
