import React, { useState } from 'react';
import { ChevronLeft, X, Check, ArrowLeft, Search } from 'lucide-react';
import './PartnerEducationEditor.css';

const PartnerEducationEditor = ({ initialData, onSave, onClose }) => {
    const [form, setForm] = useState({
        prefEducation: initialData.prefEducation || '',
        prefOccupation: initialData.prefOccupation || '',
        prefEmploymentType: initialData.prefEmploymentType || '',
        prefIncomeRupeeMin: initialData.prefIncomeRupeeMin || 'Rs. 0',
        prefIncomeRupeeMax: initialData.prefIncomeRupeeMax || "Doesn't Matter",
        prefIncomeDollarMin: initialData.prefIncomeDollarMin || '$0',
        prefIncomeDollarMax: initialData.prefIncomeDollarMax || "Doesn't Matter",
        prefIncome: initialData.prefIncome || ''
    });

    const [activeModal, setActiveModal] = useState(null); // 'education', 'occupation', 'employment', 'income'
    const [searchTerm, setSearchTerm] = useState('');
    const [incomeTab, setIncomeTab] = useState('Rupees (₹)'); // 'Rupees (₹)', 'Dollars ($)'

    const suggestedDegrees = ["D.Ed", "D.El.Ed", "D.Voc", "CPT", "ETT"];
    const groupedDegrees = [
        {
            category: "Engineering/Technology/Design",
            options: ["B.E/B.Tech", "B.Pharma", "M.E/M.Tech", "M.Pharma", "M.S. (Engineering)", "B.Arch", "M.Arch", "B.Des", "M.Des"]
        },
        {
            category: "Computers",
            options: ["BCA", "MCA", "B.IT", "M.IT"]
        },
        {
            category: "Arts/Science/Commerce",
            options: ["B.A", "B.Com", "B.Sc", "B.Ed", "M.A", "M.Com", "M.Sc", "M.Ed", "B.F.A", "M.F.A"]
        },
        {
            category: "Management",
            options: ["MBA", "PGDM", "BBA", "BMS"]
        },
        {
            category: "Medicine",
            options: ["MBBS", "BDS", "MDS", "MD", "MS (Medicine)", "BAMS", "BHMS"]
        },
        {
            category: "Law",
            options: ["B.A.L.L.B", "L.L.B", "L.L.M"]
        }
    ];

    const allOccupations = [
        "Private Sector", "Government/Public Sector", "Civil Services", "Defence",
        "Business/ Self Employed", "Not working currently", "Banking & Finance",
        "Accounting Professional", "Software Professional", "Hardware & Networking",
        "HR Professional", "Architect", "Doctor", "Teacher/ Professor",
        "Lawyer", "Marketing Professional", "Manager"
    ];

    const allEmploymentTypes = [
        "Private Sector", "Government/Public Sector", "Civil Services",
        "Defense", "Business/Self Employed", "Not Working"
    ];

    const incomeRupees = [
        "Rs. 0", "Rs. 1 Lakh", "Rs. 2 Lakh", "Rs. 3 Lakh", "Rs. 4 Lakh", "Rs. 5 Lakh",
        "Rs. 6 Lakh", "Rs. 7 Lakh", "Rs. 8 Lakh", "Rs. 9 Lakh", "Rs. 10 Lakh"
    ];

    const incomeDollars = [
        "$0", "$25,001", "$40,001", "$60,001", "$80,001", "$100,001",
        "$120,001", "$150,001", "$200,001"
    ];

    const incomeRupeeMax = [
        "Doesn't Matter", "Rs. 1 Lakh", "Rs. 2 Lakh", "Rs. 3 Lakh", "Rs. 4 Lakh", "Rs. 5 Lakh",
        "Rs. 6 Lakh", "Rs. 7 Lakh", "Rs. 8 Lakh", "Rs. 9 Lakh", "Rs. 10 Lakh"
    ];

    const incomeDollarMax = [
        "Doesn't Matter", "$25,001", "$40,001", "$60,001", "$80,001", "$100,001",
        "$120,001", "$150,001", "$200,001"
    ];

    const handleSave = () => {
        // Build combined income string
        const rMinStr = form.prefIncomeRupeeMin;
        const rMaxStr = form.prefIncomeRupeeMax === "Doesn't Matter" ? "and above" : `to ${form.prefIncomeRupeeMax}`;
        const rupeeStr = rMinStr ? `${rMinStr} ${rMaxStr}` : '';

        const dMinStr = form.prefIncomeDollarMin;
        const dMaxStr = form.prefIncomeDollarMax === "Doesn't Matter" ? "and above" : `to ${form.prefIncomeDollarMax}`;
        const dollarStr = dMinStr ? `${dMinStr} ${dMaxStr}` : '';

        const combinedIncome = [rupeeStr, dollarStr].filter(Boolean).join(', ');

        onSave({
            ...form,
            prefIncome: combinedIncome
        });
    };

    const handleChipSelect = (field, value) => {
        setForm(prev => {
            const arr = prev[field] ? prev[field].split(',').map(s => s.trim()).filter(Boolean) : [];
            let newArr = [...arr];

            if (value === "Doesn't Matter") {
                return { ...prev, [field]: "" }; // Empty string means doesn't matter for these fields
            }

            if (newArr.includes(value)) {
                newArr = newArr.filter(item => item !== value);
            } else {
                newArr.push(value);
            }

            return { ...prev, [field]: newArr.join(', ') };
        });
    };

    const isChipSelected = (field, value) => {
        const val = form[field];
        if (!val || val.trim() === '') return value === "Doesn't Matter";
        if (value === "Doesn't Matter") return false;

        const arr = val.split(',').map(s => s.trim()).filter(Boolean);
        return arr.includes(value);
    };

    const clearField = (field) => {
        setForm(prev => ({ ...prev, [field]: '' }));
    };

    const renderMultiSelectModal = (type) => {
        let title, fieldKey, sourceOptions;

        if (type === 'education') {
            title = "Highest Education";
            fieldKey = 'prefEducation';
        } else if (type === 'occupation') {
            title = "Partner's Occupation";
            fieldKey = 'prefOccupation';
            sourceOptions = allOccupations;
        } else {
            title = "Employment Type";
            fieldKey = 'prefEmploymentType';
            sourceOptions = allEmploymentTypes;
        }

        let filteredGroups = [];
        let filteredFlatOptions = [];

        if (type === 'education') {
            groupedDegrees.forEach(group => {
                const filteredOpts = group.options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));
                if (filteredOpts.length > 0 || group.category.toLowerCase().includes(searchTerm.toLowerCase())) {
                    filteredGroups.push({
                        category: group.category,
                        options: group.category.toLowerCase().includes(searchTerm.toLowerCase()) ? group.options : filteredOpts
                    });
                }
            });
        } else {
            filteredFlatOptions = sourceOptions.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        const arr = form[fieldKey] ? form[fieldKey].split(',').map(s => s.trim()).filter(Boolean) : [];
        const isDoesntMatter = arr.length === 0;

        return (
            <div className="peoe-modal-overlay">
                <div className="peoe-modal-content peoe-modal-full">
                    <div className="peoe-modal-header">
                        <button className="peoe-back" onClick={() => { setActiveModal(null); setSearchTerm(''); }}><ArrowLeft size={24} color="#374151" /></button>
                        <h2 style={{ fontSize: '1.25rem', color: '#1a2a3a', marginLeft: '8px', fontWeight: '700' }}>{title}</h2>
                        <button className="peoe-close" onClick={() => { setActiveModal(null); setSearchTerm(''); }}><X size={20} /></button>
                    </div>

                    <div className="peoe-selected-summary-area">
                        {isDoesntMatter ? null : (
                            <div className="peoe-selected-chips-wrap">
                                {arr.slice(0, 3).map(sel => (
                                    <div key={sel} className="peoe-small-chip">
                                        {sel} <button onClick={() => handleChipSelect(fieldKey, sel)}><X size={12} /></button>
                                    </div>
                                ))}
                                {arr.length > 3 && <span className="peoe-more-count">+{arr.length - 3} More</span>}
                            </div>
                        )}

                        <div className="peoe-search-bar">
                            <input
                                type="text"
                                placeholder="Type to search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search size={18} color="#4b5563" />
                        </div>
                    </div>

                    <div className="peoe-modal-body">
                        <div className="peoe-list">
                            {searchTerm === '' && (
                                <div className="peoe-list-item" onClick={() => clearField(fieldKey)}>
                                    <div className={`peoe-circle-checkbox ${isDoesntMatter ? 'selected' : ''}`}>
                                        {isDoesntMatter && <div className="peoe-circle-inner" />}
                                    </div>
                                    <span style={{ fontWeight: 400, color: '#374151', fontSize: '1rem' }}>Doesn't Matter</span>
                                </div>
                            )}

                            {type === 'education' ? (
                                <>
                                    {filteredGroups.map(group => (
                                        <div key={group.category} style={{ marginBottom: '8px' }}>
                                            <div style={{ background: '#f9fafb', padding: '12px 16px', fontWeight: '600', color: '#1a2a3a', borderRadius: '4px', marginTop: '16px', marginBottom: '8px' }}>
                                                {group.category}
                                            </div>
                                            {group.options.map(opt => {
                                                const selected = isChipSelected(fieldKey, opt);
                                                return (
                                                    <div key={opt} className="peoe-list-item" style={{ borderBottom: 'none', padding: '12px 0' }} onClick={() => handleChipSelect(fieldKey, opt)}>
                                                        <div className={`peoe-circle-checkbox ${selected ? 'selected' : ''}`}>
                                                            {selected && <div className="peoe-circle-inner" />}
                                                        </div>
                                                        <span style={{ color: '#374151', fontSize: '1rem' }}>{opt}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ))}
                                </>
                            ) : (
                                filteredFlatOptions.map(opt => {
                                    const selected = isChipSelected(fieldKey, opt);
                                    return (
                                        <div key={opt} className="peoe-list-item" style={{ borderBottom: 'none', padding: '12px 0' }} onClick={() => handleChipSelect(fieldKey, opt)}>
                                            <div className={`peoe-circle-checkbox ${selected ? 'selected' : ''}`}>
                                                {selected && <div className="peoe-circle-inner" />}
                                            </div>
                                            <span style={{ color: '#374151', fontSize: '1rem' }}>{opt}</span>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    <div className="peoe-modal-footer">
                        <button className="peoe-done-btn" onClick={() => { setActiveModal(null); setSearchTerm(''); }}>Done</button>
                    </div>
                </div>
            </div>
        )
    };

    const renderIncomeModal = () => {
        const minOptions = incomeTab === 'Rupees (₹)' ? incomeRupees : incomeDollars;
        const maxOptions = incomeTab === 'Rupees (₹)' ? incomeRupeeMax : incomeDollarMax;
        const fieldKeyMin = incomeTab === 'Rupees (₹)' ? 'prefIncomeRupeeMin' : 'prefIncomeDollarMin';
        const fieldKeyMax = incomeTab === 'Rupees (₹)' ? 'prefIncomeRupeeMax' : 'prefIncomeDollarMax';

        return (
            <div className="peoe-modal-overlay">
                <div className="peoe-modal-content peoe-modal-income">
                    <div className="peoe-modal-header border-none pb-0">
                        <h2 style={{ paddingLeft: '0' }}>Annual Income</h2>
                        <button className="peoe-close" onClick={() => setActiveModal(null)}><X size={20} /></button>
                    </div>

                    <div className="peoe-tabs-container">
                        <button
                            className={`peoe-tab ${incomeTab === 'Rupees (₹)' ? 'active' : ''}`}
                            onClick={() => setIncomeTab('Rupees (₹)')}
                        >
                            Rupees (₹)
                        </button>
                        <button
                            className={`peoe-tab ${incomeTab === 'Dollars ($)' ? 'active' : ''}`}
                            onClick={() => setIncomeTab('Dollars ($)')}
                        >
                            Dollars ($)
                        </button>
                    </div>

                    <div className="peoe-modal-body" style={{ paddingTop: '20px' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <label className="peoe-label-small">Minimum Income</label>
                            <div className="peoe-dropdown-container">
                                <select
                                    className="peoe-simple-input select-styled"
                                    value={form[fieldKeyMin]}
                                    onChange={(e) => setForm(prev => ({ ...prev, [fieldKeyMin]: e.target.value }))}
                                >
                                    {minOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="peoe-label-small">Maximum Income</label>
                            <div className="peoe-dropdown-container">
                                <select
                                    className="peoe-simple-input select-styled"
                                    value={form[fieldKeyMax]}
                                    onChange={(e) => setForm(prev => ({ ...prev, [fieldKeyMax]: e.target.value }))}
                                >
                                    {maxOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="peoe-modal-footer">
                        <button className="peoe-done-btn" onClick={() => setActiveModal(null)}>Done</button>
                    </div>
                </div>
            </div>
        )
    };

    const formatDegreeDisplay = () => {
        if (!form.prefEducation) return "Doesn't Matter";
        const arr = form.prefEducation.split(',').map(s => s.trim());
        if (arr.length <= 2) return arr.join(', ');
        return `${arr.slice(0, 2).join(', ')} +${arr.length - 2} More`;
    };

    const formatOccupationDisplay = () => {
        if (!form.prefOccupation) return "Doesn't Matter";
        const arr = form.prefOccupation.split(',').map(s => s.trim());
        if (arr.length <= 2) return arr.join(', ');
        return `${arr.slice(0, 2).join(', ')} +${arr.length - 2} More`;
    };

    const formatEmploymentDisplay = () => {
        if (!form.prefEmploymentType) return "Doesn't Matter";
        const arr = form.prefEmploymentType.split(',').map(s => s.trim());
        if (arr.length <= 2) return arr.join(', ');
        return `${arr.slice(0, 2).join(', ')} +${arr.length - 2} More`;
    };

    const formatIncomeDisplay = () => {
        const rMinStr = form.prefIncomeRupeeMin;
        const rMaxStr = form.prefIncomeRupeeMax === "Doesn't Matter" ? "and above" : `to ${form.prefIncomeRupeeMax}`;
        const rupeeStr = rMinStr ? `${rMinStr} ${rMaxStr}` : '';

        const dMinStr = form.prefIncomeDollarMin;
        const dMaxStr = form.prefIncomeDollarMax === "Doesn't Matter" ? "and above" : `to ${form.prefIncomeDollarMax}`;
        const dollarStr = dMinStr ? `${dMinStr} ${dMaxStr}` : '';

        const together = [rupeeStr, dollarStr].filter(Boolean).join(', ');
        return together || "Doesn't Matter";
    };

    return (
        <div className="peoe-fullscreen">
            <div className="peoe-container">
                <div className="peoe-page-header">
                    <button className="peoe-back-arrow" onClick={onClose}><ArrowLeft size={24} /></button>
                    <div className="peoe-title-block">
                        <h1>Partner's Education & Occupation</h1>
                        <p>Update these details to get suitable matches</p>
                    </div>
                </div>

                <div className="peoe-editor-content">
                    {/* HIGHEST DEGREE */}
                    <div className="peoe-field-group">
                        <label>Partner's Highest Degree</label>
                        <div className="peoe-value-display peoe-clickable" onClick={() => setActiveModal('education')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{formatDegreeDisplay()}</span>
                            <ChevronLeft size={18} color="#4b5563" style={{ transform: 'rotate(-90deg)' }} />
                        </div>
                    </div>

                    {/* EMPLOYMENT TYPE */}
                    <div className="peoe-field-group" style={{ marginTop: '32px' }}>
                        <label>Partner's Employment Type</label>
                        <div className="peoe-value-display peoe-clickable" onClick={() => setActiveModal('employment')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{formatEmploymentDisplay()}</span>
                            <ChevronLeft size={18} color="#4b5563" style={{ transform: 'rotate(-90deg)' }} />
                        </div>
                    </div>

                    {/* OCCUPATION */}
                    <div className="peoe-field-group" style={{ marginTop: '32px' }}>
                        <label>Partner's Occupation</label>
                        <div className="peoe-value-display peoe-clickable" onClick={() => setActiveModal('occupation')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{formatOccupationDisplay()}</span>
                            <ChevronLeft size={18} color="#4b5563" style={{ transform: 'rotate(-90deg)' }} />
                        </div>
                    </div>

                    {/* ANNUAL INCOME */}
                    <div className="peoe-field-group" style={{ marginTop: '32px' }}>
                        <label>Annual Income</label>
                        <div className="peoe-value-display peoe-clickable" onClick={() => setActiveModal('income')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{formatIncomeDisplay()}</span>
                            <ChevronLeft size={18} color="#4b5563" style={{ transform: 'rotate(-90deg)' }} />
                        </div>
                    </div>

                </div>

                <div className="peoe-save-container">
                    <button className="peoe-save-btn" onClick={handleSave}>Save</button>
                </div>
            </div>

            {activeModal === 'education' && renderMultiSelectModal('education')}
            {activeModal === 'occupation' && renderMultiSelectModal('occupation')}
            {activeModal === 'employment' && renderMultiSelectModal('employment')}
            {activeModal === 'income' && renderIncomeModal()}
        </div>
    );
};

export default PartnerEducationEditor;
