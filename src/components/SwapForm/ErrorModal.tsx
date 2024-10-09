import styles from './ErrorModal.module.scss';

export default function SwapFormErrorModal({ error, onClose = () => {} }: { error?: any; onClose?: () => void }) {
	return (
		<div className={styles.Overlay} style={{ display: error ? undefined : 'none' }}>
			<div className={styles.Modal}>
				<div className={styles.Top}>
					<div className={styles.Title}>Approve swap</div>
					<button onClick={() => onClose?.()} className={styles.CloseButton}>
						{/* Similar, place svg icon here differently depends on your preferences */}
						<svg viewBox='0 0 22 22' fill='none' xmlns='http://www.w3.org/2000/svg'>
							<path
								d='M1.1953 20.6843C1.83775 21.3391 2.95451 21.3159 3.57798 20.6951L10.918 13.3401L18.2676 20.6897C18.902 21.3241 19.9928 21.3364 20.6353 20.6816C21.3024 20.0268 21.2901 18.936 20.6434 18.3016L13.3088 10.9492L20.6434 3.61463C21.2901 2.97761 21.3024 1.87442 20.6353 1.23468C19.9928 0.579874 18.902 0.592229 18.2676 1.22383L10.918 8.5708L3.57798 1.22112C2.95451 0.597653 1.83775 0.577163 1.1953 1.22925C0.543211 1.87171 0.563703 2.98846 1.18717 3.61192L8.54227 10.9492L1.18717 18.3043C0.563703 18.9278 0.543211 20.0295 1.1953 20.6843Z'
								fill='currentColor'
							/>
						</svg>
					</button>
				</div>
				<img src='/images/success-modal.png' className={styles.Image} alt='' />
				<div className={styles.Bottom}>
					<div className={styles.Message}>Transaction Error</div>
					<div className={styles.Info}>Error occurred during transaction.</div>
				</div>
			</div>
		</div>
	);
}
