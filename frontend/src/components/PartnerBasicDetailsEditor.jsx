import React, { useState } from 'react';
import { ChevronLeft, X, Check, Lock, ArrowLeft } from 'lucide-react';
import { getCountries, getStates, getCities } from '../data/locationData';
import './PartnerBasicDetailsEditor.css';

const PartnerBasicDetailsEditor = ({ initialData, onSave, onClose }) => {
    const [form, setForm] = useState({ ...initialData });
    const [activeModal, setActiveModal] = useState(null); // 'minAge', 'maxAge', 'minHeight', 'maxHeight'
    const [errorMsg, setErrorMsg] = useState('');

    const generateAgeOptions = (type) => {
        let options = [];
        let start = 18;
        if (type === 'maxAge' && form.prefAgeFrom) {
            start = parseInt(form.prefAgeFrom) + 1;
        }
        for (let i = start; i <= 70; i++) {
            options.push(i);
        }
        return options;
    };

    const generateHeightOptions = (type) => {
        const heights = [
            { id: "1", label: "4' 0'' (1.22 mts)" }, { id: "2", label: "4' 1'' (1.24 mts)" },
            { id: "3", label: "4' 2'' (1.28 mts)" }, { id: "4", label: "4' 3'' (1.31 mts)" },
            { id: "5", label: "4' 4'' (1.34 mts)" }, { id: "6", label: "4' 5'' (1.35 mts)" },
            { id: "7", label: "4' 6'' (1.37 mts)" }, { id: "8", label: "4' 7'' (1.40 mts)" },
            { id: "9", label: "4' 8'' (1.42 mts)" }, { id: "10", label: "4' 9'' (1.45 mts)" },
            { id: "11", label: "4' 10'' (1.47 mts)" }, { id: "12", label: "4' 11'' (1.50 mts)" },
            { id: "13", label: "5' 0'' (1.52 mts)" }, { id: "14", label: "5' 1'' (1.55 mts)" },
            { id: "15", label: "5' 2'' (1.57 mts)" }, { id: "16", label: "5' 3'' (1.60 mts)" },
            { id: "17", label: "5' 4'' (1.63 mts)" }, { id: "18", label: "5' 5'' (1.65 mts)" },
            { id: "19", label: "5' 6'' (1.68 mts)" }, { id: "20", label: "5' 7'' (1.70 mts)" },
            { id: "21", label: "5' 8'' (1.73 mts)" }, { id: "22", label: "5' 9'' (1.75 mts)" },
            { id: "23", label: "5' 10'' (1.78 mts)" }, { id: "24", label: "5' 11'' (1.80 mts)" },
            { id: "25", label: "6' 0'' (1.83 mts)" }, { id: "26", label: "6' 1'' (1.85 mts)" },
            { id: "27", label: "6' 2'' (1.88 mts)" }, { id: "28", label: "6' 3'' (1.91 mts)" },
        ];
        if (type === 'maxHeight' && form.prefHeightFrom) {
            const minIndex = heights.findIndex(h => h.label === form.prefHeightFrom);
            if (minIndex !== -1) {
                return heights.slice(minIndex + 1);
            }
        }
        return heights;
    };

    const handleSave = () => {
        const minA = parseInt(form.prefAgeFrom);
        const maxA = parseInt(form.prefAgeTo);

        if (minA < 18) {
            setErrorMsg("Minimum age must be >= 18.");
            return;
        }
        if (maxA <= minA) {
            setErrorMsg("Maximum age must be greater than minimum age.");
            return;
        }

        // Add additional validations for heights here if needed

        setErrorMsg('');
        onSave(form);
    };

    const handleChipSelect = (field, value) => {
        setForm(prev => {
            const arr = prev[field] ? prev[field].split(',').map(s => s.trim()).filter(Boolean) : [];
            let newArr = [...arr];

            if (value === "Doesn't Matter") {
                return { ...prev, [field]: "Doesn't Matter" };
            }

            newArr = newArr.filter(item => item !== "Doesn't Matter");

            if (newArr.includes(value)) {
                newArr = newArr.filter(item => item !== value);
            } else {
                newArr.push(value);
            }

            if (newArr.length === 0) {
                return { ...prev, [field]: "Doesn't Matter" };
            }

            return { ...prev, [field]: newArr.join(', ') };
        });
    };

    const isChipSelected = (field, value) => {
        if (!form[field]) return value === "Doesn't Matter";
        const arr = form[field].split(',').map(s => s.trim()).filter(Boolean);
        return arr.includes(value);
    };

    const renderAgeModal = (type) => {
        const title = type === 'minAge' ? "Partner's Minimum Age" : "Partner's Maximum Age";
        const options = generateAgeOptions(type);

        return (
            <div className="pbde-modal-overlay">
                <div className="pbde-modal-content">
                    <div className="pbde-modal-header">
                        <button className="pbde-back" onClick={() => setActiveModal(null)}><ChevronLeft size={20} /></button>
                        <h2>{title}</h2>
                        <button className="pbde-close" onClick={() => setActiveModal(null)}><X size={20} /></button>
                    </div>

                    <div className="pbde-modal-body">
                        {type === 'maxAge' && form.prefAgeFrom && (
                            <div className="pbde-chip-filter">
                                <span className="pbde-chip-text">Minimum Age : {form.prefAgeFrom} Years</span>
                                <button className="pbde-chip-clear" onClick={() => setActiveModal('minAge')}><X size={14} /></button>
                            </div>
                        )}
                        {type === 'minAge' && form.prefAgeTo && parseInt(form.prefAgeTo) > 0 && (
                            <div className="pbde-chip-filter">
                                <span className="pbde-chip-text">Maximum Age : {form.prefAgeTo} Years</span>
                                <button className="pbde-chip-clear" onClick={() => setActiveModal('maxAge')}><X size={14} /></button>
                            </div>
                        )}

                        <div className="pbde-list">
                            {options.map(opt => {
                                const isSelected = type === 'minAge' ? parseInt(form.prefAgeFrom) === opt : parseInt(form.prefAgeTo) === opt;
                                return (
                                    <div key={opt} className="pbde-list-item" onClick={() => {
                                        setForm(prev => ({ ...prev, [type === 'minAge' ? 'prefAgeFrom' : 'prefAgeTo']: opt.toString() }));
                                        if (type === 'minAge') {
                                            setActiveModal('maxAge');
                                        } else {
                                            setActiveModal(null);
                                        }
                                    }}>
                                        <div className={`pbde-radio ${isSelected ? 'selected' : ''}`}>
                                            {isSelected && <div className="pbde-radio-inner" />}
                                        </div>
                                        <span>{opt} Years</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )
    };

    const renderHeightModal = (type) => {
        const title = type === 'minHeight' ? "Partner's Minimum Height" : "Partner's Maximum Height";
        const options = generateHeightOptions(type);

        return (
            <div className="pbde-modal-overlay">
                <div className="pbde-modal-content">
                    <div className="pbde-modal-header">
                        <button className="pbde-back" onClick={() => setActiveModal(null)}><ChevronLeft size={20} /></button>
                        <h2>{title}</h2>
                        <button className="pbde-close" onClick={() => setActiveModal(null)}><X size={20} /></button>
                    </div>

                    <div className="pbde-modal-body">
                        {type === 'maxHeight' && form.prefHeightFrom && (
                            <div className="pbde-chip-filter">
                                <span className="pbde-chip-text">Partner's Minimum Height : {form.prefHeightFrom}</span>
                                <button className="pbde-chip-clear" onClick={() => setActiveModal('minHeight')}><X size={14} /></button>
                            </div>
                        )}

                        <div className="pbde-list">
                            {options.map(opt => {
                                const isSelected = type === 'minHeight' ? form.prefHeightFrom === opt.label : form.prefHeightTo === opt.label;
                                return (
                                    <div key={opt.id} className="pbde-list-item" onClick={() => {
                                        setForm(prev => ({ ...prev, [type === 'minHeight' ? 'prefHeightFrom' : 'prefHeightTo']: opt.label }));
                                        if (type === 'minHeight') {
                                            setActiveModal('maxHeight');
                                        } else {
                                            setActiveModal(null);
                                        }
                                    }}>
                                        <div className={`pbde-radio ${isSelected ? 'selected' : ''}`}>
                                            {isSelected && <div className="pbde-radio-inner" />}
                                        </div>
                                        <span>{opt.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )
    };
    const renderLocationModal = (type) => {
        const titles = {
            country: "Partner's Country",
            state: "Partner's State",
            city: "Partner's City"
        };
        const title = titles[type];
        const fieldKey = type === 'country' ? 'prefCountry' : type === 'state' ? 'prefState' : 'prefCity';

        let options = [];
        if (type === 'country') options = getCountries();
        if (type === 'state') options = getStates('India');
        if (type === 'city') {
            const selectedStates = form.prefState ? form.prefState.split(',').map(s => s.trim()).filter(s => s !== "Doesn't Matter" && s !== "") : [];
            options = selectedStates.flatMap(st => getCities('India', st));
        }

        return (
            <div className="pbde-modal-overlay">
                <div className="pbde-modal-content">
                    <div className="pbde-modal-header">
                        <button className="pbde-back" onClick={() => setActiveModal(null)}><ChevronLeft size={20} /></button>
                        <h2>{title}</h2>
                        <button className="pbde-close" onClick={() => setActiveModal(null)}><X size={20} /></button>
                    </div>

                    <div className="pbde-modal-body">
                        <div className="pbde-list">
                            <div className="pbde-list-item" onClick={() => handleChipSelect(fieldKey, "Doesn't Matter")}>
                                <div className={`pbde-checkbox ${isChipSelected(fieldKey, "Doesn't Matter") ? 'selected' : ''}`}>
                                    {isChipSelected(fieldKey, "Doesn't Matter") && <Check size={16} color="#fff" />}
                                </div>
                                <span style={{ fontWeight: isChipSelected(fieldKey, "Doesn't Matter") ? 600 : 400, color: isChipSelected(fieldKey, "Doesn't Matter") ? '#1a2a3a' : '#6b7c93' }}>Doesn't Matter</span>
                            </div>

                            {options.map(opt => {
                                const selected = isChipSelected(fieldKey, opt);
                                return (
                                    <div key={opt} className="pbde-list-item" onClick={() => handleChipSelect(fieldKey, opt)}>
                                        <div className={`pbde-checkbox ${selected ? 'selected' : ''}`}>
                                            {selected && <Check size={16} color="#fff" />}
                                        </div>
                                        <span style={{ fontWeight: selected ? 600 : 400, color: selected ? '#1a2a3a' : '#6b7c93' }}>{opt}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )
    };

    const countries = form.prefCountry ? form.prefCountry.split(',').map(s => s.trim()).filter(s => s !== "Doesn't Matter" && s !== "") : [];
    const showStateCity = (countries.length === 1 && countries[0] === 'India');
    const showResStatus = !showStateCity;

    const showHavingChildren = !form.prefMaritalStatus || form.prefMaritalStatus.trim() !== 'Never Married';

    return (
        <div className="pbde-fullscreen">
            <div className="pbde-container">
                <div className="pbde-page-header">
                    <button className="pbde-back-arrow" onClick={onClose}><ArrowLeft size={24} /></button>
                    <div className="pbde-title-block">
                        <h1>Basic Details</h1>
                        <p>Update these details to get suitable matches</p>
                    </div>
                </div>

                <div className="pbde-editor-content">
                    {errorMsg && <div className="pbde-error-alert">{errorMsg}</div>}

                    {/* AGE */}
                    <div className="pbde-field-group">
                        <label>Partner's Age</label>
                        <div className="pbde-value-display pbde-clickable" onClick={() => setActiveModal('minAge')}>
                            {form.prefAgeFrom && form.prefAgeTo ? `${form.prefAgeFrom} Years - ${form.prefAgeTo} Years` : "Doesn't Matter"}
                        </div>
                    </div>

                    {/* HEIGHT */}
                    <div className="pbde-field-group">
                        <label>Partner's Height</label>
                        <div className="pbde-value-display pbde-clickable" onClick={() => setActiveModal('minHeight')}>
                            {form.prefHeightFrom && form.prefHeightTo ? `${form.prefHeightFrom} - ${form.prefHeightTo}` : "Doesn't Matter"}
                        </div>
                    </div>

                    {/* COUNTRY */}
                    <div className="pbde-field-group">
                        <label>Partner's Country</label>
                        <div className="pbde-value-display pbde-clickable" onClick={() => setActiveModal('country')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{form.prefCountry || "Doesn't Matter"}</span>
                            <ChevronLeft size={18} color="#4b5563" style={{ transform: 'rotate(-90deg)' }} />
                        </div>
                    </div>

                    {/* STATE */}
                    {showStateCity && (
                        <div className="pbde-field-group">
                            <label>Partner's State</label>
                            <div className="pbde-value-display pbde-clickable" onClick={() => setActiveModal('state')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{form.prefState || "Doesn't Matter"}</span>
                                <ChevronLeft size={18} color="#4b5563" style={{ transform: 'rotate(-90deg)' }} />
                            </div>
                        </div>
                    )}

                    {/* CITY */}
                    {showStateCity && (
                        <div className="pbde-field-group">
                            <label>Partner's City</label>
                            <div className="pbde-value-display pbde-clickable" onClick={() => setActiveModal('city')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{form.prefCity || "Doesn't Matter"}</span>
                                <ChevronLeft size={18} color="#4b5563" style={{ transform: 'rotate(-90deg)' }} />
                            </div>
                        </div>
                    )}

                    {/* RESIDENTIAL STATUS */}
                    {showResStatus && (
                        <div className="pbde-field-group pbde-tags-group">
                            <label>Partner's Residential Status</label>
                            <div className="pbde-chips-container">
                                <button className={`pbde-chip ${isChipSelected('prefResidentialStatus', "Doesn't Matter") ? 'selected default-sel' : ''}`} onClick={() => handleChipSelect('prefResidentialStatus', "Doesn't Matter")}>
                                    Doesn't Matter {isChipSelected('prefResidentialStatus', "Doesn't Matter") && <Check size={14} />}
                                </button>
                                {['Citizen', 'Permanent Resident', 'Work Permit', 'Student Visa', 'Temporary Visa'].map(opt => (
                                    <button key={opt} className={`pbde-chip ${isChipSelected('prefResidentialStatus', opt) ? 'selected' : ''}`} onClick={() => handleChipSelect('prefResidentialStatus', opt)}>
                                        {opt} {isChipSelected('prefResidentialStatus', opt) ? <Check size={14} /> : '+'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MARITAL STATUS */}
                    <div className="pbde-field-group pbde-tags-group">
                        <label>Partner's Marital Status</label>
                        <div className="pbde-chips-container">
                            <button className={`pbde-chip ${isChipSelected('prefMaritalStatus', "Doesn't Matter") ? 'selected default-sel' : ''}`} onClick={() => handleChipSelect('prefMaritalStatus', "Doesn't Matter")}>
                                Doesn't Matter {isChipSelected('prefMaritalStatus', "Doesn't Matter") && <Check size={14} />}
                            </button>
                            {['Never Married', 'Awaiting Divorce', 'Divorced', 'Widowed', 'Annulled', 'Married'].map(opt => (
                                <button key={opt} className={`pbde-chip ${isChipSelected('prefMaritalStatus', opt) ? 'selected' : ''}`} onClick={() => handleChipSelect('prefMaritalStatus', opt)}>
                                    {opt} {isChipSelected('prefMaritalStatus', opt) ? <Check size={14} /> : '+'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* HAVING CHILDREN */}
                    {showHavingChildren && (
                        <div className="pbde-field-group pbde-tags-group">
                            <label>Having Children</label>
                            <div className="pbde-chips-container">
                                <button className={`pbde-chip ${isChipSelected('prefHavingChildren', "Doesn't Matter") ? 'selected default-sel' : ''}`} onClick={() => handleChipSelect('prefHavingChildren', "Doesn't Matter")}>
                                    Doesn't Matter {isChipSelected('prefHavingChildren', "Doesn't Matter") && <Check size={14} />}
                                </button>
                                {['Yes', 'No'].map(opt => (
                                    <button key={opt} className={`pbde-chip ${isChipSelected('prefHavingChildren', opt) ? 'selected' : ''}`} onClick={() => handleChipSelect('prefHavingChildren', opt)}>
                                        {opt} {isChipSelected('prefHavingChildren', opt) ? <Check size={14} /> : '+'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PROFILE POSTED BY */}
                    <div className="pbde-field-group pbde-tags-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label>Partner's profile posted by</label>
                        </div>
                        <div className="pbde-chips-container">
                            <button className={`pbde-chip ${isChipSelected('prefProfilePostedBy', "Doesn't Matter") ? 'selected default-sel' : ''}`} onClick={() => handleChipSelect('prefProfilePostedBy', "Doesn't Matter")}>
                                Doesn't Matter {isChipSelected('prefProfilePostedBy', "Doesn't Matter") ? <Check size={14} /> : '+'}
                            </button>
                            {['Self', 'Parent'].map(opt => (
                                <button key={opt} className={`pbde-chip ${isChipSelected('prefProfilePostedBy', opt) ? 'selected' : ''}`} onClick={() => handleChipSelect('prefProfilePostedBy', opt)}>
                                    {opt} {isChipSelected('prefProfilePostedBy', opt) ? <Check size={14} /> : '+'}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                <div className="pbde-save-container">
                    <button className="pbde-save-btn" onClick={handleSave}>Save</button>
                </div>

            </div>


            {activeModal === 'minAge' && renderAgeModal('minAge')}
            {activeModal === 'maxAge' && renderAgeModal('maxAge')}
            {activeModal === 'minHeight' && renderHeightModal('minHeight')}
            {activeModal === 'maxHeight' && renderHeightModal('maxHeight')}
            {activeModal === 'country' && renderLocationModal('country')}
            {activeModal === 'state' && renderLocationModal('state')}
            {activeModal === 'city' && renderLocationModal('city')}
        </div>
    );
};

export default PartnerBasicDetailsEditor;
