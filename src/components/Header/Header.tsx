import styles from './Header.module.scss';

export default function Header() {
    return (
        <header className={styles.Header}>
            <img src="/images/logo.png" className={styles.Logo} alt="" />
            <a href="https://ultrasoundlabs.github.io/untron-docs/" target="_blank" rel="noopener noreferrer" className={styles.DocsLink}>
                Docs
            </a>
        </header>
    );
}
