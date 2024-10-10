import styles from './Form.module.scss';
import { ConnectKitButton } from 'connectkit';
import SwapFormItem from './Item';
import SwapFormInput from './Input';
import SwapFormLoadingSpinner from './LoadingSpinner';
import SwapFormSuccessModal from './SuccessModal';
import SwapFormErrorModal from './ErrorModal';
import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import axios from 'axios';
import { signOrder, signPermit } from '../../eip712/signer';
import { encodeIntent, getTokenNonce, Intent, Order, Permit } from '../../utils/utils';

export default function SwapForm() {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient({
        account: address,
    });
    const publicClient = usePublicClient();

    const [transaction, setTransaction] = useState<any>(null);
    const [isSwapping, setIsSwapping] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function requestSwap() {
        if (isSwapping) return;
        if (!walletClient || !address) {
            console.error('Wallet not connected');
            return;
        }

        setIsSwapping(true);

        try {
            const chainId = await walletClient.getChainId();
            console.log(chainId);
            const tokenAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`; // Replace with actual token address
            const contractAddress = '0x525e984919701Fd8E01bA77eFa4213b9894371Ee' as `0x${string}`; // Replace with actual contract address
            const spender = contractAddress; // The contract is the spender
            const value = BigInt('1000000'); // Example token amount (1 token with 6 decimals)
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

            // Get the nonce (you may need to fetch this from the token contract)
            const nonce = await getTokenNonce(publicClient, chainId, tokenAddress, address);

            const permit: Permit = {
                owner: address,
                spender,
                value,
                nonce,
                deadline,
            };
            console.log('Permit:', permit);
            const permitSignature = await signPermit(walletClient, chainId, tokenAddress, permit, nonce);

            const intent: Intent = {
                refundBeneficiary: address,
                inputs: [{ token: tokenAddress, amount: value }],
                to: '0x418187505007dfc0c80bd64288c73d79665761af5d', // Replace with actual destination address (bytes21)
                outputAmount: BigInt('1000000'), // Example output amount
            };
            const order: Order = {
                originSettler: contractAddress,
                user: address,
                nonce,
                originChainId: chainId,
                openDeadline: BigInt(1828585485), //BigInt(Math.floor(Date.now() / 1000) + 3600),
                fillDeadline: BigInt(1828585485), //BigInt(Math.floor(Date.now() / 1000) + 7200),
                intent: intent,
            };
            const orderSignature = await signOrder(walletClient, chainId, contractAddress, order);
            const orderData = encodeIntent(intent); // TODO: See if we should just send intent instead and then encode it on BE

            // **Send data to backend**
            // TODO: Replace base url
            const response = await axios.post('http://localhost:3001/intents/permitted-gasless-order', {
                user: address,
                openDeadline: order.openDeadline.toString(),
                fillDeadline: order.fillDeadline.toString(),
                nonce: order.nonce.toString(),
                orderData: orderData,
                signature: orderSignature,
                tokenPermits: [
                    {
                        deadline: permit.deadline.toString(),
                        v: permitSignature.v,
                        r: permitSignature.r,
                        s: permitSignature.s,
                    },
                ],
            });

            console.log('Backend response:', response.data);
            setTransaction({
                url: `https://basescan.org/tx/${response.data.txHash}`,
            });
        } catch (error: any) {
            console.error('Error during swap:', error);
            setErrorMessage('Swap could not be performed, please try again.');
        } finally {
            setIsSwapping(false);
        }
    }

    function clearTransaction() {
        setTransaction(null);
    }
    function clearErrorMessage() {
        setErrorMessage(null);
    }

    return (
        <div className={styles.Form}>
            <SwapFormItem
                chainId="tron"
                label="You send"
                amountInputProps={{
                    placeholder: 'Enter amount',
                    defaultValue: '52.00',
                }}
                convertedAmountInputProps={{
                    placeholder: 'Converted amount',
                    defaultValue: '$260045.00',
                }}
            />
            <div className={styles.SwapArrowContainer}>
                <button className={styles.SwapArrow}>
                    {/* Place svg icon here differently depends on your preferences */}
                    {/* Would be cool if height, width props will be removed, and fill=currentColor */}
                    <svg viewBox="0 0 35 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M20.8474 18.7528C18.6996 21.0393 15.9476 21.0336 13.8 18.7414L1.14986 5.27906C0.0232434 4.10323 0.0232441 2.39082 1.02837 1.34498C2.18935 0.175092 3.9744 0.175092 5.0228 1.29854L17.3134 14.3526L29.5983 1.29854C30.6728 0.175092 32.4317 0.201176 33.6189 1.34498C34.6501 2.36473 34.598 4.1092 33.4973 5.28476L20.8474 18.7528Z"
                            fill="currentColor"
                        />
                    </svg>
                </button>
            </div>
            <SwapFormItem
                chainId="tron"
                label="You receive"
                amountInputProps={{
                    placeholder: 'Enter amount',
                    defaultValue: '52.00',
                }}
                convertedAmountInputProps={{
                    placeholder: 'Converted amount',
                    defaultValue: '$260045.00',
                }}
            />
            <div className={styles.Gap} />
            <SwapFormInput
                inputProps={{
                    type: 'text',
                    placeholder: 'Tron address',
                    autoComplete: 'off',
                }}
            />
            <div className={styles.Gap} />
            <ConnectKitButton.Custom>
                {({ isConnected, isConnecting, show, address }) => (
                    <button
                        className={styles.Button}
                        onClick={() => {
                            if (isConnected && address) {
                                requestSwap();
                            } else {
                                show?.();
                            }
                        }}
                    >
                        {isConnecting || isSwapping ? (
                            <SwapFormLoadingSpinner />
                        ) : address ? (
                            'Swap'
                        ) : (
                            'Connect Your Wallet'
                        )}
                    </button>
                )}
            </ConnectKitButton.Custom>
            <p className={styles.Info}>Swaps from Tron coming soon</p>
            <SwapFormSuccessModal transaction={transaction} onClose={() => clearTransaction()} />
            <SwapFormErrorModal error={errorMessage} onClose={() => clearErrorMessage()} />
        </div>
    );
}
