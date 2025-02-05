import bs58check from 'bs58check';
import { TronWeb } from 'tronweb';
import { EventResponse } from 'tronweb/lib/esm/lib/event';

/**
 * Decodes a Tron base58check address (e.g. T....) into an EVM 0x address.
 * Tron addresses are 21 bytes where:
 *   - The first byte is always 0x41
 *   - The next 20 bytes are the keccak256-hash-based address (like Ethereum)
 */
export function decodeTronBase58Address(tronAddress: string): `0x${string}` {
    const bytes = bs58check.decode(tronAddress);

    // Tron addresses always start with 0x41 in raw bytes
    if (bytes[0] !== 0x41) {
        throw new Error('Invalid Tron address: missing 0x41 prefix');
    }

    // Remove the first byte (0x41) to leave the 20-byte EVM address
    const evmBytes = bytes.slice(1); // 20 bytes remain
    // Return '0x' + hex
    return `0x${Buffer.from(evmBytes).toString('hex')}` as `0x${string}`;
}

interface PollOptions {
    contractAddress: string;
    to: string;
    amount: string;
    onSuccess: (transactionHash: string, blockTimestamp: number) => void;
    onError?: (error: Error) => void;
}

export function pollTronTransaction(tronWeb: TronWeb, options: PollOptions) {
    const { contractAddress, to, amount, onSuccess, onError } = options;

    (async () => {
        try {
            const timeout = setTimeout(() => {
                console.log('Timeout reached. Stopping event polling.');
                clearInterval(pollingInterval);
            }, 60000); // 60 seconds timeout

            // Convert user-supplied T... address into 0x... format
            // so we can do a direct match with the event result
            let evmTo: string;
            try {
                evmTo = decodeTronBase58Address(to).toLowerCase();
            } catch (err) {
                console.error('Error decoding Tron address:', err);
                clearTimeout(timeout);
                if (onError) onError(err as Error);
                return;
            }

            const pollingInterval = setInterval(async () => {
                try {
                    const events: EventResponse = await tronWeb.getEventResult(contractAddress, {
                        eventName: 'Transfer',
                    });

                    const eventData = events.data?.map((eventData) => ({
                        to: eventData.result.to,
                        value: eventData.result.value,
                        transactionHash: eventData.transaction_id,
                        blockTimestamp: eventData.block_timestamp,
                    }));

                    if (!eventData || eventData.length === 0) return;

                    // Compare 'to' from the event to the EVM version of the Tron address
                    for (const { to, value, transactionHash, blockTimestamp } of eventData) {
                        if (to.toLowerCase() === evmTo.toLowerCase() && value === amount) {
                            onSuccess(transactionHash, blockTimestamp);
                            clearInterval(pollingInterval);
                            clearTimeout(timeout);
                            break;
                        }
                    }
                } catch (err) {
                    console.error('Error fetching events:', err);
                    if (onError) onError(err as Error);
                }
            }, 3000); // Poll every 3 seconds
        } catch (error) {
            console.error('Error setting up event polling:', error);
            if (onError) onError(error as Error);
        }
    })();
} 