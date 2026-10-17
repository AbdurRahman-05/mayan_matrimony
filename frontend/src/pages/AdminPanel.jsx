import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { showAlert } from '../components/GlobalModal';
import { apiFetch } from '../services/api';
import {
    horoscopes, religions, maritalOptions, heights, educationOptions,
    employedInOptions, occupations, incomes, residentialStatusOptions,
    dietOptions, smokingOptions, drinkingOptions, familyTypeOptions, languages,
    booleanOptions, childrenCountOptions, physicalStatusOptions, disabilityOptions,
    bodyTypeOptions, financialStatusOptions, propertyTypeOptions, familyStatusOptions,
    familyIncomes, fatherOccupationOptions, motherOccupationOptions, siblingCounts,
    currencies
} from '../data/sharedOptions';
import { getCastes, getSects, getCountries, getStates, getCities, nationalities } from '../data/locationData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminPanel.css';

const initialRegisterForm = {
    // 1. Account
    fullName: '',
    profileFor: 'Self',
    gender: 'Male',
    mobile: '',
    email: '',
    password: '',
    isVerified: true,
    photo: null,

    // 2. Personal & Community
    dobDay: '1',
    dobMonth: 'Jan',
    dobYear: '1995',
    nationality: 'Indian',
    motherTongue: 'Tamil',
    religion: 'Hindu',
    sect: '',
    caste: '',
    casteOther: '',
    willingToMarryOtherCaste: 'No',
    maritalStatus: 'Never Married',
    havingChildren: 'No',
    numberOfChildren: '',
    height: '5ft 6in (167 cm)',
    physicalStatus: 'Normal',
    disability: 'None',
    bodyType: 'Average',
    weight: '',

    // 3. Horoscope & Astrology
    horoscope: '',
    timeOfBirth: '',
    placeOfBirth: '',
    dosham: 'No',

    // 4. Location
    country: 'India',
    workingCountry: 'India',
    visaStatus: '',
    state: 'Tamil Nadu',
    city: '',
    residentialStatus: 'Citizen',

    // 5. Education & Career
    education: 'B.E/B.Tech',
    employmentType: 'Private Sector',
    occupation: 'Software Professional',
    organizationName: '',
    currency: 'INR',
    income: 'Rs. 5 - 7.5 Lakh',
    extraIncome: '',
    jobDetails: '',
    propertyType: 'Own House',
    financialStatus: 'Middle Class',

    // 6. Lifestyle & Habits
    diet: 'Veg',
    smoking: 'No',
    drinking: 'No',

    // 7. Family Details
    familyType: 'Nuclear Family',
    familyStatus: 'Middle Class',
    familyIncome: 'INR 4 Lakh to 7 Lakh',
    fatherName: '',
    fatherStatus: 'Employed',
    fatherOccupation: '',
    motherName: '',
    motherStatus: 'Homemaker',
    motherOccupation: '',
    elderBrother: '0',
    marriedElderBrother: '0',
    youngerBrother: '0',
    marriedYoungerBrother: '0',
    elderSister: '0',
    marriedElderSister: '0',
    youngerSister: '0',
    marriedYoungerSister: '0',
    familyLivingIn: '',

    // 8. Identity, Address & About
    aadharNumber: '',
    temporaryAddress: '',
    permanentAddress: '',
    about: '',
    partnerPreference: ''
};

