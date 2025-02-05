import React, { useEffect, useState } from 'react';
import styles from './Header.module.scss';
import { ConnectKitButton } from 'connectkit';
import ChainSelector from '../ChainSelector/ChainSelector';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            setIsScrolled(scrollPosition > 0);
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Check initial position

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`${styles.Header} ${isScrolled ? styles.Scrolled : ''}`}>
            <div className={styles.Logo}>
                <img src="images/logo.png" alt="Logo" />
            </div>
            <div className={styles.Actions}>
                <ChainSelector />
                <ConnectKitButton />
            </div>
        </header>
    );
}
