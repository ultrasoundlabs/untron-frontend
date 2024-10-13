export const untronIntentsDomain = (chainId: number, contractAddress: `0x${string}`) => ({
    name: 'UntronIntents',
    version: '1',
    chainId: chainId,
    verifyingContract: contractAddress,
});

export const untronIntentsTypes = {
    Intent: [
        { name: 'refundBeneficiary', type: 'address' },
        { name: 'inputs', type: 'Input[]' },
        { name: 'to', type: 'bytes21' },
        { name: 'outputAmount', type: 'uint256' },
        { name: 'orderId', type: 'bytes32' },
    ],
    Input: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
    ],
};
