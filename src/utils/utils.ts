import { keccak256, encodeAbiParameters } from 'viem';

// Define the types for the inputs and the order
export type Input = {
    token: `0x${string}`; // Token address (in hex format)
    amount: bigint; // Amount of tokens
};

export type Order = {
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
    console.log(chainId);
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

export function generateOrderId(order: Order): `0x${string}` {
    // Define the ABI types for encoding the order parameters
    const orderAbiTypes = [
        { type: 'address', name: 'originSettler' },
        { type: 'address', name: 'user' },
        { type: 'uint256', name: 'nonce' },
        { type: 'uint64', name: 'originChainId' },
        { type: 'uint32', name: 'openDeadline' },
        { type: 'uint32', name: 'fillDeadline' },
        { type: 'bytes', name: 'orderData' }, // The orderData will be the ABI encoded Intent
    ];


    // Encode the order parameters using viem's `encodeAbiParameters`
    const encodedOrder = encodeAbiParameters(orderAbiTypes, [
        order.originSettler,
        order.user,
        order.nonce,
        BigInt(order.originChainId), // Convert number to bigint for encoding
        order.openDeadline,
        order.fillDeadline,
        encodeIntent(order.intent), // Encode the intent
    ]);

    // Hash the encoded order to get the order ID
    // TODO: See if this is the correct way or if we should do something in the sc instead :shrug:
    // Add offset of 32 bytes
    const offsetEncodedOrder = ('0x0000000000000000000000000000000000000000000000000000000000000020' +
        encodedOrder.slice(2)) as `0x${string}`;

    return keccak256(offsetEncodedOrder);
}

export function encodeIntent(intent: Intent): `0x${string}` {
    // Define the ABI types for encoding the intent parameters
    const intentAbiTypes = [
        { type: 'address', name: 'refundBeneficiary' },
        {
            type: 'tuple[]',
            name: 'inputs',
            components: [{ type: 'address' }, { type: 'uint256' }],
        },
        { type: 'bytes21', name: 'to' },
        { type: 'uint256', name: 'outputAmount' },
    ];

    const intentInputs = [] as [`0x${string}`, bigint][]; // Tuple array for inputs
    for (const input of intent.inputs) {
        intentInputs.push([input.token, input.amount]);
    }

    // Encode the intent parameters using viem's `encodeAbiParameters`
    const encodedIntent = encodeAbiParameters(intentAbiTypes, [
        intent.refundBeneficiary,
        intentInputs,
        intent.to,
        intent.outputAmount,
    ]);

    const offsetEncodedIntent = ('0x0000000000000000000000000000000000000000000000000000000000000020' +
        encodedIntent.slice(2)) as `0x${string}`;
    // Convert the encoded intent to hexadecimal format (starts with '0x')
    return offsetEncodedIntent;
}
