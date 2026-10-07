import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './LegalPage.css';

const RefundPolicy = () => {
    return (
        <div className="legal-page">
            <Navbar />
            <div className="legal-container">
                <div className="legal-header">
                    <h1>Refund & Cancellation Policy</h1>
                    <p>Last Updated: October 2024</p>
                </div>
                <div className="legal-content">
                    <h2>1. 100% Free Service</h2>
                    <p>Sri Mayan Matrimony is currently a completely <strong>free platform</strong>. We do not charge any registration fees, hidden charges, or mandatory subscription fees to use our core matchmaking services.</p>

                    <h2>2. No Payments Required</h2>
                    <p>Since we do not collect any payments, credit card information, or banking details from our users for our standard services, a refund policy is not applicable. There is nothing to cancel or refund.</p>

                    <h2>3. Voluntary Contributions</h2>
                    <p>Any future premium plans or voluntary contributions made to the platform will be clearly marked as such, and specific terms regarding their cancellation will be provided at the time of purchase. Until such features are implemented, the platform remains 100% free of charge.</p>

                    <h2>4. Account Deletion</h2>
                    <p>You are free to delete your account and cancel your registration on the platform at any time without any financial obligations or penalties.</p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default RefundPolicy;
