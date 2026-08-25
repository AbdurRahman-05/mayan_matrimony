import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import './PartnerReligionEditor.css';

const allReligions = ["Hindu", "Muslim", "Sikh", "Christian", "Buddhist", "Jain", "Parsi", "Jewish", "Bahai"];

const sectData = {
    "Hindu": ["Saiva", "Vaishnava", "Smartha", "Srivaishnava", "Others"],
    "Muslim": ["Shia", "Sunni", "Others"],
    "Christian": ["Catholic", "Protestant", "Orthodox", "Others"],
    "Sikh": ["Others"],
    "Jain": ["Others"],
    "Buddhist": ["Others"],
    "Parsi": ["Others"],
    "Jewish": ["Others"],
    "Bahai": ["Others"]
};

const casteData = {
    "Hindu": [
        "Brahmin", "Gounder", "Vanniyar", "Thevar", "Nadar", "Chettiar", "Yadav",
        "Mudaliar", "Naidu", "Pillai", "Reddy", "Viswakarma", "Maravar", "Kallar",
        "Agamudayar", "Devar", "Mukkulathor", "Vellalar", "Kamma", "Kapu",
        "Balija", "Devandra Kula Vellalar", "Kongu Vellalar", "Senguntha Mudaliar",
        "Saiva Mudaliar", "Parkavakulam", "Nair", "Ezhava", "Menon",
        "Iyer", "Iyengar", "Smartha Brahmin", "Kuruba", "Lingayat", "Vokkaliga",
        "Maratha", "Kunbi", "Patil", "Mali", "Dhangar", "Rajput", "Jat",
        "Gupta", "Agarwal", "Baniya", "Kayastha", "Khatri", "Arora",
        "Maheshwari", "Oswal", "Sindhi", "Bania",
        "SC", "ST", "SC/ST", "OBC", "Caste No Bar"
    ],
    "Muslim": [
        "Sunni", "Shia", "Pathan", "Syed", "Sheikh", "Mughal",
        "Lebbai", "Maraicar", "Rowther", "Mapila", "Ansari",
        "Arain", "Awan", "Barhai", "Bohra", "Dekkani",
        "Hanafi", "Jat", "Julaha", "Khoja", "Lohar",
        "Memon", "Meo", "Mirasi", "Momin", "Nagori",
        "Qureshi", "Rajput Muslim", "Shaikh", "Siddiqui", "Teli",
        "Caste No Bar"
    ],
    "Christian": [
        "Roman Catholic", "Protestant", "Pentecost", "CSI", "CNI",
        "Latin Catholic", "Syrian Catholic", "Syrian Orthodox",
        "Marthoma", "Jacobite", "Anglican", "Baptist",
        "Church of God", "Evangelical", "Knanaya Catholic", "Knanaya Jacobite",
        "Methodist", "Nadar Christian", "Mukkuvar", "Born Again",
        "Seventh Day Adventist", "Salvation Army", "Brethren",
        "Caste No Bar"
    ],
    "Sikh": [
        "Jat", "Ramgarhia", "Ramdasia", "Arora", "Khatri",
        "Ahluwalia", "Bhatia", "Ghumar", "Labana", "Lubana",
        "Mahajan", "Majhabi", "Nai", "Rajput Sikh", "Saini",
        "Tarkhan", "Caste No Bar"
    ],
    "Jain": [
        "Shwetamber", "Digamber", "Agarwal", "Baniya", "Gupta",
        "Khandelwal", "Oswal", "Porwal", "Jaiswal", "Caste No Bar"
    ],
    "Buddhist": [
        "Neo Buddhist", "Mahar", "Theravada", "Mahayana", "Vajrayana",
        "Caste No Bar"
    ],
    "Parsi": [
        "Irani", "Shahenshai", "Kadmi", "Caste No Bar"
    ],
    "Jewish": [
        "Bene Israel", "Cochin Jews", "Baghdadi Jews", "Caste No Bar"
    ],
    "Bahai": [
        "Caste No Bar"
    ]
};

const motherTongueData = [
    { category: "North", options: ["Hindi - All", "Hindi-Delhi", "Hindi-MP/CG", "Hindi-UP/UK", "Punjabi", "Hindi-Bihar/Jharkhand", "Hindi-Rajasthan"] },
    { category: "South", options: ["Tamil", "Telugu", "Malayalam", "Kannada", "Tulu"] },
    { category: "East & West", options: ["Bengali", "Marathi", "Gujarati", "Odia", "Urdu"] }
];

const horoscopeData = ["Mesham (Aries)", "Rishabam (Taurus)", "Mithunam (Gemini)", "Kadagam (Cancer)", "Simmam (Leo)", "Kanni (Virgo)", "Thulam (Libra)", "Viruchigam (Scorpio)", "Dhanusu (Sagittarius)", "Magaram (Capricorn)", "Kumbam (Aquarius)", "Meenam (Pisces)"];

