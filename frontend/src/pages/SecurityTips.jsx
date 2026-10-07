import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './LegalPage.css';

const SecurityTips = () => {
    return (
        <div className="legal-page">
            <Navbar />
            <div className="legal-container">
                <div className="legal-header">
                    <h1>Security & Safety Tips</h1>
                    <p>Your safety is our top priority.</p>
                </div>
                <div className="legal-content">
                    <h2>1. Protect Your Personal Information</h2>
                    <p>Do not share sensitive financial information like bank account numbers, credit card details, or UPI IDs with anyone on the platform. We will never ask for such information over chat or email.</p>

                    <h2>2. Meet in Public Places</h2>
                    <p>When meeting a prospective match for the first time, always choose a safe, public location such as a cafe or restaurant. Inform a friend or family member about your meeting details.</p>

                    <h2>3. Verify Profiles Independently</h2>
                    <p>While we strive to keep our platform authentic, we strongly advise you and your family to conduct your own independent background checks before committing to a matrimonial alliance.</p>

                    <h2>4. Report Suspicious Behavior</h2>
                    <p>If you encounter a user asking for money, behaving inappropriately, or providing inconsistent information, please use the 'Report' button on their profile immediately to alert our moderation team.</p>

                    <h2>5. Beware of Scams</h2>
                    <p>Be cautious of individuals who claim to be in an emergency and ask for financial help. Genuine individuals seeking marriage will not ask for money under any circumstances.</p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default SecurityTips;
