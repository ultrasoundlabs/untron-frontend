import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { UserRejectedRequestError } from 'viem';
import { configuration } from '../config/config';
import { TokenConfig } from '../config/chains';
import { Transaction } from '../types';
import { callCompactUsdc, callCompactUsdt, encodeSwapData } from '../utils/utils';
import { calculateInputAmount, calculateOutputAmount } from '../utils/calculator';

export interface SwapState {
    isSwapping: boolean;
    isApproving: boolean;
    isApproved: boolean;
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
        isApproving: false,
        isApproved: false,
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

    // Debounced allowance check
    useEffect(() => {
        if (!state.inputAmount || parseFloat(state.inputAmount) <= 0 || !selectedInputAsset) {
            updateState({ isApproved: false });
            return;
        }

        const tokenConfig = getTokenConfig(selectedInputAsset);
        const amount = BigInt(Math.floor(parseFloat(state.inputAmount) * 10 ** tokenConfig.decimals));
        
        const checkCurrentAllowance = async () => {
            const isApproved = await checkAllowance(tokenConfig, amount);
            updateState({ isApproved });
        };

        const timeoutId = setTimeout(checkCurrentAllowance, 500);
        return () => clearTimeout(timeoutId);
    }, [state.inputAmount, selectedInputAsset, address]);

    // Check if the input token is approved for the required amount
    const checkAllowance = async (tokenConfig: TokenConfig, amount: bigint) => {
        if (!address || !publicClient) return false;

        try {
            const allowance: bigint = await publicClient.readContract({
                address: tokenConfig.tokenAddress,
                abi: [
                    {
                        constant: true,
                        inputs: [
                            { name: 'owner', type: 'address' },
                            { name: 'spender', type: 'address' }
                        ],
                        name: 'allowance',
                        outputs: [{ name: '', type: 'uint256' }],
                        type: 'function'
                    }
                ],
                functionName: 'allowance',
                args: [address, tokenConfig.contractAddress]
            }) as bigint;

            return allowance >= amount;
        } catch (error) {
            console.error('Error checking allowance:', error);
            return false;
        }
    };

    // Request approval for the input token
    const requestApproval = async () => {
        if (!walletClient || !address || !state.inputAmount || !publicClient) return;

        const tokenConfig = getTokenConfig(selectedInputAsset);
        const decimals = tokenConfig.decimals;
        const amount = BigInt(Math.floor(parseFloat(state.inputAmount) * 10 ** decimals));

        updateState({ isApproving: true });

        try {
            const tx = await walletClient.writeContract({
                address: tokenConfig.tokenAddress,
                abi: [
                    {
                        constant: false,
                        inputs: [
                            { name: 'spender', type: 'address' },
                            { name: 'amount', type: 'uint256' }
                        ],
                        name: 'approve',
                        outputs: [{ name: '', type: 'bool' }],
                        type: 'function'
                    }
                ],
                functionName: 'approve',
                args: [tokenConfig.contractAddress, amount]
            });

            await publicClient.waitForTransactionReceipt({ hash: tx });
            updateState({ isApproved: true });
        } catch (error: any) {
            let errorMessage: string | null = null;
            if (!(error instanceof UserRejectedRequestError) && !error.message.includes('rejected')) {
                errorMessage = `Approval error: ${error.message}`;
                updateState({ errorMessage });
            }
            // Don't rethrow the error for user rejections
            if (errorMessage) {
                throw error;
            }
        } finally {
            updateState({ isApproving: false });
        }
    };

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
        if (state.isSwapping || !state.inputAmount || !state.outputAmount || !state.isApproved) return;
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
            let transactionHash = null;
            if (tokenConfig.symbol === 'USDT') {
                transactionHash = await callCompactUsdt(swapData, walletClient, publicClient);
            } else {
                transactionHash = await callCompactUsdc(swapData, walletClient, publicClient);
            }

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
        requestApproval,
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