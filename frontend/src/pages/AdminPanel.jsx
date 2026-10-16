import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { showAlert } from '../components/GlobalModal';
import { apiFetch } from '../services/api';
import {
    horoscopes, religions, maritalOptions, heights, educationOptions,
    employedInOptions, occupations, incomes, residentialStatusOptions,
    dietOptions, smokingOptions, drinkingOptions, familyTypeOptions, languages
} from '../data/sharedOptions';
import { getCastes, getCountries, getStates, getCities } from '../data/locationData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminPanel.css';

const initialRegisterForm = {
    fullName: '',
    profileFor: 'Self',
    gender: 'Male',
    dobDay: '1',
    dobMonth: 'Jan',
    dobYear: '1995',
    motherTongue: 'Tamil',
    mobile: '',
    email: '',
    password: '',
    maritalStatus: 'Never Married',
    height: '5ft 6in (167 cm)',
    religion: 'Hindu',
    sect: '',
    caste: '',
    casteOther: '',
    horoscope: '',
    country: 'India',
    workingCountry: 'India',
    state: 'Tamil Nadu',
    city: '',
    residentialStatus: 'Citizen',
    education: 'B.E/B.Tech',
    employmentType: 'Private Sector',
    occupation: 'Software Professional',
    income: 'Rs. 5 - 7.5 Lakh',
    familyType: 'Nuclear Family',
    fatherName: '',
    fatherOccupation: '',
    motherName: '',
    motherOccupation: '',
    diet: 'Veg'
};

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

    // Filters
    const [filterGender, setFilterGender] = useState('');
    const [filterReligion, setFilterReligion] = useState('');
    const [filterCaste, setFilterCaste] = useState('');
    const [filterHoroscope, setFilterHoroscope] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Multi-profile selection
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [isBatchDownloading, setIsBatchDownloading] = useState(false);
    const [downloadingProfileId, setDownloadingProfileId] = useState(null);

    // Register user modal state
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [registerForm, setRegisterForm] = useState(initialRegisterForm);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [registerError, setRegisterError] = useState('');

    // Edit user modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editUserForm, setEditUserForm] = useState({});
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Story editing state
    const [storyData, setStoryData] = useState({
        story1: { coupleName: '', description: '' },
        story2: { coupleName: '', description: '' },
        story3: { coupleName: '', description: '' }
    });
    const [storyStatus, setStoryStatus] = useState({ message: '', error: false });
    const [savingStories, setSavingStories] = useState(false);

    // Storage state
    const [showStorage, setShowStorage] = useState(false);
    const [storageData, setStorageData] = useState(null);
    const [loadingStorage, setLoadingStorage] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchStats();
            fetchStoryData();
        }
    }, [isAuthenticated]);

    // Available castes derived dynamically from the users list
    const availableCastes = useMemo(() => {
        const set = new Set();
        usersList.forEach(u => {
            const c = (u.caste || '').trim();
            if (c && c !== 'Not Specified' && c !== 'N/A') {
                set.add(c);
            }
        });
        return Array.from(set).sort();
    }, [usersList]);

    // Castes for Register Modal
    const registerCastes = useMemo(() => {
        return getCastes(registerForm.religion, registerForm.sect);
    }, [registerForm.religion, registerForm.sect]);

    // Castes for Edit Modal
    const editCastes = useMemo(() => {
        return getCastes(editUserForm.religion, editUserForm.sect);
    }, [editUserForm.religion, editUserForm.sect]);

    // Filtered users list
    const filteredUsers = useMemo(() => {
        return usersList.filter(user => {
            if (filterGender && user.gender !== filterGender) return false;
            if (filterReligion && (user.religion || 'Not Specified') !== filterReligion) return false;
            if (filterHoroscope && (user.horoscope || 'Not Specified') !== filterHoroscope) return false;
            if (filterCaste) {
                const userCaste = (user.caste || '').trim().toLowerCase();
                if (userCaste !== filterCaste.trim().toLowerCase()) return false;
            }
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const name = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
                const email = (user.email || '').toLowerCase();
                const phone = (user.phone || '').toLowerCase();
                const uniqueId = (user.unique_id || '').toLowerCase();
                const caste = (user.caste || '').toLowerCase();
                const city = (user.city || '').toLowerCase();
                if (!name.includes(term) && !email.includes(term) && !phone.includes(term) && !uniqueId.includes(term) && !caste.includes(term) && !city.includes(term)) {
                    return false;
                }
            }
            return true;
        });
    }, [usersList, filterGender, filterReligion, filterCaste, filterHoroscope, searchTerm]);

    const resetAllFilters = () => {
        setFilterGender('');
        setFilterReligion('');
        setFilterCaste('');
        setFilterHoroscope('');
        setSearchTerm('');
    };

    // Toggle select all on filtered users
    const handleToggleSelectAll = () => {
        const filteredIds = filteredUsers.map(u => u.user_id);
        const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedUserIds.includes(id));
        if (allSelected) {
            setSelectedUserIds(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            setSelectedUserIds(prev => Array.from(new Set([...prev, ...filteredIds])));
        }
    };

    const handleToggleSelectUser = (id) => {
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // Generate Profile PDF (supports 1 or multiple profiles)
    const generateProfilesPDF = (profiles, filename = 'SriMayan_Profiles.pdf') => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        profiles.forEach((profile, index) => {
            if (index > 0) doc.addPage();

            // Header Banner
            doc.setFillColor(15, 118, 110); // Teal / Emerald
            doc.rect(0, 0, pageWidth, 26, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('SRI MAYAN MATRIMONY', 14, 12);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(204, 251, 241);
            doc.text('Official Matrimonial Profile Bio-Data', 14, 19);

            const uniqueIdText = `Profile ID: ${profile.unique_id || profile.user_id || 'N/A'}`;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(uniqueIdText, pageWidth - 14, 15, { align: 'right' });

            // Sub-bar with Name & Status
            doc.setFillColor(243, 244, 246);
            doc.rect(0, 26, pageWidth, 11, 'F');
            doc.setTextColor(31, 41, 55);
            doc.setFontSize(10.5);
            doc.setFont('helvetica', 'bold');
            const fullName = profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'N/A';
            doc.text(fullName.toUpperCase(), 14, 33);

            const regDateStr = profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A';
            const statusText = `Profile For: ${profile.profile_for || 'Self'} | Reg: ${regDateStr}`;
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(75, 85, 99);
            doc.text(statusText, pageWidth - 14, 33, { align: 'right' });

            let startY = 40;

            // 1. Personal & Religious Details
            const dobStr = profile.dob ? String(profile.dob).split('T')[0] : [profile.dob_day, profile.dob_month, profile.dob_year].filter(Boolean).join(' ') || 'N/A';
            autoTable(doc, {
                startY,
                head: [['Personal & Religious Details', '']],
                body: [
                    ['Full Name', fullName],
                    ['Gender', profile.gender || 'Not Specified'],
                    ['Date of Birth', dobStr],
                    ['Mother Tongue', profile.mother_tongue || 'N/A'],
                    ['Height', profile.height || 'N/A'],
                    ['Marital Status', profile.marital_status || 'Never Married'],
                    ['Religion & Sect', `${profile.religion || 'N/A'} ${profile.sect ? `(${profile.sect})` : ''}`],
                    ['Caste', profile.caste || 'Not Specified'],
                    ['Horoscope / Star', profile.horoscope || profile.star || 'N/A'],
                    ['Place & Time of Birth', `${profile.place_of_birth || 'N/A'} ${profile.time_of_birth ? `(${profile.time_of_birth})` : ''}`]
                ],
                theme: 'striped',
                headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold', textColor: [55, 65, 81] }, 1: { textColor: [17, 24, 39] } },
                margin: { left: 14, right: 14 }
            });

            startY = doc.lastAutoTable.finalY + 4;

            // 2. Education & Career
            autoTable(doc, {
                startY,
                head: [['Education, Profession & Location', '']],
                body: [
                    ['Highest Degree', profile.education || 'N/A'],
                    ['Employment Type', profile.employment_type || 'N/A'],
                    ['Occupation', profile.occupation || 'N/A'],
                    ['Annual Income', profile.income || 'N/A'],
                    ['Location', [profile.city, profile.state, profile.country || profile.working_country].filter(Boolean).join(', ') || 'N/A'],
                    ['Residential Status', profile.residential_status || 'Citizen / Resident']
                ],
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold', textColor: [55, 65, 81] }, 1: { textColor: [17, 24, 39] } },
                margin: { left: 14, right: 14 }
            });

            startY = doc.lastAutoTable.finalY + 4;

            // 3. Family Background
            autoTable(doc, {
                startY,
                head: [['Family & Lifestyle', '']],
                body: [
                    ['Family Type & Status', `${profile.family_type || 'N/A'} ${profile.family_status ? `(${profile.family_status})` : ''}`],
                    ['Father Details', `${profile.father_name || 'N/A'} ${profile.father_occupation ? `- ${profile.father_occupation}` : ''}`],
                    ['Mother Details', `${profile.mother_name || 'N/A'} ${profile.mother_occupation ? `- ${profile.mother_occupation}` : ''}`],
                    ['Brothers / Sisters', `Brothers: ${profile.elder_brother || profile.younger_brother ? `${profile.elder_brother || 0} Elder, ${profile.younger_brother || 0} Younger` : '0'} | Sisters: ${profile.elder_sister || profile.younger_sister ? `${profile.elder_sister || 0} Elder, ${profile.younger_sister || 0} Younger` : '0'}`],
                    ['Diet & Habits', `Diet: ${profile.diet || 'N/A'} | Smoke: ${profile.smoking || 'No'} | Drink: ${profile.drinking || 'No'}`]
                ],
                theme: 'striped',
                headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold', textColor: [55, 65, 81] }, 1: { textColor: [17, 24, 39] } },
                margin: { left: 14, right: 14 }
            });

            startY = doc.lastAutoTable.finalY + 4;

            // 4. Contact & Verification (Confidential Admin Use)
            autoTable(doc, {
                startY,
                head: [['Contact & Verification (Confidential)', '']],
                body: [
                    ['Mobile Phone', profile.mobile || profile.phone || 'N/A'],
                    ['Email Address', profile.email || 'N/A'],
                    ['Account Status', profile.is_verified ? 'Verified Member ✓' : 'Unverified']
                ],
                theme: 'striped',
                headStyles: { fillColor: [55, 65, 81], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold', textColor: [55, 65, 81] }, 1: { textColor: [17, 24, 39] } },
                margin: { left: 14, right: 14 }
            });

            // Footer
            doc.setFontSize(7.5);
            doc.setTextColor(156, 163, 175);
            doc.text(`Sri Mayan Matrimony Confidential Bio-Data Document | Generated on ${new Date().toLocaleString()}`, 14, pageHeight - 6);
            doc.text(`Page ${index + 1} of ${profiles.length}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
        });

        doc.save(filename);
    };

    // Download Single Profile
    const handleDownloadSingleProfile = async (userId, userName, uniqueId) => {
        setDownloadingProfileId(userId);
        try {
            const fullData = await apiFetch(`/admin/users/${userId}`);
            const profileObj = {
                ...fullData,
                ...(fullData.profile || {}),
                unique_id: fullData.unique_id,
                email: fullData.email,
                mobile: fullData.mobile,
                gender: fullData.gender
            };
            const safeName = (userName || 'User').replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `SriMayan_Profile_${uniqueId || userId}_${safeName}.pdf`;
            generateProfilesPDF([profileObj], filename);
        } catch (err) {
            showAlert('Failed to download profile: ' + (err.message || 'Network error'), 'Error');
        } finally {
            setDownloadingProfileId(null);
        }
    };

    // Download Multiple Selected Profiles
    const handleDownloadMultipleProfiles = async () => {
        if (selectedUserIds.length === 0) {
            showAlert('Please select at least one user profile to download.', 'Selection Empty');
            return;
        }

        setIsBatchDownloading(true);
        try {
            const res = await apiFetch('/admin/users/batch', {
                method: 'POST',
                body: JSON.stringify({ userIds: selectedUserIds })
            });

            if (Array.isArray(res) && res.length > 0) {
                const filename = `SriMayan_Batch_Profiles_${selectedUserIds.length}_users_${new Date().toISOString().slice(0, 10)}.pdf`;
                generateProfilesPDF(res, filename);
                showAlert(`Successfully generated and downloaded ${res.length} user profile(s) in a single PDF document.`, 'Download Complete');
            } else {
                showAlert('No profiles returned for the selected users.', 'Notice');
            }
        } catch (err) {
            showAlert('Error generating batch profiles: ' + (err.message || 'Failed'), 'Error');
        } finally {
            setIsBatchDownloading(false);
        }
    };

    // Export Selected to CSV
    const handleExportMultipleCSV = () => {
        if (selectedUserIds.length === 0) return;
        const selectedUsers = usersList.filter(u => selectedUserIds.includes(u.user_id));

        const headers = ["User ID", "Unique ID", "Name", "Gender", "Mobile", "Email", "Religion", "Caste", "Horoscope", "City", "State", "Country", "Education", "Occupation", "Income", "Registration Date", "Status"];
        const rows = selectedUsers.map(u => [
            u.user_id,
            u.unique_id || 'N/A',
            `"${(u.first_name || '').replace(/"/g, '""')}"`,
            u.gender || '',
            u.phone || '',
            u.email || '',
            u.religion || '',
            `"${(u.caste || '').replace(/"/g, '""')}"`,
            `"${(u.horoscope || '').replace(/"/g, '""')}"`,
            `"${(u.city || '').replace(/"/g, '""')}"`,
            `"${(u.state || '').replace(/"/g, '""')}"`,
            `"${(u.country || u.working_country || '').replace(/"/g, '""')}"`,
            `"${(u.education || '').replace(/"/g, '""')}"`,
            `"${(u.occupation || '').replace(/"/g, '""')}"`,
            `"${(u.income || '').replace(/"/g, '""')}"`,
            new Date(u.created_at).toLocaleDateString(),
            u.is_verified ? 'Verified' : 'Unverified'
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `SriMayan_Users_Export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Export table list to PDF (existing feature)
    const handleDownloadPDF = () => {
        const doc = new jsPDF('landscape');
        doc.setFontSize(18);
        doc.text('Registered Users - Admin Dashboard', 14, 22);

        const tableColumn = ["ID", "Unique ID", "Name", "Email", "Phone", "Gender", "Religion", "Caste", "Horoscope", "Reg Date", "Status"];
        const tableRows = [];

        filteredUsers.forEach((user, index) => {
            let status = user.is_verified ? 'Verified' : 'Active';
            const userData = [
                index + 1,
                user.unique_id || 'N/A',
                `${user.first_name} ${user.last_name}`.trim(),
                user.email,
                user.phone,
                user.gender,
                user.religion || 'N/A',
                user.caste || 'N/A',
                user.horoscope || 'N/A',
                new Date(user.created_at).toLocaleDateString(),
                status
            ];
            tableRows.push(userData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [75, 85, 99] }
        });

        doc.save(`users_list_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    // Quick Register Submit Handler
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setRegisterError('');

        if (!registerForm.fullName.trim()) {
            setRegisterError('Full name is required');
            return;
        }
        if (!registerForm.mobile.trim() && !registerForm.email.trim()) {
            setRegisterError('Mobile number or email is required');
            return;
        }
        if (registerForm.caste === 'Other' && !registerForm.casteOther?.trim()) {
            setRegisterError('Please specify the caste');
            return;
        }

        setRegisterLoading(true);
        try {
            const payload = {
                ...registerForm,
                caste: registerForm.caste === 'Other' && registerForm.casteOther ? registerForm.casteOther.trim() : registerForm.caste
            };
            const res = await apiFetch('/admin/register', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res.success) {
                showAlert(`User registered successfully!\nUnique ID: ${res.user.uniqueId}\nMobile: ${res.user.mobile || 'N/A'}\nPassword: ${res.user.temporaryPassword}`, 'Registration Successful');
                setShowRegisterModal(false);
                setRegisterForm(initialRegisterForm);
                fetchUsers(true);
                fetchStats();
            } else {
                setRegisterError(res.error || 'Failed to register user');
            }
        } catch (err) {
            setRegisterError(err.message || 'Error occurred during registration');
        } finally {
            setRegisterLoading(false);
        }
    };

    // Open Edit User Modal
    const handleOpenEditModal = async (user) => {
        setEditError('');
        setEditLoading(true);
        setShowEditModal(true);

        try {
            const fullData = await apiFetch(`/admin/users/${user.user_id}`);
            const p = fullData.profile || {};
            const standardCastes = getCastes(p.religion || 'Hindu', p.sect);
            const isCustomCaste = p.caste && !standardCastes.includes(p.caste);

            setEditUserForm({
                userId: user.user_id,
                uniqueId: fullData.unique_id || user.unique_id || '',
                fullName: p.full_name || user.first_name || '',
                mobile: fullData.mobile || user.phone || '',
                email: fullData.email && fullData.email !== 'No Email' ? fullData.email : '',
                gender: fullData.gender || user.gender || 'Male',
                profileFor: fullData.profile_for || 'Self',
                isVerified: fullData.is_verified ?? true,
                password: '', // Blank unless resetting
                dob: p.dob ? String(p.dob).split('T')[0] : '',
                dobDay: p.dob_day || '',
                dobMonth: p.dob_month || '',
                dobYear: p.dob_year || '',
                motherTongue: p.mother_tongue || 'Tamil',
                height: p.height || '',
                maritalStatus: p.marital_status || 'Never Married',
                religion: p.religion || 'Hindu',
                sect: p.sect || '',
                caste: isCustomCaste ? 'Other' : (p.caste || ''),
                casteOther: isCustomCaste ? p.caste : '',
                horoscope: p.horoscope || '',
                country: p.country || 'India',
                workingCountry: p.working_country || 'India',
                state: p.state || '',
                city: p.city || '',
                residentialStatus: p.residential_status || '',
                education: p.education || '',
                employmentType: p.employment_type || '',
                occupation: p.occupation || '',
                income: p.income || '',
                familyType: p.family_type || 'Nuclear Family',
                fatherName: p.father_name || '',
                fatherOccupation: p.father_occupation || '',
                motherName: p.mother_name || '',
                motherOccupation: p.mother_occupation || '',
                diet: p.diet || '',
                smoking: p.smoking || 'No',
                drinking: p.drinking || 'No',
                aadharNumber: p.aadhar_number || ''
            });
        } catch (err) {
            setEditError('Failed to fetch full user details');
        } finally {
            setEditLoading(false);
        }
    };

    // Save Edit User Changes
    const handleSaveEditUser = async (e) => {
        e.preventDefault();
        setEditError('');
        setIsSavingEdit(true);

        try {
            const payload = {
                ...editUserForm,
                caste: editUserForm.caste === 'Other' && editUserForm.casteOther ? editUserForm.casteOther.trim() : editUserForm.caste
            };
            const res = await apiFetch(`/admin/users/${editUserForm.userId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            if (res.success) {
                showAlert('User details updated successfully!', 'Success');
                setShowEditModal(false);
                fetchUsers(true);
                if (fullProfile && fullProfile.id === editUserForm.userId) {
                    handleSeeProfile(editUserForm.userId);
                }
            } else {
                setEditError(res.error || 'Failed to update user');
            }
        } catch (err) {
            setEditError(err.message || 'Error updating user');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const fetchStorageDetails = async () => {
        setShowStorage(true);
        setLoadingStorage(true);
        try {
            const data = await apiFetch('/admin/storage');
            setStorageData(data);
        } catch (error) {
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
            const data = await apiFetch('/admin/login', {
                method: 'POST',
                body: JSON.stringify({ id: loginId, password: loginPassword })
            });
            if (data.success) {
                setIsAuthenticated(true);
            } else {
                setLoginError(data.error || 'Invalid ID or Password');
            }
        } catch (error) {
            setLoginError(error.message || 'An error occurred during login');
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
            const data = await apiFetch('/admin/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email: resetEmail })
            });
            if (data.success) {
                setResetMessage('OTP sent successfully to your email.');
                setForgotStep('otp');
            } else {
                setResetError(data.error || 'Failed to send OTP.');
            }
        } catch (error) {
            setResetError(error.message || 'An error occurred while sending OTP.');
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setResetError('');
        setResetMessage('');
        try {
            const data = await apiFetch('/admin/verify-otp', {
                method: 'POST',
                body: JSON.stringify({ email: resetEmail, otp: resetOtp })
            });
            if (data.success) {
                setResetMessage('OTP verified. Please enter your new password.');
                setForgotStep('reset');
            } else {
                setResetError(data.error || 'Invalid OTP.');
            }
        } catch (error) {
            setResetError(error.message || 'An error occurred while verifying OTP.');
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
            const data = await apiFetch('/admin/reset-password', {
                method: 'POST',
                body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword })
            });
            if (data.success) {
                showAlert('Password reset successfully. You can now login.', 'Success');
                setForgotStep('login');
                setLoginId(resetEmail);
            } else {
                setResetError(data.error || 'Failed to reset password.');
            }
        } catch (error) {
            setResetError(error.message || 'An error occurred while resetting password.');
        }
    };

    const fetchStats = async () => {
        try {
            const data = await apiFetch('/admin/stats');
            setStats(data);
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
            const data = await apiFetch('/admin/users');
            setUsersList(data);
            if (!force) setShowUsers(true);
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
            await apiFetch(`/admin/users/${userToDelete}`, {
                method: 'DELETE',
            });
            fetchUsers(true);
            fetchStats();
            setUserToDelete(null);
            setFullProfile(null);
            setSelectedUserIds(prev => prev.filter(id => id !== userToDelete));
        } catch (error) {
            showAlert('An error occurred during deletion', 'Error');
        }
    };

    const handleSeeProfile = async (userId) => {
        setLoadingProfile(true);
        try {
            const data = await apiFetch(`/admin/users/${userId}`);
            setFullProfile(data);
        } catch (error) {
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
                await apiFetch('/admin/images', {
                    method: 'POST',
                    body: JSON.stringify({ target: targetField, base64Data })
                });
                setUploadStatus({ message: 'Image successfully updated! Refresh the home page to see changes.', error: false });
            } catch (error) {
                setUploadStatus({ message: error.message || 'Network error. Failed to update image.', error: true });
            }
        };
        reader.onerror = () => {
            setUploadStatus({ message: 'Failed to read file.', error: true });
        };
    };

    const fetchStoryData = async () => {
        try {
            const data = await apiFetch('/admin/stories');
            setStoryData(data);
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
            await apiFetch('/admin/stories', {
                method: 'PUT',
                body: JSON.stringify(storyData)
            });
            setStoryStatus({ message: 'Story content updated successfully! Refresh the home page to see changes.', error: false });
        } catch (error) {
            setStoryStatus({ message: error.message || 'Network error. Failed to save stories.', error: true });
        } finally {
            setSavingStories(false);
        }
    };

    // Login Form View
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

    // Full Profile View Modal
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
                                <div>
                                    <h2 style={{ margin: 0 }}>{fullProfile.profile?.full_name || fullProfile.first_name || 'N/A'}</h2>
                                    <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Unique ID: {fullProfile.unique_id || 'N/A'}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button
                                    className="admin-action-btn btn-green"
                                    onClick={() => handleDownloadSingleProfile(fullProfile.id, fullProfile.profile?.full_name, fullProfile.unique_id)}
                                    disabled={downloadingProfileId === fullProfile.id}
                                >
                                    {downloadingProfileId === fullProfile.id ? 'Downloading...' : 'Download Bio-Data PDF'}
                                </button>
                                <button
                                    className="admin-action-btn btn-amber"
                                    onClick={() => handleOpenEditModal({ user_id: fullProfile.id, first_name: fullProfile.profile?.full_name, unique_id: fullProfile.unique_id })}
                                >
                                    Edit Profile
                                </button>
                                <button
                                    className="admin-action-btn btn-red"
                                    onClick={() => handleDeleteUser(fullProfile.id)}
                                >
                                    Remove User
                                </button>
                            </div>
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
                                    <p><strong>Verified:</strong> {fullProfile.is_verified ? 'Yes ✓' : 'No'}</p>
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

                            {(fullProfile.profile?.aadhar_number || fullProfile.profile?.community_certificate || fullProfile.profile?.birth_certificate) && (
                                <div className="admin-profile-section">
                                    <h3>Verification Documents</h3>
                                    <div className="admin-profile-grid">
                                        {fullProfile.profile?.aadhar_number && (
                                            <p><strong>Aadhar Number:</strong> {fullProfile.profile.aadhar_number}</p>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '15px' }}>
                                        {fullProfile.profile?.community_certificate && (
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Community Certificate</p>
                                                {fullProfile.profile.community_certificate.startsWith('data:image') ? (
                                                    <img
                                                        src={fullProfile.profile.community_certificate}
                                                        alt="Community Certificate"
                                                        style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ccc', cursor: 'pointer' }}
                                                        onClick={() => {
                                                            const win = window.open();
                                                            win.document.write(`<iframe src="${fullProfile.profile.community_certificate}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                                        }}
                                                    />
                                                ) : (
                                                    <a href={fullProfile.profile.community_certificate} download="Community_Certificate" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Download Certificate</a>
                                                )}
                                            </div>
                                        )}
                                        {fullProfile.profile?.birth_certificate && (
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Birth Certificate</p>
                                                {fullProfile.profile.birth_certificate.startsWith('data:image') ? (
                                                    <img
                                                        src={fullProfile.profile.birth_certificate}
                                                        alt="Birth Certificate"
                                                        style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ccc', cursor: 'pointer' }}
                                                        onClick={() => {
                                                            const win = window.open();
                                                            win.document.write(`<iframe src="${fullProfile.profile.birth_certificate}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                                        }}
                                                    />
                                                ) : (
                                                    <a href={fullProfile.profile.birth_certificate} download="Birth_Certificate" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Download Certificate</a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {fullProfile.profile ? (
                                <>
                                    <div className="admin-profile-section">
                                        <h3>Basic & Community Details</h3>
                                        <div className="admin-profile-grid">
                                            <p><strong>DOB:</strong> {fullProfile.profile.dob ? String(fullProfile.profile.dob).split('T')[0] : 'N/A'}</p>
                                            <p><strong>Marital Status:</strong> {fullProfile.profile.marital_status || 'N/A'}</p>
                                            <p><strong>Height:</strong> {fullProfile.profile.height || 'N/A'}</p>
                                            <p><strong>Religion:</strong> {fullProfile.profile.religion || 'N/A'}</p>
                                            <p><strong>Sect:</strong> {fullProfile.profile.sect || 'N/A'}</p>
                                            <p><strong>Caste:</strong> {fullProfile.profile.caste || 'N/A'}</p>
                                            <p><strong>Horoscope:</strong> {fullProfile.profile.horoscope || 'N/A'}</p>
                                            <p><strong>Mother Tongue:</strong> {fullProfile.profile.mother_tongue || 'N/A'}</p>
                                            <p><strong>Location:</strong> {[fullProfile.profile.city, fullProfile.profile.state, fullProfile.profile.country || fullProfile.profile.working_country].filter(Boolean).join(', ') || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="admin-profile-section">
                                        <h3>Education & Career Details</h3>
                                        <div className="admin-profile-grid">
                                            <p><strong>Education:</strong> {fullProfile.profile.education || 'N/A'}</p>
                                            <p><strong>Occupation:</strong> {fullProfile.profile.occupation || 'N/A'}</p>
                                            <p><strong>Employment Type:</strong> {fullProfile.profile.employment_type || 'N/A'}</p>
                                            <p><strong>Income:</strong> {fullProfile.profile.income || 'N/A'}</p>
                                            <p><strong>Residential Status:</strong> {fullProfile.profile.residential_status || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="admin-profile-section">
                                        <h3>Family & Lifestyle Details</h3>
                                        <div className="admin-profile-grid">
                                            <p><strong>Family Type:</strong> {fullProfile.profile.family_type || 'N/A'}</p>
                                            <p><strong>Father:</strong> {fullProfile.profile.father_name || 'N/A'} {fullProfile.profile.father_occupation ? `- ${fullProfile.profile.father_occupation}` : ''}</p>
                                            <p><strong>Mother:</strong> {fullProfile.profile.mother_name || 'N/A'} {fullProfile.profile.mother_occupation ? `- ${fullProfile.profile.mother_occupation}` : ''}</p>
                                            <p><strong>Diet:</strong> {fullProfile.profile.diet || 'N/A'}</p>
                                            <p><strong>Smoking:</strong> {fullProfile.profile.smoking || 'No'}</p>
                                            <p><strong>Drinking:</strong> {fullProfile.profile.drinking || 'No'}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p>No detailed profile information filled yet.</p>
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
                <div className="admin-header-row">
                    <div>
                        <h1 className="admin-title">Admin Dashboard</h1>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '4px 0 0 0' }}>Sri Mayan Matrimony Management Console</p>
                    </div>
                    <div className="admin-header-actions">
                        <button className="admin-action-btn btn-green" onClick={() => setShowRegisterModal(true)}>
                            + Quick Register User
                        </button>
                        <button className="admin-action-btn btn-gray" onClick={fetchStorageDetails}>
                            See Storage
                        </button>
                        <button className="admin-action-btn btn-logout" onClick={() => setIsAuthenticated(false)}>
                            Logout
                        </button>
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
                            <div className="admin-card-actions">
                                <button className="admin-action-btn btn-blue" onClick={() => fetchUsers(false)}>
                                    {showUsers ? 'Hide Users' : 'Show Users'}
                                </button>
                                <button className="admin-action-btn btn-green" onClick={() => setShowRegisterModal(true)}>
                                    + Register New User
                                </button>
                                {showUsers && (
                                    <button className="admin-action-btn btn-red" onClick={handleDownloadPDF}>
                                        Download Users List (PDF)
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {loadingUsers && <div className="admin-loading" style={{ marginTop: '20px' }}>Loading users...</div>}

                    {showUsers && usersList.length > 0 && (
                        <div className="admin-filter-container" style={{ flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                className="admin-filter-input"
                                placeholder="🔍 Search name, caste, mobile, ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            <select
                                className="admin-filter-select"
                                value={filterGender}
                                onChange={(e) => setFilterGender(e.target.value)}
                            >
                                <option value="">Filter by Gender (All)</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>

                            <select
                                className="admin-filter-select"
                                value={filterReligion}
                                onChange={(e) => {
                                    setFilterReligion(e.target.value);
                                    setFilterCaste('');
                                }}
                            >
                                <option value="">Filter by Religion (All)</option>
                                {religions.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>

                            <select
                                className="admin-filter-select"
                                value={filterCaste}
                                onChange={(e) => setFilterCaste(e.target.value)}
                            >
                                <option value="">Filter by Caste (All)</option>
                                {availableCastes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <select
                                className="admin-filter-select"
                                value={filterHoroscope}
                                onChange={(e) => setFilterHoroscope(e.target.value)}
                            >
                                <option value="">Filter by Horoscope (All)</option>
                                {horoscopes.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>

                            {(filterGender || filterReligion || filterCaste || filterHoroscope || searchTerm) && (
                                <button className="admin-filter-reset-btn" onClick={resetAllFilters}>
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Batch Action Bar */}
                    {showUsers && selectedUserIds.length > 0 && (
                        <div className="admin-batch-bar">
                            <div className="admin-batch-info">
                                <span className="admin-batch-count">{selectedUserIds.length}</span> profiles selected
                            </div>
                            <div className="admin-batch-actions">
                                <button
                                    className="admin-btn-batch-download"
                                    onClick={handleDownloadMultipleProfiles}
                                    disabled={isBatchDownloading}
                                >
                                    {isBatchDownloading ? 'Generating Batch PDF...' : `Download ${selectedUserIds.length} Profiles (PDF)`}
                                </button>
                                <button
                                    className="admin-btn-batch-csv"
                                    onClick={handleExportMultipleCSV}
                                >
                                    Export Selected to CSV
                                </button>
                                <button
                                    className="admin-btn-batch-clear"
                                    onClick={() => setSelectedUserIds([])}
                                >
                                    Deselect All
                                </button>
                            </div>
                        </div>
                    )}

                    {showUsers ? (
                        filteredUsers.length > 0 ? (
                            <div className="admin-users-table-container">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '0.85rem', color: '#64748b' }}>
                                    <span>Showing <strong>{filteredUsers.length}</strong> of {usersList.length} registered users</span>
                                    <span>Tip: Check boxes to download multiple profiles together</span>
                                </div>
                                <table className="admin-users-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px', textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.user_id))}
                                                    onChange={handleToggleSelectAll}
                                                    title="Select / Deselect All Filtered"
                                                />
                                            </th>
                                            <th>#</th>
                                            <th>Unique ID</th>
                                            <th>Name</th>
                                            <th>Phone</th>
                                            <th>Gender</th>
                                            <th>Religion & Caste</th>
                                            <th>Location</th>
                                            <th>Registration Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((user, index) => {
                                            const isSelected = selectedUserIds.includes(user.user_id);
                                            return (
                                                <tr key={user.user_id || index} style={{ background: isSelected ? '#f0fdf4' : 'inherit' }}>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleToggleSelectUser(user.user_id)}
                                                        />
                                                    </td>
                                                    <td>{index + 1}</td>
                                                    <td><strong style={{ color: '#0f766e' }}>{user.unique_id || 'N/A'}</strong></td>
                                                    <td>
                                                        <div>{user.first_name} {user.last_name}</div>
                                                        <small style={{ color: '#888' }}>{user.email !== 'No Email' ? user.email : ''}</small>
                                                    </td>
                                                    <td>{user.phone}</td>
                                                    <td>{user.gender}</td>
                                                    <td>
                                                        <div>{user.religion || 'N/A'}</div>
                                                        <small style={{ color: '#059669', fontWeight: 600 }}>{user.caste || 'Not Specified'}</small>
                                                    </td>
                                                    <td>{[user.city, user.state].filter(Boolean).join(', ') || 'N/A'}</td>
                                                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                                    <td>
                                                        <div className="admin-action-btns" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                            <button
                                                                className="admin-btn-profile"
                                                                onClick={() => handleSeeProfile(user.user_id)}
                                                                title="View Full Profile"
                                                            >
                                                                {loadingProfile && user.user_id === fullProfile?.id ? '...' : 'View'}
                                                            </button>
                                                            <button
                                                                className="admin-btn-edit"
                                                                onClick={() => handleOpenEditModal(user)}
                                                                title="Edit User Details"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="admin-btn-download"
                                                                onClick={() => handleDownloadSingleProfile(user.user_id, user.first_name, user.unique_id)}
                                                                disabled={downloadingProfileId === user.user_id}
                                                                title="Download Single Profile PDF"
                                                            >
                                                                {downloadingProfileId === user.user_id ? '...' : 'PDF'}
                                                            </button>
                                                            <button
                                                                className="admin-btn-remove"
                                                                onClick={() => handleDeleteUser(user.user_id)}
                                                                title="Delete User"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>No users match the selected filters.</p>
                        )) : null}
                </div>

                {/* Confirm Delete Modal */}
                {userToDelete && (
                    <div className="admin-modal-overlay">
                        <div className="admin-modal">
                            <h3>Confirm Action</h3>
                            <p>Are you sure you want to remove this user from the system?</p>
                            <div className="admin-modal-actions">
                                <button className="admin-modal-btn yes" onClick={confirmDeleteUser}>Yes, Remove</button>
                                <button className="admin-modal-btn no" onClick={() => setUserToDelete(null)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Registration Modal */}
                {showRegisterModal && (
                    <div className="admin-modal-overlay">
                        <div className="admin-modal-large">
                            <div className="admin-modal-header">
                                <h3>Register New User (Admin Console)</h3>
                                <button className="admin-modal-close-btn" onClick={() => setShowRegisterModal(false)}>✕</button>
                            </div>
                            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                                <div className="admin-modal-body">
                                    {registerError && (
                                        <div className="admin-alert error" style={{ padding: '10px 14px', marginBottom: '16px' }}>
                                            {registerError}
                                        </div>
                                    )}

                                    {/* Section 1: Account Information */}
                                    <div className="admin-modal-section-title">1. Account Information</div>
                                    <div className="admin-form-grid-2">
                                        <div className="admin-form-field">
                                            <label>Full Name *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Enter candidate full name"
                                                value={registerForm.fullName}
                                                onChange={e => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                                            />
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Profile Created For *</label>
                                            <select
                                                value={registerForm.profileFor}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    let gen = registerForm.gender;
                                                    if (val === 'Son') gen = 'Male';
                                                    if (val === 'Daughter') gen = 'Female';
                                                    setRegisterForm({ ...registerForm, profileFor: val, gender: gen });
                                                }}
                                            >
                                                {['Self', 'Son', 'Daughter', 'Brother', 'Sister', 'Relative', 'Friend'].map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Gender *</label>
                                            <select
                                                value={registerForm.gender}
                                                onChange={e => setRegisterForm({ ...registerForm, gender: e.target.value })}
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Mobile Number *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="10-digit mobile number"
                                                value={registerForm.mobile}
                                                onChange={e => setRegisterForm({ ...registerForm, mobile: e.target.value })}
                                            />
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Email Address (Optional)</label>
                                            <input
                                                type="email"
                                                placeholder="User email address"
                                                value={registerForm.email}
                                                onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Temporary Password (Optional, Default: Welcome@123)</label>
                                            <input
                                                type="text"
                                                placeholder="Welcome@123"
                                                value={registerForm.password}
                                                onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Section 2: Personal & Community Details */}
                                    <div className="admin-modal-section-title">2. Personal & Community Details</div>
                                    <div className="admin-form-grid-3">
                                        <div className="admin-form-field">
                                            <label>DOB Day</label>
                                            <select value={registerForm.dobDay} onChange={e => setRegisterForm({ ...registerForm, dobDay: e.target.value })}>
                                                {Array.from({ length: 31 }, (_, i) => String(i + 1)).map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>DOB Month</label>
                                            <select value={registerForm.dobMonth} onChange={e => setRegisterForm({ ...registerForm, dobMonth: e.target.value })}>
                                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>DOB Year</label>
                                            <select value={registerForm.dobYear} onChange={e => setRegisterForm({ ...registerForm, dobYear: e.target.value })}>
                                                {Array.from({ length: 65 }, (_, i) => String(2007 - i)).map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="admin-form-grid-2" style={{ marginTop: '14px' }}>
                                        <div className="admin-form-field">
                                            <label>Mother Tongue *</label>
                                            <select value={registerForm.motherTongue} onChange={e => setRegisterForm({ ...registerForm, motherTongue: e.target.value })}>
                                                {languages.map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Marital Status</label>
                                            <select value={registerForm.maritalStatus} onChange={e => setRegisterForm({ ...registerForm, maritalStatus: e.target.value })}>
                                                {maritalOptions.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Height</label>
                                            <select value={registerForm.height} onChange={e => setRegisterForm({ ...registerForm, height: e.target.value })}>
                                                {heights.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Religion *</label>
                                            <select
                                                value={registerForm.religion}
                                                onChange={e => setRegisterForm({ ...registerForm, religion: e.target.value, caste: '', casteOther: '' })}
                                            >
                                                {religions.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Caste *</label>
                                            <select
                                                value={registerForm.caste}
                                                onChange={e => setRegisterForm({ ...registerForm, caste: e.target.value })}
                                            >
                                                <option value="">Select Caste</option>
                                                {registerCastes.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        {registerForm.caste === 'Other' && (
                                            <div className="admin-form-field">
                                                <label>Specify Caste *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Specify the caste"
                                                    value={registerForm.casteOther}
                                                    onChange={e => setRegisterForm({ ...registerForm, casteOther: e.target.value })}
                                                />
                                            </div>
                                        )}
                                        <div className="admin-form-field">
                                            <label>Horoscope</label>
                                            <select value={registerForm.horoscope} onChange={e => setRegisterForm({ ...registerForm, horoscope: e.target.value })}>
                                                <option value="">Select Horoscope</option>
                                                {horoscopes.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Section 3: Location Details */}
                                    <div className="admin-modal-section-title">3. Location Details</div>
                                    <div className="admin-form-grid-3">
                                        <div className="admin-form-field">
                                            <label>Working Country</label>
                                            <input
                                                type="text"
                                                value={registerForm.workingCountry}
                                                onChange={e => setRegisterForm({ ...registerForm, workingCountry: e.target.value })}
                                            />
                                        </div>
                                        <div className="admin-form-field">
                                            <label>State</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Tamil Nadu"
                                                value={registerForm.state}
                                                onChange={e => setRegisterForm({ ...registerForm, state: e.target.value })}
                                            />
                                        </div>
                                        <div className="admin-form-field">
                                            <label>City</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Chennai"
                                                value={registerForm.city}
                                                onChange={e => setRegisterForm({ ...registerForm, city: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Section 4: Education & Profession */}
                                    <div className="admin-modal-section-title">4. Education & Profession</div>
                                    <div className="admin-form-grid-2">
                                        <div className="admin-form-field">
                                            <label>Highest Degree</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. B.E / B.Tech / MBA"
                                                value={registerForm.education}
                                                onChange={e => setRegisterForm({ ...registerForm, education: e.target.value })}
                                            />
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Employment Sector</label>
                                            <select value={registerForm.employmentType} onChange={e => setRegisterForm({ ...registerForm, employmentType: e.target.value })}>
                                                {employedInOptions.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Occupation</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Software Engineer"
                                                value={registerForm.occupation}
                                                onChange={e => setRegisterForm({ ...registerForm, occupation: e.target.value })}
                                            />
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Annual Income</label>
                                            <select value={registerForm.income} onChange={e => setRegisterForm({ ...registerForm, income: e.target.value })}>
                                                {incomes.map(inc => <option key={inc} value={inc}>{inc}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Section 5: Family & Lifestyle */}
                                    <div className="admin-modal-section-title">5. Family & Lifestyle</div>
                                    <div className="admin-form-grid-2">
                                        <div className="admin-form-field">
                                            <label>Family Type</label>
                                            <select value={registerForm.familyType} onChange={e => setRegisterForm({ ...registerForm, familyType: e.target.value })}>
                                                {familyTypeOptions.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Diet</label>
                                            <select value={registerForm.diet} onChange={e => setRegisterForm({ ...registerForm, diet: e.target.value })}>
                                                {dietOptions.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Father's Name & Occupation</label>
                                            <input
                                                type="text"
                                                placeholder="Father name & job"
                                                value={registerForm.fatherName}
                                                onChange={e => setRegisterForm({ ...registerForm, fatherName: e.target.value })}
                                            />
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Mother's Name & Occupation</label>
                                            <input
                                                type="text"
                                                placeholder="Mother name & job"
                                                value={registerForm.motherName}
                                                onChange={e => setRegisterForm({ ...registerForm, motherName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="admin-modal-footer">
                                    <button type="button" className="admin-btn-cancel" onClick={() => setShowRegisterModal(false)}>Cancel</button>
                                    <button type="submit" className="admin-btn-submit" disabled={registerLoading}>
                                        {registerLoading ? 'Registering User...' : 'Complete Registration'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit User Modal */}
                {showEditModal && (
                    <div className="admin-modal-overlay">
                        <div className="admin-modal-large">
                            <div className="admin-modal-header">
                                <h3>Edit User Profile: {editUserForm.fullName || 'User'} ({editUserForm.uniqueId || 'N/A'})</h3>
                                <button className="admin-modal-close-btn" onClick={() => setShowEditModal(false)}>✕</button>
                            </div>
                            {editLoading ? (
                                <div style={{ padding: '40px', textAlign: 'center' }}>Loading user details...</div>
                            ) : (
                                <form onSubmit={handleSaveEditUser} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                                    <div className="admin-modal-body">
                                        {editError && (
                                            <div className="admin-alert error" style={{ padding: '10px 14px', marginBottom: '16px' }}>
                                                {editError}
                                            </div>
                                        )}

                                        {/* Account Information */}
                                        <div className="admin-modal-section-title">Account & Credentials</div>
                                        <div className="admin-form-grid-2">
                                            <div className="admin-form-field">
                                                <label>Unique ID</label>
                                                <input
                                                    type="text"
                                                    value={editUserForm.uniqueId || ''}
                                                    onChange={e => setEditUserForm({ ...editUserForm, uniqueId: e.target.value })}
                                                />
                                            </div>
                                            <div className="admin-form-field">
                                                <label>Full Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={editUserForm.fullName || ''}
                                                    onChange={e => setEditUserForm({ ...editUserForm, fullName: e.target.value })}
                                                />
                                            </div>
                                            <div className="admin-form-field">
                                                <label>Mobile Number *</label>
                                                <input
                                                    type="text"
                                                    value={editUserForm.mobile || ''}
                                                    onChange={e => setEditUserForm({ ...editUserForm, mobile: e.target.value })}
                                                />
                                            </div>
                                            <div className="admin-form-field">
                                                <label>Email Address</label>
                                                <input
                                                    type="email"
                                                    value={editUserForm.email || ''}
                                                    onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="admin-form-field">
                                                <label>Gender</label>
                                                <select
                                                    value={editUserForm.gender || 'Male'}
                                                    onChange={e => setEditUserForm({ ...editUserForm, gender: e.target.value })}
                                                >
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </select>
                                            </div>
                                            <div className="admin-form-field">
                                                <label>Verification Status</label>
                                                <select
                                                    value={editUserForm.isVerified ? 'true' : 'false'}
                                                    onChange={e => setEditUserForm({ ...editUserForm, isVerified: e.target.value === 'true' })}
                                                >
                                                    <option value="true">Verified ✓</option>
                                                    <option value="false">Unverified</option>
                                                </select>
                                            </div>
                                            <div className="admin-form-field" style={{ gridColumn: 'span 2' }}>
                                                <label>Reset Password (leave empty to keep current password)</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter new password if you want to reset it"
                                                    value={editUserForm.password || ''}
                                                    onChange={e => setEditUserForm({ ...editUserForm, password: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Personal & Community Details */}
                                        <div className="admin-modal-section-title">Personal & Community Details</div>
                                        <div className="admin-form-grid-2">
                                            <div className="admin-form-field">
                                                <label>Date of Birth (YYYY-MM-DD)</label>
                                                <input
                                                    type="text"
                                                    placeholder="YYYY-MM-DD"
                                                    value={editUserForm.dob || ''}
                                                    onChange={e => setEditUserForm({ ...editUserForm, dob: e.target.value })}
                                                />
                                            </div>
                                            <div className="admin-form-field">
                                                <label>Mother Tongue</label>
                                                <select value={editUserForm.motherTongue || 'Tamil'} onChange={e => setEditUserForm({ ...editUserForm, motherTongue: e.target.value })}>
                                                    {languages.map(l => <option key={l} value={l}>{l}</option>)}
                                                </select>
                                            </div>
                                            <div className="admin-form-field">
                                                <label>Marital Status</label>
                                                <select value={editUserForm.maritalStatus || 'Never Married'} onChange={e => setEditUserForm({ ...editUserForm, maritalStatus: e.target.value })}>
                                                    {maritalOptions.map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                            <div className="admin-form-field">
                                                <label>Height</label>
                                                <select value={editUserForm.height || ''} onChange={e => setEditUserForm({ ...editUserForm, height: e.target.value })}>
                                                    <option value="">Select Height</option>
                                                    {heights.map(h => <option key={h} value={h}>{h}</option>)}
                                                </select>
                                            </div>
                                            <div className="admin-form-field">
                                                <label>Religion</label>
                                                <select
                                                    value={editUserForm.religion || 'Hindu'}
                                                    onChange={e => setEditUserForm({ ...editUserForm, religion: e.target.value, caste: '', casteOther: '' })}
                                                >
                                                    {religions.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </div>
                                            <div className="admin-form-field">
                                                <label>Caste</label>
                                                <select
                                                    value={editUserForm.caste || ''}
                                                    onChange={e => setEditUserForm({ ...editUserForm, caste: e.target.value })}
                                                >
                                                    <option value="">Select Caste</option>
                                                    {editCastes.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            {editUserForm.caste === 'Other' && (
                                                <div className="admin-form-field">
                                                    <label>Specify Caste *</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Specify the caste"
                                                        value={editUserForm.casteOther || ''}
                                                        onChange={e => setEditUserForm({ ...editUserForm, casteOther: e.target.value })}
                                                    />
                                                </div>
                                            )}
                                            <div className="admin-form-field">
                                                <label>Horoscope</label>
                                                <select value={editUserForm.horoscope || ''} onChange={e => setEditUserForm({ ...editUserForm, horoscope: e.target.value })}>
                                                    <option value="">Select Horoscope</option>
                                                    {horoscopes.map(h => <option key={h} value={h}>{h}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Location & Career */}
                                        <div className="admin-modal-section-title">Location, Education & Career</div>
                                        <div className="admin-form-grid-3">
                                            <div className="admin-form-field">
                                                <label>Country</label>
                                                <input
                                                    type="text"
                                                    value={editUserForm.country || editUserForm.workingCountry || ''}
                                                    onChange={e => setEditUserForm({ ...editUserForm, country: e.target.value, workingCountry: e.target.value })}
                                                />
                                            </div>
                                            <div className="admin-form-field">
                                                <label>State</label>
                                                <input
                                                    type="text"
                                                    value={editUserForm.state || ''}
                                                    onChange={e => setEditUserForm({ ...editUserForm, state: e.target.value })}
                                                />
                                            </div>
                                            <div className="admin-form-field">
                                                <label>City</label>
                                                <input
                                                    type="text"
                                                    value={editUserForm.city || ''}
                                                    onChange={e => setEditUserForm({ ...editUserForm, city: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="admin-form-grid-2" style={{ marginTop: '14px' }}>
                                            <div className="admin-form-field">
                                                <label>Highest Education</label>
                                                <input
                                                    type="text"
                                                    value={editUserForm.education || ''}
                                                    onChange={e => setEditUserForm({ ...editUserForm, education: e.target.value })}
                                                />
                                            </div>
                                            <div className="admin-form-field">
                                                <label>Employment Sector</label>
                                                <select value={editUserForm.employmentType || ''} onChange={e => setEditUserForm({ ...editUserForm, employmentType: e.target.value })}>
                                                    <option value="">Select Sector</option>
                                                    {employedInOptions.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                                                </select>
                                            </div>
                                            <div className="admin-form-field">
                                                <label>Occupation</label>
                                                <input
                                                    type="text"
                                                    value={editUserForm.occupation || ''}
                                                    onChange={e => setEditUserForm({ ...editUserForm, occupation: e.target.value })}
                                                />
                                            </div>
                                            <div className="admin-form-field">
                                                <label>Annual Income</label>
                                                <select value={editUserForm.income || ''} onChange={e => setEditUserForm({ ...editUserForm, income: e.target.value })}>
                                                    <option value="">Select Income</option>
                                                    {incomes.map(inc => <option key={inc} value={inc}>{inc}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Family & Lifestyle */}
                                        <div className="admin-modal-section-title">Family Details</div>
                                        <div className="admin-form-grid-2">
                                            <div className="admin-form-field">
                                                <label>Father's Name & Occupation</label>
                                                <input
                                                    type="text"
                                                    value={editUserForm.fatherName || ''}
                                                    onChange={e => setEditUserForm({ ...editUserForm, fatherName: e.target.value })}
                                                />
                                            </div>
                                            <div className="admin-form-field">
                                                <label>Mother's Name & Occupation</label>
                                                <input
                                                    type="text"
                                                    value={editUserForm.motherName || ''}
                                                    onChange={e => setEditUserForm({ ...editUserForm, motherName: e.target.value })}
                                                />
                                            </div>
                                            <div className="admin-form-field">
                                                <label>Diet</label>
                                                <select value={editUserForm.diet || ''} onChange={e => setEditUserForm({ ...editUserForm, diet: e.target.value })}>
                                                    <option value="">Select Diet</option>
                                                    {dietOptions.map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>
                                            <div className="admin-form-field">
                                                <label>Family Type</label>
                                                <select value={editUserForm.familyType || 'Nuclear Family'} onChange={e => setEditUserForm({ ...editUserForm, familyType: e.target.value })}>
                                                    {familyTypeOptions.map(f => <option key={f} value={f}>{f}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="admin-modal-footer">
                                        <button type="button" className="admin-btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
                                        <button type="submit" className="admin-btn-submit" disabled={isSavingEdit}>
                                            {isSavingEdit ? 'Saving Changes...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {/* Storage View Modal */}
                {showStorage && (
                    <div className="admin-modal-overlay">
                        <div className="admin-modal" style={{ maxWidth: '500px', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0 }}>System Storage Report</h3>
                                <button className="admin-modal-close-btn" onClick={() => setShowStorage(false)}>✕</button>
                            </div>
                            {loadingStorage ? (
                                <p>Loading storage data...</p>
                            ) : storageData ? (
                                <div style={{ fontSize: '0.95rem', lineHeight: '1.8' }}>
                                    <p><strong>Database User Space:</strong> {storageData.databaseStorage?.totalUserSpaceMB} MB</p>
                                    <p><strong>Total Registered Profiles:</strong> {storageData.totalUsers}</p>
                                    <p><strong>Server Disk Total:</strong> {storageData.vpsStorage?.total}</p>
                                    <p><strong>Server Disk Used:</strong> {storageData.vpsStorage?.used}</p>
                                    <p><strong>Server Disk Available:</strong> {storageData.vpsStorage?.available}</p>
                                    <p><strong>Disk Utilization:</strong> {storageData.vpsStorage?.usePercent}</p>
                                </div>
                            ) : (
                                <p>No storage info available.</p>
                            )}
                            <div style={{ textAlign: 'right', marginTop: '20px' }}>
                                <button className="admin-modal-btn no" onClick={() => setShowStorage(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manage Website Images */}
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

                {/* Manage Success Stories */}
                <div className="admin-card story-card">
                    <h2>Manage Success Stories</h2>
                    <p>Update the couple names, descriptions, and images for the "Real Stories, True Connections" section.</p>

                    {storyStatus.message && (
                        <div className={`admin-alert ${storyStatus.error ? 'error' : 'success'}`}>
                            {storyStatus.message}
                        </div>
                    )}

                    <div className="admin-stories-edit-grid">
                        {['story1', 'story2', 'story3'].map((storyKey, idx) => (
                            <div key={storyKey} className="admin-story-edit-item">
                                <h3>Story {idx + 1}</h3>
                                <div className="admin-story-field">
                                    <label>Couple Names</label>
                                    <input
                                        type="text"
                                        className="admin-story-input"
                                        placeholder="e.g. John & Jane"
                                        value={storyData[storyKey]?.coupleName || ''}
                                        onChange={(e) => handleStoryChange(storyKey, 'coupleName', e.target.value)}
                                    />
                                </div>
                                <div className="admin-story-field">
                                    <label>Their Story / Testimonial</label>
                                    <textarea
                                        className="admin-story-textarea"
                                        rows={4}
                                        placeholder="Enter their success story..."
                                        value={storyData[storyKey]?.description || ''}
                                        onChange={(e) => handleStoryChange(storyKey, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="admin-story-field">
                                    <label>Couple Image</label>
                                    <p className="admin-story-img-note">Recommended: 600x400px (PNG/JPG)</p>
                                    <label className="admin-upload-btn story-img-btn">
                                        Change Photo
                                        <input
                                            type="file"
                                            accept="image/png, image/jpeg"
                                            onChange={(e) => handleImageUpload(e, storyKey)}
                                            hidden
                                        />
                                    </label>
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
                            {savingStories ? 'Saving Changes...' : 'Save All Stories'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
