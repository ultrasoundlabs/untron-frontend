import styles from './Input.module.scss';

export default function SwapFormInput() {
	return (
		<label className={styles.Block}>
			<input className={styles.Input} type='text' placeholder='Tron address' autoComplete='off' />
			<button className={styles.Insert}>Insert</button>
		</label>
	);
}
