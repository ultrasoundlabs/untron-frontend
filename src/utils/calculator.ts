import { TokenConfig } from '../config/chains';

interface CalculationResult {
    output: number;
    outputConverted: number;
    inputConverted: number;
    maxOutputSurpassed: boolean;
}

interface InputCalculationResult {
    adjustedInput: number;
    inputConverted: number;
    outputConverted: number;
    maxOutputSurpassed: boolean;
}

export function calculateOutputAmount(
    input: number,
    tokenConfig: TokenConfig,
    maxOutputAmount: number,
): CalculationResult {
    const inputConverted = input * tokenConfig.rate;
    const percentageFee = Math.max(0.01, input * tokenConfig.percentFee);
    const output = Math.floor((input - percentageFee - tokenConfig.flatFee + Number.EPSILON) * 100) / 100;

    const usdtUsdRate = 1; // Assuming USDT is pegged to USD
    const outputConverted = output * usdtUsdRate;

    return {
        output,
        outputConverted,
        inputConverted,
        maxOutputSurpassed: output > maxOutputAmount,
    };
}

export function calculateInputAmount(
    output: number,
    tokenConfig: TokenConfig,
    maxOutputAmount: number,
): InputCalculationResult {
    if (output > maxOutputAmount) {
        return {
            adjustedInput: 0,
            inputConverted: 0,
            outputConverted: output,
            maxOutputSurpassed: true,
        };
    }

    const input = Math.ceil(((output + tokenConfig.flatFee) / (1 - tokenConfig.percentFee)) * 100) / 100;
    const percentageFee = Math.max(0.01, input * tokenConfig.percentFee);
    const adjustedInput = Math.ceil((output + tokenConfig.flatFee + percentageFee) * 100) / 100;

    const inputConverted = adjustedInput * tokenConfig.rate;
    const usdtUsdRate = 1; // Assuming USDT is pegged to USD
    const outputConverted = output * usdtUsdRate;

    return {
        adjustedInput,
        inputConverted,
        outputConverted,
        maxOutputSurpassed: false,
    };
} 