import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { UserRejectedRequestError } from 'viem';
import { configuration } from '../config/config';
import { TokenConfig } from '../config/chains';
import { Transaction } from '../types';
import { callCompactUsdc, encodeSwapData } from '../utils/utils';
import { calculateInputAmount, calculateOutputAmount } from '../utils/calculator';

export interface SwapState {
    isSwapping: boolean;
    errorMessage: string | null;
    inputAmount: string;
    inputConvertedAmount: string;
    outputAmount: string;
    outputConvertedAmount: string;
    insufficientFunds: boolean;
    maxOutputSurpassed: boolean;
    transaction: Transaction | undefined;
    baseTransactionTimestamp: number | undefined;
}

export function useSwap(
    selectedInputAsset: string,
    userBalance: number,
    maxOutputAmount: number,
    decodedTronAddress: string,
    tronAddress: string,
) {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient({ account: address });
    const publicClient = usePublicClient();

    const [state, setState] = useState<SwapState>({
        isSwapping: false,
        errorMessage: null,
        inputAmount: '',
        inputConvertedAmount: '',
        outputAmount: '',
        outputConvertedAmount: '',
        insufficientFunds: false,
        maxOutputSurpassed: false,
        transaction: undefined,
        baseTransactionTimestamp: undefined,
    });

    const handleInputAmountChange = (value: string) => {
        if (!value || parseFloat(value) <= 0 || !selectedInputAsset) {
            updateState({
                inputAmount: value,
                outputAmount: '',
                outputConvertedAmount: '',
            });
            return;
        }

        const tokenConfig = getTokenConfig(selectedInputAsset);
        const result = calculateOutputAmount(parseFloat(value), tokenConfig, maxOutputAmount);

        updateState({
            inputAmount: value,
            inputConvertedAmount: `$${result.inputConverted.toFixed(2)}`,
            outputAmount: result.output.toFixed(2),
            outputConvertedAmount: `$${result.outputConverted.toFixed(2)}`,
            maxOutputSurpassed: result.maxOutputSurpassed,
            insufficientFunds: !!address && parseFloat(value) > userBalance,
        });
    };

    const handleOutputAmountChange = (value: string) => {
        if (!value || parseFloat(value) <= 0 || !selectedInputAsset) {
            updateState({
                outputAmount: value,
                inputAmount: '',
                inputConvertedAmount: '',
            });
            return;
        }

        const tokenConfig = getTokenConfig(selectedInputAsset);
        const result = calculateInputAmount(parseFloat(value), tokenConfig, maxOutputAmount);

        if (result.maxOutputSurpassed) {
            updateState({
                outputAmount: value,
                inputAmount: '',
                inputConvertedAmount: '',
                maxOutputSurpassed: true,
            });
        } else {
            updateState({
                outputAmount: value,
                outputConvertedAmount: `$${result.outputConverted.toFixed(2)}`,
                inputAmount: result.adjustedInput.toFixed(2),
                inputConvertedAmount: `$${result.inputConverted.toFixed(2)}`,
                maxOutputSurpassed: false,
                insufficientFunds: !!address && result.adjustedInput > userBalance,
            });
        }
    };

    const requestSwap = async () => {
        if (state.isSwapping || !state.inputAmount || !state.outputAmount) return;
        if (!walletClient || !address) {
            console.error('Wallet not connected');
            return;
        }

        updateState({ isSwapping: true });

        try {
            const tokenConfig = getTokenConfig(selectedInputAsset);
            const chainId = configuration.chains.find(c => 
                c.tokens.some(t => t.tokenAddress.toLowerCase() === tokenConfig.tokenAddress.toLowerCase())
            )?.chainId;

            if (!chainId) {
                throw new Error('Failed to determine chain ID');
            }

            // Switch chain if necessary
            const currentChainId = await walletClient.getChainId();
            if (currentChainId !== chainId) {
                await walletClient.switchChain({ id: chainId });
            }

            const decimals = tokenConfig.decimals;
            const value = BigInt(Math.floor(parseFloat(state.inputAmount) * 10 ** decimals));
            const outputValue = BigInt(Math.floor(parseFloat(state.outputAmount) * 1e6)); // Assuming USDT has 6 decimals

            const swapData = encodeSwapData(value.toString(), outputValue.toString(), decodedTronAddress);
            const signedTimestamp = Math.floor(Date.now() / 1000);
            const transactionHash = await callCompactUsdc(swapData, walletClient, publicClient);

            const baseTimestamp = Math.floor(Date.now() / 1000);
            updateState({
                errorMessage: null,
                transaction: {
                    url: `https://basescan.org/tx/${transactionHash}`,
                    timestamp: baseTimestamp,
                    orderSignedAt: signedTimestamp,
                },
                baseTransactionTimestamp: baseTimestamp,
            });

            return {
                contractAddress: configuration.contracts.usdtTronAddress,
                to: tronAddress,
                amount: outputValue.toString(),
            };
        } catch (error: any) {
            let errorMessage: string | null = 'An unexpected error occurred during the swap. Please try again.';
            if (error instanceof UserRejectedRequestError || error.message.includes('rejected')) {
                errorMessage = null;
            } else if (error instanceof Error) {
                errorMessage = `Swap error: ${error.message}`;
            }
            updateState({ errorMessage });
            throw error;
        } finally {
            updateState({ isSwapping: false });
        }
    };

    const clearErrorMessage = () => updateState({ errorMessage: null });
    const clearSuccess = () => updateState({
        transaction: undefined,
        baseTransactionTimestamp: undefined,
    });

    const updateState = (newState: Partial<SwapState>) => {
        setState(prevState => ({ ...prevState, ...newState }));
    };

    return {
        state,
        handleInputAmountChange,
        handleOutputAmountChange,
        requestSwap,
        clearErrorMessage,
        clearSuccess,
    };
}

function getTokenConfig(selectedKey: string): TokenConfig {
    const [chainIdStr, tokenAddress] = selectedKey.split('-');
    const chainId = Number(chainIdStr);
    const chain = configuration.chains.find(c => c.chainId === chainId);
    if (!chain) throw new Error('Chain not found');
    const tokenConfig = chain.tokens.find(token => token.tokenAddress.toLowerCase() === tokenAddress.toLowerCase());
    if (!tokenConfig) throw new Error('Token config not found');
    return tokenConfig;
} 