import styles from './Input.module.scss';

interface SwapFormInputProps {
    inputProps: React.InputHTMLAttributes<HTMLInputElement>;
    onInsert?: () => void;
    buttonText?: string;
    label?: string;
}
export default function SwapFormInput({
    inputProps,
    onInsert,
    buttonText = 'Paste',
}: SwapFormInputProps) {
    const handleInsert = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            if (inputProps.onChange && clipboardText) {
                const event = {
                    target: { value: clipboardText }
                } as React.ChangeEvent<HTMLInputElement>;
                inputProps.onChange(event);
            }
        } catch (error) {
            console.error('Failed to read clipboard contents: ', error);
        }
    };

    return (
        <label className={styles.Block}>
            <input {...inputProps} className={`${styles.Input} ${inputProps.className || ''}`} />
            <button className={styles.Insert} onClick={handleInsert}>
                {buttonText}
            </button>
        </label>
    );
}
