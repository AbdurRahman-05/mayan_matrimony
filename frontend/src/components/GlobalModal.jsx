import React, { useState, useEffect } from 'react';
import './GlobalModal.css';

let modalRef = null;

export const showModal = (options) => {
    if (modalRef) {
        return modalRef.show(options);
    }
    return Promise.reject("Modal not initialized");
};

export const showAlert = (message, title = "Alert") => {
    return showModal({ type: 'alert', message, title });
};

export const showConfirm = (message, title = "Confirm Action") => {
    return showModal({ type: 'confirm', message, title });
};

const GlobalModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState({});
    const [resolvePromise, setResolvePromise] = useState(null);

    useEffect(() => {
        modalRef = {
            show: (newOptions) => {
                setOptions(newOptions);
                setIsOpen(true);
                return new Promise((resolve) => {
                    setResolvePromise(() => resolve);
                });
            }
        };
        return () => {
            modalRef = null;
        };
    }, []);

    const handleClose = (result) => {
        setIsOpen(false);
        if (resolvePromise) {
            resolvePromise(result);
        }
    };

    if (!isOpen) return null;

    const { type, title, message } = options;

    return (
        <div className="global-modal-overlay">
            <div className="global-modal-content">
                <h3 className="global-modal-title">{title}</h3>
                <p className="global-modal-message">{message}</p>
                <div className="global-modal-actions">
                    {type === 'confirm' ? (
                        <>
                            <button className="global-modal-btn yes" onClick={() => handleClose(true)}>Yes</button>
                            <button className="global-modal-btn no" onClick={() => handleClose(false)}>No</button>
                        </>
                    ) : (
                        <button className="global-modal-btn ok" onClick={() => handleClose(true)}>OK</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalModal;