const AdminPanel = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return sessionStorage.getItem('isAdminAuthenticated') === 'true';
    });
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
    const [editActiveTab, setEditActiveTab] = useState('account');
    const [viewActiveTab, setViewActiveTab] = useState('overview');
    const [previewDocModal, setPreviewDocModal] = useState(null);
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

    // Dynamic options for Register Modal
    const registerSects = useMemo(() => {
        return getSects(registerForm.religion);
    }, [registerForm.religion]);

    const registerCastes = useMemo(() => {
        return getCastes(registerForm.religion, registerForm.sect);
    }, [registerForm.religion, registerForm.sect]);

    const registerStates = useMemo(() => {
        return getStates(registerForm.country || 'India');
    }, [registerForm.country]);

    const registerCities = useMemo(() => {
        return getCities(registerForm.country || 'India', registerForm.state);
    }, [registerForm.country, registerForm.state]);

    // Dynamic options for Edit Modal
    const editSects = useMemo(() => {
        return getSects(editUserForm.religion);
    }, [editUserForm.religion]);

    const editCastes = useMemo(() => {
        return getCastes(editUserForm.religion, editUserForm.sect);
    }, [editUserForm.religion, editUserForm.sect]);

    const editStates = useMemo(() => {
        return getStates(editUserForm.country || 'India');
    }, [editUserForm.country]);

    const editCities = useMemo(() => {
        return getCities(editUserForm.country || 'India', editUserForm.state);
    }, [editUserForm.country, editUserForm.state]);

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

    // Helper to calculate age from DOB or dob_year
    const calculateAge = (dob, dobYear) => {
        if (dob) {
            const birthDate = new Date(dob);
            if (!isNaN(birthDate.getTime())) {
                const diff = Date.now() - birthDate.getTime();
                const ageDate = new Date(diff);
                return Math.abs(ageDate.getUTCFullYear() - 1970);
            }
        }
        if (dobYear) {
            const y = parseInt(dobYear);
            if (!isNaN(y)) return new Date().getFullYear() - y;
        }
        return 'N/A';
    };

    // Photo change for Edit Modal
    const handleEditPhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showAlert('Photo must be less than 5MB', 'File Size Limit');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setEditUserForm(prev => ({ ...prev, photo: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    // Admin direct photo upload for candidate
    const handleAdminUploadUserPhoto = async (userId, e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showAlert('Photo must be less than 5MB', 'File Size Limit');
            return;
        }
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const res = await apiFetch(`/admin/users/${userId}/photos`, {
                    method: 'POST',
                    body: JSON.stringify({ photoData: reader.result })
                });
                if (res.success) {
                    showAlert('Photo uploaded successfully!', 'Success');
                    handleSeeProfile(userId);
                    fetchUsers(false);
                } else {
                    showAlert(res.error || 'Failed to upload photo', 'Error');
                }
            } catch (err) {
                showAlert(err.message || 'Error uploading photo', 'Error');
            }
        };
        reader.readAsDataURL(file);
    };

    // Admin set main photo for candidate
    const handleAdminSetMainPhoto = async (userId, photoId) => {
        try {
            const res = await apiFetch(`/admin/users/${userId}/photos/${photoId}/main`, {
                method: 'PUT'
            });
            if (res.success) {
                showAlert('Main profile photo updated successfully!', 'Success');
                handleSeeProfile(userId);
                fetchUsers(false);
            }
        } catch (err) {
            showAlert(err.message || 'Error setting main photo', 'Error');
        }
    };

    // Admin delete photo for candidate
    const handleAdminDeletePhoto = async (userId, photoId) => {
        if (!window.confirm('Are you sure you want to delete this photo?')) return;
        try {
            const res = await apiFetch(`/admin/users/${userId}/photos/${photoId}`, {
                method: 'DELETE'
            });
            if (res.success) {
                showAlert('Photo deleted successfully!', 'Success');
                handleSeeProfile(userId);
                fetchUsers(false);
            }
        } catch (err) {
            showAlert(err.message || 'Error deleting photo', 'Error');
        }
    };

    const handleRegisterPhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showAlert('Photo must be less than 5MB', 'File Size Limit');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setRegisterForm(prev => ({ ...prev, photo: reader.result }));
        };
        reader.readAsDataURL(file);
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
                caste: registerForm.caste === 'Other' && registerForm.casteOther ? registerForm.casteOther.trim() : registerForm.caste,
                country: registerForm.country || 'India',
                workingCountry: registerForm.workingCountry || registerForm.country || 'India'
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

    // Open Edit User Modal with full fields
    const handleOpenEditModal = async (user) => {
        setEditError('');
        setEditLoading(true);
        setEditActiveTab('account');
        setShowEditModal(true);

        const targetUserId = user.user_id || user.id;

        try {
            const fullData = await apiFetch(`/admin/users/${targetUserId}`);
            const p = fullData.profile || {};
            const standardCastes = getCastes(p.religion || 'Hindu', p.sect);
            const isCustomCaste = p.caste && !standardCastes.includes(p.caste);

            // Compute DOB Day, Month, Year
            let dDay = p.dob_day || '';
            let dMonth = p.dob_month || '';
            let dYear = p.dob_year || '';
            if (p.dob && (!dDay || !dMonth || !dYear)) {
                const parsedDate = new Date(p.dob);
                if (!isNaN(parsedDate.getTime())) {
                    dDay = dDay || String(parsedDate.getDate());
                    const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                    dMonth = dMonth || mNames[parsedDate.getMonth()];
                    dYear = dYear || String(parsedDate.getFullYear());
                }
            }

            setEditUserForm({
                userId: targetUserId,
                uniqueId: fullData.unique_id || user.unique_id || '',
                fullName: p.full_name || user.first_name || '',
                profileFor: fullData.profile_for || 'Self',
                gender: fullData.gender || user.gender || 'Male',
                mobile: fullData.mobile || user.phone || '',
                email: fullData.email && fullData.email !== 'No Email' ? fullData.email : '',
                isVerified: fullData.is_verified ?? true,
                password: '', // Blank unless admin enters a new password
                photo: p.photo || (fullData.photos && fullData.photos.length > 0 ? fullData.photos[0].photo_data : null),

                // Personal & Physical
                dob: p.dob ? String(p.dob).split('T')[0] : '',
                dobDay: dDay || '1',
                dobMonth: dMonth || 'Jan',
                dobYear: dYear || '1995',
                nationality: p.nationality || 'Indian',
                motherTongue: p.mother_tongue || 'Tamil',
                religion: p.religion || 'Hindu',
                sect: p.sect || '',
                caste: isCustomCaste ? 'Other' : (p.caste || ''),
                casteOther: isCustomCaste ? p.caste : '',
                willingToMarryOtherCaste: p.willing_to_marry_other_caste || 'No',
                maritalStatus: p.marital_status || 'Never Married',
                havingChildren: p.having_children || 'No',
                numberOfChildren: p.number_of_children || '',
                height: p.height || '5ft 6in (167 cm)',
                physicalStatus: p.physical_status || 'Normal',
                disability: p.disability || 'None',
                bodyType: p.body_type || 'Average',
                weight: p.weight || '',

                // Horoscope & Astrology
                horoscope: p.horoscope || '',
                star: p.star || '',
                timeOfBirth: p.time_of_birth || '',
                placeOfBirth: p.place_of_birth || '',
                dosham: p.dosham || 'No',

                // Location & Living
                country: p.country || 'India',
                workingCountry: p.working_country || p.country || 'India',
                visaStatus: p.visa_status || '',
                state: p.state || 'Tamil Nadu',
                city: p.city || '',
                residentialStatus: p.residential_status || 'Citizen',

                // Education & Career
                education: p.education || '',
                employmentType: p.employment_type || '',
                occupation: p.occupation || '',
                organizationName: p.organization_name || '',
                currency: p.currency || 'INR',
                income: p.income || '',
                extraIncome: p.extra_income || '',
                jobDetails: p.job_details || '',
                propertyType: p.property_type || '',
                financialStatus: p.financial_status || '',

                // Lifestyle & Habits
                diet: p.diet || 'Veg',
                smoking: p.smoking || 'No',
                drinking: p.drinking || 'No',

                // Family Details
                familyType: p.family_type || 'Nuclear Family',
                familyStatus: p.family_status || 'Middle Class',
                familyIncome: p.family_income || '',
                fatherName: p.father_name || '',
                fatherStatus: p.father_status || 'Employed',
                fatherOccupation: p.father_occupation || '',
                motherName: p.mother_name || '',
                motherStatus: p.mother_status || 'Homemaker',
                motherOccupation: p.mother_occupation || '',
                elderBrother: p.elder_brother || '0',
                marriedElderBrother: p.married_elder_brother || '0',
                youngerBrother: p.younger_brother || '0',
                marriedYoungerBrother: p.married_younger_brother || '0',
                elderSister: p.elder_sister || '0',
                marriedElderSister: p.married_elder_sister || '0',
                youngerSister: p.younger_sister || '0',
                marriedYoungerSister: p.married_younger_sister || '0',
                familyLivingIn: p.family_living_in || '',

                // Identity, Address & About
                aadharNumber: p.aadhar_number || '',
                temporaryAddress: p.temporary_address || '',
                permanentAddress: p.permanent_address || '',
                about: p.about || '',
                partnerPreference: p.partner_preference || ''
            });
        } catch (err) {
            setEditError('Failed to fetch full user details: ' + (err.message || ''));
        } finally {
            setEditLoading(false);
        }
    };

    // Save Edit User Changes across all registration fields
    const handleSaveEditUser = async (e) => {
        e.preventDefault();
        setEditError('');
        setIsSavingEdit(true);

        try {
            const monthsMap = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
            let computedDob = editUserForm.dob;
            if (editUserForm.dobYear && editUserForm.dobMonth && editUserForm.dobDay) {
                const mm = monthsMap[editUserForm.dobMonth] || '01';
                const dd = String(editUserForm.dobDay).padStart(2, '0');
                computedDob = `${editUserForm.dobYear}-${mm}-${dd}`;
            }

            const payload = {
                ...editUserForm,
                dob: computedDob,
                caste: editUserForm.caste === 'Other' && editUserForm.casteOther ? editUserForm.casteOther.trim() : editUserForm.caste
            };

            const res = await apiFetch(`/admin/users/${editUserForm.userId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            if (res.success) {
                showAlert('Candidate registration details updated successfully!', 'Update Successful');
                setShowEditModal(false);
                fetchUsers(true);
                fetchStats();
                if (fullProfile && (fullProfile.id === editUserForm.userId || fullProfile.user_id === editUserForm.userId)) {
                    handleSeeProfile(editUserForm.userId);
                }
            } else {
                setEditError(res.error || 'Failed to update user details');
            }
        } catch (err) {
            setEditError(err.message || 'Error occurred while updating candidate details');
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
                body: JSON.stringify({ id: loginId.trim(), password: loginPassword })
            });
            if (data.success) {
                sessionStorage.setItem('isAdminAuthenticated', 'true');
                setIsAuthenticated(true);
            } else {
                setLoginError(data.error || 'Invalid ID or Password');
            }
        } catch (error) {
            setLoginError(error.message || 'An error occurred during login');
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('isAdminAuthenticated');
        setIsAuthenticated(false);
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

    // Main Admin Dashboard View
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
                        <button className="admin-action-btn btn-logout" onClick={handleLogout}>
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
                                            <th style={{ width: '45px' }}>#</th>
                                            <th>Unique ID</th>
                                            <th>Candidate Name</th>
                                            <th>Phone</th>
                                            <th>Gender</th>
                                            <th>Religion & Caste</th>
                                            <th>Location</th>
                                            <th>Registration Date</th>
                                            <th className="col-actions">Actions</th>
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
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="admin-user-id-btn"
                                                            onClick={() => handleSeeProfile(user.user_id)}
                                                            title="Click to view complete registration details"
                                                        >
                                                            <span>{user.unique_id || 'N/A'}</span>
                                                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>↗</span>
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <div
                                                            className="admin-user-name-link"
                                                            onClick={() => handleSeeProfile(user.user_id)}
                                                            title="Click to view candidate profile"
                                                        >
                                                            <span>{user.first_name} {user.last_name}</span>
                                                            {user.is_verified ? (
                                                                <span className="admin-badge-verified">✓ Verified</span>
                                                            ) : (
                                                                <span className="admin-badge-unverified">Unverified</span>
                                                            )}
                                                        </div>
                                                        <small style={{ color: '#888', display: 'block' }}>{user.email !== 'No Email' ? user.email : ''}</small>
                                                    </td>
                                                    <td><strong>{user.phone}</strong></td>
                                                    <td>{user.gender}</td>
                                                    <td>
                                                        <div>{user.religion || 'N/A'}</div>
                                                        <small style={{ color: '#059669', fontWeight: 600 }}>{user.caste || 'Not Specified'}</small>
                                                    </td>
                                                    <td>{[user.city, user.state].filter(Boolean).join(', ') || 'N/A'}</td>
                                                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                                    <td className="col-actions">
                                                        <div className="admin-action-btns" style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                            <button
                                                                className="admin-btn-profile"
                                                                onClick={() => handleSeeProfile(user.user_id)}
                                                                title="View Full Registration Details"
                                                            >
                                                                👁️ {loadingProfile && user.user_id === fullProfile?.id ? '...' : 'View'}
                                                            </button>
                                                            <button
                                                                className="admin-btn-edit"
                                                                onClick={() => handleOpenEditModal(user)}
                                                                title="Update User Details"
                                                            >
                                                                ✏️ Edit
                                                            </button>
                                                            <button
                                                                className="admin-btn-download"
                                                                onClick={() => handleDownloadSingleProfile(user.user_id, user.first_name, user.unique_id)}
                                                                disabled={downloadingProfileId === user.user_id}
                                                                title="Download Bio-Data PDF"
                                                            >
                                                                {downloadingProfileId === user.user_id ? '...' : '📄 PDF'}
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

                {/* Register New User Modal (Admin Console) */}
                {showRegisterModal && (
                    <div className="admin-modal-overlay">
                        <div className="admin-modal-large" style={{ maxWidth: '920px' }}>
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
                                    <div className="admin-modal-section-title">1. Account Information & Credentials</div>
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
                                                {['Self', 'Son', 'Daughter', 'Brother', 'Sister', 'Relative', 'Friend', 'Other'].map(opt => (
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
                                                type="tel"
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
                                        <div className="admin-form-field">
                                            <label>Account Status</label>
                                            <select
                                                value={registerForm.isVerified ? 'true' : 'false'}
                                                onChange={e => setRegisterForm({ ...registerForm, isVerified: e.target.value === 'true' })}
                                            >
                                                <option value="true">Verified ✓ (Active on Sri Mayan)</option>
                                                <option value="false">Unverified</option>
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Profile Photo (Optional)</label>
                                            <div className="admin-photo-upload-box">
                                                {registerForm.photo ? (
                                                    <>
                                                        <img src={registerForm.photo} alt="Preview" className="admin-photo-thumb" />
                                                        <button
                                                            type="button"
                                                            className="admin-photo-clear-btn"
                                                            onClick={() => setRegisterForm(prev => ({ ...prev, photo: null }))}
                                                        >
                                                            Remove Photo
                                                        </button>
                                                    </>
                                                ) : (
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleRegisterPhotoChange}
                                                        style={{ fontSize: '0.85rem' }}
                                                    />
                                                )}
                                            </div>
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
                                            <label>Nationality</label>
                                            <select value={registerForm.nationality} onChange={e => setRegisterForm({ ...registerForm, nationality: e.target.value })}>
                                                {nationalities.map(nat => <option key={nat} value={nat}>{nat}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Mother Tongue *</label>
                                            <select value={registerForm.motherTongue} onChange={e => setRegisterForm({ ...registerForm, motherTongue: e.target.value })}>
                                                {languages.map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Religion *</label>
                                            <select
                                                value={registerForm.religion}
                                                onChange={e => setRegisterForm({ ...registerForm, religion: e.target.value, sect: '', caste: '', casteOther: '' })}
                                            >
                                                {religions.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>{registerForm.religion === 'Hindu' ? 'Category' : 'Sect'}</label>
                                            {registerSects.length > 0 ? (
                                                <select
                                                    value={registerForm.sect}
                                                    onChange={e => setRegisterForm({ ...registerForm, sect: e.target.value, caste: '', casteOther: '' })}
                                                >
                                                    <option value="">Select {registerForm.religion === 'Hindu' ? 'Category' : 'Sect'}</option>
                                                    {registerSects.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder="Enter sect/division"
                                                    value={registerForm.sect}
                                                    onChange={e => setRegisterForm({ ...registerForm, sect: e.target.value })}
                                                />
                                            )}
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
                                                    placeholder="Specify candidate caste"
                                                    value={registerForm.casteOther}
                                                    onChange={e => setRegisterForm({ ...registerForm, casteOther: e.target.value })}
                                                />
                                            </div>
                                        )}
                                        <div className="admin-form-field">
                                            <label>Willing to Marry Other Caste?</label>
                                            <select value={registerForm.willingToMarryOtherCaste} onChange={e => setRegisterForm({ ...registerForm, willingToMarryOtherCaste: e.target.value })}>
                                                <option value="No">No</option>
                                                <option value="Yes">Yes</option>
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Marital Status *</label>
                                            <select value={registerForm.maritalStatus} onChange={e => setRegisterForm({ ...registerForm, maritalStatus: e.target.value })}>
                                                {maritalOptions.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        {registerForm.maritalStatus !== 'Never Married' && (
                                            <>
                                                <div className="admin-form-field">
                                                    <label>Having Children?</label>
                                                    <select value={registerForm.havingChildren} onChange={e => setRegisterForm({ ...registerForm, havingChildren: e.target.value })}>
                                                        <option value="No">No</option>
                                                        <option value="Yes, living together">Yes, living together</option>
                                                        <option value="Yes, not living together">Yes, not living together</option>
                                                    </select>
                                                </div>
                                                {registerForm.havingChildren && registerForm.havingChildren !== 'No' && (
                                                    <div className="admin-form-field">
                                                        <label>Number of Children</label>
                                                        <select value={registerForm.numberOfChildren} onChange={e => setRegisterForm({ ...registerForm, numberOfChildren: e.target.value })}>
                                                            <option value="">Select count</option>
                                                            {childrenCountOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div className="admin-form-field">
                                            <label>Height</label>
                                            <select value={registerForm.height} onChange={e => setRegisterForm({ ...registerForm, height: e.target.value })}>
                                                {heights.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Physical Status</label>
                                            <select value={registerForm.physicalStatus} onChange={e => setRegisterForm({ ...registerForm, physicalStatus: e.target.value })}>
                                                {physicalStatusOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                        {registerForm.physicalStatus === 'Physically Challenged' && (
                                            <div className="admin-form-field">
                                                <label>Disability Details</label>
                                                <select value={registerForm.disability} onChange={e => setRegisterForm({ ...registerForm, disability: e.target.value })}>
                                                    {disabilityOptions.map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        <div className="admin-form-field">
                                            <label>Body Type</label>
                                            <select value={registerForm.bodyType} onChange={e => setRegisterForm({ ...registerForm, bodyType: e.target.value })}>
                                                {bodyTypeOptions.map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Weight</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 65 kg"
                                                value={registerForm.weight}
                                                onChange={e => setRegisterForm({ ...registerForm, weight: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Section 3: Horoscope & Astrology Details */}
                                    <div className="admin-modal-section-title">3. Horoscope & Astrology Details</div>
                                    <div className="admin-form-grid-2">
                                        <div className="admin-form-field">
                                            <label>Horoscope / Rasi Natchathiram</label>
                                            <select value={registerForm.horoscope} onChange={e => setRegisterForm({ ...registerForm, horoscope: e.target.value })}>
                                                <option value="">Select Horoscope</option>
                                                {horoscopes.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Chevvai Dosham</label>
                                            <select value={registerForm.dosham} onChange={e => setRegisterForm({ ...registerForm, dosham: e.target.value })}>
                                                <option value="No">No</option>
                                                <option value="Yes">Yes</option>
                                                <option value="Don't Know">Don't Know</option>
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Time of Birth</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 10:30 AM"
                                                value={registerForm.timeOfBirth}
                                                onChange={e => setRegisterForm({ ...registerForm, timeOfBirth: e.target.value })}
                                            />
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Place of Birth</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Madurai, Tamil Nadu"
                                                value={registerForm.placeOfBirth}
                                                onChange={e => setRegisterForm({ ...registerForm, placeOfBirth: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Section 4: Location Details */}
                                    <div className="admin-modal-section-title">4. Location Details</div>
                                    <div className="admin-form-grid-3">
                                        <div className="admin-form-field">
                                            <label>Working / Living Country</label>
                                            <select
                                                value={registerForm.workingCountry}
                                                onChange={e => setRegisterForm({ ...registerForm, workingCountry: e.target.value })}
                                            >
                                                {getCountries().map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        {registerForm.workingCountry !== 'India' && (
                                            <div className="admin-form-field">
                                                <label>Visa Status</label>
                                                <select value={registerForm.visaStatus} onChange={e => setRegisterForm({ ...registerForm, visaStatus: e.target.value })}>
                                                    <option value="">Select Visa Status</option>
                                                    {residentialStatusOptions.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        <div className="admin-form-field">
                                            <label>Citizen / Native Country</label>
                                            <select
                                                value={registerForm.country}
                                                onChange={e => setRegisterForm({ ...registerForm, country: e.target.value, state: '', city: '' })}
                                            >
                                                {getCountries().map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>State</label>
                                            {registerStates.length > 0 ? (
                                                <select
                                                    value={registerForm.state}
                                                    onChange={e => setRegisterForm({ ...registerForm, state: e.target.value, city: '' })}
                                                >
                                                    <option value="">Select State</option>
                                                    {registerStates.map(st => <option key={st} value={st}>{st}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder="Enter state"
                                                    value={registerForm.state}
                                                    onChange={e => setRegisterForm({ ...registerForm, state: e.target.value })}
                                                />
                                            )}
                                        </div>
                                        <div className="admin-form-field">
                                            <label>City living in</label>
                                            {registerCities.length > 0 ? (
                                                <select
                                                    value={registerForm.city}
                                                    onChange={e => setRegisterForm({ ...registerForm, city: e.target.value })}
                                                >
                                                    <option value="">Select City</option>
                                                    {registerCities.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder="Enter city"
                                                    value={registerForm.city}
                                                    onChange={e => setRegisterForm({ ...registerForm, city: e.target.value })}
                                                />
                                            )}
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Residential Status</label>
                                            <select value={registerForm.residentialStatus} onChange={e => setRegisterForm({ ...registerForm, residentialStatus: e.target.value })}>
                                                {residentialStatusOptions.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Section 5: Education & Profession */}
                                    <div className="admin-modal-section-title">5. Education & Profession</div>
                                    <div className="admin-form-grid-2">
                                        <div className="admin-form-field">
                                            <label>Highest Degree</label>
                                            <select value={registerForm.education} onChange={e => setRegisterForm({ ...registerForm, education: e.target.value })}>
                                                {educationOptions.map((opt, i) =>
                                                    typeof opt === 'object' && opt.isHeader ? (
                                                        <optgroup key={i} label={opt.label} />
                                                    ) : (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    )
                                                )}
                                            </select>
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
                                                placeholder="e.g. Software Professional"
                                                value={registerForm.occupation}
                                                onChange={e => setRegisterForm({ ...registerForm, occupation: e.target.value })}
                                            />
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Organization / Company Name (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. TCS / Cognizant"
                                                value={registerForm.organizationName}
                                                onChange={e => setRegisterForm({ ...registerForm, organizationName: e.target.value })}
                                            />
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Currency</label>
                                            <select value={registerForm.currency} onChange={e => setRegisterForm({ ...registerForm, currency: e.target.value })}>
                                                {currencies.map(cur => <option key={cur} value={cur}>{cur}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Annual Income</label>
                                            <select value={registerForm.income} onChange={e => setRegisterForm({ ...registerForm, income: e.target.value })}>
                                                {incomes.map(inc => <option key={inc} value={inc}>{inc}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Other Extra Income (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Rs. 2 Lakh (Rental / Business)"
                                                value={registerForm.extraIncome}
                                                onChange={e => setRegisterForm({ ...registerForm, extraIncome: e.target.value })}
                                            />
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Property Type</label>
                                            <select value={registerForm.propertyType} onChange={e => setRegisterForm({ ...registerForm, propertyType: e.target.value })}>
                                                {propertyTypeOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Financial Status</label>
                                            <select value={registerForm.financialStatus} onChange={e => setRegisterForm({ ...registerForm, financialStatus: e.target.value })}>
                                                {financialStatusOptions.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Job Details / Responsibilities (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="Brief job details"
                                                value={registerForm.jobDetails}
                                                onChange={e => setRegisterForm({ ...registerForm, jobDetails: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Section 6: Lifestyle & Habits */}
                                    <div className="admin-modal-section-title">6. Lifestyle & Habits</div>
                                    <div className="admin-form-grid-3">
                                        <div className="admin-form-field">
                                            <label>Diet *</label>
                                            <select value={registerForm.diet} onChange={e => setRegisterForm({ ...registerForm, diet: e.target.value })}>
                                                {dietOptions.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Smoking</label>
                                            <select value={registerForm.smoking} onChange={e => setRegisterForm({ ...registerForm, smoking: e.target.value })}>
                                                {smokingOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Drinking</label>
                                            <select value={registerForm.drinking} onChange={e => setRegisterForm({ ...registerForm, drinking: e.target.value })}>
                                                {drinkingOptions.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Section 7: Family Details */}
                                    <div className="admin-modal-section-title">7. Family Details</div>
                                    <div className="admin-form-grid-3">
                                        <div className="admin-form-field">
                                            <label>Family Type</label>
                                            <select value={registerForm.familyType} onChange={e => setRegisterForm({ ...registerForm, familyType: e.target.value })}>
                                                {familyTypeOptions.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Family Status</label>
                                            <select value={registerForm.familyStatus} onChange={e => setRegisterForm({ ...registerForm, familyStatus: e.target.value })}>
                                                {familyStatusOptions.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Family Income</label>
                                            <select value={registerForm.familyIncome} onChange={e => setRegisterForm({ ...registerForm, familyIncome: e.target.value })}>
                                                {familyIncomes.map(inc => <option key={inc} value={inc}>{inc}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="admin-form-grid-2" style={{ marginTop: '14px' }}>
                                        <div className="admin-form-field">
                                            <label>Father's Name</label>
                                            <input
                                                type="text"
                                                placeholder="Father full name"
                                                value={registerForm.fatherName}
                                                onChange={e => setRegisterForm({ ...registerForm, fatherName: e.target.value })}
                                            />
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Father's Status</label>
                                            <select value={registerForm.fatherStatus} onChange={e => setRegisterForm({ ...registerForm, fatherStatus: e.target.value })}>
                                                {fatherOccupationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Father's Occupation</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Retired Govt Officer"
                                                value={registerForm.fatherOccupation}
                                                onChange={e => setRegisterForm({ ...registerForm, fatherOccupation: e.target.value })}
                                            />
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Mother's Name</label>
                                            <input
                                                type="text"
                                                placeholder="Mother full name"
                                                value={registerForm.motherName}
                                                onChange={e => setRegisterForm({ ...registerForm, motherName: e.target.value })}
                                            />
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Mother's Status</label>
                                            <select value={registerForm.motherStatus} onChange={e => setRegisterForm({ ...registerForm, motherStatus: e.target.value })}>
                                                {motherOccupationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Mother's Occupation</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Homemaker / Teacher"
                                                value={registerForm.motherOccupation}
                                                onChange={e => setRegisterForm({ ...registerForm, motherOccupation: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '14px' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>
                                            Brothers & Sisters Count
                                        </label>
                                        <div className="admin-form-grid-4">
                                            <div className="admin-form-field">
                                                <label style={{ fontSize: '0.78rem' }}>Elder Brothers</label>
                                                <select value={registerForm.elderBrother} onChange={e => setRegisterForm({ ...registerForm, elderBrother: e.target.value })}>
                                                    {siblingCounts.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="admin-form-field">
                                                <label style={{ fontSize: '0.78rem' }}>Married Elder Brothers</label>
                                                <select value={registerForm.marriedElderBrother} onChange={e => setRegisterForm({ ...registerForm, marriedElderBrother: e.target.value })}>
                                                    {siblingCounts.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="admin-form-field">
                                                <label style={{ fontSize: '0.78rem' }}>Younger Brothers</label>
                                                <select value={registerForm.youngerBrother} onChange={e => setRegisterForm({ ...registerForm, youngerBrother: e.target.value })}>
                                                    {siblingCounts.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="admin-form-field">
                                                <label style={{ fontSize: '0.78rem' }}>Married Younger Brothers</label>
                                                <select value={registerForm.marriedYoungerBrother} onChange={e => setRegisterForm({ ...registerForm, marriedYoungerBrother: e.target.value })}>
                                                    {siblingCounts.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="admin-form-field">
                                                <label style={{ fontSize: '0.78rem' }}>Elder Sisters</label>
                                                <select value={registerForm.elderSister} onChange={e => setRegisterForm({ ...registerForm, elderSister: e.target.value })}>
                                                    {siblingCounts.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="admin-form-field">
                                                <label style={{ fontSize: '0.78rem' }}>Married Elder Sisters</label>
                                                <select value={registerForm.marriedElderSister} onChange={e => setRegisterForm({ ...registerForm, marriedElderSister: e.target.value })}>
                                                    {siblingCounts.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="admin-form-field">
                                                <label style={{ fontSize: '0.78rem' }}>Younger Sisters</label>
                                                <select value={registerForm.youngerSister} onChange={e => setRegisterForm({ ...registerForm, youngerSister: e.target.value })}>
                                                    {siblingCounts.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="admin-form-field">
                                                <label style={{ fontSize: '0.78rem' }}>Married Younger Sisters</label>
                                                <select value={registerForm.marriedYoungerSister} onChange={e => setRegisterForm({ ...registerForm, marriedYoungerSister: e.target.value })}>
                                                    {siblingCounts.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="admin-form-field full-width" style={{ marginTop: '14px' }}>
                                        <label>Family Living In (City / Region)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Madurai, Tamil Nadu"
                                            value={registerForm.familyLivingIn}
                                            onChange={e => setRegisterForm({ ...registerForm, familyLivingIn: e.target.value })}
                                        />
                                    </div>

                                    {/* Section 8: Identity, Address, About & Partner Preference */}
                                    <div className="admin-modal-section-title">8. Identity, Address & Partner Preference</div>
                                    <div className="admin-form-grid-2">
                                        <div className="admin-form-field">
                                            <label>Aadhar Card Number (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="12-digit Aadhar number"
                                                maxLength={12}
                                                value={registerForm.aadharNumber}
                                                onChange={e => setRegisterForm({ ...registerForm, aadharNumber: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="admin-form-grid-2" style={{ marginTop: '14px' }}>
                                        <div className="admin-form-field">
                                            <label>Temporary / Current Address</label>
                                            <textarea
                                                rows={3}
                                                placeholder="Candidate current contact address"
                                                value={registerForm.temporaryAddress}
                                                onChange={e => setRegisterForm({ ...registerForm, temporaryAddress: e.target.value })}
                                            />
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Permanent Address</label>
                                            <textarea
                                                rows={3}
                                                placeholder="Candidate permanent hometown address"
                                                value={registerForm.permanentAddress}
                                                onChange={e => setRegisterForm({ ...registerForm, permanentAddress: e.target.value })}
                                            />
                                        </div>
                                        <div className="admin-form-field">
                                            <label>About Candidate (Bio)</label>
                                            <textarea
                                                rows={3}
                                                placeholder="Write a short summary about the candidate..."
                                                value={registerForm.about}
                                                onChange={e => setRegisterForm({ ...registerForm, about: e.target.value })}
                                            />
                                        </div>
                                        <div className="admin-form-field">
                                            <label>Partner Expectations / Preference</label>
                                            <textarea
                                                rows={3}
                                                placeholder="Expectations from future partner..."
                                                value={registerForm.partnerPreference}
                                                onChange={e => setRegisterForm({ ...registerForm, partnerPreference: e.target.value })}
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

                {/* Full Profile View Modal */}
                {fullProfile && (
                    <div className="admin-modal-overlay" onClick={(e) => { if (e.target.classList.contains('admin-modal-overlay')) setFullProfile(null); }}>
                        <div className="admin-profile-view-modal">
                            {/* Modal Hero Banner */}
                            <div className="admin-profile-modal-hero">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    {fullProfile.photos && fullProfile.photos.length > 0 ? (
                                        <img
                                            src={fullProfile.photos[0].photo_data}
                                            alt="Profile"
                                            className="admin-profile-modal-avatar"
                                            onClick={() => setPreviewDocModal({ type: 'image', src: fullProfile.photos[0].photo_data, title: 'Profile Photo' })}
                                            style={{ cursor: 'pointer' }}
                                            title="Click to enlarge"
                                        />
                                    ) : (
                                        <div className="admin-profile-modal-avatar-placeholder">
                                            {(fullProfile.profile?.full_name || fullProfile.first_name || 'U')[0].toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#fff' }}>
                                                {fullProfile.profile?.full_name || fullProfile.first_name || 'N/A'}
                                            </h2>
                                            {fullProfile.is_verified ? (
                                                <span className="admin-badge-verified" style={{ background: '#dcfce7', color: '#15803d' }}>✓ Verified</span>
                                            ) : (
                                                <span className="admin-badge-unverified" style={{ background: '#fee2e2', color: '#b91c1c' }}>Unverified</span>
                                            )}
                                        </div>
                                        <div style={{ color: '#ccfbf1', fontSize: '0.9rem', marginTop: '4px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                            <span><strong>ID:</strong> {fullProfile.unique_id || 'N/A'}</span>
                                            <span><strong>Profile For:</strong> {fullProfile.profile_for || 'Self'}</span>
                                            <span><strong>Gender:</strong> {fullProfile.gender}</span>
                                            <span><strong>Age:</strong> {calculateAge(fullProfile.profile?.dob, fullProfile.profile?.dob_year)} yrs</span>
                                            <span><strong>Reg Date:</strong> {new Date(fullProfile.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button
                                        className="admin-action-btn btn-amber"
                                        onClick={() => handleOpenEditModal({ user_id: fullProfile.id, first_name: fullProfile.profile?.full_name, unique_id: fullProfile.unique_id })}
                                        title="Update registration details"
                                    >
                                        ✏️ Edit Profile Details
                                    </button>
                                    <button
                                        className="admin-action-btn btn-green"
                                        onClick={() => handleDownloadSingleProfile(fullProfile.id, fullProfile.profile?.full_name, fullProfile.unique_id)}
                                        disabled={downloadingProfileId === fullProfile.id}
                                        title="Download PDF Bio-Data"
                                    >
                                        {downloadingProfileId === fullProfile.id ? 'Downloading...' : '📄 Bio-Data PDF'}
                                    </button>
                                    <button
                                        className="admin-action-btn btn-red"
                                        onClick={() => handleDeleteUser(fullProfile.id)}
                                        title="Remove candidate from database"
                                    >
                                        ✕ Remove
                                    </button>
                                    <button
                                        className="admin-modal-close-btn"
                                        onClick={() => setFullProfile(null)}
                                        style={{ color: '#fff', fontSize: '1.8rem', marginLeft: '10px' }}
                                        title="Close"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* View Navigation Tabs */}
                            <div className="admin-modal-tabs">
                                {[
                                    { id: 'overview', label: '📋 Complete Overview' },
                                    { id: 'personal', label: '👤 Personal & Physical' },
                                    { id: 'astrology', label: '🪐 Horoscope & Astrology' },
                                    { id: 'religion', label: '🕉️ Religion & Community' },
                                    { id: 'career', label: '💼 Career & Education' },
                                    { id: 'location', label: '📍 Location & Living' },
                                    { id: 'family', label: '👨‍👩‍👧‍👦 Family Background' },
                                    { id: 'lifestyle', label: '🥗 Lifestyle & Habits' },
                                    { id: 'contact', label: '🪪 Contact & Address' },
                                    { id: 'photos', label: `🖼️ Photos & Documents (${(fullProfile.photos || []).length})` }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        className={`admin-modal-tab-btn ${viewActiveTab === t.id ? 'active' : ''}`}
                                        onClick={() => setViewActiveTab(t.id)}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* View Modal Body */}
                            <div className="admin-modal-body" style={{ background: '#f8fafc', padding: '20px' }}>
                                {fullProfile.profile ? (
                                    <>
                                        {/* TAB: OVERVIEW */}
                                        {(viewActiveTab === 'overview' || viewActiveTab === 'personal') && (
                                            <div className="admin-profile-detail-card">
                                                <h4>👤 Personal & Physical Details</h4>
                                                <div className="admin-detail-grid">
                                                    <div className="admin-detail-item"><strong>Full Name</strong><span>{fullProfile.profile.full_name || fullProfile.first_name || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Date of Birth</strong><span>{fullProfile.profile.dob ? String(fullProfile.profile.dob).split('T')[0] : [fullProfile.profile.dob_day, fullProfile.profile.dob_month, fullProfile.profile.dob_year].filter(Boolean).join(' ') || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Age</strong><span>{calculateAge(fullProfile.profile.dob, fullProfile.profile.dob_year)} Years</span></div>
                                                    <div className="admin-detail-item"><strong>Gender</strong><span>{fullProfile.gender || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Marital Status</strong><span>{fullProfile.profile.marital_status || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Having Children?</strong><span>{fullProfile.profile.having_children || 'No'} {fullProfile.profile.number_of_children ? `(${fullProfile.profile.number_of_children})` : ''}</span></div>
                                                    <div className="admin-detail-item"><strong>Mother Tongue</strong><span>{fullProfile.profile.mother_tongue || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Nationality</strong><span>{fullProfile.profile.nationality || 'Indian'}</span></div>
                                                    <div className="admin-detail-item"><strong>Height</strong><span>{fullProfile.profile.height || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Weight</strong><span>{fullProfile.profile.weight || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Body Type</strong><span>{fullProfile.profile.body_type || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Physical Status</strong><span>{fullProfile.profile.physical_status || 'Normal'}</span></div>
                                                    <div className="admin-detail-item"><strong>Disability</strong><span>{fullProfile.profile.disability || 'None'}</span></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: ASTROLOGY */}
                                        {(viewActiveTab === 'overview' || viewActiveTab === 'astrology') && (
                                            <div className="admin-profile-detail-card">
                                                <h4>🪐 Horoscope & Astrology Details</h4>
                                                <div className="admin-detail-grid">
                                                    <div className="admin-detail-item"><strong>Rasi / Horoscope</strong><span>{fullProfile.profile.horoscope || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Star / Nakshatra</strong><span>{fullProfile.profile.star || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Time of Birth</strong><span>{fullProfile.profile.time_of_birth || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Place of Birth</strong><span>{fullProfile.profile.place_of_birth || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Dosham / Chevvai</strong><span>{fullProfile.profile.dosham || 'No'}</span></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: RELIGION */}
                                        {(viewActiveTab === 'overview' || viewActiveTab === 'religion') && (
                                            <div className="admin-profile-detail-card">
                                                <h4>🕉️ Religion & Community Details</h4>
                                                <div className="admin-detail-grid">
                                                    <div className="admin-detail-item"><strong>Religion</strong><span>{fullProfile.profile.religion || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Sect / Category</strong><span>{fullProfile.profile.sect || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Caste</strong><span>{fullProfile.profile.caste || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Willing to Marry Other Caste?</strong><span>{fullProfile.profile.willing_to_marry_other_caste || 'No'}</span></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: CAREER */}
                                        {(viewActiveTab === 'overview' || viewActiveTab === 'career') && (
                                            <div className="admin-profile-detail-card">
                                                <h4>💼 Education & Professional Career</h4>
                                                <div className="admin-detail-grid">
                                                    <div className="admin-detail-item"><strong>Highest Education</strong><span>{fullProfile.profile.education || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Employment Sector</strong><span>{fullProfile.profile.employment_type || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Occupation</strong><span>{fullProfile.profile.occupation || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Company / Organization</strong><span>{fullProfile.profile.organization_name || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Annual Income</strong><span>{fullProfile.profile.currency || 'INR'} {fullProfile.profile.income || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Extra Income</strong><span>{fullProfile.profile.extra_income || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Financial Status</strong><span>{fullProfile.profile.financial_status || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Property Type</strong><span>{fullProfile.profile.property_type || 'N/A'}</span></div>
                                                    <div className="admin-detail-item" style={{ gridColumn: '1 / -1' }}><strong>Job Details & Responsibilities</strong><span>{fullProfile.profile.job_details || 'N/A'}</span></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: LOCATION */}
                                        {(viewActiveTab === 'overview' || viewActiveTab === 'location') && (
                                            <div className="admin-profile-detail-card">
                                                <h4>📍 Location & Residence</h4>
                                                <div className="admin-detail-grid">
                                                    <div className="admin-detail-item"><strong>Current City</strong><span>{fullProfile.profile.city || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>State</strong><span>{fullProfile.profile.state || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Country</strong><span>{fullProfile.profile.country || 'India'}</span></div>
                                                    <div className="admin-detail-item"><strong>Working Country</strong><span>{fullProfile.profile.working_country || fullProfile.profile.country || 'India'}</span></div>
                                                    <div className="admin-detail-item"><strong>Visa / Resident Status</strong><span>{fullProfile.profile.visa_status || fullProfile.profile.residential_status || 'Citizen'}</span></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: FAMILY */}
                                        {(viewActiveTab === 'overview' || viewActiveTab === 'family') && (
                                            <div className="admin-profile-detail-card">
                                                <h4>👨‍👩‍👧‍👦 Family Background</h4>
                                                <div className="admin-detail-grid">
                                                    <div className="admin-detail-item"><strong>Family Type</strong><span>{fullProfile.profile.family_type || 'Nuclear Family'}</span></div>
                                                    <div className="admin-detail-item"><strong>Family Status</strong><span>{fullProfile.profile.family_status || 'Middle Class'}</span></div>
                                                    <div className="admin-detail-item"><strong>Family Income</strong><span>{fullProfile.profile.family_income || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Father's Name</strong><span>{fullProfile.profile.father_name || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Father's Status & Occupation</strong><span>{fullProfile.profile.father_status || 'Employed'} {fullProfile.profile.father_occupation ? `- ${fullProfile.profile.father_occupation}` : ''}</span></div>
                                                    <div className="admin-detail-item"><strong>Mother's Name</strong><span>{fullProfile.profile.mother_name || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Mother's Status & Occupation</strong><span>{fullProfile.profile.mother_status || 'Homemaker'} {fullProfile.profile.mother_occupation ? `- ${fullProfile.profile.mother_occupation}` : ''}</span></div>
                                                    <div className="admin-detail-item"><strong>Brothers</strong><span>Elder: {fullProfile.profile.elder_brother || '0'} (Married: {fullProfile.profile.married_elder_brother || '0'}) | Younger: {fullProfile.profile.younger_brother || '0'} (Married: {fullProfile.profile.married_younger_brother || '0'})</span></div>
                                                    <div className="admin-detail-item"><strong>Sisters</strong><span>Elder: {fullProfile.profile.elder_sister || '0'} (Married: {fullProfile.profile.married_elder_sister || '0'}) | Younger: {fullProfile.profile.younger_sister || '0'} (Married: {fullProfile.profile.married_younger_sister || '0'})</span></div>
                                                    <div className="admin-detail-item"><strong>Family Living In</strong><span>{fullProfile.profile.family_living_in || 'N/A'}</span></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: LIFESTYLE */}
                                        {(viewActiveTab === 'overview' || viewActiveTab === 'lifestyle') && (
                                            <div className="admin-profile-detail-card">
                                                <h4>🥗 Lifestyle & Habits</h4>
                                                <div className="admin-detail-grid">
                                                    <div className="admin-detail-item"><strong>Diet</strong><span>{fullProfile.profile.diet || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Smoking Habits</strong><span>{fullProfile.profile.smoking || 'No'}</span></div>
                                                    <div className="admin-detail-item"><strong>Drinking Habits</strong><span>{fullProfile.profile.drinking || 'No'}</span></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: CONTACT & ADDRESS */}
                                        {(viewActiveTab === 'overview' || viewActiveTab === 'contact') && (
                                            <div className="admin-profile-detail-card">
                                                <h4>🪪 Contact, Identity & Addresses</h4>
                                                <div className="admin-detail-grid">
                                                    <div className="admin-detail-item"><strong>Mobile Number</strong><span>{fullProfile.mobile || fullProfile.phone || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Email Address</strong><span>{fullProfile.email || 'N/A'}</span></div>
                                                    <div className="admin-detail-item"><strong>Aadhar Number</strong><span>{fullProfile.profile.aadhar_number || 'Not Provided'}</span></div>
                                                    <div className="admin-detail-item" style={{ gridColumn: '1 / -1' }}><strong>Temporary / Current Address</strong><span>{fullProfile.profile.temporary_address || 'N/A'}</span></div>
                                                    <div className="admin-detail-item" style={{ gridColumn: '1 / -1' }}><strong>Permanent Address</strong><span>{fullProfile.profile.permanent_address || 'N/A'}</span></div>
                                                    <div className="admin-detail-item" style={{ gridColumn: '1 / -1' }}><strong>About Candidate</strong><span>{fullProfile.profile.about || 'N/A'}</span></div>
                                                    <div className="admin-detail-item" style={{ gridColumn: '1 / -1' }}><strong>Partner Preferences</strong><span>{fullProfile.profile.partner_preference || 'N/A'}</span></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: PHOTOS & DOCUMENTS */}
                                        {(viewActiveTab === 'overview' || viewActiveTab === 'photos') && (
                                            <div className="admin-profile-detail-card">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                                                    <h4 style={{ margin: 0 }}>🖼️ Candidate Photos & Verification Documents</h4>
                                                    <label className="admin-btn-profile" style={{ cursor: 'pointer', margin: 0 }}>
                                                        + Upload Candidate Photo
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleAdminUploadUserPhoto(fullProfile.id, e)}
                                                            hidden
                                                        />
                                                    </label>
                                                </div>

                                                {/* Photos Grid */}
                                                <div className="admin-photos-manage-grid">
                                                    {fullProfile.photos && fullProfile.photos.length > 0 ? (
                                                        fullProfile.photos.map((p, pIdx) => (
                                                            <div key={p.id || pIdx} className={`admin-photo-manage-card ${p.is_main ? 'is-main' : ''}`}>
                                                                {p.is_main && <span className="admin-photo-main-tag">★ Main Profile Picture</span>}
                                                                <img
                                                                    src={p.photo_data}
                                                                    alt={`Candidate Photo ${pIdx + 1}`}
                                                                    className="admin-photo-manage-img"
                                                                    onClick={() => setPreviewDocModal({ type: 'image', src: p.photo_data, title: `Photo ${pIdx + 1}` })}
                                                                    title="Click to preview full size"
                                                                />
                                                                <div className="admin-photo-manage-actions">
                                                                    {!p.is_main && (
                                                                        <button
                                                                            type="button"
                                                                            className="admin-photo-action-btn"
                                                                            onClick={() => handleAdminSetMainPhoto(fullProfile.id, p.id)}
                                                                        >
                                                                            Set Main
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        className="admin-photo-action-btn delete"
                                                                        onClick={() => handleAdminDeletePhoto(fullProfile.id, p.id)}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                                                            No gallery photos uploaded yet. Use the "+ Upload Candidate Photo" button above to add one.
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Documents (Community & Birth Certificates) */}
                                                {(fullProfile.profile?.community_certificate || fullProfile.profile?.birth_certificate) && (
                                                    <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                                                        <h5 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#0f766e' }}>Official Certificates</h5>
                                                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                                            {fullProfile.profile.community_certificate && (
                                                                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#f8fafc', textAlign: 'center', minWidth: '180px' }}>
                                                                    <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '0.9rem' }}>Community Certificate</p>
                                                                    {fullProfile.profile.community_certificate.startsWith('data:image') ? (
                                                                        <img
                                                                            src={fullProfile.profile.community_certificate}
                                                                            alt="Community Certificate"
                                                                            style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer' }}
                                                                            onClick={() => setPreviewDocModal({ type: 'image', src: fullProfile.profile.community_certificate, title: 'Community Certificate' })}
                                                                        />
                                                                    ) : (
                                                                        <a href={fullProfile.profile.community_certificate} download="Community_Certificate" className="admin-btn-profile" style={{ fontSize: '0.8rem' }}>
                                                                            Download Document
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {fullProfile.profile.birth_certificate && (
                                                                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#f8fafc', textAlign: 'center', minWidth: '180px' }}>
                                                                    <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '0.9rem' }}>Birth Certificate</p>
                                                                    {fullProfile.profile.birth_certificate.startsWith('data:image') ? (
                                                                        <img
                                                                            src={fullProfile.profile.birth_certificate}
                                                                            alt="Birth Certificate"
                                                                            style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer' }}
                                                                            onClick={() => setPreviewDocModal({ type: 'image', src: fullProfile.profile.birth_certificate, title: 'Birth Certificate' })}
                                                                        />
                                                                    ) : (
                                                                        <a href={fullProfile.profile.birth_certificate} download="Birth_Certificate" className="admin-btn-profile" style={{ fontSize: '0.8rem' }}>
                                                                            Download Document
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No detailed profile information exists yet for this candidate.</p>
                                )}
                            </div>

                            {/* View Modal Footer */}
                            <div className="admin-modal-footer">
                                <button type="button" className="admin-btn-cancel" onClick={() => setFullProfile(null)}>
                                    Close View
                                </button>
                                <button
                                    type="button"
                                    className="admin-btn-submit"
                                    onClick={() => handleOpenEditModal({ user_id: fullProfile.id, first_name: fullProfile.profile?.full_name, unique_id: fullProfile.unique_id })}
                                >
                                    ✏️ Edit / Update This Candidate
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Preview Document Modal */}
                {previewDocModal && (
                    <div className="admin-modal-overlay" onClick={() => setPreviewDocModal(null)}>
                        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', maxWidth: '85vw', maxHeight: '85vh', textAlign: 'center', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h4 style={{ margin: 0 }}>{previewDocModal.title}</h4>
                                <button className="admin-modal-close-btn" onClick={() => setPreviewDocModal(null)}>✕</button>
                            </div>
                            <img src={previewDocModal.src} alt="Preview" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '6px' }} />
                        </div>
                    </div>
                )}

                {/* Comprehensive Edit User Modal */}
                {showEditModal && (
                    <div className="admin-modal-overlay">
                        <div className="admin-modal-large" style={{ maxWidth: '980px', maxHeight: '92vh' }}>
                            <div className="admin-modal-header">
                                <div>
                                    <h3 style={{ margin: 0 }}>Update Registered Candidate Details</h3>
                                    <p style={{ margin: '3px 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                                        {editUserForm.fullName || 'Candidate'} — Unique ID: <strong style={{ color: '#0f766e' }}>{editUserForm.uniqueId || 'N/A'}</strong>
                                    </p>
                                </div>
                                <button className="admin-modal-close-btn" onClick={() => setShowEditModal(false)}>✕</button>
                            </div>

                            {/* Edit Modal Navigation Tabs */}
                            <div className="admin-modal-tabs">
                                {[
                                    { id: 'account', label: '1. Account & Status' },
                                    { id: 'personal', label: '2. Personal & Physical' },
                                    { id: 'astrology', label: '3. Horoscope & Astro' },
                                    { id: 'religion', label: '4. Religion & Caste' },
                                    { id: 'location', label: '5. Location & Living' },
                                    { id: 'career', label: '6. Education & Career' },
                                    { id: 'family', label: '7. Family Details' },
                                    { id: 'lifestyle', label: '8. Lifestyle & Bio' },
                                    { id: 'photo', label: '9. Profile Photo' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        className={`admin-modal-tab-btn ${editActiveTab === tab.id ? 'active' : ''}`}
                                        onClick={() => setEditActiveTab(tab.id)}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {editLoading ? (
                                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading candidate details...</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSaveEditUser} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                                    <div className="admin-modal-body">
                                        {editError && (
                                            <div className="admin-alert error" style={{ padding: '10px 14px', marginBottom: '16px' }}>
                                                {editError}
                                            </div>
                                        )}

                                        {/* TAB 1: ACCOUNT & STATUS */}
                                        {editActiveTab === 'account' && (
                                            <div>
                                                <div className="admin-modal-section-title">1. Account Information & Credentials</div>
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
                                                            placeholder="Candidate Full Name"
                                                            value={editUserForm.fullName || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, fullName: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Profile Created For</label>
                                                        <select
                                                            value={editUserForm.profileFor || 'Self'}
                                                            onChange={e => setEditUserForm({ ...editUserForm, profileFor: e.target.value })}
                                                        >
                                                            {['Self', 'Son', 'Daughter', 'Brother', 'Sister', 'Relative', 'Friend', 'Other'].map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Gender *</label>
                                                        <select
                                                            value={editUserForm.gender || 'Male'}
                                                            onChange={e => setEditUserForm({ ...editUserForm, gender: e.target.value })}
                                                        >
                                                            <option value="Male">Male</option>
                                                            <option value="Female">Female</option>
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Mobile Number *</label>
                                                        <input
                                                            type="tel"
                                                            required
                                                            placeholder="Mobile Number"
                                                            value={editUserForm.mobile || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, mobile: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Email Address</label>
                                                        <input
                                                            type="email"
                                                            placeholder="Email Address"
                                                            value={editUserForm.email || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Verification Status</label>
                                                        <select
                                                            value={editUserForm.isVerified ? 'true' : 'false'}
                                                            onChange={e => setEditUserForm({ ...editUserForm, isVerified: e.target.value === 'true' })}
                                                        >
                                                            <option value="true">Verified ✓ (Visible & Active)</option>
                                                            <option value="false">Unverified</option>
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Reset Password (leave empty to keep current password)</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter new password if resetting"
                                                            value={editUserForm.password || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, password: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 2: PERSONAL & PHYSICAL */}
                                        {editActiveTab === 'personal' && (
                                            <div>
                                                <div className="admin-modal-section-title">2. Personal & Physical Details</div>
                                                <div className="admin-form-grid-3">
                                                    <div className="admin-form-field">
                                                        <label>DOB Day</label>
                                                        <select value={editUserForm.dobDay || '1'} onChange={e => setEditUserForm({ ...editUserForm, dobDay: e.target.value })}>
                                                            {Array.from({ length: 31 }, (_, i) => String(i + 1)).map(d => (
                                                                <option key={d} value={d}>{d}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>DOB Month</label>
                                                        <select value={editUserForm.dobMonth || 'Jan'} onChange={e => setEditUserForm({ ...editUserForm, dobMonth: e.target.value })}>
                                                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                                                                <option key={m} value={m}>{m}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>DOB Year</label>
                                                        <select value={editUserForm.dobYear || '1995'} onChange={e => setEditUserForm({ ...editUserForm, dobYear: e.target.value })}>
                                                            {Array.from({ length: 65 }, (_, i) => String(2007 - i)).map(y => (
                                                                <option key={y} value={y}>{y}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="admin-form-grid-2" style={{ marginTop: '14px' }}>
                                                    <div className="admin-form-field">
                                                        <label>Nationality</label>
                                                        <select value={editUserForm.nationality || 'Indian'} onChange={e => setEditUserForm({ ...editUserForm, nationality: e.target.value })}>
                                                            {nationalities.map(nat => <option key={nat} value={nat}>{nat}</option>)}
                                                        </select>
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
                                                    {editUserForm.maritalStatus !== 'Never Married' ? (
                                                        <div className="admin-form-field">
                                                            <label>Having Children?</label>
                                                            <select value={editUserForm.havingChildren || 'No'} onChange={e => setEditUserForm({ ...editUserForm, havingChildren: e.target.value })}>
                                                                <option value="No">No</option>
                                                                <option value="Yes">Yes</option>
                                                            </select>
                                                        </div>
                                                    ) : (
                                                        <div className="admin-form-field">
                                                            <label>Height</label>
                                                            <select value={editUserForm.height || ''} onChange={e => setEditUserForm({ ...editUserForm, height: e.target.value })}>
                                                                <option value="">Select Height</option>
                                                                {heights.map(h => <option key={h} value={h}>{h}</option>)}
                                                            </select>
                                                        </div>
                                                    )}
                                                    {editUserForm.havingChildren === 'Yes' && (
                                                        <div className="admin-form-field">
                                                            <label>Number of Children</label>
                                                            <select value={editUserForm.numberOfChildren || ''} onChange={e => setEditUserForm({ ...editUserForm, numberOfChildren: e.target.value })}>
                                                                <option value="">Select count</option>
                                                                {childrenCountOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        </div>
                                                    )}
                                                    {editUserForm.maritalStatus !== 'Never Married' && (
                                                        <div className="admin-form-field">
                                                            <label>Height</label>
                                                            <select value={editUserForm.height || ''} onChange={e => setEditUserForm({ ...editUserForm, height: e.target.value })}>
                                                                <option value="">Select Height</option>
                                                                {heights.map(h => <option key={h} value={h}>{h}</option>)}
                                                            </select>
                                                        </div>
                                                    )}
                                                    <div className="admin-form-field">
                                                        <label>Weight (e.g. 68 kg)</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. 65 kg"
                                                            value={editUserForm.weight || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, weight: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Body Type</label>
                                                        <select value={editUserForm.bodyType || 'Average'} onChange={e => setEditUserForm({ ...editUserForm, bodyType: e.target.value })}>
                                                            {bodyTypeOptions.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Physical Status</label>
                                                        <select value={editUserForm.physicalStatus || 'Normal'} onChange={e => setEditUserForm({ ...editUserForm, physicalStatus: e.target.value })}>
                                                            {physicalStatusOptions.map(ps => <option key={ps} value={ps}>{ps}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Disability</label>
                                                        <select value={editUserForm.disability || 'None'} onChange={e => setEditUserForm({ ...editUserForm, disability: e.target.value })}>
                                                            {disabilityOptions.map(d => <option key={d} value={d}>{d}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 3: HOROSCOPE & ASTROLOGY */}
                                        {editActiveTab === 'astrology' && (
                                            <div>
                                                <div className="admin-modal-section-title">3. Horoscope & Astrological Details</div>
                                                <div className="admin-form-grid-2">
                                                    <div className="admin-form-field">
                                                        <label>Rasi / Horoscope</label>
                                                        <select value={editUserForm.horoscope || ''} onChange={e => setEditUserForm({ ...editUserForm, horoscope: e.target.value })}>
                                                            <option value="">Select Horoscope</option>
                                                            {horoscopes.map(h => <option key={h} value={h}>{h}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Nakshatra / Star</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Rohini, Ashwini, Magham"
                                                            value={editUserForm.star || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, star: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Time of Birth</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. 10:30 AM"
                                                            value={editUserForm.timeOfBirth || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, timeOfBirth: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Place of Birth</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Chennai, Madurai"
                                                            value={editUserForm.placeOfBirth || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, placeOfBirth: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Dosham / Chevvai Dosham</label>
                                                        <select value={editUserForm.dosham || 'No'} onChange={e => setEditUserForm({ ...editUserForm, dosham: e.target.value })}>
                                                            <option value="No">No</option>
                                                            <option value="Yes">Yes</option>
                                                            <option value="Don't Know">Don't Know</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 4: RELIGION & CASTE */}
                                        {editActiveTab === 'religion' && (
                                            <div>
                                                <div className="admin-modal-section-title">4. Religion & Caste Information</div>
                                                <div className="admin-form-grid-2">
                                                    <div className="admin-form-field">
                                                        <label>Religion</label>
                                                        <select
                                                            value={editUserForm.religion || 'Hindu'}
                                                            onChange={e => setEditUserForm({ ...editUserForm, religion: e.target.value, sect: '', caste: '', casteOther: '' })}
                                                        >
                                                            {religions.map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>{editUserForm.religion === 'Hindu' ? 'Category / Sect' : 'Sect'}</label>
                                                        {editSects.length > 0 ? (
                                                            <select
                                                                value={editUserForm.sect || ''}
                                                                onChange={e => setEditUserForm({ ...editUserForm, sect: e.target.value, caste: '', casteOther: '' })}
                                                            >
                                                                <option value="">Select Sect</option>
                                                                {editSects.map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                placeholder="Enter sect"
                                                                value={editUserForm.sect || ''}
                                                                onChange={e => setEditUserForm({ ...editUserForm, sect: e.target.value })}
                                                            />
                                                        )}
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
                                                                placeholder="Specify candidate caste"
                                                                value={editUserForm.casteOther || ''}
                                                                onChange={e => setEditUserForm({ ...editUserForm, casteOther: e.target.value })}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="admin-form-field">
                                                        <label>Willing to Marry Other Caste?</label>
                                                        <select
                                                            value={editUserForm.willingToMarryOtherCaste || 'No'}
                                                            onChange={e => setEditUserForm({ ...editUserForm, willingToMarryOtherCaste: e.target.value })}
                                                        >
                                                            <option value="No">No</option>
                                                            <option value="Yes">Yes</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 5: LOCATION & LIVING */}
                                        {editActiveTab === 'location' && (
                                            <div>
                                                <div className="admin-modal-section-title">5. Location & Residential Details</div>
                                                <div className="admin-form-grid-3">
                                                    <div className="admin-form-field">
                                                        <label>Country of Living</label>
                                                        <input
                                                            type="text"
                                                            value={editUserForm.country || 'India'}
                                                            onChange={e => setEditUserForm({ ...editUserForm, country: e.target.value, workingCountry: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Working Country</label>
                                                        <input
                                                            type="text"
                                                            value={editUserForm.workingCountry || editUserForm.country || 'India'}
                                                            onChange={e => setEditUserForm({ ...editUserForm, workingCountry: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Visa / Residential Status</label>
                                                        <select
                                                            value={editUserForm.residentialStatus || 'Citizen'}
                                                            onChange={e => setEditUserForm({ ...editUserForm, residentialStatus: e.target.value, visaStatus: e.target.value })}
                                                        >
                                                            {residentialStatusOptions.map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="admin-form-grid-2" style={{ marginTop: '14px' }}>
                                                    <div className="admin-form-field">
                                                        <label>State</label>
                                                        {editStates.length > 0 ? (
                                                            <select
                                                                value={editUserForm.state || ''}
                                                                onChange={e => setEditUserForm({ ...editUserForm, state: e.target.value, city: '' })}
                                                            >
                                                                <option value="">Select State</option>
                                                                {editStates.map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                placeholder="State / Province"
                                                                value={editUserForm.state || ''}
                                                                onChange={e => setEditUserForm({ ...editUserForm, state: e.target.value })}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>City</label>
                                                        {editCities.length > 0 ? (
                                                            <select
                                                                value={editUserForm.city || ''}
                                                                onChange={e => setEditUserForm({ ...editUserForm, city: e.target.value })}
                                                            >
                                                                <option value="">Select City</option>
                                                                {editCities.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                placeholder="City / Town"
                                                                value={editUserForm.city || ''}
                                                                onChange={e => setEditUserForm({ ...editUserForm, city: e.target.value })}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 6: EDUCATION & CAREER */}
                                        {editActiveTab === 'career' && (
                                            <div>
                                                <div className="admin-modal-section-title">6. Education & Professional Career</div>
                                                <div className="admin-form-grid-2">
                                                    <div className="admin-form-field">
                                                        <label>Highest Education</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. B.E / B.Tech, MBA, MBBS"
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
                                                            placeholder="e.g. Software Professional, Doctor, Manager"
                                                            value={editUserForm.occupation || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, occupation: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Company / Organization Name</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Employer / Business Name"
                                                            value={editUserForm.organizationName || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, organizationName: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Currency</label>
                                                        <select value={editUserForm.currency || 'INR'} onChange={e => setEditUserForm({ ...editUserForm, currency: e.target.value })}>
                                                            {currencies.map(cur => <option key={cur} value={cur}>{cur}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Annual Income</label>
                                                        <select value={editUserForm.income || ''} onChange={e => setEditUserForm({ ...editUserForm, income: e.target.value })}>
                                                            <option value="">Select Income Bracket</option>
                                                            {incomes.map(inc => <option key={inc} value={inc}>{inc}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Extra Income (Optional)</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Rental, Dividends, etc."
                                                            value={editUserForm.extraIncome || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, extraIncome: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Financial Status</label>
                                                        <select value={editUserForm.financialStatus || 'Middle Class'} onChange={e => setEditUserForm({ ...editUserForm, financialStatus: e.target.value })}>
                                                            {financialStatusOptions.map(f => <option key={f} value={f}>{f}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Property Type</label>
                                                        <select value={editUserForm.propertyType || 'Own House'} onChange={e => setEditUserForm({ ...editUserForm, propertyType: e.target.value })}>
                                                            {propertyTypeOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field" style={{ gridColumn: 'span 2' }}>
                                                        <label>Job Details / Career Description</label>
                                                        <textarea
                                                            rows={2}
                                                            placeholder="Brief job description"
                                                            value={editUserForm.jobDetails || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, jobDetails: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 7: FAMILY BACKGROUND */}
                                        {editActiveTab === 'family' && (
                                            <div>
                                                <div className="admin-modal-section-title">7. Family Background Details</div>
                                                <div className="admin-form-grid-3">
                                                    <div className="admin-form-field">
                                                        <label>Family Type</label>
                                                        <select value={editUserForm.familyType || 'Nuclear Family'} onChange={e => setEditUserForm({ ...editUserForm, familyType: e.target.value })}>
                                                            {familyTypeOptions.map(f => <option key={f} value={f}>{f}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Family Status</label>
                                                        <select value={editUserForm.familyStatus || 'Middle Class'} onChange={e => setEditUserForm({ ...editUserForm, familyStatus: e.target.value })}>
                                                            {familyStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Family Annual Income</label>
                                                        <select value={editUserForm.familyIncome || ''} onChange={e => setEditUserForm({ ...editUserForm, familyIncome: e.target.value })}>
                                                            <option value="">Select bracket</option>
                                                            {familyIncomes.map(fi => <option key={fi} value={fi}>{fi}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="admin-form-grid-3" style={{ marginTop: '14px' }}>
                                                    <div className="admin-form-field">
                                                        <label>Father's Name</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Father's full name"
                                                            value={editUserForm.fatherName || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, fatherName: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Father's Status</label>
                                                        <select value={editUserForm.fatherStatus || 'Employed'} onChange={e => setEditUserForm({ ...editUserForm, fatherStatus: e.target.value })}>
                                                            {['Employed', 'Business', 'Retired', 'Homemaker', 'Passed Away'].map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Father's Occupation</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Father occupation"
                                                            value={editUserForm.fatherOccupation || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, fatherOccupation: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="admin-form-grid-3" style={{ marginTop: '14px' }}>
                                                    <div className="admin-form-field">
                                                        <label>Mother's Name</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Mother's full name"
                                                            value={editUserForm.motherName || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, motherName: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Mother's Status</label>
                                                        <select value={editUserForm.motherStatus || 'Homemaker'} onChange={e => setEditUserForm({ ...editUserForm, motherStatus: e.target.value })}>
                                                            {['Homemaker', 'Employed', 'Business', 'Retired', 'Passed Away'].map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Mother's Occupation</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Mother occupation"
                                                            value={editUserForm.motherOccupation || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, motherOccupation: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="admin-form-grid-4" style={{ marginTop: '14px' }}>
                                                    <div className="admin-form-field">
                                                        <label>Elder Brothers</label>
                                                        <select value={editUserForm.elderBrother || '0'} onChange={e => setEditUserForm({ ...editUserForm, elderBrother: e.target.value })}>
                                                            {siblingCounts.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Married Elder Brothers</label>
                                                        <select value={editUserForm.marriedElderBrother || '0'} onChange={e => setEditUserForm({ ...editUserForm, marriedElderBrother: e.target.value })}>
                                                            {siblingCounts.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Younger Brothers</label>
                                                        <select value={editUserForm.youngerBrother || '0'} onChange={e => setEditUserForm({ ...editUserForm, youngerBrother: e.target.value })}>
                                                            {siblingCounts.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Married Younger Brothers</label>
                                                        <select value={editUserForm.marriedYoungerBrother || '0'} onChange={e => setEditUserForm({ ...editUserForm, marriedYoungerBrother: e.target.value })}>
                                                            {siblingCounts.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Elder Sisters</label>
                                                        <select value={editUserForm.elderSister || '0'} onChange={e => setEditUserForm({ ...editUserForm, elderSister: e.target.value })}>
                                                            {siblingCounts.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Married Elder Sisters</label>
                                                        <select value={editUserForm.marriedElderSister || '0'} onChange={e => setEditUserForm({ ...editUserForm, marriedElderSister: e.target.value })}>
                                                            {siblingCounts.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Younger Sisters</label>
                                                        <select value={editUserForm.youngerSister || '0'} onChange={e => setEditUserForm({ ...editUserForm, youngerSister: e.target.value })}>
                                                            {siblingCounts.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Married Younger Sisters</label>
                                                        <select value={editUserForm.marriedYoungerSister || '0'} onChange={e => setEditUserForm({ ...editUserForm, marriedYoungerSister: e.target.value })}>
                                                            {siblingCounts.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="admin-form-field" style={{ marginTop: '14px' }}>
                                                    <label>Family Location / Living In</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Chennai, Tamil Nadu"
                                                        value={editUserForm.familyLivingIn || ''}
                                                        onChange={e => setEditUserForm({ ...editUserForm, familyLivingIn: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 8: LIFESTYLE, ADDRESS & ABOUT */}
                                        {editActiveTab === 'lifestyle' && (
                                            <div>
                                                <div className="admin-modal-section-title">8. Lifestyle, Addresses & Candidate Profile</div>
                                                <div className="admin-form-grid-3">
                                                    <div className="admin-form-field">
                                                        <label>Diet</label>
                                                        <select value={editUserForm.diet || 'Veg'} onChange={e => setEditUserForm({ ...editUserForm, diet: e.target.value })}>
                                                            {dietOptions.map(d => <option key={d} value={d}>{d}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Smoking</label>
                                                        <select value={editUserForm.smoking || 'No'} onChange={e => setEditUserForm({ ...editUserForm, smoking: e.target.value })}>
                                                            {smokingOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Drinking</label>
                                                        <select value={editUserForm.drinking || 'No'} onChange={e => setEditUserForm({ ...editUserForm, drinking: e.target.value })}>
                                                            {drinkingOptions.map(d => <option key={d} value={d}>{d}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="admin-form-grid-2" style={{ marginTop: '14px' }}>
                                                    <div className="admin-form-field" style={{ gridColumn: 'span 2' }}>
                                                        <label>Aadhar Card Number</label>
                                                        <input
                                                            type="text"
                                                            placeholder="12-digit Aadhar number"
                                                            value={editUserForm.aadharNumber || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, aadharNumber: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Temporary / Current Address</label>
                                                        <textarea
                                                            rows={3}
                                                            placeholder="Current address"
                                                            value={editUserForm.temporaryAddress || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, temporaryAddress: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Permanent Address</label>
                                                        <textarea
                                                            rows={3}
                                                            placeholder="Permanent native address"
                                                            value={editUserForm.permanentAddress || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, permanentAddress: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>About Candidate (Bio)</label>
                                                        <textarea
                                                            rows={3}
                                                            placeholder="Personal description, interests, values"
                                                            value={editUserForm.about || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, about: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="admin-form-field">
                                                        <label>Partner Preference Expectations</label>
                                                        <textarea
                                                            rows={3}
                                                            placeholder="Expected qualities in partner"
                                                            value={editUserForm.partnerPreference || ''}
                                                            onChange={e => setEditUserForm({ ...editUserForm, partnerPreference: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 9: PROFILE PHOTO */}
                                        {editActiveTab === 'photo' && (
                                            <div>
                                                <div className="admin-modal-section-title">9. Candidate Profile Photo</div>
                                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                                    {editUserForm.photo ? (
                                                        <div style={{ textAlign: 'center' }}>
                                                            <img
                                                                src={editUserForm.photo}
                                                                alt="Candidate Preview"
                                                                style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #10b981' }}
                                                            />
                                                            <div style={{ marginTop: '8px' }}>
                                                                <button
                                                                    type="button"
                                                                    className="admin-photo-clear-btn"
                                                                    onClick={() => setEditUserForm({ ...editUserForm, photo: null })}
                                                                >
                                                                    Remove Photo
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '2rem', fontWeight: 'bold' }}>
                                                            ?
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>Upload or Replace Profile Photo</h4>
                                                        <p style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: '#64748b' }}>
                                                            Select a JPG or PNG file (less than 5MB). This image will become the candidate's primary profile photo.
                                                        </p>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleEditPhotoChange}
                                                            style={{ fontSize: '0.9rem' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Modal Footer with Tab Navigation & Submit */}
                                    <div className="admin-modal-footer">
                                        <button type="button" className="admin-btn-cancel" onClick={() => setShowEditModal(false)}>
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="admin-btn-submit"
                                            disabled={isSavingEdit}
                                        >
                                            {isSavingEdit ? 'Saving All Changes...' : '✓ Save Candidate Details'}
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
