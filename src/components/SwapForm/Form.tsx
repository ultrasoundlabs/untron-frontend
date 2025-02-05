import styles from './Form.module.scss';
import { ConnectKitButton } from 'connectkit';
import SwapFormItem from './Item';
import SwapFormInput from './Input';
import SwapFormLoadingSpinner from './LoadingSpinner';
import SwapFormSuccessModal from './SuccessModal';
import SwapFormErrorModal from './ErrorModal';
import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useChainId } from 'wagmi';
import { configuration } from '../../config/config';
import { useSwap } from '../../hooks/useSwap';
import { decodeTronBase58Address, pollTronTransaction } from '../../utils/tron';
import { TronWeb } from 'tronweb';
import { Transaction } from '../../types';

function getTokenConfig(selectedKey: string) {
    const [chainIdStr, tokenAddress] = selectedKey.split('-');
    const chainId = Number(chainIdStr);
    const chain = configuration.chains.find(c => c.chainId === chainId);
    if (!chain) throw new Error('Chain not found');
    const tokenConfig = chain.tokens.find(token => token.tokenAddress.toLowerCase() === tokenAddress.toLowerCase());
    if (!tokenConfig) throw new Error('Token config not found');
    return tokenConfig;
}

export default function SwapForm() {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const chainId = useChainId();
    const tronWeb = new TronWeb({
        fullHost: configuration.urls.tronRpcUrl,
    });

    const [tronAddress, setTronAddress] = useState<string>('');
    const [userBalance, setUserBalance] = useState<number>(0);
    const [errorDecodingTronAddress, setErrorDecodingTronAddress] = useState<boolean>(false);
    const [selectedInputAsset, setSelectedInputAsset] = useState<string>('');
    const [tronTransaction, setTronTransaction] = useState<Transaction | undefined>(undefined);

    // Initialize the first available token as the default when chain changes
    useEffect(() => {
        const currentChain = configuration.chains.find(c => c.chainId === chainId);
        if (currentChain && currentChain.tokens.length > 0) {
            const firstToken = currentChain.tokens[0];
            setSelectedInputAsset(`${currentChain.chainId}-${firstToken.tokenAddress.toLowerCase()}`);
        }
    }, [chainId]);

    // Fetch user balance
    useEffect(() => {
        async function fetchBalance() {
            if (publicClient && address && selectedInputAsset) {
                try {
                    const tokenConfig = getTokenConfig(selectedInputAsset);
                    const balance = await publicClient.readContract({
                        address: tokenConfig.tokenAddress,
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
                    setUserBalance(Number(balance) / 10 ** tokenConfig.decimals);
                } catch (error) {
                    console.error('Error fetching balance:', error);
                    setUserBalance(0);
                }
            }
        }
        fetchBalance();
    }, [publicClient, address, selectedInputAsset]);

    // Try to decode the Tron address
    let decodedTronAddress: `0x${string}` | undefined;
    try {
        if (tronAddress) {
            decodedTronAddress = decodeTronBase58Address(tronAddress);
            if (errorDecodingTronAddress) setErrorDecodingTronAddress(false);
        }
    } catch (error) {
        console.error('Invalid Tron address:', error);
        setErrorDecodingTronAddress(true);
    }

    const {
        state: {
            isSwapping,
            errorMessage,
            inputAmount,
            inputConvertedAmount,
            outputAmount,
            outputConvertedAmount,
            insufficientFunds,
            maxOutputSurpassed,
            transaction,
            baseTransactionTimestamp,
        },
        handleInputAmountChange,
        handleOutputAmountChange,
        requestSwap,
        clearErrorMessage,
        clearSuccess,
    } = useSwap(
        selectedInputAsset,
        userBalance,
        100, // maxOutputAmount
        decodedTronAddress || '0x0',
        tronAddress,
    );

    const handleAddressChange = (address: string) => {
        setErrorDecodingTronAddress(false);
        setTronAddress(address);
    };

    const handleInputAssetChange = (key: string) => {
        setSelectedInputAsset(key);
    };

    const handleSwap = async () => {
        try {
            const pollOptions = await requestSwap();
            const usdtTronAddress = configuration.contracts.usdtTronAddress;
            if (pollOptions && usdtTronAddress) {
                pollTronTransaction(tronWeb, {
                    ...pollOptions,
                    contractAddress: usdtTronAddress,
                    onSuccess: (transactionHash, blockTimestamp) => {
                                if (baseTransactionTimestamp) {
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
                    },
                });
            }
        } catch (error) {
            // Error is already handled in useSwap
        }
    };

    const isSwapDisabled = !inputAmount || !tronAddress || insufficientFunds || maxOutputSurpassed;

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
                iconSrc={selectedInputAsset ? getTokenConfig(selectedInputAsset).iconPath : 'images/placeholder.png'}
                insufficientFunds={insufficientFunds}
                assetOptions={
                    configuration.chains
                        .filter(chain => chain.chainId === chainId)
                        .flatMap(chain =>
                            chain.tokens.map(token => ({
                                key: `${chain.chainId}-${token.tokenAddress.toLowerCase()}`,
                                symbol: token.symbol,
                                icon: token.iconPath,
                            }))
                        )
                }
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
                                handleSwap();
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
            <SwapFormErrorModal 
                error={errorMessage} 
                onClose={() => clearErrorMessage()} 
            />
            <SwapFormSuccessModal
                transaction={transaction}
                tronTransaction={tronTransaction}
                onClose={() => clearSuccess()}
            />
        </div>
    );
}
