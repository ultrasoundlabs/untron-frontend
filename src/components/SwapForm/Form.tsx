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
    const [inputAmount, setInputAmount] = useState<string>(''); // Input amount state
    const [inputConvertedAmount, setInputConvertedAmount] = useState<string>(''); // Converted input amount state
    const [outputAmount, setOutputAmount] = useState<string>(''); // Output amount state
    const [outputConvertedAmount, setOutputConvertedAmount] = useState<string>(''); // Converted output amount state
    const [tronAddress, setTronAddress] = useState<string>(''); // Tron address state

    // Fee percentage
    const FEE_PERCENTAGE = 0.001; // 0.1% fee

    // Hardcoded rate (1:1 for now)
    const EXCHANGE_RATE = 1;

    const handleAddressChange = (address: string) => {
        setTronAddress(address);
    };

    const handleAmountChange = (amount: string) => {
        setInputAmount(amount);

        // If the input is empty or invalid, reset the converted and output amounts
        if (isNaN(parseFloat(amount)) || amount === '') {
            setInputConvertedAmount('');
            setOutputAmount('');
            setOutputConvertedAmount('');
            return;
        }

        // Calculate input converted amount (rate * input amount)
        const inputConverted = parseFloat(amount) * EXCHANGE_RATE;
        setInputConvertedAmount(`$${inputConverted.toFixed(2)}`);

        // Calculate output amount (input - fee)
        const fee = parseFloat(amount) * FEE_PERCENTAGE;
        const output = parseFloat(amount) - fee;
        setOutputAmount(output.toFixed(2));

        // Calculate output converted amount (rate * output amount)
        const outputConverted = output * EXCHANGE_RATE;
        setOutputConvertedAmount(`$${outputConverted.toFixed(2)}`);
    };

    async function requestSwap() {
        if (isSwapping || !inputAmount || !outputAmount) return;
        if (!walletClient || !address) {
            console.error('Wallet not connected');
            return;
        }

        setIsSwapping(true);

        try {
            const chainId = await walletClient.getChainId();
            const tokenAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`; // Replace with actual token address
            const contractAddress = '0x525e984919701Fd8E01bA77eFa4213b9894371Ee' as `0x${string}`; // Replace with actual contract address
            const spender = contractAddress; // The contract is the spender
            const value = BigInt(Math.floor(parseFloat(inputAmount) * 1e6)); // Convert inputAmount to BigInt
            const outputValue = BigInt(Math.floor(parseFloat(outputAmount) * 1e6)); // Convert outputAmount to BigInt
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

            // Get the nonce
            const nonce = await getTokenNonce(publicClient, chainId, tokenAddress, address);

            const permit: Permit = {
                owner: address,
                spender,
                value,
                nonce,
                deadline,
            };
            const permitSignature = await signPermit(walletClient, chainId, tokenAddress, permit, nonce);

            const intent: Intent = {
                refundBeneficiary: address,
                inputs: [{ token: tokenAddress, amount: value }],
                to: tronAddress as `0x${string}`,
                outputAmount: outputValue,
            };
            const order: Order = {
                originSettler: contractAddress,
                user: address,
                nonce,
                originChainId: chainId,
                openDeadline: BigInt(1828585485),
                fillDeadline: BigInt(1828585485),
                intent: intent,
            };
            const orderSignature = await signOrder(walletClient, chainId, contractAddress, order);
            const orderData = encodeIntent(intent);

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
                    value: inputAmount,
                    onChange: (e) => handleAmountChange(e.target.value),
                }}
                convertedAmountInputProps={{
                    placeholder: 'Converted amount',
                    value: inputConvertedAmount,
                    readOnly: true, // Marking it as read-only since it's calculated
                }}
            />
            <div className={styles.SwapArrowContainer}>
                <button className={styles.SwapArrow}>
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
                    placeholder: 'You receive amount',
                    value: outputAmount,
                    readOnly: true, // Marking it as read-only since it's calculated
                }}
                convertedAmountInputProps={{
                    placeholder: 'Converted amount',
                    value: outputConvertedAmount,
                    readOnly: true, // Marking it as read-only since it's calculated
                }}
            />
            <div className={styles.Gap} />
            <SwapFormInput
                inputProps={{
                    type: 'text',
                    placeholder: 'Tron address',
                    value: tronAddress,
                    autoComplete: 'off',
                    onChange: (e) => handleAddressChange(e.target.value),
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
