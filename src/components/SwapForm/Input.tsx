import { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import styles from './Input.module.scss';

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

    const handleScan = (result: any) => {
        if (result && inputProps.onChange) {
            const event = {
                target: { value: result.text },
            } as React.ChangeEvent<HTMLInputElement>;
            inputProps.onChange(event);
            setShowScanner(false);
        }
    };

    // Reset hasScanned when scanner is opened
    const handleOpenScanner = () => {
        setShowScanner(true);
    };

    return (
        <div className={styles.InputWrapper}>
            <label className={styles.Block}>
                <input {...inputProps} className={`${styles.Input} ${inputProps.className || ''}`} />
                <button className={styles.QrButton} onClick={() => handleOpenScanner()}>
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
                            onClick={() => {
                                setShowScanner(false);
                            }}
                        >
                            ×
                        </button>
                        <QrReader
                            onResult={handleScan}
                            constraints={{ facingMode: 'environment' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
