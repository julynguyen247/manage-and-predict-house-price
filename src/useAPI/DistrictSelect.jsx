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
                
                {/* Indicator cho số lượng đã chọn */}
                <div className="flex items-center mr-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                        selectedDistricts.length >= maxSelections 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-gray-100 text-gray-600'
                    }`}>
                        {selectedDistricts.length}/{maxSelections}
                    </span>
                </div>
            </div>

            {isOpen && isProvinceSelected && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-xl z-40 mt-1 max-h-96 overflow-hidden">
                    {loading ? (
                        <div className="p-4 text-center">
                            <div className="inline-flex items-center">
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                                <span className="text-gray-600">Đang tải danh sách quận huyện...</span>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="p-4 text-center">
                            <div className="inline-flex items-center text-red-600">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                <span>{error}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="max-h-96 overflow-y-auto">
                            <div className="grid grid-cols-1 gap-4 p-4">
                                {/* Thông tin tỉnh được chọn */}
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <h3 className="font-semibold text-blue-800 mb-2">
                                        Đang tìm kiếm tại: {selectedProvince}
                                    </h3>
                                    <div className="text-sm text-blue-600">
                                        {selectedDistricts.length > 0 && (
                                            <span>Đã chọn {selectedDistricts.length} địa điểm</span>
                                        )}
                                    </div>
                                </div>

                                {/* Danh sách tìm kiếm */}
                                {searchTerm && filteredDistricts.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-gray-800">
                                            Kết quả tìm kiếm "{searchTerm}"
                                        </h3>
                                        <div className="max-h-40 overflow-y-auto space-y-1">
                                            {filteredDistricts.slice(0, 10).map((district) => (
                                                <div
                                                    key={district.id}
                                                    className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                                                    onClick={() => handleDistrictSelect(district)}
                                                >
                                                    <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                                                    <span className="text-sm text-gray-700 flex-1">
                                                        {district.name}, {selectedProvince}
                                                    </span>
                                                    <span className="text-xs text-green-600 font-medium">
                                                        Chọn
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

    
                                {/* Tất cả quận huyện từ API */}
                                {!searchTerm && districts.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-gray-800">
                                            Tất cả quận huyện ({districts.length})
                                        </h3>
                                        <div className="max-h-40 overflow-y-auto space-y-1">
                                            {districts
                                                .filter(district => !selectedDistricts.some(d => d.id === district.id))
                                                .map((district) => (
                                                <div
                                                    key={district.id}
                                                    className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                                                    onClick={() => handleDistrictSelect(district)}
                                                >
                                                    <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                                                    <span className="text-sm text-gray-700 flex-1">
                                                        {district.name}, {selectedProvince}
                                                    </span>
                                                    <span className="text-xs text-green-600 font-medium">
                                                        Chọn
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Thông báo khi không có kết quả */}
                                {searchTerm && filteredDistricts.length === 0 && (
                                    <div className="text-center py-4">
                                        <div className="text-gray-500 text-sm">
                                            Không tìm thấy kết quả cho "{searchTerm}"
                                        </div>
                                    </div>
                                )}

                                {/* Thông báo khi đã chọn đủ giới hạn */}
                                {selectedDistricts.length >= maxSelections && (
                                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                                        <div className="text-orange-800 text-sm text-center">
                                            {`Bạn đã chọn đủ ${maxSelections} địa điểm. Hãy bỏ chọn một số địa điểm để thêm địa điểm mới.`}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default DistrictSelect;