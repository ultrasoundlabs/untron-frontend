import styles from './Item.module.scss';

export default function SwapFormItem({
    label,
    amount,
    balance,
    currency,
    chainId,
}: {
    label: string;
    amount: number;
    balance: number;
    currency: string;
    chainId: string;
}) {
    return (
        <div className={styles.Block}>
            <div className={styles.Row}>
                <div className={styles.Left}>
                    <div className={styles.Label}>{label}</div>
                    <div className={styles.Amount}>{Number(amount).toFixed(2)}</div>
                    <div className={styles.Balance}>
                        {currency}
                        {Number(balance).toFixed(2)}
                    </div>
                </div>
                <div className={styles.Right}>
                    <img src="/images/chain.png" alt="" height={58} width={58} />
                    {/* Place chain icon here. For some reason, "connectkit" module does ot contain this component. */}
                    {/* <ChainIcon id={chainId} /> */}
                </div>
            </div>
        </div>
    );
}
