import { Transaction } from '../../types';
import styles from './SuccessModal.module.scss';
import successImage from '../../images/success-modal.png';
import { useState } from 'react';

export default function SwapFormSuccessModal({
    transaction,
    tronTransaction,
    onClose = () => {},
}: {
    transaction?: Transaction;
    tronTransaction?: Transaction;
    onClose?: () => void;
}) {
    const [copiedLinks, setCopiedLinks] = useState<{[key: string]: boolean}>({});

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedLinks(prev => ({ ...prev, [id]: true }));
        setTimeout(() => {
            setCopiedLinks(prev => ({ ...prev, [id]: false }));
        }, 2000);
    };

    // Calculate time differences
    const baseDeliveryTime = transaction?.timestamp && transaction?.orderSignedAt
        ? Math.max(0, transaction.timestamp - transaction.orderSignedAt)
        : undefined;

    const tronDeliveryTime = transaction?.timestamp && tronTransaction?.timestamp
        ? Math.max(0, tronTransaction.timestamp - transaction.timestamp)
        : undefined;

    // Don't render anything if there's no transaction
    if (!transaction) {
        return null;
    }

    return (
        <div className={styles.Overlay} onClick={onClose}>
            <div className={styles.Modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.Top}>
                    <div className={styles.Title}>Success</div>
                    <button className={styles.CloseButton} onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M18 6L6 18M6 6L18 18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>
                <img src={successImage} className={styles.Image} alt="" />
                <div className={styles.Bottom}>
                    <div className={styles.Message}>Transaction Successful</div>
                    <div className={styles.Info}>
                        Your deposit transaction on Base:
                        <br />
                        <div className={styles.LinkContainer}>
                            <a href={transaction?.url} target="_blank" rel="noreferrer">
                                View on Basescan
                            </a>
                            <button 
                                onClick={() => transaction?.url && copyToClipboard(transaction.url, 'base')} 
                                title={copiedLinks['base'] ? 'Copied!' : 'Copy link'}
                            >
                                {copiedLinks['base'] ? (
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M20 6L9 17L4 12"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                )}
                            </button>
                        </div>
                        {baseDeliveryTime !== undefined && (
                            <span className={styles.TimeDifference}>
                                took {baseDeliveryTime} seconds
                            </span>
                        )}
                    </div>
                </div>
                {!tronTransaction && (
                    <div className={styles.Bottom}>
                        <div className={styles.Info}>
                            Your transaction is being processed on the Tron network.
                            <br />
                            Please wait a few moments.
                        </div>
                    </div>
                )}
                {tronTransaction && (
                    <div className={styles.Bottom}>
                        <div className={styles.Info}>
                            Your final transaction on Tron:
                            <br />
                            <div className={styles.LinkContainer}>
                                <a href={tronTransaction.url} target="_blank" rel="noreferrer">
                                    View on Tronscan
                                </a>
                                <button 
                                    onClick={() => tronTransaction.url && copyToClipboard(tronTransaction.url, 'tron')}
                                    title={copiedLinks['tron'] ? 'Copied!' : 'Copy link'}
                                >
                                    {copiedLinks['tron'] ? (
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M20 6L9 17L4 12"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {tronDeliveryTime !== undefined && (
                                <span className={styles.TimeDifference}>
                                    took {tronDeliveryTime} seconds
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
