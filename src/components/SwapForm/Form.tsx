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
import { getGaslessNonce, getTokenNonce, Intent, GaslessCrossChainOrder, Permit } from '../../utils/utils';
import bs58check from 'bs58check';
import { UserRejectedRequestError } from 'viem';
import { configuration } from '../../config/config';

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
        [key: string]: {
            symbol: string;
            network: string;
            chainId: number;
            flatFee: number;
            percentFee: number;
            contractAddress: `0x${string}`;
            tokenAddress: `0x${string}`;
            decimals: number;
            icon: string;
        };
    }>({});
    const [currentChainFees, setCurrentChainFees] = useState<{
        flatFee: number;
        percentFee: number;
        contractAddress: `0x${string}`;
        tokenAddress: `0x${string}`;
        decimals: number;
    }>({
        flatFee: 0,
        percentFee: 0,
        contractAddress: '' as `0x${string}`,
        tokenAddress: '' as `0x${string}`,
        decimals: 6,
    });
    const [insufficientFunds, setInsufficientFunds] = useState<boolean>(false);
    const [errorDecodingTronAddress, setErrorDecodingTronAddress] = useState<boolean>(false);
    const [exchangeRates, setExchangeRates] = useState<{
        [key: string]: number;
    }>({});
    const [maxOutputAmount, setMaxOutputAmount] = useState<number>(100);
    const [maxOutputSurpassed, setMaxOutputSurpassed] = useState<boolean>(false);
    const [enabledAssets, setEnabledAssets] = useState<
        Array<{
            symbol: string;
            network: string;
            chainId: number;
            contractAddress: `0x${string}`;
            tokenAddress: `0x${string}`;
            decimals: number;
            icon: string;
            flatFee: number;
            percentFee: number;
        }>
    >([]);
    const [selectedInputAsset, setSelectedInputAsset] = useState<string>('');

    // Fetch information from the backend
    useEffect(() => {
        async function fetchInformation() {
            try {
                const informationResponse = await axios.get(`${configuration.urls.backend}/intents/information`);
                const data = informationResponse.data;

                // Map tokens from supportedNetworks
                const mappedAssets = data.supportedNetworks.flatMap((network: any) =>
                    network.tokens.map((token: any) => ({
                        key: `${network.chainId}-${token.tokenAddress.toLowerCase()}`,
                        symbol: token.symbol,
                        icon: `${configuration.urls.backend}/public/${network.chainId}-${token.tokenAddress.toLowerCase()}.png`,
                        network: network.network,
                        chainId: network.chainId,
                        contractAddress: network.contractAddress,
                        tokenAddress: token.tokenAddress,
                        decimals: token.decimals,
                        flatFee: Number(token.flatFee),
                        percentFee: Number(token.percentFee),
                    }))
                );
                setEnabledAssets(mappedAssets);

                if (mappedAssets.length > 0) {
                    const defaultAssetKey = `${mappedAssets[0].chainId}-${mappedAssets[0].tokenAddress.toLowerCase()}`;
                    setSelectedInputAsset(defaultAssetKey);
                }

                // Build fees map
                const networkFees: {
                    [key: string]: {
                        symbol: string;
                        network: string;
                        chainId: number;
                        flatFee: number;
                        percentFee: number;
                        contractAddress: `0x${string}`;
                        tokenAddress: `0x${string}`;
                        decimals: number;
                        icon: string;
                    };
                } = {};
                mappedAssets.forEach((asset: {
                    symbol: string;
                    network: string;
                    chainId: number;
                    contractAddress: `0x${string}`;
                    tokenAddress: `0x${string}`;
                    decimals: number;
                    icon: string;
                    flatFee: number;
                    percentFee: number;
                }) => {
                    const key = `${asset.chainId}-${asset.tokenAddress.toLowerCase()}`;
                    networkFees[key] = {
                        symbol: asset.symbol,
                        network: asset.network,
                        chainId: asset.chainId,
                        flatFee: asset.flatFee,
                        percentFee: asset.percentFee,
                        contractAddress: asset.contractAddress as `0x${string}`,
                        tokenAddress: asset.tokenAddress as `0x${string}`,
                        decimals: asset.decimals,
                        icon: asset.icon,
                    };
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

    // Fetch exchange rate when the token is selected
    useEffect(() => {
        async function fetchExchangeRate() {
            if (selectedInputAsset) {
                try {
                    const feeData = fees[selectedInputAsset];
                    if (feeData) {
                        const tokenAddress = feeData.tokenAddress;
                        const ratesResponse = await axios.get(
                            `${configuration.urls.backend}/intents/rates?token=${tokenAddress}`
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
        const output =
            Math.floor((input - percentageFee - feeData.flatFee + Number.EPSILON) * 100) / 100;
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
            const input =
                Math.ceil(((output + feeData.flatFee) / (1 - feeData.percentFee)) * 100) / 100;
            const percentageFee = Math.max(0.01, input * feeData.percentFee);
            const adjustedInput =
                Math.ceil((output + feeData.flatFee + percentageFee) * 100) / 100;
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

    const isSwapDisabled =
        !inputAmount || !tronAddress || insufficientFunds || maxOutputSurpassed;

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
            console.log(publicClient, chainId, tokenAddress, address);

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
            const order: GaslessCrossChainOrder = {
                originSettler: contractAddress,
                user: address,
                nonce: gaslessNonce,
                originChainId: chainId,
                openDeadline: BigInt(Math.floor(Date.now() / 1000) + 600), // 10 minutes from now
                fillDeadline: BigInt(Math.floor(Date.now() / 1000) + 21600), // 6 hours from now
                intent: intent,
            };
            console.log(order);
            const orderSignature = await signOrder(walletClient, publicClient, chainId, contractAddress, order);

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
                openDeadline: order.openDeadline.toString(),
                fillDeadline: order.fillDeadline.toString(),
                intent: {
                    refundBeneficiary: intent.refundBeneficiary,
                    inputs: intent.inputs.map((input: { token: `0x${string}`; amount: bigint }) => ({
                        token: input.token,
                        amount: input.amount.toString()
                    })),
                    to: intent.to,
                    outputAmount: intent.outputAmount.toString(),
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
                iconSrc={fees[selectedInputAsset]?.icon}
                insufficientFunds={insufficientFunds}
                assetOptions={Object.keys(fees).map((key) => ({
                    key,
                    symbol: fees[key].symbol,
                    icon: fees[key].icon,
                }))}
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
                selectedAssetKey='USDT-TRON'
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
                        className={`${styles.Button} ${
                            isSwapDisabled && isConnected ? styles.DisabledButton : ''
                        }`}
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
