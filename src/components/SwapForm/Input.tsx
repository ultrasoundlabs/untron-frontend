import styles from './Input.module.scss';

export default function SwapFormInput({ inputProps, onInsert }: { inputProps: JSX.IntrinsicElements['input']; onInsert?: () => void }) {
	return (
		<label className={styles.Block}>
			<input {...inputProps} className={styles.Input} />
			<button className={styles.Insert} onClick={() => onInsert?.()}>
				Insert
			</button>
		</label>
	);
}