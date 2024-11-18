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
import { getTokenNonce, Intent, Order, Permit } from '../../utils/utils';
import bs58check from 'bs58check';
import { UserRejectedRequestError } from 'viem';
import { configuration } from '../../config/config';
import { base } from 'viem/chains';

export default function SwapForm() {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient({
        account: address,
    });
    const publicClient = usePublicClient();

    const [isSwapping, setIsSwapping] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [inputAmount, setInputAmount] = useState<string>('');
    const [inputConvertedAmount, setInputConvertedAmount] = useState<string>('');
    const [outputAmount, setOutputAmount] = useState<string>('');
    const [outputConvertedAmount, setOutputConvertedAmount] = useState<string>('');
    const [tronAddress, setTronAddress] = useState<string>('');
    const [userBalance, setUserBalance] = useState<number>(0);
    const [fees, setFees] = useState<{
        [chainId: number]: { symbol: string; network: string; chainId: number; flatFee: number; percentFee: number };
    }>({});
    const [currentChainFees, setCurrentChainFees] = useState<{ flatFee: number; percentFee: number }>({
        flatFee: 0,
        percentFee: 0,
    });
    const [insufficientFunds, setInsufficientFunds] = useState<boolean>(false);
    const [errorDecodingTronAddress, setErrorDecodingTronAddress] = useState<boolean>(false);
    const [exchangeRate, setExchangeRate] = useState<number>(0);
    const [maxOutputAmount, setMaxOutputAmount] = useState<number>(100);
    const [maxOutputSurpassed, setMaxOutputSurpassed] = useState<boolean>(false);
    const [enabledAssets, setEnabledAssets] = useState<
        Array<{
            symbol: string;
            network: string;
            chainId: number;
            tokenAddress: `0x${string}`;
            decimals: number;
            icon: string;
        }>
    >([]);

    // Fetch enabled assets and rates for each asset
    useEffect(() => {
        async function fetchInitialData() {
            try {
                const assetsResponse = await axios.get(`${configuration.urls.backend}/intents/assets`);
                setEnabledAssets(assetsResponse.data);

                const ratesResponse = await axios.get(`${configuration.urls.backend}/intents/rates`);
                // Assuming the rate for USDC on Base is in the response
                const usdcBaseRate = ratesResponse.data.find(
                    (rate: any) =>
                        rate.fromToken.chainId === base.id &&
                        rate.fromToken.tokenAddress.toLowerCase() ===
                            configuration.contracts.base.usdc.toLowerCase()
                );
                setExchangeRate(usdcBaseRate ? Number(usdcBaseRate.rate) : 1);
            } catch (error) {
                console.error('Failed to fetch enabled assets or rates:', error);
                // Set default asset and rate in case BE fails
                setEnabledAssets([
                    {
                        symbol: 'USDC',
                        network: 'Base',
                        chainId: base.id,
                        tokenAddress: configuration.contracts.base.usdc,
                        decimals: 6,
                        icon: 'images/usdcbase.png',
                    },
                ]);
                setExchangeRate(1);
            }
        }
        fetchInitialData();
    }, []);

    // Fetch user balance
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
                const informationResponse = await axios.get(`${configuration.urls.backend}/intents/information`);
                const networkFees = informationResponse.data.fees.reduce((acc: any, fee: any) => {
                    acc[fee.chainId] = {
                        symbol: fee.symbol,
                        network: fee.network,
                        chainId: fee.chainId,
                        flatFee: Number(fee.flatFee),
                        percentFee: Number(fee.percentFee),
                    };
                    return acc;
                }, {});
                setFees(networkFees);

                if (walletClient) {
                    const chainId = await walletClient.getChainId();
                    setCurrentChainFees({
                        flatFee: networkFees[chainId]?.flatFee || 0,
                        percentFee: networkFees[chainId]?.percentFee || 0,
                    });
                }

                setMaxOutputAmount(informationResponse.data.maxOutputAmount);
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
        const usdcUsdRate = 1; // Assuming USDC is pegged to USD
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
                const usdtToUsdRate = 1; // Assuming USDT is pegged to USD
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
        const usdtToUsdRate = 1; // Assuming USDT is pegged to USD
        const outputConverted = output * usdtToUsdRate;
        setOutputConvertedAmount(`$${outputConverted.toFixed(2)}`);

        if (output > maxOutputAmount) {
            setMaxOutputSurpassed(true);
            setInputAmount('');
            setInputConvertedAmount('');
        } else {
            setMaxOutputSurpassed(false);
            const input = Math.ceil(((output + currentChainFees.flatFee) / (1 - currentChainFees.percentFee)) * 100) / 100;
            const percentageFee = Math.max(0.01, input * currentChainFees.percentFee);
            const adjustedInput =
                Math.ceil((output + currentChainFees.flatFee + percentageFee) * 100) / 100;
            setInputAmount(adjustedInput.toFixed(2));
            const usdcUsdRate = 1; // Assuming USDC is pegged to USD
            const inputConverted = adjustedInput * usdcUsdRate;
            setInputConvertedAmount(`$${inputConverted.toFixed(2)}`);
            setInsufficientFunds(!!address && adjustedInput > userBalance);
        }
    };

    const isSwapDisabled =
        !inputAmount || !tronAddress || insufficientFunds || maxOutputSurpassed || exchangeRate === 0;

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
            decodedTronAddress = '0x' + Buffer.from(bs58check.decode(tronAddress)).toString('hex').slice(2);
        } catch (error) {
            console.error('Invalid Tron address:', error);
            setErrorDecodingTronAddress(true);
            setIsSwapping(false);
            return;
        }

        try {
            const chainId = await walletClient.getChainId();
            if (chainId !== base.id) {
                try {
                    await walletClient.switchChain({ id: base.id });
                } catch (error) {
                    console.error('Failed to switch chain:', error);
                    setErrorMessage('Failed to switch chain');
                    setIsSwapping(false);
                    return;
                }
            }

            const tokenAddress = configuration.contracts.base.usdc;
            const contractAddress = configuration.contracts.base.untronIntents;
            const spender = contractAddress;
            const value = BigInt(Math.floor(parseFloat(inputAmount) * 1e6));
            const outputValue = BigInt(Math.floor(parseFloat(outputAmount) * 1e6));
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

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

            const gaslessNonce = await getTokenNonce(publicClient, chainId, contractAddress, address);

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
                fillDeadline: BigInt(Math.floor(Date.now() / 1000) + 21600), // 6 hours from now
                intent: intent,
            };
            const orderSignature = await signOrder(walletClient, chainId, contractAddress, order);

            await axios.post(`${configuration.urls.backend}/intents/swap`, {
                userAddress: address,
                chainId: chainId,
                tokenAddress: tokenAddress,
                amount: inputAmount,
                toTronAddress: tronAddress,
                nonce: order.nonce.toString(),
                signature: orderSignature,
                permit: {
                    deadline: permit.deadline.toString(),
                    v: permitSignature.v,
                    r: permitSignature.r,
                    s: permitSignature.s,
                },
            });

            // Swap completed successfully
            setErrorMessage(null);
            // Optionally, you can display a success message or update the UI accordingly
        } catch (error: any) {
            console.error('Error during swap:', error);
            if (error instanceof UserRejectedRequestError) {
                setErrorMessage('Transaction was rejected by the user.');
            } else if (axios.isAxiosError(error)) {
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
            <SwapFormErrorModal error={errorMessage} onClose={() => clearErrorMessage()} />
        </div>
    );
}
