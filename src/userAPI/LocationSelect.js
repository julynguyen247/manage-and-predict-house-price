import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { baseUrl } from '../base';
import DistrictSelect from './DistrictSelect';

const provinceUrl = baseUrl + 'provinces/';

function LocationSelect({ onProvinceSelect, onDistrictSelect, maxDistrictSelections = 5 }) {
  const [provinces, setProvinces] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState({ id: null, name: '' });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  // fetch provinces with AbortController and minimal logs
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchProvinces = async () => {
      setLoading(true);
      try {
        const res = await fetch(provinceUrl, { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        setProvinces(payload?.data ?? []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching provinces:', err);
          setProvinces([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProvinces();
    return () => controller.abort();
  }, []);

  // close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // memoized counts and label
  const provincesCount = useMemo(() => provinces.length, [provinces]);
  const provinceLabel = selectedProvince.name || 'Chọn tỉnh thành';

  // callbacks
  const handleProvinceSelect = useCallback(
    (provinceName, provinceId) => {
      setSelectedProvince({ id: provinceId, name: provinceName });
      setIsOpen(false);
      onProvinceSelect?.(provinceName, provinceId);
    },
    [onProvinceSelect]
  );

  const handleSelectAllProvinces = useCallback(() => {
    setSelectedProvince({ id: null, name: '' });
    setIsOpen(false);
    onProvinceSelect?.('Chọn tỉnh thành', null);
  }, [onProvinceSelect]);

  const handleDistrictSelect = useCallback(
    (ids, names) => {
      onDistrictSelect?.(ids, names);
    },
    [onDistrictSelect]
  );

  // open dropdown (used by DistrictSelect when requiring province)
  const openProvinceDropdown = useCallback(() => {
    setIsOpen(true);
    // focus first element could be done here if needed
  }, []);

  // keyboard accessibility for the toggler
  const onTogglerKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((s) => !s);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="relative w-full">
        <div className="flex items-center px-4 py-3 bg-gray-50 w-full">
          <MapPin className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-gray-400">Đang tải tỉnh thành...</span>
          <div className="ml-2 w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row w-full">
      <div className="relative z-10 w-full md:w-[260px]" ref={dropdownRef}>
        <div
          role="button"
          tabIndex={0}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onKeyDown={onTogglerKeyDown}
          className="flex items-center px-4 py-3 md:border-r border-b md:border-b-0 border-gray-300 bg-gray-50 md:min-w-[260px] cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setIsOpen((s) => !s)}
        >
          <MapPin className="h-5 w-5 text-gray-500 mr-2" />
          <span className="text-gray-700 font-medium flex-1 truncate">{provinceLabel}</span>
          <ChevronDown className={`h-4 w-4 text-gray-500 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {isOpen && (
          <div
            role="listbox"
            aria-label="Chọn tỉnh thành"
            className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-xl z-40 max-h-60 overflow-y-auto"
          >
            <div className="p-2">
              <div className="px-3 py-2 text-sm font-medium text-gray-500 border-b border-gray-200">
                Tất cả tỉnh thành ({provincesCount})
              </div>

              <div className="max-h-48 overflow-y-auto">
                <button
                  type="button"
                  className={`w-full text-left flex items-center px-3 py-2 hover:bg-gray-100 rounded cursor-pointer transition-colors ${
                    selectedProvince.id == null ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                  onClick={handleSelectAllProvinces}
                >
                  <MapPin className={`h-4 w-4 mr-2 ${selectedProvince.id == null ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className="flex-1">Chọn tỉnh thành</span>
                  {selectedProvince.id == null && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                </button>

                {provinces.map((province) => {
                  const active = selectedProvince.id === province.id;
                  return (
                    <button
                      key={province.id}
                      type="button"
                      className={`w-full text-left flex items-center px-3 py-2 hover:bg-gray-100 rounded cursor-pointer transition-colors ${
                        active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                      onClick={() => handleProvinceSelect(province.name, province.id)}
                    >
                      <MapPin className={`h-4 w-4 mr-2 ${active ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span className="flex-1 truncate">{province.name}</span>
                      {active && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1">
        <DistrictSelect
          selectedProvince={provinceLabel}
          selectedProvinceId={selectedProvince.id}
          onDistrictSelect={handleDistrictSelect}
          onClose={() => {}}
          onRequireProvince={openProvinceDropdown}
          isProvinceSelected={Boolean(selectedProvince.id)}
          maxSelections={maxDistrictSelections}
        />
      </div>
    </div>
  );
}

export default LocationSelect;
