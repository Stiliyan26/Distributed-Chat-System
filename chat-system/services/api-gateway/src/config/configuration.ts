export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    jwtSecret: process.env.JWT_SECRET,
    services: {
        auth: {
            url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
        },
        channel: {
            url: process.env.CHANNEL_SERVICE_URL || 'http://localhost:3002',
        },
        messaging: {
            url: process.env.MESSAGING_SERVICE_URL || 'http://localhost:3003',
        }
    }
});