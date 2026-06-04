import React, { useState, useRef, useEffect } from 'react';
import './SearchableSelect.css';

export default function SearchableSelect({ options, value, onChange, placeholder = 'Pilih opsi...', disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) => opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`searchable-select ${disabled ? 'disabled' : ''}`} ref={wrapperRef}>
      <div 
        className="searchable-select-control" 
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="searchable-select-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`searchable-select-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      
      {isOpen && (
        <div className="searchable-select-menu">
          <input
            type="text"
            className="searchable-select-search"
            placeholder="Cari..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
          <div className="searchable-select-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`searchable-select-option ${String(opt.value) === String(value) ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="searchable-select-no-results">Tidak ada hasil</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
