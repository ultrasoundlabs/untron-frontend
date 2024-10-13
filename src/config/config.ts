export const configuration = {
    environment: process.env.NODE_ENV,
    urls: {
        backend: process.env.REACT_APP_BACKEND_URL,
    },
    walletConnect: {
        projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID,
    },
    contracts: {
        base: {
            // TODO: Validate that the address is a valid Ethereum address
            usdc: process.env.REACT_APP_USDC_BASE_ADDRESS as `0x${string}`,
            untronIntents: process.env.REACT_APP_UNTRON_INTENTS_BASE_ADDRESS as `0x${string}`,
        },
    },
};
