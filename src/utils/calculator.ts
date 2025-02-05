import { TokenConfig } from '../config/chains';

interface CalculationResult {
    output: number;
    outputConverted: number;
    inputConverted: number;
    maxOutputSurpassed: boolean;
}

export function calculateOutputAmount(
    inputAmount: number,
    tokenConfig: TokenConfig,
    maxOutputAmount: number
): CalculationResult {
    // Convert input amount to USD
    const inputConverted = inputAmount * tokenConfig.rate;
    
    // Calculate fees
    const flatFeeDeduction = tokenConfig.flatFee;
    const percentFeeDeduction = (inputConverted * tokenConfig.percentFee) / 100;
    
    // Calculate output after fees
    const outputBeforeMax = inputConverted - flatFeeDeduction - percentFeeDeduction;
    const maxOutputSurpassed = outputBeforeMax > maxOutputAmount;
    const output = maxOutputSurpassed ? maxOutputAmount : outputBeforeMax;
    
    return {
        output,
        outputConverted: output,
        inputConverted,
        maxOutputSurpassed
    };
}

export function calculateInputAmount(
    outputAmount: number,
    tokenConfig: TokenConfig,
    maxOutputAmount: number
): CalculationResult & { adjustedInput: number } {
    if (outputAmount > maxOutputAmount) {
        return {
            output: outputAmount,
            outputConverted: outputAmount,
            inputConverted: 0,
            maxOutputSurpassed: true,
            adjustedInput: 0
        };
    }

    // Calculate required input amount including fees
    const flatFee = tokenConfig.flatFee;
    const percentFee = tokenConfig.percentFee;
    
    // Solve for input: output = input - flatFee - (input * percentFee / 100)
    // output = input * (1 - percentFee/100) - flatFee
    // input = (output + flatFee) / (1 - percentFee/100)
    const adjustedInput = (outputAmount + flatFee) / (1 - percentFee / 100);
    
    return {
        output: outputAmount,
        outputConverted: outputAmount,
        inputConverted: adjustedInput,
        maxOutputSurpassed: false,
        adjustedInput: adjustedInput / tokenConfig.rate
    };
} 