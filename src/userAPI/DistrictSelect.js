import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin,  AlertCircle } from 'lucide-react';
import { baseUrl } from '../base';

function DistrictUrl(provinceId) {
    return baseUrl + 'provinces/' + provinceId + '/districts/';
}

function DistrictSelect({ selectedProvince, selectedProvinceId, onDistrictSelect, onClose, onRequireProvince, isProvinceSelected, maxSelections = 5 }) {
    const [districts, setDistricts] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDistricts, setSelectedDistricts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const dropdownRef = useRef(null);

    // Danh sách quận huyện phổ biến cho Hồ Chí Minh (fallback)
    const popularDistricts = [
        { id: '24', name: 'Tân Phú', province: 'Hồ Chí Minh' },
        { id: '22', name: 'Thủ Đức', province: 'Hồ Chí Minh' },
        { id: '19', name: 'Quận 7', province: 'Hồ Chí Minh' },
        { id: '13', name: 'Quận 12', province: 'Hồ Chí Minh' },
        { id: '3', name: 'Bình Thạnh', province: 'Hồ Chí Minh' },
        { id: '6', name: 'Gò Vấp', province: 'Hồ Chí Minh' },
        { id: '14', name: 'Quận 2', province: 'Hồ Chí Minh' },
        { id: '17', name: 'Quận 9', province: 'Hồ Chí Minh' },
        { id: '23', name: 'Tân Bình', province: 'Hồ Chí Minh' },
        { id: '2', name: 'Bình Tân', province: 'Hồ Chí Minh' }
    ];

    useEffect(() => {
        if (selectedProvinceId) {
            fetchDistricts(selectedProvinceId);
        }
    }, [selectedProvinceId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                if (onClose) onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const fetchDistricts = async (provinceId) => {
        try {
            setLoading(true);
            setError('');
            const res = await fetch(DistrictUrl(provinceId));
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            setDistricts(data.data || []);
        } catch (error) {
            console.error('Error fetching districts:', error);
            setError('Không thể tải danh sách quận huyện');
            setDistricts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDistrictSelect = (district) => {
        // Kiểm tra xem district đã được chọn chưa
        const isAlreadySelected = selectedDistricts.some(d => d.id === district.id);
        if (isAlreadySelected) {
            return;
        }

        // Kiểm tra giới hạn tối đa
        if (selectedDistricts.length >= maxSelections) {
            alert(`Bạn chỉ có thể chọn tối đa ${maxSelections} địa điểm`);
            return;
        }

        const newSelectedDistricts = [...selectedDistricts, district];
        setSelectedDistricts(newSelectedDistricts);
        
        // Trả về danh sách district IDs và names
        const districtIds = newSelectedDistricts.map(d => d.id);
        const districtNames = newSelectedDistricts.map(d => d.name);
        if (onDistrictSelect) {
            onDistrictSelect(districtIds, districtNames);
        }
        
        // Clear search term after selection
        setSearchTerm('');
    };

    const removeDistrict = (districtId) => {
        const newSelectedDistricts = selectedDistricts.filter(d => d.id !== districtId);
        setSelectedDistricts(newSelectedDistricts);
        // Trả về danh sách district IDs và names
        const districtIds = newSelectedDistricts.map(d => d.id);
        const districtNames = newSelectedDistricts.map(d => d.name);
        if (onDistrictSelect) {
            onDistrictSelect(districtIds, districtNames);
        }
    };

    const filteredDistricts = districts.filter(district =>
        district.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedDistricts.some(d => d.id === district.id)
    );

    // Lọc popular districts để không hiển thị những cái đã chọn
    const filteredPopularDistricts = popularDistricts.filter(district =>
        !selectedDistricts.some(d => d.name === district.name)
    );

    return (
        <div className="relative w-full z-20" ref={dropdownRef}>
            <div className="flex items-center bg-white border border-gray-300 rounded-lg min-h-[48px] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
                <Search className="h-5 w-5 text-gray-500 ml-3 mr-2 flex-shrink-0" />
                <div className="flex flex-nowrap items-center gap-1 py-2 pr-2 flex-1 overflow-x-auto">
                    {selectedDistricts.map((district) => (
                        <span
                            key={district.id}
                            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md hover:bg-blue-200 transition-colors"
                        >
                            {district.name}
                            <X
                                className="h-3 w-3 ml-1 cursor-pointer hover:text-red-600"
                                onClick={() => removeDistrict(district.id)}
                            />
                        </span>
                    ))}
                    <input
                        type="text"
                        placeholder={
                            !isProvinceSelected
                                ? 'Chọn tỉnh thành để bắt đầu'
                                : (selectedDistricts.length === 0
                                    ? `Nhập tối đa ${maxSelections} địa điểm tại ${selectedProvince}. Ví dụ: Quận 1`
                                    : `Thêm địa điểm (còn lại ${Math.max(0, maxSelections - selectedDistricts.length)})`)
                        }
                        className="flex-1 outline-none text-sm min-w-[220px] placeholder-gray-400 truncate"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => {
                            if (!isProvinceSelected) {
                                setIsOpen(false);
                                if (onRequireProvince) onRequireProvince();
                            } else {
                                setIsOpen(true);
                            }
                        }}
                        readOnly={!isProvinceSelected}
                        onClick={() => {
                            if (!isProvinceSelected && onRequireProvince) {
                                onRequireProvince();
                            }
                        }}
                        disabled={selectedDistricts.length >= maxSelections}
                    />
                </div>