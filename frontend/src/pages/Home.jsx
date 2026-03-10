import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { User, Camera, Star, Users, Edit2, Settings, HelpCircle, ChevronDown, Phone, MessageSquare, TrendingUp, Eye, LogOut, FileText, Briefcase, Heart, MapPin, GraduationCap, Utensils, Loader2 } from 'lucide-react';
import { getProfile, logout as apiLogout } from '../services/api';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    fullName: 'Member Name',
    uniqueId: 'SM-XXXXXX',
    photo: '',
    gender: '',
  });

  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [incompleteItems, setIncompleteItems] = useState([]);

  // Define all profile completion checks
  const profileSections = [
    {
      id: 'photo',
      label: 'Add Photo(s)',
      icon: <Camera size={24} color="#43a047" />,
      iconBg: '#e8f5e9',
      fields: ['photo'],
      navState: { openPhotos: true }
    },
    {
      id: 'basic',
      label: 'Basic Details',
      icon: <User size={24} color="#1e88e5" />,
      iconBg: '#e3f2fd',
      fields: ['gender', 'dob', 'height', 'maritalStatus', 'religion'],
      navState: { openSection: 'basic' }
    },
    {
      id: 'about',
      label: 'About Me',
      icon: <FileText size={24} color="#8e24aa" />,
      iconBg: '#f3e5f5',
      fields: ['about'],
      navState: { openSection: 'about' }
    },
    {
      id: 'education',
      label: 'Education Details',
      icon: <GraduationCap size={24} color="#00897b" />,
      iconBg: '#e0f2f1',
      fields: ['education', 'occupation', 'employmentType'],
      navState: { openSection: 'education' }
    },
    {
      id: 'contact',
      label: 'Contact Details',
      icon: <Phone size={24} color="#e53935" />,
      iconBg: '#ffebee',
      fields: ['mobile', 'email'],
      navState: { openSection: 'contact' }
    },
    {
      id: 'family',
      label: 'Family Details',
      icon: <Users size={24} color="#fb8c00" />,
      iconBg: '#fff3e0',
      fields: ['fatherOccupation', 'motherOccupation', 'familyType', 'familyStatus'],
      navState: { openSection: 'family' }
    },
    {
      id: 'horoscope',
      label: 'Add Horoscope',
      icon: <Star size={24} color="#1e88e5" />,
      iconBg: '#e3f2fd',
      fields: ['horoscope'],
      navState: { openSection: 'basic' }
    },
    {
      id: 'location',
      label: 'Location Details',
      icon: <MapPin size={24} color="#6d4c41" />,
      iconBg: '#efebe9',
      fields: ['country', 'state', 'city'],
      navState: { openSection: 'basic' }
    },
    {
      id: 'lifestyle',
      label: 'Lifestyle',
      icon: <Utensils size={24} color="#00acc1" />,
      iconBg: '#e0f7fa',
      fields: ['smoking', 'drinking'],
      navState: { openSection: 'lifestyle' }
    },
    {
      id: 'partner',
      label: 'Partner Preferences',
      icon: <Heart size={24} color="#D4AF37" />,
      iconBg: '#fdf8e8',
      fields: [],
      navState: { openPreferences: true }
    },
  ];

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const parsed = await getProfile();
        setProfileData(parsed);

        // Seed initial display from localStorage
        setProfileData(prev => ({ ...prev, ...parsed }));

        // Use upstream granular completion logic
        const allFields = [];
        profileSections.forEach(sec => {
          // Skip horoscope for non-Hindu users
          if (sec.id === 'horoscope' && parsed.religion && parsed.religion.toLowerCase() !== 'hindu') {
            return;
          }
          sec.fields.forEach(f => {
            if (!allFields.includes(f)) allFields.push(f);
          });
        });

        const calculateCompletion = (data) => {
          let completed = 0;
          allFields.forEach(field => {
            const value = data[field];
            if (value && value !== 'Not Specified' && value !== '') {
              completed++;
            }
          });
          return Math.round((completed / (allFields.length || 1)) * 100);
        };

        setCompletionPercentage(calculateCompletion(parsed));

        // Find incomplete sections
        const incomplete = profileSections.filter(sec => {
          if (sec.fields.length === 0) return false;
          // Only show horoscope section for Hindu users
          if (sec.id === 'horoscope' && parsed.religion && parsed.religion.toLowerCase() !== 'hindu') {
            return false;
          }
          return sec.fields.some(field => {
            const value = parsed[field];
            return !value || value === 'Not Specified' || value === '';
          });
        });
        setIncompleteItems(incomplete);
      } catch (e) {
        console.error("Error loading profile", e);
        if (e.message.includes('Access denied')) navigate('/');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [navigate]);

  const handleLogout = () => {
    apiLogout();
    navigate('/');
  };

  const handleQuickAction = (section) => {
    navigate('/profile', { state: section.navState });
  };

  return (
    <div className="home-page">
      <Navbar />

      <div className="dashboard-container">
        {/* Left Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-profile-card">
            <div className="sidebar-avatar">
              {profileData.photo ? (
                <img src={profileData.photo} alt={profileData.fullName} />
              ) : (
                <User size={50} color="#9ca3af" />
              )}
            </div>
            <h3 className="sidebar-name">{profileData.fullName}</h3>

            <div className="sidebar-id">{profileData.uniqueId}</div>
            <div className="sidebar-membership">Free member</div>
          </div>

          <div className="sidebar-upgrade-banner">
            <p>Upgrade membership to call or message with matches</p>
            <Link to="/membership" className="upgrade-btn">Upgrade now</Link>
          </div>

          <div className="sidebar-menu">
            <div className="sidebar-menu-item" onClick={() => navigate('/profile')}>
              <Edit2 size={16} /> Edit profile
            </div>
            <div className="sidebar-menu-item" onClick={() => navigate('/profile', { state: { openPreferences: true } })}>
              <Settings size={16} /> Edit preferences
            </div>
            <div className="sidebar-menu-item" onClick={() => navigate('/settings')}>
              <Settings size={16} /> Settings
            </div>
            <div className="sidebar-menu-item" style={{ color: '#D4AF37' }} onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </div>
          </div>

          <div className="sidebar-support">
            <h4>Support & feedback</h4>
            <div className="sidebar-menu-item">
              <HelpCircle size={16} /> Help & FAQ
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {/* Complete Your Profile Section */}
          <section className="dashboard-card profile-completion-card">
            <h2>Complete Your Profile</h2>
            <div className="completion-bar-section">
              <span className="completion-label">Profile completeness score: {completionPercentage}%</span>
              <div className="completion-track">
                <div
                  className="completion-fill"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>

            {incompleteItems.length > 0 && (
              <div className="quick-action-cards">
                {incompleteItems.map(item => (
                  <div className="quick-action-card" key={item.id} onClick={() => handleQuickAction(item)}>
                    <div className="quick-action-icon" style={{ background: item.iconBg }}>
                      {item.icon}
                    </div>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )}

            {incompleteItems.length === 0 && (
              <div className="profile-complete-msg">
                <span>🎉 Great job! Your profile is complete.</span>
              </div>
            )}
          </section>

          {/* Become a Paid Member Section */}
          <section className="dashboard-card membership-promo-card">
            <div className="promo-content">
              <h2>Become a paid member</h2>
              <p className="promo-discount">Get up to <span className="discount-highlight">61% OFF</span> on paid membership!</p>

              <ul className="promo-features">
                <li>
                  <Phone size={16} color="#D4AF37" />
                  <span>Call/WhatsApp matches</span>
                </li>
                <li>
                  <MessageSquare size={16} color="#7c3aed" />
                  <span>Unlimited messages</span>
                </li>
                <li>
                  <TrendingUp size={16} color="#2563eb" />
                  <span>Higher chances of response</span>
                </li>
                <li>
                  <Eye size={16} color="#D4AF37" />
                  <span>View and match horoscopes</span>
                </li>
              </ul>

              <Link to="/membership" className="promo-cta-btn">See membership plans</Link>
            </div>
            <div className="promo-image">
              <img
                src="https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
                alt="Premium Member"
              />
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Home;
