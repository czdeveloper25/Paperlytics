import React, { useState, useRef, useEffect, useMemo } from 'react';

const SearchWithAutocomplete = ({
  value,
  onChange,
  suggestions,
  placeholder = "Search..."
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Get the current search term (last part after comma)
  const currentTerm = useMemo(() => {
    const parts = value.split(',');
    return parts[parts.length - 1].trim().toLowerCase();
  }, [value]);

  // Filter suggestions based on current term
  const filteredSuggestions = useMemo(() => {
    if (!currentTerm || currentTerm.length < 1) return [];

    return suggestions
      .filter(variable =>
        variable.name.toLowerCase().includes(currentTerm) ||
        variable.shortName.toLowerCase().includes(currentTerm)
      )
      .slice(0, 8); // Limit to 8 suggestions
  }, [currentTerm, suggestions]);

  // Handle suggestion click
  const handleSuggestionClick = (variable) => {
    const parts = value.split(',').map(p => p.trim()).filter(Boolean);
    // Replace the last term with the selected variable
    if (parts.length > 0) {
      parts[parts.length - 1] = variable.shortName;
    } else {
      parts.push(variable.shortName);
    }
    onChange(parts.join(', '));
    setShowDropdown(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
          handleSuggestionClick(filteredSuggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    onChange(e.target.value);
    setShowDropdown(true);
    setHighlightedIndex(-1);
  };

  // Handle focus
  const handleFocus = () => {
    if (currentTerm.length >= 1) {
      setShowDropdown(true);
    }
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show dropdown when we have suggestions and a current term
  const shouldShowDropdown = showDropdown && filteredSuggestions.length > 0 && currentTerm.length >= 1;

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-gray-100 dark:bg-[#252464] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-medium-purple transition-all"
      />

      {/* Autocomplete Dropdown */}
      {shouldShowDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-300 dark:border-gray-600 overflow-hidden z-50 max-h-[320px] overflow-y-auto"
        >
          <div className="p-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1 mb-1">
              Suggestions (click or press Enter)
            </p>
            {filteredSuggestions.map((variable, index) => (
              <button
                key={variable.id}
                onClick={() => handleSuggestionClick(variable)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  index === highlightedIndex
                    ? 'bg-success-green text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{variable.shortName}</p>
                    <p className={`text-xs truncate ${
                      index === highlightedIndex ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {variable.name}
                    </p>
                  </div>
                  <div className="ml-2 flex gap-1">
                    {variable.processes.slice(0, 2).map((process, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          index === highlightedIndex
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {process.slice(0, 8)}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search hint */}
      {value && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
          {value.split(',').filter(t => t.trim()).length} term(s)
        </div>
      )}
    </div>
  );
};

export default SearchWithAutocomplete;
