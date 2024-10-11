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
    /*
        // Create output array with USDT TRC20 on Tron
        Output[] memory minReceived = new Output[](1);
        minReceived[0] = Output(USDT_TRC20, intent.outputAmount, bytes32(uint256(uint168(intent.to))), TRON_COINID);

        // Create fill instruction to send output to settlement address on Tron
        FillInstruction[] memory fillInstructions = new FillInstruction[](1);
        fillInstructions[0] = FillInstruction(TRON_COINID, TRON_SETTLEMENT_ADDRESS, "");

        return ResolvedCrossChainOrder({
            user: intent.refundBeneficiary,
            originChainId: _chainId(),
            openDeadline: type(uint32).max,
            fillDeadline: fillDeadline,
            maxSpent: intent.inputs,
            minReceived: minReceived,
            fillInstructions: fillInstructions
        });
    */

    //  bytes32 orderId = keccak256(abi.encode(resolvedOrder));
    const MAX_UINT32 = Math.pow( 2, 32 ) - 1;
    const resolvedCrossChainOrderTypes = [
        { type: 'address', name: 'user' },
        { type: 'uint64', name: 'originChainId' },
        { type: 'uint32', name: 'openDeadline' },
        { type: 'uint32', name: 'fillDeadline' },
        {
            type: 'tuple[]',
            name: 'maxSpent',
            components: [{ type: 'address' }, { type: 'uint256' }],
        },
        {
            type: 'tuple[]',
            name: 'minReceived',
            components: [{ type: 'address' }, { type: 'uint256' }, { type: 'bytes32' }, { type: 'uint32' }],
        },
        {
            type: 'tuple[]',
            name: 'fillInstructions',
            components: [{ type: 'uint32' }, { type: 'bytes32' }, { type: 'bytes'} ],
        },
    ];

    const maxSpent = [] as [`0x${string}`, bigint][]; // Tuple array for inputs
    for (const input of order.intent.inputs) {
        maxSpent.push([input.token, input.amount]);
    }

    const minReceived = [] as [`0x${string}`, bigint, `0x${string}`, number][]; // Tuple array for inputs
    minReceived.push([
        // TODO: Convert to bytes32 representation
        '0x41a614f803b6fd780986a42c78ec9c7f77e6ded13c' as `0x${string}`,
        order.intent.outputAmount,
        // TODO: Convert to bytes32 representation
        order.intent.to,
        0x800000c3,
    ]);

    const fillInstructions = [] as [number, `0x${string}`, `0x${string}`][]; // Tuple array for inputs
    fillInstructions.push([
        0x800000c3,
        // TODO: Convert to bytes32 representation
        '0x00' as `0x${string}`,
        '0x' as `0x${string}`,
    ]);

    const encodedResolvedCrossChainOrder = encodeAbiParameters(resolvedCrossChainOrderTypes, [
        order.user,
        BigInt(order.originChainId),
        MAX_UINT32,
        order.fillDeadline,
        maxSpent,
        minReceived,
        fillInstructions,
    ]);

    // Hash the encoded order to get the order ID
    // TODO: See if this is the correct way or if we should do something in the sc instead :shrug:
    // Add offset of 32 bytes
    const offsetEncodedResolvedCrossChainOrder = ('0x0000000000000000000000000000000000000000000000000000000000000020' +
        encodedResolvedCrossChainOrder.slice(2)) as `0x${string}`;

    return keccak256(offsetEncodedResolvedCrossChainOrder);
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
