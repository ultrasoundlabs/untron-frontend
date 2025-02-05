import styles from './Item.module.scss';
import { AssetDisplayOption } from '../../types';
import { useState, useRef, useEffect } from 'react';

// Update the Right section to handle both selectable and fixed assets consistently
const AssetDisplay = ({
    icon,
    assetOptions,
    selectedAssetKey,
    onAssetChange,
    disableAssetSelection,
}: {
    icon: string;
    assetOptions: AssetDisplayOption[];
    selectedAssetKey: string;
    onAssetChange: (key: string) => void;
    disableAssetSelection?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAssetSelect = (key: string) => {
        onAssetChange(key);
        setIsOpen(false);
    };

    return (
        <div className={styles.AssetSelector} ref={dropdownRef}>
            <button 
                className={styles.AssetButton} 
                onClick={() => !disableAssetSelection && setIsOpen(!isOpen)} 
                disabled={disableAssetSelection}
            >
                {!disableAssetSelection && (
                    <span className={styles.DropdownIndicator}>
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M1 1.5L6 6.5L11 1.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                )}
                <img src={icon} alt="Token icon" />
            </button>

            {isOpen && !disableAssetSelection && (
                <div className={styles.Dropdown}>
                    {assetOptions.map((asset) => (
                        <div
                            key={asset.key}
                            className={`${styles.DropdownItem} ${asset.key === selectedAssetKey ? styles.Selected : ''}`}
                            onClick={() => handleAssetSelect(asset.key)}
                        >
                            <img src={asset.icon} alt={asset.symbol} className={styles.AssetIcon} />
                            <span className={styles.AssetSymbol}>{asset.symbol}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
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
    assetOptions: AssetDisplayOption[];
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
                        icon={disableAssetSelection ? iconSrc : selectedAsset?.icon || ''}
                        assetOptions={assetOptions}
                        selectedAssetKey={selectedAssetKey}
                        onAssetChange={onAssetChange}
                        disableAssetSelection={disableAssetSelection}
                    />
                </div>
            </div>
        </div>
    );
}
