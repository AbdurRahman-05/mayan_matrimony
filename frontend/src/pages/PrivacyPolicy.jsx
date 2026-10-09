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

                    <h2>4. Account Deletion and Data Retention</h2>
                    <p>You have full control over your account. If you wish to delete your account and associated data from Sri Mayan Matrimony, you can do so by following these steps:</p>
                    <ul>
                        <li>Log in to your account.</li>
                        <li>Navigate to <strong>Settings</strong> from the bottom menu.</li>
                        <li>Select <strong>Account</strong>.</li>
                        <li>Tap on <strong>Delete Account</strong> and confirm your choice.</li>
                    </ul>
                    <p><strong>What gets deleted:</strong> Upon account deletion, your profile information, photos, preferences, and chat history are permanently erased from our active databases.</p>
                    <p><strong>What gets kept:</strong> We may retain certain log data (such as IP addresses and device information) for up to 90 days strictly for security, fraud prevention, and legal compliance purposes before it is securely purged.</p>

                    <h2>5. Contact Us</h2>
                    <p>If you have any questions or concerns regarding this privacy policy or how your data is handled, please contact our support team at support@srimayan.com.</p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
