import { hashTypedData, keccak256, PublicClient, stringToBytes, WalletClient } from 'viem';
import { erc20PermitDomain, erc20PermitTypes } from './erc20Permit';
import { untronIntentsDomain, untronIntentsTypes } from './untronIntents';
import { generateOrderId, GaslessCrossChainOrder, Permit } from '../utils/utils';

export async function signPermit(
    walletClient: WalletClient,
    chainId: number,
    tokenAddress: `0x${string}`,
    permit: Permit,
    nonce: bigint,
) {
    const PERMIT_TYPEHASH = keccak256(
        stringToBytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'),
    );
    const domain = erc20PermitDomain(chainId, tokenAddress);
    const message = {
        PERMIT_TYPEHASH,
        owner: permit.owner,
        spender: permit.spender,
        value: permit.value,
        nonce: nonce,
        deadline: permit.deadline,
    };

    if (!walletClient.account) {
        throw new Error('Wallet client not associated with an account');
    }

    /*
    To debug messageHash creation
    const messageHash = hashTypedData({
        domain,
        types: erc20PermitTypes,
        primaryType: 'Permit',
        message,
    });
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
    publicClient: any,
    chainId: number,
    contractAddress: `0x${string}`,
    order: GaslessCrossChainOrder,
) {
    console.log('Signing order with parameters:', { chainId, contractAddress, order });

    const INTENT_TYPEHASH = keccak256(
        stringToBytes(
            'Intent(address refundBeneficiary,Input[] inputs,bytes21 to,uint256 outputAmount,bytes32 orderId)Input(address token,uint256 amount)',
        ),
    );
    console.log('INTENT_TYPEHASH:', INTENT_TYPEHASH);

    const domain = untronIntentsDomain(chainId, contractAddress);
    console.log('Domain:', domain);

    const orderId = await generateOrderId(publicClient, chainId, contractAddress, order);
    console.log('Generated orderId:', orderId);

    const message = {
        refundBeneficiary: order.intent.refundBeneficiary,
        inputs: order.intent.inputs,
        to: order.intent.to,
        outputAmount: order.intent.outputAmount,
        orderId: orderId,
    };
    console.log('Message:', message);

    if (!walletClient.account) {
        throw new Error('Wallet client not associated with an account');
    }
    
    const messageHash = hashTypedData({
        domain,
        types: untronIntentsTypes,
        primaryType: 'Intent',
        message,
    });
    console.log('Client-side messageHash:', messageHash);

    // Verify message hash against contract
    const contractMessageHash = await publicClient.readContract({
        address: contractAddress,
        abi: [{
            inputs: [
                { name: 'orderId', type: 'bytes32' },
                { 
                    name: 'intent',
                    type: 'tuple',
                    components: [
                        { name: 'refundBeneficiary', type: 'address' },
                        { 
                            name: 'inputs',
                            type: 'tuple[]',
                            components: [
                                { name: 'token', type: 'address' },
                                { name: 'amount', type: 'uint256' }
                            ]
                        },
                        { name: 'to', type: 'bytes21' },
                        { name: 'outputAmount', type: 'uint256' }
                    ]
                }
            ],
            name: '_messageHash',
            outputs: [{ type: 'bytes32' }],
            stateMutability: 'view',
            type: 'function'
        }],
        functionName: '_messageHash',
        args: [orderId, order.intent]
    });
    console.log('Contract-side messageHash:', contractMessageHash);

    if (messageHash !== contractMessageHash) {
        console.error('Message hash mismatch:', { clientHash: messageHash, contractHash: contractMessageHash });
        throw new Error('Message hash mismatch between client and contract');
    }

    const signature = await walletClient.signTypedData({
        account: walletClient.account,
        domain,
        types: untronIntentsTypes,
        primaryType: 'Intent',
        message,
    });
    console.log('Generated signature:', signature);

    return signature;
}
