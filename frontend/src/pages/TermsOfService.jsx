import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './LegalPage.css';

const TermsOfService = () => {
    return (
        <div className="legal-page">
            <Navbar />
            <div className="legal-container">
                <div className="legal-header">
                    <h1>Terms of Service</h1>
                    <p>Last Updated: October 2024</p>
                </div>
                <div className="legal-content">
                    <h2>1. Acceptance of Terms</h2>
                    <p>By accessing and using Sri Mayan Matrimony, you accept and agree to be bound by the terms and provisions of this agreement. Our platform is completely free to use and serves as a medium to help individuals find prospective life partners.</p>

                    <h2>2. Eligibility</h2>
                    <p>You must be at least 18 years of age (for women) or 21 years of age (for men) to register and use our platform. By registering, you confirm that you are legally competent to enter into matrimony under the laws applicable to you.</p>

                    <h2>3. Account Responsibilities</h2>
                    <p>You are responsible for maintaining the confidentiality of your login credentials. All information provided by you must be accurate, current, and true. Sri Mayan Matrimony reserves the right to suspend or terminate accounts that contain false or misleading information.</p>

                    <h2>4. User Conduct</h2>
                    <p>You agree to use this platform solely for the purpose of finding a life partner. You must not use the platform for any commercial purposes, harassment, abusive behavior, or any illegal activities. We hold a zero-tolerance policy for offensive language and inappropriate conduct.</p>

                    <h2>5. Disclaimer of Liability</h2>
                    <p>Sri Mayan Matrimony acts solely as a platform to connect individuals. We do not guarantee marriage or background verify every user. It is the responsibility of the users and their families to conduct proper background checks before proceeding with any matrimonial alliance.</p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default TermsOfService;
