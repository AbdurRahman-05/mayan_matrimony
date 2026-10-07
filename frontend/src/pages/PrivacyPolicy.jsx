import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './LegalPage.css';

const PrivacyPolicy = () => {
    return (
        <div className="legal-page">
            <Navbar />
            <div className="legal-container">
                <div className="legal-header">
                    <h1>Privacy Policy</h1>
                    <p>Last Updated: October 2024</p>
                </div>
                <div className="legal-content">
                    <h2>1. Information We Collect</h2>
                    <p>When you register on Sri Mayan Matrimony, we collect personal information such as your name, date of birth, contact details, educational background, occupation, religion, and caste. We also collect profile photos and identity verification documents if voluntarily provided.</p>

                    <h2>2. How We Use Your Information</h2>
                    <p>The information collected is strictly used to provide matrimonial matchmaking services. We use this data to display your profile to potential matches, send you relevant notifications, and help you connect with suitable profiles.</p>

                    <h2>3. Data Security</h2>
                    <p>We implement robust security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. We do not sell or rent your personal information to third-party marketers.</p>

                    <h2>4. Visibility and Control</h2>
                    <p>Your profile information is visible to other registered users of Sri Mayan Matrimony to facilitate matchmaking. You have full control over your account settings and can modify your privacy preferences, hide your profile, or delete your account at any time.</p>

                    <h2>5. Contact Us</h2>
                    <p>If you have any questions or concerns regarding this privacy policy or how your data is handled, please contact our support team at support@srimayan.com.</p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
