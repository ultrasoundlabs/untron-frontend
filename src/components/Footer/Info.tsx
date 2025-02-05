import styles from './Info.module.scss';

export default function FooterInfo() {
    return (
        <p className={styles.Info}>
            Warning: This UI and contracts it utilizes are not audited and not suitable for production use.
            <br />
            This service is provided as is for demonstration purposes only.
            <br />
            Please use with caution and do not use with funds you cannot afford to lose.
            <br />
            <br />© 2024{' '}
            <a href="https://github.com/ultrasoundlabs" target="_blank" rel="noopener noreferrer">
                Ultrasound Labs LLC
            </a>{' '}
            — all rights reserved
        </p>
    );
}
