export const configuration = {
    // There is also a built-in environment variable called NODE_ENV.
    // You can read it from process.env.NODE_ENV. When you run npm start, it is always equal to 'development',
    // when you run npm test it is always equal to 'test', and when you run npm run build to make a production bundle,
    // it is always equal to 'production'. You cannot override NODE_ENV manually.
    // This prevents developers from accidentally deploying a slow development build to production.
    environment: process.env.NODE_ENV,
    urls: {
        backend: process.env.REACT_APP_BACKEND_URL,
        tronRpcUrl: process.env.REACT_APP_TRON_RPC_URL,
    },
    walletConnect: {
        projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID,
    },
    contracts: {
        usdtTronAddress: process.env.REACT_APP_USDT_TRON_ADDRESS,
        untronTransfersAddress: process.env.REACT_APP_UNTRON_INTENTS_BASE_ADDRESS,
    },
};
