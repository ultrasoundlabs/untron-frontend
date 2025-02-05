import { encodeAbiParameters, pad, toHex, encodeFunctionData } from 'viem';
import contractAbi from '../abi/untronTransfersAbi';
import { configuration } from '../config/config';

// Chain-specific types that differ from API types
export type Permit = {
    owner: `0x${string}`;
    spender: `0x${string}`;
    amount: bigint;
    nonce: bigint;
    deadline: bigint;
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

// Implement the function to encode the permit data
export function encodePermitData(
    permit: Permit,
    permitSignature: {
        v: number;
        r: `0x${string}`;
        s: `0x${string}`;
    },
): `0x${string}` {
    // ABI encode the data according to the expected format
    return encodeAbiParameters(
        [
            { type: 'address' }, // spender
            { type: 'uint256' }, // amount
            { type: 'uint256' }, // deadline
            { type: 'uint8' }, // v
            { type: 'bytes32' }, // r
            { type: 'bytes32' }, // s
        ],
        [permit.spender, permit.amount, permit.deadline, permitSignature.v, permitSignature.r, permitSignature.s],
    );
}

export function encodeSwapData(inputAmount: string, outputAmount: string, tronAddress: string): `0x${string}` {
    // Ensure input and output amounts fit into 6 bytes (0 <= amount < 2^48)
    const inputAmountHex = pad(toHex(BigInt(inputAmount)), { size: 6 }); // 6 bytes
    const outputAmountHex = pad(toHex(BigInt(outputAmount)), { size: 6 }); // 6 bytes

    console.log(tronAddress);
    console.info(tronAddress);
    const strippedTronAddress = tronAddress.replace('41', '');
    console.log(strippedTronAddress);
    // Validate and pad the Tron address without the prefix byte 0x41 (20 bytes)
    if (strippedTronAddress.length !== 42 || !strippedTronAddress.startsWith('0x')) {
        throw new Error('Invalid Tron address format. Must be 21 bytes in hex format.');
    }
    const tronAddressHex = strippedTronAddress.toLowerCase(); // Tron address should already be 20 bytes

    // Concatenate inputAmount (6 bytes), outputAmount (6 bytes), and Tron address (21 bytes)
    const swapData = `0x${inputAmountHex.slice(2)}${outputAmountHex.slice(2)}${tronAddressHex.slice(2)}`;

    if (swapData.length !== 66) {
        throw new Error('Swap data is not 33 bytes.');
    }

    return swapData as `0x${string}`;
}

export async function callCompactUsdc(
    swapData: `0x${string}`,
    walletClient: any, // Provided by `useWalletClient`
    publicClient: any, // Provided by `usePublicClient`
) {
    console.log(swapData);

    // Use `walletClient` to send the transaction
    const tx = await walletClient.writeContract({
        address: configuration.contracts.untronTransfersAddress,
        abi: contractAbi,
        functionName: 'compactUsdc',
        args: [swapData],
    });

    // Await for receipt
    const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
    });
    
    console.log('Transaction Sent:', tx);
    console.log('Receipt:', receipt);

    console.log('Transaction Sent:', tx);
    return tx;
}

export async function callPermitAndCompactUsdc(
    permitData: `0x${string}`,
    swapData: `0x${string}`,
    walletClient: any, // Provided by `useWalletClient`
    publicClient: any, // Provided by `usePublicClient`
) {
    console.log(permitData);
    console.log(swapData);

    // Use `walletClient` to send the transaction
    const tx = await walletClient.writeContract({
        address: configuration.contracts.untronTransfersAddress,
        abi: contractAbi,
        functionName: 'permitAndCompactUsdc',
        args: [permitData, swapData],
    });

    // Await for receipt
    const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
    });
    console.log('Transaction Sent:', tx);
    console.log('Receipt:', receipt);

    console.log('Transaction Sent:', tx);
    return tx;
}
