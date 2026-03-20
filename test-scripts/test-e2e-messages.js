const axios = require('axios');
const { io } = require('socket.io-client');

const API_GATEWAY_URL = 'http://localhost:3000/api';
// Chat service is exposed on 3080:3000 in docker-compose.chat.yml
// Connecting directly (bypassing API gateway) so we pass x-user-id header manually
const WS_GATEWAY_URL = 'http://localhost:3080';

async function generateTestUser(index) {
    const shortId = Date.now().toString().slice(-4);
    const username = `usr${shortId}${index}`;
    const password = 'Password123!';
    const email = `${username}@example.com`;

    try {
        // 1. Register User
        const registerResponse = await axios.post(`${API_GATEWAY_URL}/auth/register`, {
            username,
            email,
            password,
            repeatPassword: password
        });
        console.log(`[User ${index}] Registered explicitly`);

        // 2. Login User to get cookie token
        const loginResponse = await axios.post(`${API_GATEWAY_URL}/auth/login`, {
            email,
            password,
        });
        console.log(`[User ${index}] Logged in`);

        const setCookieHeader = loginResponse.headers['set-cookie'];
        if (!setCookieHeader) {
            throw new Error(`[User ${index}] No set-cookie header received!`);
        }

        // Extract the access_token string from the array of set-cookies
        const cookie = setCookieHeader.find(c => c.startsWith('access_token='));
        const token = cookie ? cookie.split(';')[0].split('=')[1] : null;

        if (!token) {
            throw new Error(`[User ${index}] Could not parse Authentication token from cookies!`);
        }

        return {
            id: loginResponse.data.id,
            username,
            token,
            cookie: `access_token=${token}`
        };

    } catch (error) {
        if (error.response) {
            console.error(`[User ${index}] Auth Error:`, error.response.data);
        } else {
            console.error(`[User ${index}] Auth Error:`, error.message);
        }
        process.exit(1);
    }
}

async function createChannel(user, channelName) {
    try {
        const response = await axios.post(`${API_GATEWAY_URL}/channels/create`, {
            channelName,
            memberIds: [user.id] // User creates it and explicitly adds themselves
        }, {
            headers: {
                Cookie: user.cookie
            }
        });
        console.log(`[${user.username}] Created Channel -> ${channelName} (${response.data.channelId})`);
        return response.data;
    } catch (err) {
        console.error(`[${user.username}] Create Channel Error:`, err?.response?.data || err.message);
        process.exit(1);
    }
}

async function joinChannelInDB(adminUser, userToJoin, channelId) {
    // In our Chat-System, it looks like only creating the channel with memberIds adds them.
    // If the channel is already created, you would have an endpoint to add a member.
    // Since we don't know the exact endpoint off hand, we'll try recreating or assuming we have one.
    // However, the best way is to create the channel with BOTH memberIds immediately.
    return true; // We handles this differently inside the main test function
}

function connectSocket(user, channelIdsToJoin) {
    return new Promise((resolve, reject) => {
        // 3. Connect Socket with authentication
        // ChatGateway has transports: ['websocket'] — polling is NOT supported
        // x-user-id is required since we bypass the API gateway (which normally injects it from the JWT cookie)
        const socket = io(WS_GATEWAY_URL, {
            transports: ['websocket'],
            extraHeaders: {
                'x-user-id': user.id
            }
        });

        socket.on('connect', () => {
            console.log(`[${user.username}] Socket connected (${socket.id})`);

            // 4. Subscribe to new_message event BEFORE joining
            socket.on('new_message', (msg) => {
                console.log(`\n===========================================`);
                console.log(`📩 [${user.username}] RECEIVES MESSAGE:`);
                console.log(`    From: ${msg.senderUsername}`);
                console.log(`    Content: "${msg.content}"`);
                console.log(`===========================================\n`);
            });

            // 5. Join Channels internally
            if (channelIdsToJoin && channelIdsToJoin.length > 0) {
                socket.emit('join_all_user_channels', channelIdsToJoin);
                console.log(`[${user.username}] Subscribed to channels natively`);
            }

            resolve(socket);
        });

        socket.on('connect_error', (err) => {
            console.error(`[${user.username}] Socket Connection Error:`, err.message);
            reject(err);
        });

        socket.on('disconnect', () => {
            console.log(`[${user.username}] Socket disconnected`);
        });
    });
}

function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}

async function runTests() {
    console.log("--- STARTING E2E TEST ---\n");

    // A. Create two distinct users
    const userA = await generateTestUser(1); // The sender and general admin
    const userB = await generateTestUser(2); // The recipient

    console.log("\n--- CREATING CHANNELS ---");
    // B. We'll create ONE channel through User A, but specify *both* members so they exist in DB
    let responseShared = null;
    try {
        responseShared = await axios.post(`${API_GATEWAY_URL}/channels/create`, {
            channelName: 'Shared Channel',
            memberIds: [userA.id, userB.id] // Both members!
        }, {
            headers: { Cookie: userA.cookie }
        });
        console.log(`[${userA.username}] Created 'Shared Channel' -> ID: ${responseShared.data.channelId}`);
    } catch (err) {
        console.error(`Failed to create shared channel:`, err?.response?.data || err.message);
        process.exit(1);
    }
    const sharedChannelId = responseShared.data.channelId;

    // Create an exclusive channel just for User A
    let responseExclusive = null;
    try {
        responseExclusive = await axios.post(`${API_GATEWAY_URL}/channels/create`, {
            channelName: 'Exclusive Channel',
            memberIds: [userA.id] // ONLY User A!
        }, {
            headers: { Cookie: userA.cookie }
        });
        console.log(`[${userA.username}] Created 'Exclusive Channel' -> ID: ${responseExclusive.data.channelId}`);
    } catch (err) {
        console.error(`Failed to create exclusive channel:`, err?.response?.data || err.message);
        process.exit(1);
    }
    const exclusiveChannelId = responseExclusive.data.channelId;


    console.log("\n--- CONNECTING SOCKETS ---");

    // Connect User A and subscribe to BOTH channels
    const socketA = await connectSocket(userA, [sharedChannelId, exclusiveChannelId]);

    // Connect User B and subscribe ONLY to the shared channel
    const socketB = await connectSocket(userB, [sharedChannelId]);

    await delay(2000); // Wait for Redis pub/sub to settle

    console.log("\n--- TEST CASE 1: Sending message to shared channel (Both Online) ---");
    // Expected Result: Both User A and User B receive it
    console.log(`[${userA.username}] sending message...`);
    socketA.emit('send_message', {
        channelId: sharedChannelId,
        senderUsername: userA.username,
        content: "Hello everyone in the shared channel!",
        sentAt: new Date().toISOString()
    });

    await delay(3000); // Wait for Kafka -> DB -> Redis delivery

    await delay(3000);

    console.log("\n--- TEST CASE 3: Sending message to User B while OFFLINE ---");
    console.log(`[${userB.username}] disconnecting socket...`);
    socketB.disconnect(); 
    await delay(1000); // Wait for presence to detect offline

    console.log(`[${userA.username}] sending message...`);
    socketA.emit('send_message', {
        channelId: sharedChannelId,
        senderUsername: userA.username,
        content: "User B should get an email for this!",
        sentAt: new Date().toISOString()
    });

    console.log(`\n💡 [TIP] Check the 'delivery-service' docker logs now:`);
    console.log(`   You should see: [MOCK EMAIL] → user: ${userB.username}@example.com | channel: ${sharedChannelId}`);

    await delay(5000); // Give enough time for the full flow to complete

    console.log("\n--- TESTS FINISHED ---");
    process.exit(0);
}

runTests();
