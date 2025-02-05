import React from 'react';
import styles from './Modal.module.scss';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.Overlay} onClick={onClose}>
            <div className={`${styles.Modal} ${className || ''}`} onClick={e => e.stopPropagation()}>
                {title && <h2 className={styles.Title}>{title}</h2>}
                {children}
            </div>
        </div>
    );
} 