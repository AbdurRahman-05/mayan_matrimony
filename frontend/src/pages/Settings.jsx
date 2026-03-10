import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
    Settings as SettingsIcon, Lock, UserX, Trash2, EyeOff, ShieldOff,
    ArrowLeft, Eye, EyeOff as EyeOffIcon, CheckCircle, XCircle, AlertTriangle,
    Loader2, User, ChevronRight, Info, X
} from 'lucide-react';
import {
    verifyPassword, changePassword as apiChangePassword,
    deactivateProfile as apiDeactivateProfile, activateProfile as apiActivateProfile,
    getDeactivationStatus, deleteProfile as apiDeleteProfile,
    getIgnoredProfiles, removeFromIgnored as apiRemoveFromIgnored,
    getBlockedProfiles, removeFromBlocked as apiRemoveFromBlocked,
    logout as apiLogout
} from '../services/api';
import './Settings.css';

const Settings = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState(null);

    // Change password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordVerified, setPasswordVerified] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [verifyingPassword, setVerifyingPassword] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Deactivate state
    const [selectedDuration, setSelectedDuration] = useState('');
    const [deactivating, setDeactivating] = useState(false);
    const [deactivationStatus, setDeactivationStatus] = useState(null);
    const [activating, setActivating] = useState(false);

    // Delete profile state
    const [deleteReason, setDeleteReason] = useState('');
    const [otherReason, setOtherReason] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Ignored profiles state
    const [ignoredProfiles, setIgnoredProfiles] = useState([]);
    const [loadingIgnored, setLoadingIgnored] = useState(false);
    const [removingIgnored, setRemovingIgnored] = useState('');

    // Blocked profiles state
    const [blockedProfiles, setBlockedProfiles] = useState([]);
    const [loadingBlocked, setLoadingBlocked] = useState(false);
    const [removingBlocked, setRemovingBlocked] = useState('');

    // General
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    // Check deactivation on mount
    useEffect(() => {
        checkDeactivation();
    }, []);

    const checkDeactivation = async () => {
        try {
            const status = await getDeactivationStatus();
            setDeactivationStatus(status);
        } catch (e) {
            // Ignore if endpoint doesn't exist yet
        }
    };

    const showStatus = (type, text) => {
        setStatusMsg({ type, text });
        setTimeout(() => setStatusMsg({ type: '', text: '' }), 5000);
    };

    // Section handlers
    const handleSectionChange = async (section) => {
        setActiveSection(section);
        setStatusMsg({ type: '', text: '' });

        // Reset states
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordVerified(false);
        setSelectedDuration('');
        setDeleteReason('');
        setOtherReason('');

        if (section === 'ignored') {
            loadIgnoredProfiles();
        } else if (section === 'blocked') {
            loadBlockedProfiles();
        }
    };

    // ============ CHANGE PASSWORD ============
    const handleVerifyPassword = async () => {
        if (!currentPassword) {
            showStatus('error', 'Please enter your current password');
            return;
        }
        setVerifyingPassword(true);
        try {
            await verifyPassword(currentPassword);
            setPasswordVerified(true);
            showStatus('success', 'Current password verified successfully!');
        } catch (e) {
            showStatus('error', e.message || 'Current password is incorrect');
            setPasswordVerified(false);
        } finally {
            setVerifyingPassword(false);
        }
    };

    const getPasswordStrength = (pwd) => {
        if (!pwd) return null;
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        if (score <= 1) return 'weak';
        if (score <= 2) return 'medium';
        return 'strong';
    };

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) {
            showStatus('error', 'Please fill in all fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            showStatus('error', 'New password and confirm password do not match');
            return;
        }
        if (newPassword.length < 8) {
            showStatus('error', 'New password must be at least 8 characters');
            return;
        }
        setChangingPassword(true);
        try {
            await apiChangePassword(currentPassword, newPassword, confirmPassword);
            showStatus('success', 'Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordVerified(false);
        } catch (e) {
            showStatus('error', e.message || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    // ============ DEACTIVATE ============
    const handleDeactivate = async () => {
        if (!selectedDuration) {
            showStatus('error', 'Please select a deactivation duration');
            return;
        }
        setDeactivating(true);
        try {
            await apiDeactivateProfile(selectedDuration);
            showStatus('success', 'Profile deactivated successfully');
            localStorage.setItem('isDeactivated', 'true');
            await checkDeactivation();
        } catch (e) {
            showStatus('error', e.message || 'Failed to deactivate profile');
        } finally {
            setDeactivating(false);
        }
    };

    const handleActivate = async () => {
        setActivating(true);
        try {
            await apiActivateProfile();
            localStorage.removeItem('isDeactivated');
            setDeactivationStatus({ isDeactivated: false });
            showStatus('success', 'Profile activated successfully!');
        } catch (e) {
            showStatus('error', e.message || 'Failed to activate profile');
        } finally {
            setActivating(false);
        }
    };

    // ============ DELETE PROFILE ============
    const handleDeleteProfile = async () => {
        setDeleting(true);
        try {
            await apiDeleteProfile(deleteReason, otherReason, true);
            apiLogout();
            navigate('/');
        } catch (e) {
            showStatus('error', e.message || 'Failed to delete profile');
            setShowDeleteConfirm(false);
        } finally {
            setDeleting(false);
        }
    };

    // ============ IGNORED PROFILES ============
    const loadIgnoredProfiles = async () => {
        setLoadingIgnored(true);
        try {
            const profiles = await getIgnoredProfiles();
            setIgnoredProfiles(profiles);
        } catch (e) {
            showStatus('error', 'Failed to load ignored profiles');
        } finally {
            setLoadingIgnored(false);
        }
    };

    const handleRemoveIgnored = async (uniqueId) => {
        setRemovingIgnored(uniqueId);
        try {
            await apiRemoveFromIgnored(uniqueId);
            setIgnoredProfiles(prev => prev.filter(p => p.uniqueId !== uniqueId));
            showStatus('success', 'Removed from ignored list');
        } catch (e) {
            showStatus('error', e.message || 'Failed to remove from ignored list');
        } finally {
            setRemovingIgnored('');
        }
    };

    // ============ BLOCKED PROFILES ============
    const loadBlockedProfiles = async () => {
        setLoadingBlocked(true);
        try {
            const profiles = await getBlockedProfiles();
            setBlockedProfiles(profiles);
        } catch (e) {
            showStatus('error', 'Failed to load blocked profiles');
        } finally {
            setLoadingBlocked(false);
        }
    };

    const handleRemoveBlocked = async (uniqueId) => {
        setRemovingBlocked(uniqueId);
        try {
            await apiRemoveFromBlocked(uniqueId);
            setBlockedProfiles(prev => prev.filter(p => p.uniqueId !== uniqueId));
            showStatus('success', 'Removed from blocked list');
        } catch (e) {
            showStatus('error', e.message || 'Failed to remove from blocked list');
        } finally {
            setRemovingBlocked('');
        }
    };

    // ============ DEACTIVATION SCREEN ============
    if (deactivationStatus?.isDeactivated) {
        return (
            <div className="deactivation-screen">
                <div className="deactivation-card">
                    <div className="deactivation-icon">
                        <EyeOff size={36} color="#D4AF37" />
                    </div>
                    <h2>Your Profile is Deactivated</h2>
                    <p>Your profile is currently hidden from other users. You will not receive interests, messages, or matches during this period.</p>
                    {deactivationStatus.reactivateAt && (
                        <span className="deactivation-date">
                            Scheduled reactivation: {new Date(deactivationStatus.reactivateAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    )}
                    <button className="activate-btn" onClick={handleActivate} disabled={activating}>
                        {activating ? <Loader2 size={20} className="spin" /> : <CheckCircle size={20} />}
                        {activating ? 'Activating...' : 'Activate Your Profile Now'}
                    </button>
                </div>
            </div>
        );
    }

    // ============ PASSWORD STRENGTH INDICATOR ============
    const passwordStrength = getPasswordStrength(newPassword);

    const navItems = [
        { id: 'password', label: 'Change Password', icon: <Lock size={18} color="#D4AF37" /> },
        { id: 'delete', label: 'Delete Profile', icon: <Trash2 size={18} color="#ef4444" /> },
        { id: 'deactivate', label: 'Deactivate Profile', icon: <EyeOff size={18} color="#ec4899" /> },
        { id: 'ignored', label: 'Ignored Profiles', icon: <UserX size={18} color="#3b82f6" /> },
        { id: 'blocked', label: 'Blocked Profiles', icon: <ShieldOff size={18} color="#8b5cf6" /> },
    ];

    const durationOptions = [
        { value: '15_days', label: '15 Days' },
        { value: '1_month', label: '1 Month' },
        { value: '2_months', label: '2 Months' },
        { value: '3_months', label: '3 Months' },
    ];

    const deleteReasons = [
        'Marriage fixed',
        'Married',
        'Other reasons',
    ];

    const renderProfileItem = (profile, type) => {
        const isRemoving = type === 'ignored' ? removingIgnored === profile.uniqueId : removingBlocked === profile.uniqueId;
        const handleRemove = type === 'ignored' ? handleRemoveIgnored : handleRemoveBlocked;

        const details = [
            profile.age && `${profile.age} yrs`,
            profile.height,
            profile.religion,
            profile.city,
        ].filter(Boolean).join(' • ');

        return (
            <div className="profile-list-item" key={profile.uniqueId}>
                <div className="profile-list-avatar">
                    {profile.photo ? (
                        <img src={profile.photo} alt={profile.fullName} />
                    ) : (
                        <User size={28} color="#9ca3af" />
                    )}
                </div>
                <div className="profile-list-info">
                    <div className="profile-list-name">{profile.fullName}</div>
                    <div className="profile-list-id">{profile.uniqueId}</div>
                    {details && <div className="profile-list-details">{details}</div>}
                </div>
                <button
                    className="profile-list-remove-btn"
                    onClick={() => handleRemove(profile.uniqueId)}
                    disabled={isRemoving}
                >
                    {isRemoving ? (
                        <Loader2 size={14} />
                    ) : (
                        <X size={14} />
                    )}
                    {type === 'ignored' ? 'Remove from Ignored' : 'Remove from Blocked'}
                </button>
            </div>
        );
    };

    return (
        <div className="settings-page">
            <Navbar />

            <div className="settings-container">
                {/* Settings Sidebar */}
                <aside className="settings-sidebar">
                    <div className="settings-sidebar-card">
                        <div className="settings-sidebar-header">
                            <SettingsIcon size={22} />
                            <h2>Settings</h2>
                        </div>

                        <div className="settings-nav">
                            {navItems.map(item => (
                                <div
                                    key={item.id}
                                    className={`settings-nav-item ${activeSection === item.id ? 'active' : ''}`}
                                    onClick={() => handleSectionChange(item.id)}
                                >
                                    <div className="nav-icon">{item.icon}</div>
                                    {item.label}
                                </div>
                            ))}
                        </div>

                        <div className="settings-back-btn" onClick={() => navigate('/home')}>
                            <ArrowLeft size={16} />
                            Back to Home
                        </div>
                    </div>
                </aside>

                {/* Settings Content */}
                <main className="settings-content">
                    <div className="settings-content-card">
                        {/* Status Message */}
                        {statusMsg.text && (
                            <div className={`status-message ${statusMsg.type}`} style={{ margin: '20px 30px 0' }}>
                                {statusMsg.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                {statusMsg.text}
                            </div>
                        )}

                        {/* Welcome State */}
                        {!activeSection && (
                            <div className="settings-welcome">
                                <div className="settings-welcome-icon">
                                    <SettingsIcon size={36} color="#D4AF37" />
                                </div>
                                <h3>Account Settings</h3>
                                <p>Manage your account settings, change password, control your profile visibility, and manage ignored or blocked profiles.</p>
                            </div>
                        )}

                        {/* ============ CHANGE PASSWORD ============ */}
                        {activeSection === 'password' && (
                            <>
                                <div className="settings-content-header">
                                    <div className="header-icon" style={{ background: '#fef3c7' }}>
                                        <Lock size={22} color="#D4AF37" />
                                    </div>
                                    <h2>Change Password</h2>
                                </div>
                                <div className="settings-content-body">
                                    <div className="password-form">
                                        <div className="form-group">
                                            <label>Enter Current Password</label>
                                            <div className="input-wrapper">
                                                <input
                                                    type={showCurrentPassword ? 'text' : 'password'}
                                                    value={currentPassword}
                                                    onChange={(e) => {
                                                        setCurrentPassword(e.target.value);
                                                        if (passwordVerified) setPasswordVerified(false);
                                                    }}
                                                    placeholder="Enter your current password"
                                                    className={passwordVerified ? 'success' : ''}
                                                    disabled={passwordVerified}
                                                />
                                                <button
                                                    className="toggle-password-btn"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    type="button"
                                                >
                                                    {showCurrentPassword ? <EyeOffIcon size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                            {passwordVerified && (
                                                <div className="verification-badge verified">
                                                    <CheckCircle size={14} /> Password verified
                                                </div>
                                            )}
                                            {!passwordVerified && (
                                                <button
                                                    className="settings-btn primary verify-btn"
                                                    onClick={handleVerifyPassword}
                                                    disabled={verifyingPassword || !currentPassword}
                                                >
                                                    {verifyingPassword ? (
                                                        <><Loader2 size={16} /> Verifying...</>
                                                    ) : (
                                                        <><CheckCircle size={16} /> Verify Password</>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {passwordVerified && (
                                            <>
                                                <div className="form-group">
                                                    <label>Enter New Password</label>
                                                    <div className="input-wrapper">
                                                        <input
                                                            type={showNewPassword ? 'text' : 'password'}
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            placeholder="Enter new password (min. 8 characters)"
                                                        />
                                                        <button
                                                            className="toggle-password-btn"
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                            type="button"
                                                        >
                                                            {showNewPassword ? <EyeOffIcon size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>
                                                    {passwordStrength && (
                                                        <div className="password-strength">
                                                            <div className="strength-bar">
                                                                <div className={`strength-fill ${passwordStrength}`}></div>
                                                            </div>
                                                            <span className={`strength-text ${passwordStrength}`}>
                                                                {passwordStrength === 'weak' ? 'Weak password' :
                                                                    passwordStrength === 'medium' ? 'Medium strength' : 'Strong password'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="form-group">
                                                    <label>Confirm New Password</label>
                                                    <div className="input-wrapper">
                                                        <input
                                                            type={showConfirmPassword ? 'text' : 'password'}
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            placeholder="Re-enter new password"
                                                            className={confirmPassword && confirmPassword !== newPassword ? 'error' : confirmPassword && confirmPassword === newPassword ? 'success' : ''}
                                                        />
                                                        <button
                                                            className="toggle-password-btn"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            type="button"
                                                        >
                                                            {showConfirmPassword ? <EyeOffIcon size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>
                                                    {confirmPassword && confirmPassword !== newPassword && (
                                                        <div className="verification-badge not-verified">
                                                            <XCircle size={14} /> Passwords do not match
                                                        </div>
                                                    )}
                                                    {confirmPassword && confirmPassword === newPassword && (
                                                        <div className="verification-badge verified">
                                                            <CheckCircle size={14} /> Passwords match
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="btn-group">
                                                    <button
                                                        className="settings-btn primary"
                                                        onClick={handleChangePassword}
                                                        disabled={changingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                                                    >
                                                        {changingPassword ? (
                                                            <><Loader2 size={16} /> Changing...</>
                                                        ) : (
                                                            <><Lock size={16} /> Change Password</>
                                                        )}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ============ DEACTIVATE PROFILE ============ */}
                        {activeSection === 'deactivate' && (
                            <>
                                <div className="settings-content-header">
                                    <div className="header-icon" style={{ background: '#fce7f3' }}>
                                        <EyeOff size={22} color="#ec4899" />
                                    </div>
                                    <h2>Deactivate Profile</h2>
                                </div>
                                <div className="settings-content-body">
                                    <div className="deactivate-form">
                                        <div className="deactivate-info">
                                            <Info size={20} color="#92400e" />
                                            <p>
                                                When your profile is deactivated, other users will not be able to see your profile.
                                                You will not receive interests, messages, or matches during the deactivation period.
                                                You can reactivate your profile at any time by logging in.
                                            </p>
                                        </div>

                                        <div className="form-group">
                                            <label>Select Deactivation Duration</label>
                                            <div className="duration-options">
                                                {durationOptions.map(opt => (
                                                    <div
                                                        key={opt.value}
                                                        className={`duration-option ${selectedDuration === opt.value ? 'selected' : ''}`}
                                                        onClick={() => setSelectedDuration(opt.value)}
                                                    >
                                                        <div className="duration-radio">
                                                            <div className="duration-radio-inner"></div>
                                                        </div>
                                                        <span className="duration-label">{opt.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="btn-group">
                                            <button
                                                className="settings-btn danger"
                                                onClick={handleDeactivate}
                                                disabled={deactivating || !selectedDuration}
                                            >
                                                {deactivating ? (
                                                    <><Loader2 size={16} /> Deactivating...</>
                                                ) : (
                                                    <><EyeOff size={16} /> Deactivate Profile</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ============ DELETE PROFILE ============ */}
                        {activeSection === 'delete' && (
                            <>
                                <div className="settings-content-header">
                                    <div className="header-icon" style={{ background: '#fee2e2' }}>
                                        <Trash2 size={22} color="#ef4444" />
                                    </div>
                                    <h2>Delete Profile</h2>
                                </div>
                                <div className="settings-content-body">
                                    <div className="delete-form">
                                        <div className="delete-warning">
                                            <AlertTriangle size={22} color="#dc2626" />
                                            <p>
                                                <strong>Note:</strong> If you delete your profile, it cannot be restored.
                                                Your profile ID, password, and all related data will be permanently removed.
                                                This action is irreversible.
                                            </p>
                                        </div>

                                        <div className="form-group">
                                            <label>Please select a reason for deleting your profile</label>
                                            <div className="reason-options">
                                                {deleteReasons.map(reason => (
                                                    <div
                                                        key={reason}
                                                        className={`reason-option ${deleteReason === reason ? 'selected' : ''}`}
                                                        onClick={() => setDeleteReason(reason)}
                                                    >
                                                        <div className="reason-radio">
                                                            <div className="reason-radio-inner"></div>
                                                        </div>
                                                        <span className="reason-label">{reason}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {deleteReason === 'Other reasons' && (
                                            <div className="other-reason-input">
                                                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                                    Please tell us your reason
                                                </label>
                                                <textarea
                                                    value={otherReason}
                                                    onChange={(e) => setOtherReason(e.target.value)}
                                                    placeholder="Enter your reason for deleting the profile..."
                                                />
                                            </div>
                                        )}

                                        <div className="btn-group">
                                            <button
                                                className="settings-btn danger"
                                                onClick={() => setShowDeleteConfirm(true)}
                                                disabled={!deleteReason || (deleteReason === 'Other reasons' && !otherReason.trim())}
                                            >
                                                <Trash2 size={16} /> Delete Profile
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ============ IGNORED PROFILES ============ */}
                        {activeSection === 'ignored' && (
                            <>
                                <div className="settings-content-header">
                                    <div className="header-icon" style={{ background: '#e0f2fe' }}>
                                        <UserX size={22} color="#3b82f6" />
                                    </div>
                                    <h2>Ignored Profiles</h2>
                                </div>
                                <div className="settings-content-body">
                                    {loadingIgnored ? (
                                        <div className="settings-loading">
                                            <Loader2 size={32} color="#D4AF37" />
                                        </div>
                                    ) : ignoredProfiles.length === 0 ? (
                                        <div className="profiles-list-empty">
                                            <div className="profiles-list-empty-icon">
                                                <UserX size={32} color="#9ca3af" />
                                            </div>
                                            <h4>No Ignored Profiles</h4>
                                            <p>You haven't ignored any profiles yet.</p>
                                        </div>
                                    ) : (
                                        <div className="profiles-list">
                                            {ignoredProfiles.map(profile => renderProfileItem(profile, 'ignored'))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* ============ BLOCKED PROFILES ============ */}
                        {activeSection === 'blocked' && (
                            <>
                                <div className="settings-content-header">
                                    <div className="header-icon" style={{ background: '#ede9fe' }}>
                                        <ShieldOff size={22} color="#8b5cf6" />
                                    </div>
                                    <h2>Blocked Profiles</h2>
                                </div>
                                <div className="settings-content-body">
                                    {loadingBlocked ? (
                                        <div className="settings-loading">
                                            <Loader2 size={32} color="#D4AF37" />
                                        </div>
                                    ) : blockedProfiles.length === 0 ? (
                                        <div className="profiles-list-empty">
                                            <div className="profiles-list-empty-icon">
                                                <ShieldOff size={32} color="#9ca3af" />
                                            </div>
                                            <h4>No Blocked Profiles</h4>
                                            <p>You haven't blocked any profiles yet.</p>
                                        </div>
                                    ) : (
                                        <div className="profiles-list">
                                            {blockedProfiles.map(profile => renderProfileItem(profile, 'blocked'))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-modal-icon danger">
                            <AlertTriangle size={28} color="#ef4444" />
                        </div>
                        <h3>Are you sure you want to delete your profile?</h3>
                        <p>
                            This action is permanent and cannot be undone. Your profile ID, password,
                            and all related data will be permanently deleted.
                        </p>
                        <div className="confirm-modal-btns">
                            <button
                                className="settings-btn outline"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleting}
                            >
                                No, Keep My Profile
                            </button>
                            <button
                                className="settings-btn danger"
                                onClick={handleDeleteProfile}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <><Loader2 size={16} /> Deleting...</>
                                ) : (
                                    'Yes, Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Settings;
