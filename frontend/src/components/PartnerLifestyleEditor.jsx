import React, { useState, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import './PartnerReligionEditor.css';

const dietaryOptions = ["Vegetarian", "Non Vegetarian", "Jain", "Eggetarian"];
const smokingOptions = ['No', 'Occasionally', 'Yes', 'Regularly'];
const drinkingOptions = ['No', 'Occasionally', 'Yes', 'Regularly'];
const specialCaseOptions = [
    "None",
    "Physically disabled from birth",
    "Physically disabled due to accident",
    "Mentally disabled from birth",
    "Mentally disabled due to accident"
];

const PartnerLifestyleEditor = ({ initialData, onSave, onCancel }) => {
    const [form, setForm] = useState({
        prefDietary: '',
        prefSmoking: '',
        prefDrinking: '',
        prefPhysicalStatus: ''
    });

    const [activeModal, setActiveModal] = useState(null);

    useEffect(() => {
        if (initialData) {
            setForm({
                prefDietary: initialData.prefDietary || '',
                prefSmoking: initialData.prefSmoking || '',
                prefDrinking: initialData.prefDrinking || '',
                prefPhysicalStatus: initialData.prefPhysicalStatus || ''
            });
        }
    }, [initialData]);

    const handleSave = () => {
        onSave(form);
    };

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

    const renderModal = (type, fieldKey) => {
        let title = '';
        let options = [];

        if (type === 'dietary') {
            title = "Partner's Dietary Habits";
            options = dietaryOptions;
        } else if (type === 'smoking') {
            title = "Partner's Smoking Habits";
            options = smokingOptions;
        } else if (type === 'drinking') {
            title = "Partner's Drinking Habits";
            options = drinkingOptions;
        } else if (type === 'specialCase') {
            title = "Special Case";
            options = specialCaseOptions;
        }

        const arr = toArray(fieldKey);
        const isDoesntMatter = arr.length === 0;

        return (
            <div className="proe-modal-overlay" onClick={() => setActiveModal(null)}>
                <div className="proe-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="proe-modal-header">
                        <h2 style={{ fontSize: '1.25rem', color: '#1a2a3a', fontWeight: '700', margin: 0 }}>{title}</h2>
                        <button className="proe-close" onClick={() => setActiveModal(null)}><X size={20} /></button>
                    </div>

                    {!isDoesntMatter && (
                        <div style={{ padding: '0 16px 8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {arr.map(sel => (
                                <div key={sel} className="proe-selected-chip">
                                    {sel} <button onClick={() => toggleItem(fieldKey, sel)}><X size={12} /></button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="proe-modal-body">
                        <div className="proe-option-item" onClick={() => clearField(fieldKey)}>
                            <div className={`proe-checkbox ${isDoesntMatter ? 'checked' : ''}`}>
                                {isDoesntMatter && <div className="proe-check-mark" />}
                            </div>
                            <span style={{ fontWeight: isDoesntMatter ? 600 : 400 }}>Doesn't Matter</span>
                        </div>

                        {options.map(opt => {
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

                    <div className="proe-modal-footer">
                        <button className="proe-done-btn" onClick={() => setActiveModal(null)}>Done</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="proe-fullscreen-overlay">
            <div className="proe-container">
                <div className="proe-header">
                    <button className="proe-back-btn" onClick={onCancel}><ArrowLeft size={24} color="#374151" /></button>
                    <div>
                        <h2 className="proe-title">Partner's Lifestyle & Appearance</h2>
                        <p className="proe-subtitle">Update these details to get suitable matches</p>
                    </div>
                </div>

                <div className="proe-content">
                    {/* Dietary Habits */}
                    <div className="proe-field-group" onClick={() => setActiveModal('dietary')} style={{ cursor: 'pointer' }}>
                        <label className="proe-label">Partner's Dietary Habits</label>
                        <div className="proe-value-display">
                            {form.prefDietary || "Doesn't Matter"}
                        </div>
                    </div>

                    {/* Smoking Habits */}
                    <div className="proe-field-group" onClick={() => setActiveModal('smoking')} style={{ cursor: 'pointer' }}>
                        <label className="proe-label">Partner's Smoking Habits</label>
                        <div className="proe-value-display">
                            {form.prefSmoking || "Doesn't Matter"}
                        </div>
                    </div>

                    {/* Drinking Habits */}
                    <div className="proe-field-group" onClick={() => setActiveModal('drinking')} style={{ cursor: 'pointer' }}>
                        <label className="proe-label">Partner's Drinking Habits</label>
                        <div className="proe-value-display">
                            {form.prefDrinking || "Doesn't Matter"}
                        </div>
                    </div>

                    {/* Special Case */}
                    <div className="proe-field-group" onClick={() => setActiveModal('specialCase')} style={{ cursor: 'pointer' }}>
                        <label className="proe-label">Special Case</label>
                        <div className="proe-value-display">
                            {form.prefPhysicalStatus || "Doesn't Matter"}
                        </div>
                    </div>
                </div>

                <div className="proe-footer">
                    <button className="proe-save-btn" onClick={handleSave}>Save</button>
                </div>
            </div>

            {activeModal === 'dietary' && renderModal('dietary', 'prefDietary')}
            {activeModal === 'smoking' && renderModal('smoking', 'prefSmoking')}
            {activeModal === 'drinking' && renderModal('drinking', 'prefDrinking')}
            {activeModal === 'specialCase' && renderModal('specialCase', 'prefPhysicalStatus')}
        </div>
    );
};

export default PartnerLifestyleEditor;
