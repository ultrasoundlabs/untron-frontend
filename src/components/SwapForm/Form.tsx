import styles from './Form.module.scss';
import { ConnectKitButton } from 'connectkit';
import SwapFormItem from './Item';
import SwapFormInput from './Input';
import SwapFormLoadingSpinner from './LoadingSpinner';
import SwapFormSuccessModal from './SuccessModal';
import SwapFormErrorModal from './ErrorModal';
import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import axios from 'axios';
import { signOrder, signPermit } from '../../eip712/signer';
import { encodeIntent, getTokenNonce, getGaslessNonce, Intent, Order, Permit } from '../../utils/utils';
import bs58check from 'bs58check';
import { UserRejectedRequestError } from 'viem'; // Add this import to handle the error
import { configuration } from '../../config/config';
import { base } from 'viem/chains';

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
    const [userBalance, setUserBalance] = useState<number>(0); // User's balance in Base
    const [fees, setFees] = useState<{ flatFee: number; percentFee: number }>({ flatFee: 0.2, percentFee: 0.001 }); // Default fees
    const [insufficientFunds, setInsufficientFunds] = useState<boolean>(false); // Insufficient funds flag
    const [errorDecodingTronAddress, setErrorDecodingTronAddress] = useState<boolean>(false); // Error decoding Tron address flag
    const [exchangeRate, setExchangeRate] = useState<number>(1); // Exchange rate from USDC to USDT
    const [maxOutputSurpassed, setMaxOutputSurpassed] = useState<boolean>(false); // Max output amount surpassed flag

    // Fetch user balance (USDC on Base) when the component is mounted
    useEffect(() => {
        async function fetchBalance() {
            if (publicClient && address) {
                const balance = await publicClient.readContract({
                    address: configuration.contracts.base.usdc,
                    abi: [
                        {
                            constant: true,
                            inputs: [{ name: '_owner', type: 'address' }],
                            name: 'balanceOf',
                            outputs: [{ name: 'balance', type: 'uint256' }],
                            type: 'function',
                        },
                    ],
                    functionName: 'balanceOf',
                    args: [address],
                });
                setUserBalance(Number(balance) / 1e6); // Convert to USDC (assuming 6 decimals)
            }
        }
        fetchBalance();
    }, [publicClient, address]);

    // Fetch fees from the backend
    useEffect(() => {
        async function fetchFees() {
            try {
                const response = await axios.get(`${configuration.urls.backend}/intents/fees`); // Replace with your backend endpoint
                setFees({
                    flatFee: response.data.flatFee,
                    percentFee: response.data.percentFee,
                });
            } catch (error) {
                console.error('Failed to fetch fees:', error);
            }
        }
        fetchFees();
    }, []);

    // Fetch rates from the backend
    useEffect(() => {
        async function fetchRates() {
            try {
                const response = await axios.get(`${configuration.urls.backend}/intents/rates`, {
                    params: {
                        token: configuration.contracts.base.usdc,
                        chainId: base.id,
                    },
                });
                const rate = response.data.rate;
                if (rate) {
                    setExchangeRate(Number(rate));
                }
            } catch (error) {
                console.error('Failed to fetch rates:', error);
            }
        }
        fetchRates();
    }, []);

    const handleAddressChange = (address: string) => {
        setErrorDecodingTronAddress(false);
        setTronAddress(address);
    };

    const handleAmountChange = (amount: string) => {
        // Check if entered amount exceeds user's balance
        if (address && parseFloat(amount) > userBalance) {
            setInsufficientFunds(true);
            setOutputAmount('');
            setOutputConvertedAmount('');
            setInputAmount(amount);
            return;
        } else {
            setInsufficientFunds(false);
        }

        setInputAmount(amount);

        // If the input is empty or invalid, reset the converted and output amounts
        if (Number.isNaN(parseFloat(amount)) || amount === '') {
            setInputConvertedAmount('');
            setOutputAmount('');
            setOutputConvertedAmount('');
            return;
        }

        // Calculate input converted amount (rate * input amount) (assumes 1 USDC = 1 USD)
        const inputConverted = parseFloat(amount) * 1;
        setInputConvertedAmount(`$${inputConverted.toFixed(2)}`);

        // Handle inputs less than flat fee
        if (parseFloat(amount) <= fees.flatFee) {
            setOutputAmount('0.00');
            setOutputConvertedAmount('$0.00');
        } else {
            // Calculate output amount (input*rate - percentage fee - flat fee)
            const percentageFee = parseFloat(amount) * fees.percentFee;
            const output = parseFloat(amount) * exchangeRate - percentageFee - fees.flatFee;

            const MAX_USDT = 100; // Maximum output amount in USDT
            if (output > MAX_USDT) {
                setMaxOutputSurpassed(true);
                setOutputAmount('');
                setOutputConvertedAmount('');
                setInputAmount(amount);
                return;
            }

            setOutputAmount(output.toFixed(2));

            // Calculate output converted amount (rate * output amount) in USD (assumes 1 USDT = 1 USD)
            const outputConverted = output * 1;
            setOutputConvertedAmount(`$${outputConverted.toFixed(2)}`);
        }
    };

    const isSwapDisabled = !inputAmount || !tronAddress || insufficientFunds || maxOutputSurpassed; // Disable swap if no amount, no Tron address, or insufficient funds, or max output surpassed

    async function requestSwap() {
        if (isSwapping || !inputAmount || !outputAmount) return;
        if (!walletClient || !address) {
            console.error('Wallet not connected');
            return;
        }

        setIsSwapping(true);

        // Try to decode the Tron address
        let decodedTronAddress;
        try {
            decodedTronAddress = '0x' + Buffer.from(bs58check.decode(tronAddress)).toString('hex');
        } catch (error) {
            console.error('Invalid Tron address:', error);
            setErrorDecodingTronAddress(true);
            setIsSwapping(false);
            return;
        }

        try {
            const chainId = await walletClient.getChainId();
            // For this showcase only Base is supported
            if (chainId !== base.id) {
                // Give descriptive error message
                console.error('Unsupported chain:', chainId);
                setErrorMessage('Unsupported chain');
                return;
            }

            const tokenAddress = configuration.contracts.base.usdc;
            const contractAddress = configuration.contracts.base.untronIntents;
            const spender = contractAddress; // The contract is the spender
            const value = BigInt(Math.floor(parseFloat(inputAmount) * 1e6)); // Convert inputAmount to BigInt
            const outputValue = BigInt(Math.floor(parseFloat(outputAmount) * 1e6)); // Convert outputAmount to BigInt
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

            // Get the nonce
            const tokenNonce = await getTokenNonce(publicClient, chainId, tokenAddress, address);

            const permit: Permit = {
                owner: address,
                spender,
                value,
                nonce: tokenNonce,
                deadline,
            };
            const permitSignature = await signPermit(walletClient, chainId, tokenAddress, permit, tokenNonce);

            const gaslessNonce = await getGaslessNonce(publicClient, chainId, contractAddress, address);

            const intent: Intent = {
                refundBeneficiary: address,
                inputs: [{ token: tokenAddress, amount: value }],
                to: decodedTronAddress as `0x${string}`,
                outputAmount: outputValue,
            };
            const order: Order = {
                originSettler: contractAddress,
                user: address,
                nonce: gaslessNonce,
                originChainId: chainId,
                openDeadline: BigInt(Math.floor(Date.now() / 1000) + 600), // 10 minutes from now
                fillDeadline: BigInt(Math.floor(Date.now() / 1000) + 21600), // 6 hour from now
                intent: intent,
            };
            const orderSignature = await signOrder(walletClient, chainId, contractAddress, order);
            const orderData = encodeIntent(intent);

            const response = await axios.post(`${configuration.urls.backend}/intents/permitted-gasless-order`, {
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

            setTransaction({
                url: `https://basescan.org/tx/${response.data}`,
            });
        } catch (error: any) {
            console.error('Error during swap:', error);
            if (error instanceof UserRejectedRequestError) {
                setErrorMessage('Transaction was rejected by the user.');
            } else if (error instanceof axios.AxiosError) {
                setErrorMessage(`API error: ${error.response?.data?.message || error.message}`);
            } else if (error instanceof Error) {
                setErrorMessage(`Swap error: ${error.message}`);
            } else {
                setErrorMessage('An unexpected error occurred during the swap. Please try again.');
            }
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
                label="You send"
                amountInputProps={{
                    placeholder: '0',
                    value: inputAmount,
                    onChange: (e) => handleAmountChange(e.target.value),
                }}
                convertedAmountInputProps={{
                    placeholder: '$0.00',
                    value: inputConvertedAmount,
                    readOnly: true, // Marking it as read-only since it's calculated
                }}
                balance={userBalance.toFixed(2)} // Display user's balance
                iconSrc="images/usdcbase.png"
                insufficientFunds={insufficientFunds}
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
                label="You receive"
                amountInputProps={{
                    placeholder: '0',
                    value: outputAmount,
                    readOnly: true, // Marking it as read-only since it's calculated
                }}
                convertedAmountInputProps={{
                    placeholder: '$0',
                    value: outputConvertedAmount,
                    readOnly: true, // Marking it as read-only since it's calculated
                }}
                iconSrc="images/usdttron.png"
                balance="" // No balance for output
                maxOutputSurpassed={maxOutputSurpassed}
            />
            <div className={styles.Gap} />
            <SwapFormInput
                inputProps={{
                    type: 'text',
                    placeholder: 'Tron Address',
                    value: tronAddress,
                    autoComplete: 'off',
                    onChange: (e) => handleAddressChange(e.target.value),
                }}
            />
            {errorDecodingTronAddress && <p className={styles.Error}>Invalid Tron address</p>}
            <div className={styles.Gap} />
            <ConnectKitButton.Custom>
                {({ isConnected, isConnecting, show, address }) => (
                    <button
                        className={`${styles.Button} ${isSwapDisabled && isConnected ? styles.DisabledButton : ''}`}
                        disabled={isSwapDisabled && isConnected} // Only disable when swap conditions are not met
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
