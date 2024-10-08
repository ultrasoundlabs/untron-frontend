import styles from './Info.module.scss';

export default function FooterInfo() {
	return (
		<p className={styles.Info}>
			The UI is limited to USDC on Base to demonstrate gasless swaps.
			<br />
			Multiple coins and chains will be supported in the full version.
		</p>
	);
}
