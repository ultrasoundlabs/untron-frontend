import styles from './Form.module.scss';
import { ConnectKitButton } from 'connectkit';
import SwapFormItem from './Item';
import SwapFormInput from './Input';
import SwapFormLoadingSpinner from './LoadingSpinner';
import { useState } from 'react';
import SwapFormSuccessModal from './SuccessModal';

export default function SwapForm() {
	const [transaction, setTransaction] = useState<any>(null);
	const [isSwapping, setIsSwapping] = useState<boolean>(false);

	async function requestSwap() {
		if (isSwapping) return;
		setIsSwapping(true);
		await new Promise((res) => setTimeout(res, 1000));
		setIsSwapping(false);
		setTransaction({
			url: 'link_to_TronScan',
		});
	}

	function clearTransaction() {
		setTransaction(null);
	}

	return (
		<div className={styles.Form}>
			<SwapFormItem chainId='tron' label='You send' amount={52} balance={260645} currency='$' />
			<div className={styles.SwapArrowContainer}>
				<button className={styles.SwapArrow}>
					{/* Place svg icon here differently depends on your preferences */}
					{/* Would be cool if height, width props will be removed, and fill=currentColor */}
					<svg viewBox='0 0 35 21' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path
							d='M20.8474 18.7528C18.6996 21.0393 15.9476 21.0336 13.8 18.7414L1.14986 5.27906C0.0232434 4.10323 0.0232441 2.39082 1.02837 1.34498C2.18935 0.175092 3.9744 0.175092 5.0228 1.29854L17.3134 14.3526L29.5983 1.29854C30.6728 0.175092 32.4317 0.201176 33.6189 1.34498C34.6501 2.36473 34.598 4.1092 33.4973 5.28476L20.8474 18.7528Z'
							fill='currentColor'
						/>
					</svg>
				</button>
			</div>
			<SwapFormItem chainId='tron' label='You receive' amount={99.35} balance={260645} currency='$' />
			<div className={styles.Gap} />
			<SwapFormInput />
			<div className={styles.Gap} />
			<ConnectKitButton.Custom>
				{({ isConnected, isConnecting, show, address }) => {
					console.info('isConnected', isConnected);
					console.info('isConnecting', isConnecting);
					console.info('show', show);
					console.info('address', address);
					return (
						<button
							className={styles.Button}
							onClick={() => {
								if (isConnected && address) {
									requestSwap();
								} else {
									show?.();
								}
							}}
						>
							{isConnecting || isSwapping ? <SwapFormLoadingSpinner /> : address ? 'Swap' : 'Connect Your Wallet'}
						</button>
					);
				}}
			</ConnectKitButton.Custom>
			<p className={styles.Info}>Swaps from Tron coming soon</p>
			<SwapFormSuccessModal transaction={transaction} onClose={() => clearTransaction()} />
		</div>
	);
}
