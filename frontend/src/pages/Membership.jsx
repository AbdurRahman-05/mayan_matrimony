import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Crown, Shield, Award, Gem, Check, X, MessageCircle, Eye, Heart, Star, Search, UserCheck, BadgeCheck, Zap } from 'lucide-react';
import './Membership.css';

const plans = [
    {
        id: 'bronze',
        name: 'Bronze',
        price: '₹1,499',
        duration: '3 Months',
        period: '/3 mo',
        icon: <Shield size={28} />,
        features: [
            { text: 'View up to 50 contact numbers', included: true },
            { text: 'Send up to 50 interests', included: true },
            { text: 'View profile photos', included: true },
            { text: 'Shortlist up to 100 profiles', included: true },
            { text: 'Basic search filters', included: true },
            { text: 'Priority customer support', included: false },
            { text: 'Profile boost', included: false },
            { text: 'Verified badge', included: false },
        ],
    },
    {
        id: 'silver',
        name: 'Silver',
        price: '₹2,999',
        duration: '6 Months',
        period: '/6 mo',
        icon: <Award size={28} />,
        features: [
            { text: 'View up to 150 contact numbers', included: true },
            { text: 'Send unlimited interests', included: true },
            { text: 'View profile photos', included: true },
            { text: 'Shortlist unlimited profiles', included: true },
            { text: 'Advanced search filters', included: true },
            { text: 'Priority customer support', included: false },
            { text: 'Profile boost (1x/month)', included: false },
            { text: 'Verified badge', included: false },
        ],
    },
    {
        id: 'gold',
        name: 'Gold',
        price: '₹4,999',
        duration: '12 Months',
        period: '/yr',
        icon: <Crown size={28} />,
        popular: true,
        features: [
            { text: 'View unlimited contact numbers', included: true },
            { text: 'Send unlimited interests', included: true },
            { text: 'View profile photos in HD', included: true },
            { text: 'Shortlist unlimited profiles', included: true },
            { text: 'Advanced search + horoscope match', included: true },
            { text: 'Priority customer support', included: true },
            { text: 'Profile boost (2x/month)', included: true },
            { text: 'Verified badge', included: false },
        ],
    },
    {
        id: 'diamond',
        name: 'Diamond',
        price: '₹7,999',
        duration: '12 Months',
        period: '/yr',
        icon: <Gem size={28} />,
        features: [
            { text: 'View unlimited contact numbers', included: true },
            { text: 'Send unlimited interests', included: true },
            { text: 'View profile photos in HD', included: true },
            { text: 'Shortlist unlimited profiles', included: true },
            { text: 'Advanced search + horoscope match', included: true },
            { text: 'Profile visitors insight', included: true },
            { text: 'Dedicated relationship manager', included: true },
            { text: 'Profile boost (4x/month)', included: true },
            { text: 'Verified badge + Top listing', included: true },
        ],
    },
];

const compareFeatures = [
    { label: 'View contact numbers', bronze: '50', silver: '150', gold: 'Unlimited', diamond: 'Unlimited' },
    { label: 'Send interests', bronze: '50', silver: 'Unlimited', gold: 'Unlimited', diamond: 'Unlimited' },
    { label: 'Profile photo access', bronze: true, silver: true, gold: 'HD', diamond: 'HD' },
    { label: 'Shortlist profiles', bronze: '100', silver: 'Unlimited', gold: 'Unlimited', diamond: 'Unlimited' },
    { label: 'Search filters', bronze: 'Basic', silver: 'Advanced', gold: 'Advanced+', diamond: 'Advanced+' },
    { label: 'Profile match score', bronze: false, silver: false, gold: true, diamond: true },
    { label: 'Priority support', bronze: false, silver: false, gold: true, diamond: true },
    { label: 'Relationship manager', bronze: false, silver: false, gold: false, diamond: true },
    { label: 'Profile boost', bronze: false, silver: false, gold: '2x/mo', diamond: '4x/mo' },
    { label: 'Verified badge', bronze: false, silver: false, gold: false, diamond: true },
    { label: 'Top listing', bronze: false, silver: false, gold: false, diamond: true },
];

const Membership = () => {
    const navigate = useNavigate();

    const handlePay = (plan) => {
        alert(`Payment for ${plan.name} plan (${plan.price}) — Payment gateway integration coming soon!`);
    };

    const renderCompareCell = (value) => {
        if (value === true) return <Check size={18} className="compare-check" />;
        if (value === false) return <X size={18} className="compare-cross" />;
        return <span style={{ fontWeight: 500, color: '#334155' }}>{value}</span>;
    };

    return (
        <div className="membership-page">
            <Navbar />
            <div className="membership-container">
                <div className="membership-layout">
                    {/* Header */}
                    <div className="membership-header">
                        <h1>Choose Your Membership Plan</h1>
                        <p>
                            Upgrade your account to connect with your perfect match. Get access to premium features and find your life partner faster.
                        </p>
                    </div>

                    {/* Plans Grid */}
                    <div className="membership-plans-grid">
                        {plans.map(plan => (
                            <div key={plan.id} className={`plan-card ${plan.id}`}>
                                {plan.popular && <div className="popular-badge">Most Popular</div>}

                                {/* Card Header */}
                                <div className="plan-card-header">
                                    <div className="plan-icon">{plan.icon}</div>
                                    <div className="plan-name">{plan.name}</div>
                                    <div className="plan-price">
                                        <span className="amount">{plan.price}</span>
                                        <span className="period">{plan.period}</span>
                                    </div>
                                    <div className="plan-duration">{plan.duration} validity</div>
                                </div>

                                {/* Card Body */}
                                <div className="plan-card-body">
                                    <div className="plan-features-title">What's included</div>
                                    <ul className="plan-features-list">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className={!feature.included ? 'disabled' : ''}>
                                                <span className="feature-icon">
                                                    {feature.included
                                                        ? <Check size={12} />
                                                        : <X size={12} />
                                                    }
                                                </span>
                                                <span>{feature.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        className="plan-pay-btn"
                                        id={`pay-${plan.id}`}
                                        onClick={() => handlePay(plan)}
                                    >
                                        <Zap size={18} />
                                        Pay {plan.price}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Compare Table */}
                    <div className="membership-compare">
                        <h2>Compare All Plans</h2>
                        <table className="compare-table">
                            <thead>
                                <tr>
                                    <th>Feature</th>
                                    <th>Bronze</th>
                                    <th>Silver</th>
                                    <th>Gold</th>
                                    <th>Diamond</th>
                                </tr>
                            </thead>
                            <tbody>
                                {compareFeatures.map((row, idx) => (
                                    <tr key={idx}>
                                        <td>{row.label}</td>
                                        <td>{renderCompareCell(row.bronze)}</td>
                                        <td>{renderCompareCell(row.silver)}</td>
                                        <td>{renderCompareCell(row.gold)}</td>
                                        <td>{renderCompareCell(row.diamond)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Membership;
