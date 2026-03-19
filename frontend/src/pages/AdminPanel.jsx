import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showAlert } from '../components/GlobalModal';
import './AdminPanel.css';

const AdminPanel = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginId, setLoginId] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const [forgotStep, setForgotStep] = useState('login'); // 'login', 'email', 'otp', 'reset'
    const [resetEmail, setResetEmail] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetMessage, setResetMessage] = useState('');

    const [stats, setStats] = useState({ totalUsers: 0 });
    const [loading, setLoading] = useState(true);
    const [uploadStatus, setUploadStatus] = useState({ message: '', error: false });

    const [usersList, setUsersList] = useState([]);
    const [showUsers, setShowUsers] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [fullProfile, setFullProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);

    const [filterGender, setFilterGender] = useState('');
    const [filterReligion, setFilterReligion] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            fetchStats();
            fetchStoryData();
        }
    }, [isAuthenticated]);

    // Story editing state
    const [storyData, setStoryData] = useState({
        story1: { coupleName: '', description: '' },
        story2: { coupleName: '', description: '' },
        story3: { coupleName: '', description: '' }
    });
    const [storyStatus, setStoryStatus] = useState({ message: '', error: false });
    const [savingStories, setSavingStories] = useState(false);

    const [showStorage, setShowStorage] = useState(false);
    const [storageData, setStorageData] = useState(null);
    const [loadingStorage, setLoadingStorage] = useState(false);

    const fetchStorageDetails = async () => {
        setShowStorage(true);
        setLoadingStorage(true);
        try {
            const response = await fetch('/api/admin/storage');
            if (response.ok) {
                const data = await response.json();
                setStorageData(data);
            } else {
                showAlert('Failed to fetch storage details', 'Error');
                setShowStorage(false);
            }
        } catch (error) {
            console.error('Error fetching storage:', error);
            showAlert('Network error while fetching storage', 'Error');
            setShowStorage(false);
        } finally {
            setLoadingStorage(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: loginId, password: loginPassword })
            });
            const data = await response.json();
            if (data.success) {
                setIsAuthenticated(true);
            } else {
                setLoginError(data.error || 'Invalid ID or Password');
            }
        } catch (error) {
            setLoginError('An error occurred during login');
        }
    };

    const handleForgotPassword = () => {
        setForgotStep('email');
        setResetError('');
        setResetMessage('');
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setResetError('');
        setResetMessage('');
        try {
            const response = await fetch('/api/admin/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail })
            });
            const data = await response.json();
            if (data.success) {
                setResetMessage('OTP sent successfully to your email.');
                setForgotStep('otp');
            } else {
                setResetError(data.error || 'Failed to send OTP.');
            }
        } catch (error) {
            setResetError('An error occurred while sending OTP.');
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setResetError('');
        setResetMessage('');
        try {
            const response = await fetch('/api/admin/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail, otp: resetOtp })
            });
            const data = await response.json();
            if (data.success) {
                setResetMessage('OTP verified. Please enter your new password.');
                setForgotStep('reset');
            } else {
                setResetError(data.error || 'Invalid OTP.');
            }
        } catch (error) {
            setResetError('An error occurred while verifying OTP.');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetError('');
        setResetMessage('');
        if (newPassword !== confirmNewPassword) {
            setResetError('Passwords do not match.');
            return;
        }
        try {
            const response = await fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword })
            });
            const data = await response.json();
            if (data.success) {
                showAlert('Password reset successfully. You can now login.', 'Success');
                setForgotStep('login');
                setLoginId(resetEmail);
            } else {
                setResetError(data.error || 'Failed to reset password.');
            }
        } catch (error) {
            setResetError('An error occurred while resetting password.');
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async (force = false) => {
        if (!force && usersList.length > 0) {
            setShowUsers(!showUsers);
            return;
        }
        setLoadingUsers(true);
        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                const data = await response.json();
                setUsersList(data);
                if (!force) setShowUsers(true);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleDeleteUser = (userId) => {
        setUserToDelete(userId);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            const response = await fetch(`/api/admin/users/${userToDelete}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                // Refresh list and stats
                fetchUsers(true);
                fetchStats();
                setUserToDelete(null);
                setFullProfile(null);
            } else {
                showAlert('Failed to delete user', 'Error');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            showAlert('An error occurred during deletion', 'Error');
        }
    };

    const handleSeeProfile = async (userId) => {
        setLoadingProfile(true);
        try {
            const response = await fetch(`/api/admin/users/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setFullProfile(data);
            } else {
                showAlert('Failed to fetch user profile', 'Error');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            showAlert('An error occurred while fetching the profile', 'Error');
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleImageUpload = async (event, targetField) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadStatus({ message: 'Uploading...', error: false });

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Data = reader.result;

            try {
                const response = await fetch('/api/admin/images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ target: targetField, base64Data })
                });

                if (response.ok) {
                    setUploadStatus({ message: 'Image successfully updated! Refresh the home page to see changes.', error: false });
                } else {
                    const data = await response.json();
                    setUploadStatus({ message: data.error || 'Failed to update image.', error: true });
                }
            } catch (error) {
                console.error('Error updating image:', error);
                setUploadStatus({ message: 'Network error. Failed to update image.', error: true });
            }
        };
        reader.onerror = () => {
            setUploadStatus({ message: 'Failed to read file.', error: true });
        };
    };

    const fetchStoryData = async () => {
        try {
            const response = await fetch('/api/admin/stories');
            if (response.ok) {
                const data = await response.json();
                setStoryData(data);
            }
        } catch (error) {
            console.error('Error fetching stories:', error);
        }
    };

    const handleStoryChange = (storyKey, field, value) => {
        setStoryData(prev => ({
            ...prev,
            [storyKey]: {
                ...prev[storyKey],
                [field]: value
            }
        }));
    };

    const handleSaveStories = async () => {
        setSavingStories(true);
        setStoryStatus({ message: '', error: false });
        try {
            const response = await fetch('/api/admin/stories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(storyData)
            });
            if (response.ok) {
                setStoryStatus({ message: 'Story content updated successfully! Refresh the home page to see changes.', error: false });
            } else {
                const data = await response.json();
                setStoryStatus({ message: data.error || 'Failed to update stories.', error: true });
            }
        } catch (error) {
            console.error('Error saving stories:', error);
            setStoryStatus({ message: 'Network error. Failed to save stories.', error: true });
        } finally {
            setSavingStories(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="admin-page">
                <div className="admin-login-wrapper">
                    <div className="admin-login-card">
                        
                        {forgotStep === 'login' && (
                            <>
                                <h2>Admin Login</h2>
                                {loginError && <div className="admin-login-error">{loginError}</div>}
                                <form onSubmit={handleLogin}>
                                    <div className="admin-form-group">
                                        <label>Email ID</label>
                                        <input
                                            type="email"
                                            value={loginId}
                                            onChange={(e) => setLoginId(e.target.value)}
                                            placeholder="Enter Admin Email"
                                            required
                                        />
                                    </div>
                                    <div className="admin-form-group">
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                            placeholder="Enter Password"
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="admin-login-btn">Login</button>
                                </form>
                                <div className="admin-forgot-password" onClick={handleForgotPassword}>
                                    Forgot Password?
                                </div>
                            </>
                        )}

                        {forgotStep === 'email' && (
                            <>
                                <h2>Reset Password</h2>
                                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>Enter your admin email to receive an OTP.</p>
                                {resetError && <div className="admin-login-error">{resetError}</div>}
                                {resetMessage && <div className="admin-alert success" style={{ marginBottom: '15px' }}>{resetMessage}</div>}
                                <form onSubmit={handleSendOtp}>
                                    <div className="admin-form-group">
                                        <label>Email ID</label>
                                        <input
                                            type="email"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            placeholder="Enter Admin Email"
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="admin-login-btn">Send OTP</button>
                                </form>
                                <div className="admin-forgot-password" onClick={() => setForgotStep('login')}>
                                    Back to Login
                                </div>
                            </>
                        )}

                        {forgotStep === 'otp' && (
                            <>
                                <h2>Verify OTP</h2>
                                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>Enter the 6-digit OTP sent to {resetEmail}</p>
                                {resetError && <div className="admin-login-error">{resetError}</div>}
                                {resetMessage && <div className="admin-alert success" style={{ marginBottom: '15px' }}>{resetMessage}</div>}
                                <form onSubmit={handleVerifyOtp}>
                                    <div className="admin-form-group">
                                        <label>OTP</label>
                                        <input
                                            type="text"
                                            value={resetOtp}
                                            onChange={(e) => setResetOtp(e.target.value)}
                                            placeholder="Enter 6-digit OTP"
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="admin-login-btn">Verify OTP</button>
                                </form>
                                <div className="admin-forgot-password" onClick={() => setForgotStep('email')}>
                                    Resend OTP
                                </div>
                                <div className="admin-forgot-password" onClick={() => setForgotStep('login')} style={{ marginTop: '10px' }}>
                                    Back to Login
                                </div>
                            </>
                        )}

                        {forgotStep === 'reset' && (
                            <>
                                <h2>Set New Password</h2>
                                {resetError && <div className="admin-login-error">{resetError}</div>}
                                {resetMessage && <div className="admin-alert success" style={{ marginBottom: '15px' }}>{resetMessage}</div>}
                                <form onSubmit={handleResetPassword}>
                                    <div className="admin-form-group">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter New Password"
                                            minLength={8}
                                            required
                                        />
                                    </div>
                                    <div className="admin-form-group">
                                        <label>Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            placeholder="Confirm New Password"
                                            minLength={8}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="admin-login-btn">Reset Password</button>
                                </form>
                            </>
                        )}

                    </div>
                </div>
            </div>
        );
    }

    if (fullProfile) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <button className="admin-back-btn" onClick={() => setFullProfile(null)}>
                        &larr; Back to Dashboard
                    </button>

                    <div className="admin-profile-view">
                        <div className="admin-profile-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                {fullProfile.photos && fullProfile.photos.length > 0 ? (
                                    <img
                                        src={fullProfile.photos[0].photo_data}
                                        alt="Profile"
                                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#ccc', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <span style={{ color: '#fff', fontSize: '24px' }}>No Img</span>
                                    </div>
                                )}
                                <h2>User Profile: {fullProfile.profile?.full_name || fullProfile.first_name || 'N/A'}</h2>
                            </div>
                            <button
                                className="admin-btn-remove"
                                onClick={() => handleDeleteUser(fullProfile.id)}
                            >
                                Remove User
                            </button>
                        </div>

                        <div className="admin-profile-details">
                            <div className="admin-profile-section">
                                <h3>Account Information</h3>
                                <div className="admin-profile-grid">
                                    <p><strong>Unique ID:</strong> {fullProfile.unique_id || 'N/A'}</p>
                                    <p><strong>Email:</strong> {fullProfile.email}</p>
                                    <p><strong>Phone:</strong> {fullProfile.mobile || fullProfile.phone || 'N/A'}</p>
                                    <p><strong>Gender:</strong> {fullProfile.gender}</p>
                                    <p><strong>Registered At:</strong> {new Date(fullProfile.created_at).toLocaleString()}</p>
                                    <p><strong>Verified:</strong> {fullProfile.is_verified ? 'Yes' : 'No'}</p>
                                </div>
                            </div>

                            <div className="admin-profile-section">
                                <h3>Uploaded Images</h3>
                                {fullProfile.photos && fullProfile.photos.length > 0 ? (
                                    <div className="admin-profile-photos" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                        {fullProfile.photos.map((photo, index) => (
                                            <div key={index} style={{ textAlign: 'center' }}>
                                                <img
                                                    src={photo.photo_data}
                                                    alt={`Upload ${index + 1}`}
                                                    style={{
                                                        width: '150px',
                                                        height: '150px',
                                                        objectFit: 'cover',
                                                        borderRadius: '8px',
                                                        border: photo.is_main ? '4px solid #3b82f6' : '1px solid #ccc'
                                                    }}
                                                />
                                                {photo.is_main && (
                                                    <span style={{ display: 'block', marginTop: '5px', fontWeight: 'bold', color: '#3b82f6', fontSize: '14px' }}>
                                                        Profile Picture
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p>No images uploaded by user.</p>
                                )}
                            </div>

                            {fullProfile.profile ? (
                                <>
                                    <div className="admin-profile-section">
                                        <h3>Basic Details</h3>
                                        <div className="admin-profile-grid">
                                            <p><strong>DOB:</strong> {fullProfile.profile.dob || 'N/A'}</p>
                                            <p><strong>Marital Status:</strong> {fullProfile.profile.marital_status || 'N/A'}</p>
                                            <p><strong>Height:</strong> {fullProfile.profile.height || 'N/A'}</p>
                                            <p><strong>Religion:</strong> {fullProfile.profile.religion || 'N/A'}</p>
                                            <p><strong>Mother Tongue:</strong> {fullProfile.profile.mother_tongue || 'N/A'}</p>
                                            <p><strong>Location:</strong> {[fullProfile.profile.city, fullProfile.profile.state, fullProfile.profile.country].filter(Boolean).join(', ') || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="admin-profile-section">
                                        <h3>Education & Career Details</h3>
                                        <div className="admin-profile-grid">
                                            <p><strong>Education:</strong> {fullProfile.profile.education || 'N/A'}</p>
                                            <p><strong>College:</strong> {fullProfile.profile.ug_college || 'N/A'}</p>
                                            <p><strong>Occupation:</strong> {fullProfile.profile.occupation || 'N/A'}</p>
                                            <p><strong>Employment Type:</strong> {fullProfile.profile.employment_type || 'N/A'}</p>
                                            <p><strong>Income:</strong> {fullProfile.profile.income || 'N/A'}</p>
                                            <p><strong>Organization:</strong> {fullProfile.profile.organization_name || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="admin-profile-section">
                                        <h3>Family Details</h3>
                                        <div className="admin-profile-grid">
                                            <p><strong>Family Type:</strong> {fullProfile.profile.family_type || 'N/A'}</p>
                                            <p><strong>Family Status:</strong> {fullProfile.profile.family_status || 'N/A'}</p>
                                            <p><strong>Father Occupation:</strong> {fullProfile.profile.father_occupation || 'N/A'}</p>
                                            <p><strong>Mother Occupation:</strong> {fullProfile.profile.mother_occupation || 'N/A'}</p>
                                            <p><strong>Brothers:</strong> {fullProfile.profile.brothers || '0'}</p>
                                            <p><strong>Sisters:</strong> {fullProfile.profile.sisters || '0'}</p>
                                        </div>
                                    </div>

                                    <div className="admin-profile-section">
                                        <h3>Lifestyle Details</h3>
                                        <div className="admin-profile-grid">
                                            <p><strong>Dietary Habits:</strong> {fullProfile.profile.diet || fullProfile.profile.food_habits || 'N/A'}</p>
                                            <p><strong>Drinking Habits:</strong> {fullProfile.profile.drinking || 'N/A'}</p>
                                            <p><strong>Smoking Habits:</strong> {fullProfile.profile.smoking || 'N/A'}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p>No detailed profile information filled yet.</p>
                            )}

                            {fullProfile.preferences && (
                                <div className="admin-profile-section">
                                    <h3>Partner Preference Details</h3>
                                    <div className="admin-profile-grid">
                                        <p><strong>Age Range:</strong> {fullProfile.preferences.pref_age_from || '18'} to {fullProfile.preferences.pref_age_to || '30'} Years</p>
                                        <p><strong>Height Range:</strong> {fullProfile.preferences.pref_height_from} - {fullProfile.preferences.pref_height_to}</p>
                                        <p><strong>Marital Status:</strong> {fullProfile.preferences.pref_marital_status || 'Doesn\'t Matter'}</p>
                                        <p><strong>Religion:</strong> {fullProfile.preferences.pref_religion || 'Doesn\'t Matter'}</p>
                                        <p><strong>Education:</strong> {fullProfile.preferences.pref_education || 'Doesn\'t Matter'}</p>
                                        <p><strong>Occupation:</strong> {fullProfile.preferences.pref_occupation || 'Doesn\'t Matter'}</p>
                                        <p><strong>Location:</strong> {[fullProfile.preferences.pref_city, fullProfile.preferences.pref_state, fullProfile.preferences.pref_country].filter(Boolean).join(', ') || 'Doesn\'t Matter'}</p>
                                    </div>
                                </div>
                            )}

                            {fullProfile.favourites && (
                                <div className="admin-profile-section">
                                    <h3>Interests & Hobbies</h3>
                                    <div className="admin-profile-grid">
                                        <p><strong>Hobbies:</strong> {fullProfile.favourites.hobbies?.join(', ') || 'N/A'}</p>
                                        <p><strong>Sports:</strong> {fullProfile.favourites.sports?.join(', ') || 'N/A'}</p>
                                        <p><strong>Movies:</strong> {fullProfile.favourites.movies?.join(', ') || 'N/A'}</p>
                                        <p><strong>Destinations:</strong> {fullProfile.favourites.destinations?.join(', ') || 'N/A'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {userToDelete && (
                    <div className="admin-modal-overlay">
                        <div className="admin-modal">
                            <h3>Confirm Action</h3>
                            <p>Are you sure you want to remove this user's ID?</p>
                            <div className="admin-modal-actions">
                                <button className="admin-modal-btn yes" onClick={confirmDeleteUser}>Yes</button>
                                <button className="admin-modal-btn no" onClick={() => setUserToDelete(null)}>No</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="admin-header-row" style={{ alignItems: 'flex-start' }}>
                    <h1 className="admin-title">Admin Dashboard</h1>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button className="admin-logout-btn" onClick={() => setIsAuthenticated(false)}>Logout</button>
                        <button className="admin-btn-show-users" style={{ background: '#4b5563', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }} onClick={fetchStorageDetails}>See Storage</button>
                    </div>
                </div>

                {uploadStatus.message && (
                    <div className={`admin-alert ${uploadStatus.error ? 'error' : 'success'}`}>
                        {uploadStatus.message}
                    </div>
                )}

                <div className="admin-card stats-card">
                    <h2>Total Registered Users</h2>
                    {loading ? (
                        <div className="admin-loading">Loading...</div>
                    ) : (
                        <>
                            <div className="admin-stat-number">{stats.totalUsers}</div>
                            <button className="admin-btn-show-users" onClick={() => fetchUsers(false)}>
                                {showUsers ? 'Hide Users' : 'Show Users'}
                            </button>
                        </>
                    )}

                    {loadingUsers && <div className="admin-loading" style={{ marginTop: '20px' }}>Loading users...</div>}

                    {showUsers && usersList.length > 0 && (
                        <div className="admin-filter-container">
                            <select
                                className="admin-filter-select"
                                value={filterGender}
                                onChange={(e) => {
                                    setFilterGender(e.target.value);
                                    if (!e.target.value) setFilterReligion('');
                                }}
                            >
                                <option value="">Filter by Gender (All)</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>

                            {filterGender && (
                                <select
                                    className="admin-filter-select"
                                    value={filterReligion}
                                    onChange={(e) => setFilterReligion(e.target.value)}
                                >
                                    <option value="">Filter by Religion (All)</option>
                                    <option value="Hindu">Hindu</option>
                                    <option value="Muslim">Muslim</option>
                                    <option value="Christian">Christian</option>
                                    <option value="Sikh">Sikh</option>
                                    <option value="Buddhist">Buddhist</option>
                                    <option value="Jain">Jain</option>
                                    <option value="Parsi">Parsi</option>
                                    <option value="Jewish">Jewish</option>
                                    <option value="Other">Other</option>
                                </select>
                            )}
                        </div>
                    )}

                    {showUsers ? (
                        usersList.filter(user => {
                            if (filterGender && user.gender !== filterGender) return false;
                            if (filterGender && filterReligion && (user.religion || 'Not Specified') !== filterReligion) return false;
                            return true;
                        }).length > 0 ? (
                            <div className="admin-users-table-container">
                                <table className="admin-users-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Gender</th>
                                            <th>Registration Date</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usersList.filter(user => {
                                            if (filterGender && user.gender !== filterGender) return false;
                                            if (filterGender && filterReligion && (user.religion || 'Not Specified') !== filterReligion) return false;
                                            return true;
                                        }).map((user, index) => (
                                            <tr key={user.user_id || index}>
                                                <td>{index + 1}</td>
                                                <td>{user.first_name} {user.last_name}</td>
                                                <td>{user.email}</td>
                                                <td>{user.phone}</td>
                                                <td>{user.gender}</td>
                                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="admin-action-btns">
                                                        <button
                                                            className="admin-btn-profile"
                                                            onClick={() => handleSeeProfile(user.user_id)}
                                                        >
                                                            {loadingProfile && user.user_id === fullProfile?.id ? 'Loading...' : 'See Profile'}
                                                        </button>
                                                        <button
                                                            className="admin-btn-remove"
                                                            onClick={() => handleDeleteUser(user.user_id)}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>No users match the selected filters.</p>
                        )) : null}
                </div>

                {userToDelete && (
                    <div className="admin-modal-overlay">
                        <div className="admin-modal">
                            <h3>Confirm Action</h3>
                            <p>Are you sure you want to remove this user's ID?</p>
                            <div className="admin-modal-actions">
                                <button className="admin-modal-btn yes" onClick={confirmDeleteUser}>Yes</button>
                                <button className="admin-modal-btn no" onClick={() => setUserToDelete(null)}>No</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="admin-card image-card">
                    <h2>Manage Website Images</h2>
                    <p>Update images used on the register/landing page. Recommended dimensions are provided.</p>

                    <div className="admin-upload-grid">
                        <div className="admin-upload-item">
                            <h3>Hero Background Image</h3>
                            <p>Recommended: 1920x1080px (JPG)</p>
                            <label className="admin-upload-btn">
                                Select File
                                <input type="file" accept="image/jpeg, image/png" onChange={(e) => handleImageUpload(e, 'hero')} hidden />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="admin-card story-card">
                    <h2>Manage Success Stories</h2>
                    <p>Update the couple names, descriptions, and images for the "Real Stories, True Connections" section.</p>

                    {storyStatus.message && (
                        <div className={`admin-alert ${storyStatus.error ? 'error' : 'success'}`}>
                            {storyStatus.message}
                        </div>
                    )}

                    <div className="admin-stories-edit-grid">
                        {['story1', 'story2', 'story3'].map((key, index) => (
                            <div className="admin-story-edit-card" key={key}>
                                <div className="admin-story-edit-header">
                                    <span className="admin-story-badge">Story {index + 1}</span>
                                </div>

                                <div className="admin-story-edit-field">
                                    <label>Story Image</label>
                                    <p className="admin-story-hint">Recommended: 400x300px (PNG)</p>
                                    <label className="admin-upload-btn">
                                        Select File
                                        <input type="file" accept="image/jpeg, image/png" onChange={(e) => handleImageUpload(e, key)} hidden />
                                    </label>
                                </div>

                                <div className="admin-story-edit-field">
                                    <label>Couple Name</label>
                                    <input
                                        type="text"
                                        className="admin-story-input"
                                        value={storyData[key]?.coupleName || ''}
                                        onChange={(e) => handleStoryChange(key, 'coupleName', e.target.value)}
                                        placeholder="e.g., Anjush & Pahuja"
                                    />
                                </div>

                                <div className="admin-story-edit-field">
                                    <label>Story Description</label>
                                    <textarea
                                        className="admin-story-textarea"
                                        value={storyData[key]?.description || ''}
                                        onChange={(e) => handleStoryChange(key, 'description', e.target.value)}
                                        placeholder="Write the couple's story here..."
                                        rows={4}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="admin-story-save-container">
                        <button
                            className="admin-story-save-btn"
                            onClick={handleSaveStories}
                            disabled={savingStories}
                        >
                            {savingStories ? 'Saving...' : 'Save Story Content'}
                        </button>
                    </div>
                </div>

                {/* Storage Modal */}
                {showStorage && (
                    <div className="admin-modal-overlay" style={{ zIndex: 1000 }} onClick={() => setShowStorage(false)}>
                        <div className="admin-modal" style={{ maxWidth: '500px', width: '90%', padding: '30px' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#1f2937' }}>Server Storage Info</h3>
                                <button onClick={() => setShowStorage(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
                            </div>
                            
                            {loadingStorage ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>Fetching live server details...</div>
                            ) : storageData ? (
                                <div>
                                    <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
                                        <h4 style={{ margin: '0 0 10px 0', color: '#374151', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>VPS Storage Usage</h4>
                                        <p style={{ margin: '8px 0', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280' }}>Total storage:</span> <strong style={{color: '#111827'}}>{storageData.vpsStorage.total}</strong></p>
                                        <p style={{ margin: '8px 0', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280' }}>Used storage:</span> <strong style={{color: '#ef4444'}}>{storageData.vpsStorage.used}</strong></p>
                                        <p style={{ margin: '8px 0', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280' }}>Remaining storage:</span> <strong style={{color: '#10b981'}}>{storageData.vpsStorage.available}</strong></p>
                                        <div style={{ marginTop: '15px', height: '8px', width: '100%', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', backgroundColor: '#3b82f6', width: storageData.vpsStorage.usePercent }}></div>
                                        </div>
                                        <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', textAlign: 'right', color: '#6b7280' }}>{storageData.vpsStorage.usePercent} Occupied OS & Packages</p>
                                    </div>

                                    <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                        <h4 style={{ margin: '0 0 10px 0', color: '#0369a1', paddingBottom: '8px', borderBottom: '1px solid #bae6fd' }}>User Storage (Profiles & Uploads)</h4>
                                        <p style={{ margin: '8px 0', fontSize: '0.95rem', color: '#0c4a6e' }}>Total storage used by all users:</p>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                                            <strong style={{ fontSize: '2rem', color: '#0284c7' }}>{storageData.databaseStorage.totalUserSpaceMB} MB</strong>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: '#0ea5e9', marginTop: '5px', marginBottom: 0 }}>
                                            Includes {storageData.totalUsers} registered users' details and images. Updates automatically.
                                        </p>
                                    </div>
                                    
                                    <div style={{ marginTop: '25px', textAlign: 'right' }}>
                                        <button onClick={() => setShowStorage(false)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ color: '#ef4444' }}>Failed to load storage details.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
