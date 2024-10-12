import styles from './Item.module.scss';

export default function SwapFormItem({
    label,
    amountInputProps,
    convertedAmountInputProps,
    iconSrc,
}: {
    label: string;
    amountInputProps: JSX.IntrinsicElements['input'];
    convertedAmountInputProps: JSX.IntrinsicElements['input'];
    chainId: string;
    iconSrc: string;
}) {
    return (
        <div className={styles.Block} role="group" aria-labelledby={`${label}-label`}>
            <div className={styles.Row}>
                <div className={styles.Left}>
                    <div id={`${label}-label`} className={styles.Label}>
                        {label}
                    </div>
                    <label className={styles.InputWrapper}>
                        <span className={styles.srOnly}>Amount</span>
                        <input {...amountInputProps} className={styles.Amount} aria-label={`${label} amount`} />
                    </label>
                    <label className={styles.InputWrapper}>
                        <span className={styles.srOnly}>Converted Amount</span>
                        <input
                            {...convertedAmountInputProps}
                            className={styles.ConvertedAmount}
                            aria-label={`${label} converted amount`}
                        />
                    </label>
                </div>
                <div className={styles.Right}>
                    <img src={iconSrc} alt={`${label} icon`} height={58} width={58} />
                </div>
            </div>
        </div>
    );
}
