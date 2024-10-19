import styles from './Item.module.scss';

export default function SwapFormItem({
    label,
    amountInputProps,
    convertedAmountInputProps,
    balance,
    iconSrc,
    insufficientFunds,
    maxOutputSurpassed,
}: {
    label: string;
    amountInputProps: JSX.IntrinsicElements['input'];
    convertedAmountInputProps: JSX.IntrinsicElements['input'];
    balance: string;
    iconSrc: string;
    insufficientFunds?: boolean;
    maxOutputSurpassed?: boolean;
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
                        {insufficientFunds && (
                            <div className={styles.InsufficientFunds}>
                                You don't have enough funds.
                            </div>
                        )}
                        {maxOutputSurpassed && (
                            <div className={styles.InsufficientFunds}>
                                Not enough liquidity to cover the transaction.
                            </div>
                        )}
                    </label>
                </div>
                <div className={styles.Right}>
                    <img src={iconSrc} alt={`${label} icon`} height={58} width={58} />
                </div>
            </div>
        </div>
    );
}
