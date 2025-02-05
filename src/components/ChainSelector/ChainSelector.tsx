import React, { useState, useRef, useEffect } from 'react';
import styles from './ChainSelector.module.scss';
import { configuration } from '../../config/config';
import { useChainId, useSwitchChain } from 'wagmi';
import classNames from 'classnames';

export default function ChainSelector() {
    const chainId = useChainId();
    const { switchChain, isPending } = useSwitchChain();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentChain = configuration.chains.find(c => c.chainId === chainId);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChainSelect = (selectedChainId: number) => {
        switchChain?.({ chainId: selectedChainId });
        setIsOpen(false);
    };

    return (
        <div className={styles.ChainSelector} ref={dropdownRef}>
            <div 
                className={styles.SelectedChain} 
                onClick={() => !isPending && setIsOpen(!isOpen)}
            >
                {currentChain && (
                    <>
                        <img 
                            src={currentChain.iconPath} 
                            alt={currentChain.name} 
                            className={styles.ChainIcon}
                        />
                        <span className={styles.ChainName}>{currentChain.name}</span>
                    </>
                )}
                {isPending && <div className={styles.LoadingIndicator} />}
            </div>

            {isOpen && (
                <div className={styles.Dropdown}>
                    {configuration.chains.map((chainConfig) => (
                        <div
                            key={chainConfig.chainId}
                            className={classNames(styles.DropdownItem, {
                                [styles.Selected]: chainConfig.chainId === chainId
                            })}
                            onClick={() => handleChainSelect(chainConfig.chainId)}
                        >
                            <img 
                                src={chainConfig.iconPath} 
                                alt={chainConfig.name} 
                                className={styles.ChainIcon}
                            />
                            <span className={styles.ChainName}>{chainConfig.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 