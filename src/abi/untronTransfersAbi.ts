// The ABI of the contract
const contractAbi = [
    {
        name: 'permitAndCompactUsdc',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'permitData', type: 'bytes' },
            { name: 'swapData', type: 'bytes32' },
        ],
        outputs: [],
    },
];
export default contractAbi;