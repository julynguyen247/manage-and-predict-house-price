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