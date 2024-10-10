export const erc20PermitDomain = (chainId: number, tokenAddress: `0x${string}`) => ({
    name: '', // TODO: See if we can find name, looks empty to me :/ https://dashboard.tenderly.co/tx/base/0x17a0536e221909505f410e00cb66f3e716062194c9ad47f3213d6545091f52bc
    // Version 2 as bytes keccak256 hash
    version: '2',
    chainId: chainId,
    verifyingContract: tokenAddress,
});

export const erc20PermitTypes = {
    Permit: [
        { name: 'PERMIT_TYPEHASH', type: 'bytes32' },
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
    ],
};
