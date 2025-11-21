import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { baseUrl } from '../base';
import DistrictSelect from './DistrictSelect';

const provinceUrl = baseUrl + 'provinces/';

function LocationSelect({ onProvinceSelect, onDistrictSelect, maxDistrictSelections = 5 }) {
    const [provinces, setProvinces] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedProvinceId, setSelectedProvinceId] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    // District input is always visible; no separate toggle needed
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                console.log('🚀 Bắt đầu fetch provinces từ:', provinceUrl);
                setLoading(true);
                
                const res = await fetch(provinceUrl);
                console.log('📡 Response status:', res.status);
                
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                
                const data = await res.json();
                console.log('📦 Data nhận được:', data);
                console.log('📋 Danh sách provinces:', data.data?.length || 0, 'items');
                
                const provincesList = data.data || [];
                setProvinces(provincesList);
                // Không chọn mặc định; để người dùng tự chọn
                if (provincesList.length === 0) {
                    console.warn('⚠️ Không có dữ liệu provinces');
                }
            } catch (error) {
                console.error('❌ Error fetching provinces:', error);
                setProvinces([]);
            } finally {
                console.log('✅ Kết thúc fetch provinces, setLoading(false)');
                setLoading(false);
            }
        };
        
        fetchProvinces();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleProvinceSelect = async (provinceName, provinceId) => {
        setSelectedProvince(provinceName);
        setSelectedProvinceId(provinceId);
        setIsOpen(false);
        
        // Gọi callback để truyền dữ liệu province về component cha
        if (onProvinceSelect) {
            onProvinceSelect(provinceName, provinceId);
        }
    };

    const handleSelectAllProvinces = () => {
        setSelectedProvince('Chọn tỉnh thành');
        setSelectedProvinceId(null);
        setIsOpen(false);
        
        // Gọi callback để truyền dữ liệu về component cha
        if (onProvinceSelect) {
            onProvinceSelect('Chọn tỉnh thành', null);
        }
    };

    const handleDistrictSelect = (districtIds, districtNames) => {
        if (onDistrictSelect) {
            onDistrictSelect(districtIds, districtNames);
        }
    };

    const handleDistrictClose = () => {
        // No-op: district input always visible
    };

    const openProvinceDropdown = () => {
        setIsOpen(true);
    };

    // Loading state với thông tin debug
    if (loading) {
        return (
            <div className="relative w-full">
                <div className="flex items-center px-4 py-3 bg-gray-50 w-full">
                    <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-400">Đang tải tỉnh thành...</span>
                    <div className="ml-2 w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row w-full">
            {/* Province Selector */}
            <div className="relative z-10 w-full md:w-[260px]" ref={dropdownRef}>
                <div 
                    className="flex items-center px-4 py-3 md:border-r border-b md:border-b-0 border-gray-300 bg-gray-50 md:min-w-[260px] cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-gray-700 font-medium flex-1">
                        {selectedProvince || 'Chọn tỉnh thành'}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-500 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-xl z-40 max-h-60 overflow-y-auto">
                        <div className="p-2">
                            <div className="px-3 py-2 text-sm font-medium text-gray-500 border-b border-gray-200">
                                Tất cả tỉnh thành ({provinces.length})
                            </div>
                                                        <div className="max-h-48 overflow-y-auto">
                                <div 
                                    className={`flex items-center px-3 py-2 hover:bg-gray-100 rounded cursor-pointer transition-colors ${
                                        !selectedProvinceId 
                                            ? 'bg-blue-50 text-blue-600 font-medium' 
                                            : 'text-gray-700'
                                    }`}
                                    onClick={handleSelectAllProvinces}
                                >
                                    <MapPin className={`h-4 w-4 mr-2 ${
                                        !selectedProvinceId ? 'text-blue-500' : 'text-gray-400'
                                    }`} />
                                    <span className="flex-1">Chọn tỉnh thành</span>
                                    {!selectedProvinceId && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                </div>

                                {provinces.map((province) => (
                                    <div
                                        key={province.id}
                                        className={`flex items-center px-3 py-2 hover:bg-gray-100 rounded cursor-pointer transition-colors ${
                                            selectedProvinceId === province.id 
                                                ? 'bg-blue-50 text-blue-600 font-medium' 
                                                : 'text-gray-700'
                                        }`}
                                        onClick={() => handleProvinceSelect(province.name, province.id)}
                                    >
                                        <MapPin className={`h-4 w-4 mr-2 ${
                                            selectedProvinceId === province.id ? 'text-blue-500' : 'text-gray-400'
                                        }`} />
                                        <span className="flex-1">{province.name}</span>
                                        {selectedProvinceId === province.id && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* District Selector - luôn hiển thị; nếu chưa chọn tỉnh thì click sẽ mở chọn tỉnh */}
            <div className="flex-1">
                <DistrictSelect
                    selectedProvince={selectedProvince || 'Chọn tỉnh thành'}
                    selectedProvinceId={selectedProvinceId}
                    onDistrictSelect={handleDistrictSelect}
                    onClose={handleDistrictClose}
                    onRequireProvince={openProvinceDropdown}
                    isProvinceSelected={Boolean(selectedProvinceId) && selectedProvince !== 'Chọn tỉnh thành'}
                    maxSelections={maxDistrictSelections}
                />
            </div>
        </div>
    );
}

export default LocationSelect;