import React from 'react';
import './BrandedLoader.css';

const BrandedLoader = ({ message = 'Loading...', fullScreen = true }) => {
    const loaderContent = (
        <div className="branded-loader-box">
            <div className="branded-logo-wrapper">
                <div className="gold-spinner-ring"></div>
                <img src="/logo.png" alt="Sri Mayan Matrimony" className="branded-loader-logo" />
            </div>
            {message && <p className="branded-loader-message">{message}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="branded-loader-overlay">
                {loaderContent}
            </div>
        );
    }

    return loaderContent;
};

export default BrandedLoader;
