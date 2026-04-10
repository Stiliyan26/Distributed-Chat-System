const { ServiceBusClient } = require("@azure/service-bus");
const { requireEnv } = require("./load-env");

// 1. Connection Details — set AZURE_SERVICE_BUS_CONNECTION_STRING in .env (see .env.example)
const connectionString = requireEnv("AZURE_SERVICE_BUS_CONNECTION_STRING");
const topicName = "test-topic";
const subscriptionName = process.env.RECEIVER_ID;

async function main() {
  // 2. Create the Service Bus Client
  const sbClient = new ServiceBusClient(connectionString);

  // 3. Create a receiver for the specific Topic and Subscription
  const receiver = sbClient.createReceiver(topicName, subscriptionName);

  // 4. Define the message handler
  const myMessageHandler = async (messageReceived) => {
    console.log(`[Message Received] ID: ${messageReceived.messageId}`);
    console.log(`[Message Body]:`, messageReceived.body);

    // Explicitly complete the message so it is removed from the subscription
    await receiver.completeMessage(messageReceived);
  };

  // 5. Define the error handler
  const myErrorHandler = async (error) => {
    console.error("An error occurred while receiving messages: ", error);
  };

  console.log(`Starting receiver for ${topicName} > ${subscriptionName}...`);
  console.log("Waiting for messages. Press Ctrl+C to exit.\n");

  // 6. Start the subscription loop
  receiver.subscribe({
    processMessage: myMessageHandler,
    processError: myErrorHandler,
  });

  // Keep the script running to listen for messages indefinitely.
  // We use a simple promise that never resolves unless interrupted.
  process.on("SIGINT", async () => {
    console.log("\nGracefully shutting down...");
    await receiver.close();
    await sbClient.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Fatal error running consumer:", err);
  process.exit(1);
});
