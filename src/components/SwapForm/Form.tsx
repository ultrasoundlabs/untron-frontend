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
import { getTokenNonce, getGaslessNonce, Intent, Order, Permit } from '../../utils/utils';
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
    // TODO: If we want to avoid fetching fees for each chain, we can store them and then when switching chains we just get the fees from the stored object
    const [fees, setFees] = useState<{ [chainId: string]: { name: string; chainId: number; flatFee: number; percentFee: number } }>({}); // Fees
    const [currentChainFees, setCurrentChainFees] = useState<{ flatFee: number; percentFee: number }>({ flatFee: 0, percentFee: 0 }); // Current chain fees
    const [insufficientFunds, setInsufficientFunds] = useState<boolean>(false); // Insufficient funds flag
    const [errorDecodingTronAddress, setErrorDecodingTronAddress] = useState<boolean>(false); // Error decoding Tron address flag
    const [exchangeRate, setExchangeRate] = useState<number>(0); // Exchange rate from origin to USDT
    const [maxOutputAmount, setMaxOutputAmount] = useState<number>(100); // Maximum output amount, default 100 USDT
    const [maxOutputSurpassed, setMaxOutputSurpassed] = useState<boolean>(false); // Max output amount surpassed flag
    // TODO: We can use this later to enable frontend to switch between input assets
    const [enabledAssets, setEnabledAssets] = useState<string[]>([]); // Enabled assets

    // Fetch enabled assets and rates for each asset
    useEffect(() => {
        async function fetchInitialData() {
            try {
                const response = await axios.get(`${configuration.urls.backend}/intents/assets`);
                setEnabledAssets(response.data.map((asset: any) => asset.assetId));
            } catch (error) {
                console.error('Failed to fetch enbled assets:', error);
                // Set default asset USDC-BASE in case BE fails
                setEnabledAssets(['USDC-BASE']);
            }

            // TODO: When BE supports, get all rates in one call OR alternatively
            // Fetch when user selects another asset
            try {
                const response = await axios.get(`${configuration.urls.backend}/rates`, {
                    params: {
                        assetId: 'USDC-BASE',
                    },
                });
                // TODO: Define exchange rate as a map [input] -> [output]
                setExchangeRate(Number(response.data[0].rate));
                // Set the rate for the asset
            } catch (error) {
                console.error('Failed to fetch rate for asset:', error);
                // Set the rate to 1 for the asset by default in case BE fails
                setExchangeRate(1);
            }
        }
        fetchInitialData();
    }, [publicClient]);

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

    // Fetch information from the backend
    useEffect(() => {
        async function fetchInformation() {
            try {
                const response = await axios.get(`${configuration.urls.backend}/intents/information`); // Replace with your backend endpoint
                const networkFees = response.data.fees.reduce((acc: any, fee: any) => {
                    acc[fee.chainId] = {
                        name: fee.network,
                        chainId: fee.chainId,
                        flatFee: Number(fee.flatFee),
                        percentFee: Number(fee.pctFee),
                    };
                    return acc;
                }, {});
                setFees(networkFees);

                console.log(walletClient);
                const chainId = await walletClient!.getChainId();
                console.log(chainId);
                console.log(networkFees);
                setCurrentChainFees({
                    flatFee: networkFees[chainId].flatFee,
                    percentFee: networkFees[chainId].percentFee,
                });
                setMaxOutputAmount(response.data.maxOutputAmount);
            } catch (error) {
                console.error('Failed to fetch information:', error);
            }
        }
        fetchInformation();
    }, [walletClient]);

    const handleAddressChange = (address: string) => {
        setErrorDecodingTronAddress(false);
        setTronAddress(address);
    };

    const handleInputAmountChange = (amount: string) => {
        setInputAmount(amount);
        calculateOutputAmount(amount);
    };

    const handleOutputAmountChange = (amount: string) => {
        setOutputAmount(amount);
        calculateInputAmount(amount);
    };

    const calculateOutputAmount = (inputAmount: string) => {
        if (Number.isNaN(parseFloat(inputAmount)) || inputAmount === '') {
            setInputConvertedAmount('');
            setOutputAmount('');
            setOutputConvertedAmount('');
            return;
        }

        const input = parseFloat(inputAmount);
        const usdcUsdRate = 1; // TODO: Fetch this rate from the backend
        const inputConverted = input * usdcUsdRate;
        setInputConvertedAmount(`$${inputConverted.toFixed(2)}`);

        if (input <= currentChainFees.flatFee) {
            setOutputAmount('0.00');
            setOutputConvertedAmount('$0.00');
        } else {
            const percentageFee = Math.max(0.01, input * currentChainFees.percentFee);
            const output = Math.max(0, input * exchangeRate - percentageFee - currentChainFees.flatFee);

            if (output > maxOutputAmount) {
                setMaxOutputSurpassed(true);
                setOutputAmount('');
                setOutputConvertedAmount('');
            } else {
                setMaxOutputSurpassed(false);
                setOutputAmount(output.toFixed(2));
                const usdtToUsdRate = 1; // TODO: Fetch this rate from the backend
                const outputConverted = output * usdtToUsdRate;
                setOutputConvertedAmount(`$${outputConverted.toFixed(2)}`);
            }
        }

        setInsufficientFunds(!!address && input > userBalance);
    };

    const calculateInputAmount = (outputAmount: string) => {
        if (Number.isNaN(parseFloat(outputAmount)) || outputAmount === '') {
            setInputAmount('');
            setInputConvertedAmount('');
            setOutputConvertedAmount('');
            return;
        }

        const output = parseFloat(outputAmount);
        const usdtToUsdRate = 1; // TODO: Fetch this rate from the backend
        const outputConverted = output * usdtToUsdRate;
        setOutputConvertedAmount(`$${outputConverted.toFixed(2)}`);

        if (output > maxOutputAmount) {
            setMaxOutputSurpassed(true);
            setInputAmount('');
            setInputConvertedAmount('');
        } else {
            setMaxOutputSurpassed(false);
            // Calculate input amount and round up
            const input = Math.ceil(((output + currentChainFees.flatFee) / (1 - currentChainFees.percentFee)) * 100) / 100;
            const percentageFee = Math.max(0.01, input * currentChainFees.percentFee);
            const adjustedInput = Math.ceil((output + currentChainFees.flatFee + percentageFee) * 100) / 100;
            setInputAmount(adjustedInput.toFixed(2));
            const usdcUsdRate = 1; // TODO: Fetch this rate from the backend
            const inputConverted = adjustedInput * usdcUsdRate;
            setInputConvertedAmount(`$${inputConverted.toFixed(2)}`);
            setInsufficientFunds(!!address && adjustedInput > userBalance);
        }
    };

    const isSwapDisabled =
        !inputAmount || !tronAddress || insufficientFunds || maxOutputSurpassed || exchangeRate === 0; // Disable swap if no amount, no Tron address, or insufficient funds, or max output surpassed

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
                try {
                    await walletClient.switchChain({ id: base.id });
                } catch (error) {
                    console.error('Failed to switch chain:', error);
                    setErrorMessage('Failed to switch chain');
                    return;
                }
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

            const response = await axios.post(`${configuration.urls.backend}/intents/permitted-gasless-order`, {
                user: address,
                openDeadline: order.openDeadline.toString(),
                fillDeadline: order.fillDeadline.toString(),
                nonce: order.nonce.toString(),
                intent: {
                    refundBeneficiary: intent.refundBeneficiary,
                    inputs: intent.inputs.map((input) => ({
                        token: input.token,
                        amount: input.amount.toString(),
                    })),
                    to: intent.to,
                    outputAmount: intent.outputAmount.toString(),
                },
                signature: orderSignature,
                chainId: chainId,
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
                    placeholder: userBalance.toFixed(2),
                    value: inputAmount,
                    onChange: (e) => handleInputAmountChange(e.target.value),
                }}
                convertedAmountInputProps={{
                    placeholder: '$0.00',
                    value: inputConvertedAmount,
                    readOnly: true,
                }}
                balance={userBalance.toFixed(2)}
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
                    onChange: (e) => handleOutputAmountChange(e.target.value),
                }}
                convertedAmountInputProps={{
                    placeholder: '$0.00',
                    value: outputConvertedAmount,
                    readOnly: true,
                }}
                iconSrc="images/usdttron.png"
                balance=""
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
                        disabled={isSwapDisabled && isConnected}
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
            <p className={`${styles.Info} ${styles.SmallInfo}`}>Swaps from Tron coming soon</p>
            <SwapFormSuccessModal transaction={transaction} onClose={() => clearTransaction()} />
            <SwapFormErrorModal error={errorMessage} onClose={() => clearErrorMessage()} />
        </div>
    );
}
