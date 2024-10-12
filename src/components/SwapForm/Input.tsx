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
    buttonText = 'Insert',
    label = 'Enter value',
}: SwapFormInputProps) {
    return (
        <label className={styles.Block}>
            <span className={styles.VisuallyHidden}>{label}</span>
            <input {...inputProps} className={`${styles.Input} ${inputProps.className || ''}`} aria-label={label} />
            <button className={styles.Insert} onClick={() => onInsert?.()}>
                {buttonText}
            </button>
        </label>
    );
}
