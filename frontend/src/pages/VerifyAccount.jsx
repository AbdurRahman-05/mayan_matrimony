import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp as apiSendOtp, verifyOtp as apiVerifyOtp } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ShieldCheck, Loader2 } from 'lucide-react';
import './Register.css';

const VerifyAccount = () => {
    const navigate = useNavigate();
    const [mobile, setMobile] = useState('');
    const [verificationSent, setVerificationSent] = useState(false);
    const [verificationOtp, setVerificationOtp] = useState('');
    const [verificationError, setVerificationError] = useState('');
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        try {
            const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            if (userProfile.mobile) {
                setMobile(userProfile.mobile);
            }
            if (userProfile.isVerified === true) {
                navigate('/home');
            }
        } catch (e) {
            console.error(e);
        }
    }, [navigate]);

    const handleSendOtp = async () => {
        if (!mobile || mobile.length < 10) {
            setVerificationError('Invalid mobile number');
            return;
        }
        setLoading(true);
        setVerificationError('');
        try {
            await apiSendOtp('register', mobile);
            setVerificationSent(true);
        } catch (err) {
            // Even if API fails in dev, allow fallback
            setVerificationSent(true);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!verificationOtp || verificationOtp.length < 4) {
            setVerificationError('Please enter a valid OTP');
            return;
        }
        
        setLoading(true);
        setVerificationError('');
        try {
            const result = await apiVerifyOtp(mobile, verificationOtp);
            
            // Re-fetch profile or update local storage
            const currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            currentProfile.isVerified = true;
            localStorage.setItem('userProfile', JSON.stringify(currentProfile));
            
            setVerificationSuccess(true);
            setTimeout(() => {
                navigate('/home');
            }, 2000);
        } catch (err) {
            setVerificationError(err.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f7fa' }}>
            <Navbar />
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', maxWidth: '450px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', textAlign: 'center' }}>
                    <div style={{ margin: '0 auto 25px', width: '70px', height: '70px', background: '#eafaf1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                        <ShieldCheck size={36} />
                    </div>
                    
                    <h2 style={{ color: '#2d3748', fontSize: '1.6rem', fontWeight: 600, marginBottom: '15px' }}>Verify Your Account</h2>
                    <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '30px', lineHeight: '1.6' }}>
                        To access all features and continue your journey on Sri Mayan, please verify your mobile number.
                    </p>

                    {verificationSuccess ? (
                        <div style={{ background: '#eafaf1', border: '1px solid #10b981', borderRadius: '8px', padding: '20px', color: '#10b981' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '5px' }}>Verification Successful!</h3>
                            <p style={{ fontSize: '0.9rem' }}>Redirecting you to the home page...</p>
                        </div>
                    ) : !verificationSent ? (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 15px', marginBottom: '25px', justifyContent: 'center' }}>
                                <span style={{ color: '#64748b', fontWeight: 500, marginRight: '10px' }}>+91</span>
                                <span style={{ color: '#1e293b', fontSize: '1.05rem', fontWeight: 500, letterSpacing: '1px' }}>{mobile}</span>
                            </div>
                            
                            <button 
                                onClick={handleSendOtp}
                                disabled={loading}
                                style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.3s' }}
                            >
                                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Send Verification OTP'}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '15px' }}>Enter the OTP sent to +91 {mobile}</p>
                            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                                <input
                                    type="text"
                                    placeholder="------"
                                    value={verificationOtp}
                                    onChange={(e) => { setVerificationOtp(e.target.value); setVerificationError(''); }}
                                    maxLength={6}
                                    style={{ border: '2px solid #e2e8f0', borderRadius: '8px', padding: '15px', fontSize: '1.2rem', width: '160px', textAlign: 'center', letterSpacing: '6px', outline: 'none', transition: 'border-color 0.3s' }}
                                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                />
                            </div>
                            
                            {verificationError && (
                                <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginBottom: '15px' }}>{verificationError}</p>
                            )}
                            
                            <button 
                                onClick={handleVerifyOtp}
                                disabled={loading}
                                style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.3s', marginBottom: '15px' }}
                            >
                                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Verify & Continue'}
                            </button>
                            
                            <button 
                                onClick={() => { setVerificationSent(false); setVerificationOtp(''); setVerificationError(''); }}
                                style={{ background: 'none', border: 'none', color: '#3182ce', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Use a different number or resend
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default VerifyAccount;