const PartnerReligionEditor = ({ initialData, onSave, onCancel }) => {
    const [form, setForm] = useState({
        prefReligion: '',
        prefSect: '',
        prefCaste: '',
        prefMotherTongue: '',
        prefHoroscope: ''
    });

    const [activeModal, setActiveModal] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (initialData) {
            setForm({
                prefReligion: initialData.prefReligion || '',
                prefSect: initialData.prefSect || '',
                prefCaste: initialData.prefCaste || '',
                prefMotherTongue: initialData.prefMotherTongue || '',
                prefHoroscope: initialData.prefHoroscope || ''
            });
        }
    }, [initialData]);

    const handleSave = () => {
        onSave(form);
    };

    // --- helper: parse comma-separated string to array ---
    const toArray = (fieldKey) => form[fieldKey] ? form[fieldKey].split(',').map(s => s.trim()).filter(Boolean) : [];

    const isSelected = (fieldKey, val) => toArray(fieldKey).includes(val);

    const toggleItem = (fieldKey, val) => {
        let arr = toArray(fieldKey);
        if (arr.includes(val)) {
            arr = arr.filter(item => item !== val);
        } else {
            arr.push(val);
        }
        setForm({ ...form, [fieldKey]: arr.join(', ') });
    };

    const clearField = (fieldKey) => {
        setForm({ ...form, [fieldKey]: '' });
    };

    const getSelectedReligions = () => toArray('prefReligion');

    // --- Build grouped options for each modal type ---
    const getSectGroups = () => {
        const religions = getSelectedReligions();
        return religions.map(r => ({ category: r, options: sectData[r] || [] })).filter(g => g.options.length > 0);
    };

    const getCasteGroups = () => {
        const religions = getSelectedReligions();
        let groups = [];
        religions.forEach(r => {
            if (casteData[r]) {
                groups.push({ category: r, options: casteData[r] });
            }
        });
        return groups;
    };

    // --- Unified modal renderer ---
    const renderModal = (type, fieldKey) => {
        let title = '';
        let groups = [];
        let showSearch = false;
        let isFlat = false; // flat = no category headers

        if (type === 'religion') {
            title = "Partner's Religion";
            groups = [{ category: '', options: allReligions }];
            isFlat = true;
        } else if (type === 'sect') {
            title = "Partner's Sect";
            groups = getSectGroups();
        } else if (type === 'caste') {
            title = "Partner's Caste";
            groups = getCasteGroups();
            showSearch = true;
        } else if (type === 'motherTongue') {
            title = "Partner's Mother Tongue";
            groups = motherTongueData;
            showSearch = true;
        } else if (type === 'horoscope') {
            title = "Partner's Horoscope";
            groups = [{ category: '', options: horoscopeData }];
            isFlat = true;
        }

        // Search filter
        let filteredGroups = [];
        groups.forEach(group => {
            const filteredOpts = group.options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));
            if (filteredOpts.length > 0 || group.category.toLowerCase().includes(searchTerm.toLowerCase())) {
                filteredGroups.push({
                    category: group.category,
                    options: group.category.toLowerCase().includes(searchTerm.toLowerCase()) ? group.options : filteredOpts
                });
            }
        });

        const arr = toArray(fieldKey);
        const isDoesntMatter = arr.length === 0;

        return (
            <div className="proe-modal-overlay" onClick={() => { setActiveModal(null); setSearchTerm(''); }}>
                <div className="proe-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="proe-modal-header">
                        <h2 style={{ fontSize: '1.25rem', color: '#1a2a3a', fontWeight: '700', margin: 0 }}>{title}</h2>
                        <button className="proe-close" onClick={() => { setActiveModal(null); setSearchTerm(''); }}><X size={20} /></button>
                    </div>

                    {/* Selected chips summary */}
                    {!isDoesntMatter && (
                        <div style={{ padding: '0 16px 8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {arr.slice(0, 3).map(sel => (
                                <div key={sel} className="proe-selected-chip">
                                    {sel} <button onClick={() => toggleItem(fieldKey, sel)}><X size={12} /></button>
                                </div>
                            ))}
                            {arr.length > 3 && <span style={{ fontSize: '0.85rem', color: '#334155', alignSelf: 'center' }}>+{arr.length - 3} More</span>}
                        </div>
                    )}

                    {/* Search bar */}
                    {showSearch && (
                        <div className="proe-search-bar" style={{ margin: '0 16px 8px' }}>
                            <input
                                type="text"
                                placeholder="Type to search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search size={18} color="#4b5563" />
                        </div>
                    )}

                    {/* Options list */}
                    <div className="proe-modal-body">
                        {/* Doesn't Matter option */}
                        {searchTerm === '' && (
                            <div className="proe-option-item" onClick={() => clearField(fieldKey)}>
                                <div className={`proe-checkbox ${isDoesntMatter ? 'checked' : ''}`}>
                                    {isDoesntMatter && <div className="proe-check-mark" />}
                                </div>
                                <span style={{ fontWeight: isDoesntMatter ? 600 : 400 }}>Doesn't Matter</span>
                            </div>
                        )}

                        {filteredGroups.map(group => (
                            <div key={group.category || 'flat'}>
                                {!isFlat && group.category && (
                                    <div className="proe-group-header">{group.category}</div>
                                )}
                                {group.options.map(opt => {
                                    const selected = isSelected(fieldKey, opt);
                                    return (
                                        <div key={opt} className="proe-option-item" onClick={() => toggleItem(fieldKey, opt)}>
                                            <div className={`proe-checkbox ${selected ? 'checked' : ''}`}>
                                                {selected && <div className="proe-check-mark" />}
                                            </div>
                                            <span style={{ fontWeight: selected ? 600 : 400 }}>{opt}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    <div className="proe-modal-footer">
                        <button className="proe-done-btn" onClick={() => { setActiveModal(null); setSearchTerm(''); }}>Done</button>
                    </div>
                </div>
            </div>
        );
    };

    const religionsList = getSelectedReligions();
    const isDoesntMatterReligion = religionsList.length === 0;
    const showSectCaste = !isDoesntMatterReligion;
    const showHoroscope = religionsList.length === 1 && religionsList[0] === 'Hindu';

    return (
        <div className="proe-fullscreen-overlay">
            <div className="proe-container">
                <div className="proe-header">
                    <button className="proe-back-btn" onClick={onCancel}><ArrowLeft size={24} color="#374151" /></button>
                    <div>
                        <h2 className="proe-title">Partner's Religion & Ethnicity</h2>
                        <p className="proe-subtitle">Update these details to get suitable matches</p>
                    </div>
                </div>

                <div className="proe-content">
                    {/* Partner's Religion - now a clickable dropdown field */}
                    <div className="proe-field-group" onClick={() => setActiveModal('religion')} style={{ cursor: 'pointer' }}>
                        <label className="proe-label">Partner's Religion</label>
                        <div className="proe-value-display">
                            {form.prefReligion || "Doesn't Matter"}
                        </div>
                    </div>

                    {/* Sect - only show if religion is selected */}
                    {showSectCaste && (
                        <div className="proe-field-group" onClick={() => setActiveModal('sect')} style={{ cursor: 'pointer' }}>
                            <label className="proe-label">Partner's Sect</label>
                            <div className="proe-value-display">
                                {form.prefSect || "Doesn't Matter"}
                            </div>
                        </div>
                    )}

                    {/* Caste - only show if religion is selected */}
                    {showSectCaste && (
                        <div className="proe-field-group" onClick={() => setActiveModal('caste')} style={{ cursor: 'pointer' }}>
                            <label className="proe-label">Partner's Caste</label>
                            <div className="proe-value-display">
                                {form.prefCaste || "Doesn't Matter"}
                            </div>
                        </div>
                    )}

                    {/* Mother Tongue */}
                    <div className="proe-field-group" onClick={() => setActiveModal('motherTongue')} style={{ cursor: 'pointer' }}>
                        <label className="proe-label">Partner's Mother Tongue</label>
                        <div className="proe-value-display">
                            {form.prefMotherTongue || "Doesn't Matter"}
                        </div>
                    </div>

                    {/* Horoscope - only if Hindu only */}
                    {showHoroscope && (
                        <div className="proe-field-group" onClick={() => setActiveModal('horoscope')} style={{ cursor: 'pointer' }}>
                            <label className="proe-label">Partner's Horoscope</label>
                            <div className="proe-value-display">
                                {form.prefHoroscope || "Doesn't Matter"}
                            </div>
                        </div>
                    )}
                </div>

                <div className="proe-footer">
                    <button className="proe-save-btn" onClick={handleSave}>Save</button>
                </div>
            </div>

            {/* Sub Modals */}
            {activeModal === 'religion' && renderModal('religion', 'prefReligion')}
            {activeModal === 'sect' && renderModal('sect', 'prefSect')}
            {activeModal === 'caste' && renderModal('caste', 'prefCaste')}
            {activeModal === 'motherTongue' && renderModal('motherTongue', 'prefMotherTongue')}
            {activeModal === 'horoscope' && renderModal('horoscope', 'prefHoroscope')}
        </div>
    );
};

export default PartnerReligionEditor;
