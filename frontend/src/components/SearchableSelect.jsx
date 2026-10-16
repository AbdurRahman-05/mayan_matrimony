import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './SearchableSelect.css';

const SearchableSelect = ({ name, value, onChange, options = [], placeholder, disabled, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Find the label for the current value
    const selectedLabel = options.find(opt => {
        if (typeof opt === 'object') return opt.value === value;
        return opt === value;
    });
    const displayLabel = selectedLabel
        ? (typeof selectedLabel === 'object' ? selectedLabel.label : selectedLabel)
        : '';

    // Filter options based on search term
    const filteredOptions = options.filter(opt => {
        const label = typeof opt === 'object' ? opt.label : opt;
        return label.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const items = listRef.current.querySelectorAll('.ss-option');
            if (items[highlightedIndex]) {
                items[highlightedIndex].scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex]);

    const handleSelect = (optValue) => {
        // Simulate a native event shape for handleInputChange
        onChange({ target: { name, value: optValue } });
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
    };

    
    const handleInputBlur = () => {
        if (searchTerm && filteredOptions.length > 0) {
            const exact = filteredOptions.find(opt => {
                const label = typeof opt === 'object' ? opt.label : opt;
                return label.toString().toLowerCase() === searchTerm.trim().toLowerCase();
            });
            if (exact && !exact.isHeader) {
                handleSelect(typeof exact === 'object' ? exact.value : exact);
            }
        }
    };

    const handleInputClick = () => {
        if (disabled) return;
        setIsOpen(true);
        setSearchTerm('');
        setHighlightedIndex(-1);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            let next = highlightedIndex + 1;
            while (next < filteredOptions.length && filteredOptions[next]?.isHeader) next++;
            if (next < filteredOptions.length) setHighlightedIndex(next);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            let next = highlightedIndex - 1;
            while (next >= 0 && filteredOptions[next]?.isHeader) next--;
            if (next >= 0) setHighlightedIndex(next);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                const opt = filteredOptions[highlightedIndex];
                if (!opt?.isHeader) {
                    handleSelect(typeof opt === 'object' ? opt.value : opt);
                }
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchTerm('');
            setHighlightedIndex(-1);
        }
    };

    return (
        <div className={`ss-wrapper ${className || ''} ${disabled ? 'ss-disabled' : ''}`} ref={wrapperRef}>
            <div className={`ss-control ${isOpen ? 'ss-open' : ''}`} onClick={handleInputClick}>
                {isOpen ? (
                    <input
                        ref={inputRef}
                        type="text"
                        className="ss-search-input"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setHighlightedIndex(0); }}
                        onKeyDown={handleKeyDown}
                        onBlur={handleInputBlur}
                        placeholder={displayLabel || placeholder || 'Select or type'}
                        autoFocus
                    />
                ) : (
                    <span className={`ss-value ${!value ? 'ss-placeholder' : ''}`}>
                        {displayLabel || placeholder || 'Select or type'}
                    </span>
                )}
                <ChevronDown size={16} className={`ss-chevron ${isOpen ? 'ss-chevron-up' : ''}`} />
            </div>
            {isOpen && (
                <ul className="ss-dropdown" ref={listRef} onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.stopPropagation()}>
                    {filteredOptions.length === 0 ? (
                        <li className="ss-no-results">No results found</li>
                    ) : (
                        filteredOptions.map((opt, idx) => {
                            if (opt?.isHeader) {
                                return (
                                    <li key={`header-${idx}`} className="ss-header">
                                        {opt.label}
                                    </li>
                                );
                            }
                            const optValue = typeof opt === 'object' ? opt.value : opt;
                            const optLabel = typeof opt === 'object' ? opt.label : opt;
                            return (
                                <li
                                    key={optValue}
                                    className={`ss-option ${optValue === value ? 'ss-selected' : ''} ${idx === highlightedIndex ? 'ss-highlighted' : ''}`}
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        handleSelect(optValue);
                                    }}
                                    onTouchEnd={(e) => {
                                        e.preventDefault();
                                        handleSelect(optValue);
                                    }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleSelect(optValue);
                                    }}
                                    onMouseEnter={() => setHighlightedIndex(idx)}
                                >
                                    {optLabel}
                                </li>
                            );
                        })
                    )}
                </ul>
            )}
        </div>
    );
};

export default SearchableSelect;
