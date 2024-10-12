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
        <div className={styles.Block}>
            <div className={styles.Row}>
                <div className={styles.Left}>
                    <div className={styles.Label}>{label}</div>
                    <input {...amountInputProps} className={styles.Amount} />
                    <input {...convertedAmountInputProps} className={styles.ConvertedAmount} />
                </div>
                <div className={styles.Right}>
                    <img src={iconSrc} alt="" height={58} width={58} />
                    {/* Place chain icon here. For some reason, "connectkit" module does ot contain this component. */}
                    {/* <ChainIcon id={chainId} /> */}
                </div>
            </div>
        </div>
    );
}
