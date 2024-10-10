export const erc20PermitDomain = (chainId: number, tokenAddress: `0x${string}`) => ({
    name: 'USD Coin', // From https://eip712.domains/
    version: '2',
    chainId: chainId,
    verifyingContract: tokenAddress,
});

export const erc20PermitTypes = {
    Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
    ],
};
