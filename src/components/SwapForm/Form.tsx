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
//import { signPermit } from '../../eip712/signer';
import { callCompactUsdc, encodeSwapData, getTokenNonce } from '../../utils/utils';
import bs58check from 'bs58check';
import { UserRejectedRequestError } from 'viem';
import { configuration } from '../../config/config';
import {
    TokenInfo,
    NetworkInfo,
    Information,
    RateResponse,
    ErrorResponse,
} from '../../types/api';
import { AssetWithFees, ChainFees, AssetDisplayOption, Transaction } from '../../types';
import { TronWeb } from 'tronweb';
import { EventResponse } from 'tronweb/lib/esm/lib/event';

/**
 * Decodes a Tron base58check address (e.g. T....) into an EVM 0x address.
 * Tron addresses are 21 bytes where:
 *   - The first byte is always 0x41
 *   - The next 20 bytes are the keccak256-hash-based address (like Ethereum)
 */
function decodeTronBase58Address(tronAddress: string): `0x${string}` {
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

export default function SwapForm() {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient({
        account: address,
    });
    const publicClient = usePublicClient();
    const tronWeb = new TronWeb({
        fullHost: configuration.urls.tronRpcUrl,
    });

    const [isSwapping, setIsSwapping] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [inputAmount, setInputAmount] = useState<string>('');
    const [inputConvertedAmount, setInputConvertedAmount] = useState<string>('');
    const [outputAmount, setOutputAmount] = useState<string>('');
    const [outputConvertedAmount, setOutputConvertedAmount] = useState<string>('');
    const [tronAddress, setTronAddress] = useState<string>('');
    const [userBalance, setUserBalance] = useState<number>(0);
    const [fees, setFees] = useState<{ [key: string]: AssetWithFees }>({});
    const [currentChainFees, setCurrentChainFees] = useState<ChainFees>({
        flatFee: 0,
        percentFee: 0,
        contractAddress: '' as `0x${string}`,
        tokenAddress: '' as `0x${string}`,
        decimals: 6,
    });
    const [insufficientFunds, setInsufficientFunds] = useState<boolean>(false);
    const [errorDecodingTronAddress, setErrorDecodingTronAddress] = useState<boolean>(false);
    const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({});
    const [maxOutputAmount, setMaxOutputAmount] = useState<number>(100);
    const [maxOutputSurpassed, setMaxOutputSurpassed] = useState<boolean>(false);
    const [selectedInputAsset, setSelectedInputAsset] = useState<string>('');
    const [transaction, setTransaction] = useState<Transaction | undefined>(undefined);
    const [tronTransaction, setTronTransaction] = useState<Transaction | undefined>(undefined);
    const [baseTransactionTimestamp, setBaseTransactionTimestamp] = useState<number | undefined>(undefined);
    const [orderSignedTimestamp, setOrderSignedTimestamp] = useState<number | undefined>(undefined);

    // Fetch exchange rate when the token is selected
    useEffect(() => {
        async function fetchExchangeRate() {
            if (selectedInputAsset) {
                try {
                    const feeData = fees[selectedInputAsset];
                    if (feeData) {
                        const ratesResponse = await axios.get<RateResponse>(
                            `${configuration.urls.backend}/intents/rates`,
                            {
                                params: {
                                    token: feeData.tokenAddress,
                                    chain_id: feeData.chainId,
                                },
                            },
                        );
                        const rate = ratesResponse.data.rate;
                        setExchangeRates((prevRates) => ({
                            ...prevRates,
                            [selectedInputAsset]: Number(rate),
                        }));
                    }
                } catch (error) {
                    console.error('Failed to fetch exchange rate:', error);
                }
            }
        }
        fetchExchangeRate();
    }, [selectedInputAsset, fees]);

    // Fetch information from the backend
    useEffect(() => {
        async function fetchInformation() {
            try {
                const informationResponse = await axios.get<Information>(
                    `${configuration.urls.backend}/intents/information`,
                );
                const data = informationResponse.data;

                // Map tokens from supportedNetworks
                const mappedAssets = data.supportedNetworks.flatMap((network: NetworkInfo) =>
                    network.tokens.map(
                        (token: TokenInfo): AssetWithFees => ({
                            symbol: token.symbol,
                            network: network.network,
                            chainId: network.chainId,
                            contractAddress: network.contractAddress as `0x${string}`,
                            tokenAddress: token.tokenAddress as `0x${string}`,
                            decimals: token.decimals,
                            icon: `${configuration.urls.backend}/public/${network.chainId}-${token.tokenAddress.toLowerCase()}.png`,
                            flatFee: Number(token.flatFee),
                            percentFee: Number(token.percentFee),
                        }),
                    ),
                );

                if (mappedAssets.length > 0) {
                    const defaultAssetKey = `${mappedAssets[0].chainId}-${mappedAssets[0].tokenAddress.toLowerCase()}`;
                    setSelectedInputAsset(defaultAssetKey);
                }

                // Build fees map
                const networkFees: { [key: string]: AssetWithFees } = {};
                mappedAssets.forEach((asset) => {
                    const key = `${asset.chainId}-${asset.tokenAddress.toLowerCase()}`;
                    networkFees[key] = asset;
                });
                setFees(networkFees);

                const maxOutputAmount = data.maxOutputAmount;
                setMaxOutputAmount(maxOutputAmount);

                if (selectedInputAsset) {
                    const asset = networkFees[selectedInputAsset];
                    if (asset) {
                        setCurrentChainFees({
                            flatFee: asset.flatFee,
                            percentFee: asset.percentFee,
                            contractAddress: asset.contractAddress,
                            tokenAddress: asset.tokenAddress,
                            decimals: asset.decimals,
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch information:', error);
            }
        }
        fetchInformation();
    }, [selectedInputAsset]);

    // Fetch user balance
    useEffect(() => {
        async function fetchBalance() {
            if (publicClient && address && currentChainFees.tokenAddress) {
                const balance = await publicClient.readContract({
                    address: currentChainFees.tokenAddress,
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
                setUserBalance(Number(balance) / 10 ** currentChainFees.decimals); // Adjust based on token decimals
            }
        }
        fetchBalance();
    }, [publicClient, address, currentChainFees.tokenAddress]);

    const handleAddressChange = (address: string) => {
        setErrorDecodingTronAddress(false);
        setTronAddress(address);
    };

    const handleInputAmountChange = (value: string) => {
        setInputAmount(value);
        calculateOutputAmount(value);
    };

    const handleOutputAmountChange = (value: string) => {
        setOutputAmount(value);
        calculateInputAmount(value);
    };

    const calculateOutputAmount = (inputValue: string) => {
        if (!inputValue || parseFloat(inputValue) <= 0 || !selectedInputAsset) {
            setOutputAmount('');
            setOutputConvertedAmount('');
            return;
        }

        const input = parseFloat(inputValue);
        const assetRate = exchangeRates[selectedInputAsset] || 1;
        const inputConverted = input * assetRate;
        setInputConvertedAmount(`$${inputConverted.toFixed(2)}`);

        const feeData = fees[selectedInputAsset];
        if (!feeData) return;

        const percentageFee = Math.max(0.01, input * feeData.percentFee);
        const output = Math.floor((input - percentageFee - feeData.flatFee + Number.EPSILON) * 100) / 100;
        setOutputAmount(output.toFixed(2));

        const usdtUsdRate = 1; // Assuming USDT is pegged to USD
        const outputConverted = output * usdtUsdRate;
        setOutputConvertedAmount(`$${outputConverted.toFixed(2)}`);

        if (output > maxOutputAmount) {
            setMaxOutputSurpassed(true);
        } else {
            setMaxOutputSurpassed(false);
        }

        setInsufficientFunds(!!address && input > userBalance);
    };

    const calculateInputAmount = (outputValue: string) => {
        if (!outputValue || parseFloat(outputValue) <= 0 || !selectedInputAsset) {
            setInputAmount('');
            setInputConvertedAmount('');
            return;
        }

        const output = parseFloat(outputValue);
        const usdtUsdRate = 1; // Assuming USDT is pegged to USD
        const outputConverted = output * usdtUsdRate;
        setOutputConvertedAmount(`$${outputConverted.toFixed(2)}`);

        const feeData = fees[selectedInputAsset];
        if (!feeData) return;

        if (output > maxOutputAmount) {
            setMaxOutputSurpassed(true);
            setInputAmount('');
            setInputConvertedAmount('');
        } else {
            setMaxOutputSurpassed(false);
            const input = Math.ceil(((output + feeData.flatFee) / (1 - feeData.percentFee)) * 100) / 100;
            const percentageFee = Math.max(0.01, input * feeData.percentFee);
            const adjustedInput = Math.ceil((output + feeData.flatFee + percentageFee) * 100) / 100;
            setInputAmount(adjustedInput.toFixed(2));

            const assetRate = exchangeRates[selectedInputAsset] || 1;
            const inputConverted = adjustedInput * assetRate;
            setInputConvertedAmount(`$${inputConverted.toFixed(2)}`);

            setInsufficientFunds(!!address && adjustedInput > userBalance);
        }
    };

    const handleInputAssetChange = (key: string) => {
        setSelectedInputAsset(key);
        setInputAmount('');
        setInputConvertedAmount('');
        setOutputAmount('');
        setOutputConvertedAmount('');
        setExchangeRates({});
    };

    const isSwapDisabled = !inputAmount || !tronAddress || insufficientFunds || maxOutputSurpassed;

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
            decodedTronAddress = `0x41${decodeTronBase58Address(tronAddress).slice(2)}` as `0x${string}`;
        } catch (error) {
            console.error('Invalid Tron address:', error);
            setErrorDecodingTronAddress(true);
            setIsSwapping(false);
            return;
        }

        try {
            const feeData = fees[selectedInputAsset];
            if (!feeData) {
                setErrorMessage('Failed to retrieve fee data');
                setIsSwapping(false);
                return;
            }

            const chainId = feeData.chainId;

            // Switch chain if necessary
            const currentChainId = await walletClient.getChainId();
            if (currentChainId !== chainId) {
                try {
                    await walletClient.switchChain({ id: chainId });
                } catch (error) {
                    console.error('Failed to switch chain:', error);
                    setErrorMessage('Failed to switch chain');
                    setIsSwapping(false);
                    return;
                }
            }

            const tokenAddress = feeData.tokenAddress;
            const contractAddress = feeData.contractAddress;
            const spender = contractAddress;
            const decimals = feeData.decimals;
            const value = BigInt(Math.floor(parseFloat(inputAmount) * 10 ** decimals));
            const outputValue = BigInt(Math.floor(parseFloat(outputAmount) * 1e6)); // Assuming USDT has 6 decimals
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

            // Get the nonce
            const tokenNonce = await getTokenNonce(publicClient, chainId, tokenAddress, address);

            // TODO: Use when implementing gasless
            /*
            const permit: Permit = {
                owner: address,
                spender,
                amount: value,
                nonce: tokenNonce,
                deadline,
            };
            const permitSignature = await signPermit(walletClient, chainId, tokenAddress, permit, tokenNonce);
            const permitData = encodePermitData(permit, permitSignature);
            */
            const swapData = encodeSwapData(value.toString(), outputValue.toString(), decodedTronAddress);

            const signedTimestamp = Math.floor(Date.now() / 1000);
            setOrderSignedTimestamp(signedTimestamp);

            const transactionHash = await callCompactUsdc(swapData, walletClient, publicClient);

            // Handle successful response
            setErrorMessage(null);
            const baseTimestamp = Math.floor(Date.now() / 1000);
            setTransaction({
                url: `https://basescan.org/tx/${transactionHash}`,
                timestamp: baseTimestamp,
                orderSignedAt: signedTimestamp,
            });
            setBaseTransactionTimestamp(baseTimestamp);

            if (!configuration.contracts.usdtTronAddress) {
                console.error('USDT-TRON contract address is not set');
                throw new Error('USDT-TRON contract address is not set');
            }

            // To set Tron Transaction we poll the API and when we have a result we set the tron transaction
            pollTronTransaction({
                contractAddress: configuration.contracts.usdtTronAddress,
                to: tronAddress,
                amount: outputValue.toString(),
            });
        } catch (error: any) {
            console.error('Error during swap:', error);
            if (error instanceof UserRejectedRequestError) {
                setErrorMessage('Transaction was rejected by the user.');
            } else if (axios.isAxiosError(error)) {
                const errorResponse = error.response?.data as ErrorResponse;
                setErrorMessage(`API error: ${errorResponse?.error || error.message}`);
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

    function clearSuccess() {
        setTransaction(undefined);
        setTronTransaction(undefined);
        setBaseTransactionTimestamp(undefined);
        setOrderSignedTimestamp(undefined);
    }

    async function pollTronTransaction(options: {
        contractAddress: string;
        to: string; // This is the Tron T... address from the user
        amount: string;
    }) {
        // TODO: When backend sourced, poll the API for the Tron transaction
        //       For now, we listen directly to the Tron blockchain
        (async () => {
            try {
                const contractAddress = options.contractAddress;

                const timeout = setTimeout(() => {
                    console.log('Timeout reached. Stopping event polling.');
                    clearInterval(pollingInterval);
                }, 60000); // 60 seconds timeout

                // Convert user-supplied T... address into 0x... format
                // so we can do a direct match with the event result
                let evmTo: string;
                try {
                    evmTo = decodeTronBase58Address(options.to).toLowerCase();
                } catch (err) {
                    console.error('Error decoding Tron address:', err);
                    clearTimeout(timeout);
                    return;
                }

                const pollingInterval = setInterval(async () => {
                    try {
                        const events: EventResponse = await tronWeb.getEventResult(contractAddress, {
                            eventName: 'Transfer', // Event name to listen to
                        });

                        console.log('Poll');
                        console.log(events);
                        const eventData = events.data?.map((eventData) => ({
                            to: eventData.result.to,
                            value: eventData.result.value,
                            transactionHash: eventData.transaction_id,
                            blockTimestamp: eventData.block_timestamp,
                        }));

                        if (!eventData || eventData.length === 0) return;

                        // Compare 'to' from the event to the EVM version of the Tron address
                        for (const { to, value, transactionHash, blockTimestamp } of eventData) {
                            if (to.toLowerCase() === evmTo.toLowerCase() && value === options.amount) {
                                console.log('Transaction detected!');

                                // Calculate time difference if we have both timestamps
                                if (baseTransactionTimestamp) {
                                    // blockTimestamp is in milliseconds, convert baseTransactionTimestamp to ms
                                    const timeDiffSeconds = Math.floor(
                                        (blockTimestamp - baseTransactionTimestamp * 1000) / 1000,
                                    );
                                    console.log(`Time between Base and Tron transactions: ${timeDiffSeconds} seconds`);
                                }

                                setTronTransaction({
                                    url: `https://tronscan.org/#/transaction/${transactionHash}`,
                                    timestamp: Math.floor(blockTimestamp / 1000),
                                    orderSignedAt: transaction?.orderSignedAt,
                                });
                                clearInterval(pollingInterval);
                                clearTimeout(timeout);
                            }
                        }
                    } catch (err) {
                        console.error('Error fetching events:', err);
                    }
                }, 3000); // Poll every 3 seconds (so in total 20 times)

                console.log('Listening for Transfer events...');
            } catch (error) {
                console.error('Error setting up event polling:', error);
            }
        })();
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
                iconSrc={fees[selectedInputAsset]?.icon}
                insufficientFunds={insufficientFunds}
                assetOptions={Object.keys(fees).map(
                    (key): AssetDisplayOption => ({
                        key,
                        symbol: fees[key].symbol,
                        icon: fees[key].icon,
                    }),
                )}
                selectedAssetKey={selectedInputAsset}
                onAssetChange={handleInputAssetChange}
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
                assetOptions={[
                    {
                        key: 'USDT-TRON',
                        symbol: 'USDT',
                        icon: 'images/usdttron.png',
                    },
                ]}
                selectedAssetKey="USDT-TRON"
                onAssetChange={() => {}} // Output asset is fixed for now
                disableAssetSelection={true}
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
            {/* Development only button - remove in production
            {process.env.NODE_ENV === 'development' && (
                <button
                    className={styles.Button}
                    onClick={() => {
                        const now = Math.floor(Date.now() / 1000);
                        const orderSignedAt = now - 10; // 10 seconds ago
                        const baseTimestamp = now - 5; // 5 seconds ago
                        
                        // Show initial success modal with just the Base transaction
                        setTransaction({
                            url: 'https://basescan.org/tx/0x123...', 
                            timestamp: baseTimestamp,
                            orderSignedAt: orderSignedAt
                        });
                        // Simulate Tron transaction landing after 3 seconds
                        setTimeout(() => {
                            const tronLandingTime = Math.floor(Date.now() / 1000);
                            setTronTransaction({
                                url: 'https://tronscan.org/#/transaction/0x456...',
                                timestamp: tronLandingTime,
                                orderSignedAt: orderSignedAt
                            });
                        }, 3000);
                    }}
                >
                    [DEV] Show Success Modal
                </button>
            )} */}
            <p className={`${styles.Info} ${styles.SmallInfo}`}>Swaps from Tron coming soon</p>
            <SwapFormErrorModal error={errorMessage} onClose={() => clearErrorMessage()} />
            <SwapFormSuccessModal
                transaction={transaction}
                tronTransaction={tronTransaction}
                onClose={() => clearSuccess()}
            />
        </div>
    );
}
