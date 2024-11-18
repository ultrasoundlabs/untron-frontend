import { useState } from 'react';
import styles from './Input.module.scss';
import { Scanner } from '@yudiel/react-qr-scanner';

interface SwapFormInputProps {
    inputProps: React.InputHTMLAttributes<HTMLInputElement>;
    onInsert?: () => void;
    buttonText?: string;
}

export default function SwapFormInput({ 
    inputProps, 
    onInsert, 
    buttonText = 'Paste'
}: SwapFormInputProps) {
    const [showScanner, setShowScanner] = useState(false);

    const handleInsert = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            if (inputProps.onChange && clipboardText) {
                const event = {
                    target: { value: clipboardText },
                } as React.ChangeEvent<HTMLInputElement>;
                inputProps.onChange(event);
            }
        } catch (error) {
            console.error('Failed to read clipboard contents: ', error);
        }
    };

    return (
        <div className={styles.InputWrapper}>
            <label className={styles.Block}>
                <input {...inputProps} className={`${styles.Input} ${inputProps.className || ''}`} />
                <button className={styles.QrButton} onClick={() => setShowScanner(true)}>
                    <img src="/images/qr-code.png" alt="Scan QR" />
                </button>
                <button className={styles.Insert} onClick={handleInsert}>
                    {buttonText}
                </button>
            </label>

            {showScanner && (
                <div className={styles.ScannerModal}>
                    <div className={styles.ScannerContainer}>
                        <button 
                            className={styles.CloseButton}
                            onClick={() => setShowScanner(false)}
                        >
                            ×
                        </button>
                        <Scanner
                            onScan={(result) => {
                                if (inputProps.onChange && result[0]?.rawValue) {
                                    const event = {
                                        target: { value: result[0].rawValue },
                                    } as React.ChangeEvent<HTMLInputElement>;
                                    inputProps.onChange(event);
                                    setShowScanner(false);
                                }
                            }}
                            onError={(error) => console.warn(`QR Code scanning failed: ${error}`)}
                            formats={['qr_code']}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
