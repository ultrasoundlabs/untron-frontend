import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
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

    useEffect(() => {
        let scanner: Html5QrcodeScanner | null = null;

        if (showScanner) {
            scanner = new Html5QrcodeScanner(
                "qr-reader", 
                { 
                    fps: 10,
                    qrbox: {width: 250, height: 250},
                    aspectRatio: 1.0
                },
                false
            );

            scanner.render((decodedText) => {
                // Success callback
                if (inputProps.onChange) {
                    const event = {
                        target: { value: decodedText },
                    } as React.ChangeEvent<HTMLInputElement>;
                    inputProps.onChange(event);
                }
                setShowScanner(false);
                scanner?.clear();
            }, (error) => {
                // Error callback
                console.warn(`QR Code scanning failed: ${error}`);
            });
        }

        // Cleanup
        return () => {
            if (scanner) {
                scanner.clear().catch(error => {
                    console.error('Failed to clear scanner', error);
                });
            }
        };
    }, [showScanner, inputProps.onChange]);

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
                        <div id="qr-reader"></div>
                    </div>
                </div>
            )}
        </div>
    );
}
