import styles from './Item.module.scss';

// Update the Right section to handle both selectable and fixed assets consistently
const AssetDisplay = ({ 
  icon, 
  onClick, 
  disableAssetSelection 
}: { 
  icon: string; 
  onClick: () => void;
  disableAssetSelection?: boolean;
}) => {
  return (
    <button 
      className={styles.AssetButton}
      onClick={onClick}
      disabled={disableAssetSelection}
    >
      <img src={icon} alt="Token icon" />
      <span className={styles.DropdownIndicator}>
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    </button>
  );
};

export default function SwapFormItem({
    label,
    amountInputProps,
    convertedAmountInputProps,
    balance,
    iconSrc,
    insufficientFunds,
    maxOutputSurpassed,
    assetOptions,
    selectedAssetKey,
    onAssetChange,
    disableAssetSelection = false,
}: {
    label: string;
    amountInputProps: JSX.IntrinsicElements['input'];
    convertedAmountInputProps: JSX.IntrinsicElements['input'];
    balance: string;
    iconSrc: string;
    insufficientFunds?: boolean;
    maxOutputSurpassed?: boolean;
    assetOptions: Array<{
        key: string;
        symbol: string;
        icon: string;
    }>;
    selectedAssetKey: string;
    onAssetChange: (key: string) => void;
    disableAssetSelection?: boolean;
}) {
    const selectedAsset = assetOptions.find((asset) => asset.key === selectedAssetKey);

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
                            <div className={styles.InsufficientFunds}>You don't have enough funds.</div>
                        )}
                        {maxOutputSurpassed && (
                            <div className={styles.InsufficientFunds}>
                                Not enough liquidity to cover the transaction.
                            </div>
                        )}
                    </label>
                </div>
                <div className={styles.Right}>
                    <AssetDisplay
                        icon={disableAssetSelection ? iconSrc : (selectedAsset?.icon || '')}
                        onClick={() => {
                            if (selectedAsset) {
                                onAssetChange(selectedAsset.key);
                            }
                        }}
                        disableAssetSelection={disableAssetSelection}
                    />
                </div>
            </div>
        </div>
    );
}
