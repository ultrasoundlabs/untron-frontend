// The ABI of the contract
const contractAbi = [
    {
        name: 'compactUsdc',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'swapData', type: 'bytes32' },
        ],
        outputs: [],
    },
];
export default contractAbi;
