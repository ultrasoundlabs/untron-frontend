import { WalletClient } from 'viem';
import { erc20PermitDomain, erc20PermitTypes } from './erc20Permit';
import { untronIntentsDomain, untronIntentsTypes } from './untronIntents';
import { generateOrderId, Order, Permit } from '../utils/utils';

export async function signPermit(
    walletClient: WalletClient,
    chainId: number,
    tokenAddress: `0x${string}`,
    permit: Permit,
    nonce: bigint,
) {
    const domain = erc20PermitDomain(chainId, tokenAddress);
    const message = {
        owner: permit.owner,
        spender: permit.spender,
        value: permit.value,
        nonce: nonce,
        deadline: permit.deadline,
    };

    if (!walletClient.account) {
        throw new Error('Wallet client not associated with an account');
    }

    
    /* To debug messageHash creation
    const messageHash = hashTypedData({
        domain,
        types: erc20PermitTypes,
        primaryType: 'Permit',
        message,
    });
    console.log('[PERMIT] Message hash:', messageHash);
    */
    

    const signature = await walletClient.signTypedData({
        account: walletClient.account,
        domain,
        types: erc20PermitTypes,
        primaryType: 'Permit',
        message,
    });

    // Split signature into v, r, s
    const signatureBytes = signature.startsWith('0x') ? signature.slice(2) : signature;
    const r = `0x${signatureBytes.slice(0, 64)}` as `0x${string}`;
    const s = `0x${signatureBytes.slice(64, 128)}` as `0x${string}`;
    const v = parseInt(signatureBytes.slice(128, 130), 16);

    return { v, r, s };
}

export async function signOrder(
    walletClient: WalletClient,
    chainId: number,
    contractAddress: `0x${string}`,
    order: Order,
) {
    const domain = untronIntentsDomain(chainId, contractAddress);
    const orderId = generateOrderId(order);

    const message = {
        refundBeneficiary: order.intent.refundBeneficiary,
        inputs: order.intent.inputs,
        to: order.intent.to,
        outputAmount: order.intent.outputAmount,
        orderId: orderId,
    };
    if (!walletClient.account) {
        throw new Error('Wallet client not associated with an account');
    }

    // To debug messageHash creation
    /*
    const messageHash = hashTypedData({
        domain,
        types: untronIntentsTypes,
        primaryType: 'Intent',
        message,
    });
    console.log('Message hash:', messageHash);
    console.log('Order ID:', orderId);
    */
    

    const signature = await walletClient.signTypedData({
        account: walletClient.account,
        domain,
        types: untronIntentsTypes,
        primaryType: 'Intent',
        message,
    });

    return signature; // This can be sent as hex directly
}
