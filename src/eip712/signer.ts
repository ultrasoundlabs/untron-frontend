import { WalletClient } from 'viem';
import { erc20PermitDomain, erc20PermitTypes } from './erc20Permit';
import { Permit } from '../utils/utils';

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
        value: permit.amount,
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
