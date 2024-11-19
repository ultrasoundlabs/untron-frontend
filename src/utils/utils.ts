import { keccak256, encodeAbiParameters } from 'viem';

// Define the types for the inputs and the order
export type Input = {
    token: `0x${string}`; // Token address (in hex format)
    amount: bigint; // Amount of tokens
};

export type GaslessCrossChainOrder = {
    originSettler: `0x${string}`; // Contract address
    user: `0x${string}`; // User's address
    nonce: bigint; // Nonce to prevent replay attacks
    originChainId: number; // Origin chain ID (e.g., Base network)
    openDeadline: bigint; // Timestamp for when the order should be opened
    fillDeadline: bigint; // Timestamp for when the order should be filled on destination chain
    intent: Intent; // Intent
};

export type Permit = {
    owner: `0x${string}`;
    spender: `0x${string}`;
    value: bigint;
    nonce: bigint;
    deadline: bigint;
};

export type Intent = {
    refundBeneficiary: `0x${string}`;
    inputs: Input[];
    to: `0x${string}`;
    outputAmount: bigint;
};

export async function getTokenNonce(
    publicClient: any,
    chainId: number,
    tokenAddress: `0x${string}`,
    owner: `0x${string}`,
): Promise<bigint> {
    const data = await publicClient.readContract({
        address: tokenAddress,
        chainId,
        abi: [
            // ERC20 Permit ABI fragment for `nonces`
            {
                constant: true,
                inputs: [{ name: 'owner', type: 'address' }],
                name: 'nonces',
                outputs: [{ name: '', type: 'uint256' }],
                type: 'function',
            },
        ],
        functionName: 'nonces',
        args: [owner],
    });

    return BigInt(data.toString());
}

export async function getGaslessNonce(
    publicClient: any,
    chainId: number,
    untronIntentsAddress: `0x${string}`,
    address: `0x${string}`,
): Promise<bigint> {
    console.log(chainId);
    const data = await publicClient.readContract({
        address: untronIntentsAddress,
        chainId,
        abi: [
            {
                constant: true,
                inputs: [{ name: 'owner', type: 'address' }],
                name: 'gaslessNonces',
                outputs: [{ name: '', type: 'uint256' }],
                type: 'function',
            },
        ],
        functionName: 'gaslessNonces',
        args: [address],
    });

    return BigInt(data.toString());
}

export async function generateOrderId(
    publicClient: any,
    chainId: number,
    untronIntentsAddress: `0x${string}`,
    order: GaslessCrossChainOrder
): Promise<`0x${string}`> {
    const encodedIntent = encodeIntent(order.intent);

    const formattedOrder = {
        originSettler: order.originSettler,
        user: order.user,
        nonce: order.nonce,
        originChainId: order.originChainId,
        openDeadline: order.openDeadline,
        fillDeadline: order.fillDeadline,
        orderData: encodedIntent,
    };

    const resolvedOrder = await publicClient.readContract({
        address: untronIntentsAddress,
        chainId,
        abi: [
            {
                inputs: [
                    {
                        components: [
                            { name: 'originSettler', type: 'address' },
                            { name: 'user', type: 'address' },
                            { name: 'nonce', type: 'uint256' },
                            { name: 'originChainId', type: 'uint64' },
                            { name: 'openDeadline', type: 'uint32' },
                            { name: 'fillDeadline', type: 'uint32' },
                            { name: 'orderData', type: 'bytes' },
                        ],
                        name: 'order',
                        type: 'tuple',
                    },
                    {
                        name: '',
                        type: 'bytes',
                    },
                ],
                name: 'resolveFor',
                outputs: [
                    {
                        components: [
                            { name: 'user', type: 'address' },
                            { name: 'originChainId', type: 'uint64' },
                            { name: 'openDeadline', type: 'uint32' },
                            { name: 'fillDeadline', type: 'uint32' },
                            {
                                name: 'maxSpent',
                                type: 'tuple[]',
                                components: [
                                    { name: 'token', type: 'address' },
                                    { name: 'amount', type: 'uint256' },
                                ],
                            },
                            {
                                name: 'minReceived',
                                type: 'tuple[]',
                                components: [
                                    { name: 'token', type: 'bytes32' },
                                    { name: 'amount', type: 'uint256' },
                                    { name: 'recipient', type: 'bytes32' },
                                    { name: 'chainId', type: 'uint32' },
                                ],
                            },
                            {
                                name: 'fillInstructions',
                                type: 'tuple[]',
                                components: [
                                    { name: 'chainId', type: 'uint32' },
                                    { name: 'target', type: 'bytes32' },
                                    { name: 'data', type: 'bytes' },
                                ],
                            },
                        ],
                        name: '',
                        type: 'tuple',
                    },
                ],
                stateMutability: 'view',
                type: 'function',
            },
        ],
        functionName: 'resolveFor',
        args: [formattedOrder, '0x'],
    });

    return keccak256(
        encodeAbiParameters(
            [
                {
                    type: 'tuple',
                    components: [
                        { name: 'user', type: 'address' },
                        { name: 'originChainId', type: 'uint64' },
                        { name: 'openDeadline', type: 'uint32' },
                        { name: 'fillDeadline', type: 'uint32' },
                        {
                            name: 'maxSpent',
                            type: 'tuple[]',
                            components: [
                                { name: 'token', type: 'address' },
                                { name: 'amount', type: 'uint256' },
                            ],
                        },
                        {
                            name: 'minReceived',
                            type: 'tuple[]',
                            components: [
                                { name: 'token', type: 'bytes32' },
                                { name: 'amount', type: 'uint256' },
                                { name: 'recipient', type: 'bytes32' },
                                { name: 'chainId', type: 'uint32' },
                            ],
                        },
                        {
                            name: 'fillInstructions',
                            type: 'tuple[]',
                            components: [
                                { name: 'chainId', type: 'uint32' },
                                { name: 'target', type: 'bytes32' },
                                { name: 'data', type: 'bytes' },
                            ],
                        },
                    ],
                },
            ],
            [resolvedOrder]
        )
    ) as `0x${string}`;
}

export function encodeIntent(intent: Intent): `0x${string}` {
    const intentAbiTypes = [
        { type: 'address', name: 'refundBeneficiary' },
        {
            type: 'tuple[]',
            name: 'inputs',
            components: [
                { name: 'token', type: 'address' },
                { name: 'amount', type: 'uint256' },
            ],
        },
        { type: 'bytes21', name: 'to' },
        { type: 'uint256', name: 'outputAmount' },
    ];

    const intentInputs = [] as [`0x${string}`, bigint][]; // Tuple array for inputs
    for (const input of intent.inputs || []) {
        intentInputs.push([input.token, input.amount]);
    }

    const encodedIntent = encodeAbiParameters(intentAbiTypes, [
        intent.refundBeneficiary,
        intentInputs,
        intent.to,
        intent.outputAmount,
    ]);

    const offsetEncodedIntent = encodedIntent;
    return offsetEncodedIntent;
}
