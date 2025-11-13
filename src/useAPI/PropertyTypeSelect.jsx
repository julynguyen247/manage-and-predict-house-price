import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { baseUrl } from "../base";

const propertyTypeUrl = baseUrl + 'property-types/';

function PropertyTypeSelect({ onPropertyTypeSelect, tab }) {
    // State lưu danh sách loại nhà đất
    const [propertyTypes, setPropertyTypes] = useState([]);
    // State lưu các loại đã được chọn
    const [selectedTypes, setSelectedTypes] = useState([]);
    // State để mở/đóng dropdown
    const [isOpen, setIsOpen] = useState(false);
    // State loading
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);

    // Gọi API khi component được render đầu tiên hoặc khi tab thay đổi
    useEffect(() => {
        const fetchPropertyTypes = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                // Khi tab là 'thue' thì gọi danh sách dành cho thuê, còn lại (ban hoặc rỗng) là để bán
                if (tab === 'thue') {
                    params.set('tab', 'thue');
                } else {
                    params.set('tab', 'ban');
                }
                const res = await fetch(`${propertyTypeUrl}?${params.toString()}`);
                if(!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
                const data = await res.json();
                setPropertyTypes(data.results || data.data || []);
                // Reset lựa chọn khi thay đổi tab để tránh giữ lựa chọn sai ngữ cảnh
                setSelectedTypes([]);
                if (onPropertyTypeSelect) {
                    onPropertyTypeSelect([], []);
                }
            }catch(error){
                console.error('Error fetching property types:', error);
                setPropertyTypes([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPropertyTypes();
    }, [tab]);

    // Handle click outside to close dropdown
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

    // Kiểm tra xem có phải đang chọn tất cả không
    const isAllSelected = selectedTypes.length === propertyTypes.length && propertyTypes.length > 0;

    // Xử lý khi chọn "Tất cả"
    const handleSelectAll = () => {
        if (isAllSelected) {
            // Nếu đang chọn tất cả thì bỏ chọn tất cả
            setSelectedTypes([]);
            if (onPropertyTypeSelect) {
                onPropertyTypeSelect([], []);
            }
        } else {
            // Nếu chưa chọn tất cả thì chọn tất cả
            const allTypeIds = propertyTypes.map(type => type.id);
            const allTypeNames = propertyTypes.map(type => type.name);
            setSelectedTypes(allTypeIds);
            if (onPropertyTypeSelect) {
                onPropertyTypeSelect(allTypeIds, allTypeNames);
            }
        }
    };

    // Xử lý khi chọn một loại cụ thể
    const handleSelectType = (typeId) => {
        let newSelectedTypes;
        
        if (selectedTypes.includes(typeId)) {
            // Bỏ chọn loại này
            newSelectedTypes = selectedTypes.filter(id => id !== typeId);
        } else {
            // Chọn thêm loại này
            newSelectedTypes = [...selectedTypes, typeId];
        }
        
        setSelectedTypes(newSelectedTypes);
        
        // Trả về danh sách property type IDs và names
        const typeNames = newSelectedTypes.map(id => {
            const type = propertyTypes.find(t => t.id === id);
            return type ? type.name : '';
        }).filter(name => name);
        
        if (onPropertyTypeSelect) {
            onPropertyTypeSelect(newSelectedTypes, typeNames);
        }
    };

    // Lấy tên của các loại đã chọn
    const getSelectedTypeNames = () => {
        return selectedTypes.map(id => {
            const type = propertyTypes.find(t => t.id === id);
            return type ? type.name : '';
        }).filter(name => name);
    };

    // Xóa một loại đã chọn
    const removeType = (typeId) => {
        const newSelectedTypes = selectedTypes.filter(id => id !== typeId);
        setSelectedTypes(newSelectedTypes);
        
        // Trả về danh sách property type IDs và names
        const typeNames = newSelectedTypes.map(id => {
            const type = propertyTypes.find(t => t.id === id);
            return type ? type.name : '';
        }).filter(name => name);
        
        if (onPropertyTypeSelect) {
            onPropertyTypeSelect(newSelectedTypes, typeNames);
        }
    };

    // Hiển thị text cho dropdown
    const getDisplayText = () => {
        if (selectedTypes.length === 0) {
            return 'Loại nhà đất';
        } else if (isAllSelected) {
            return 'Tất cả loại nhà đất';
        } else if (selectedTypes.length === 1) {
            const type = propertyTypes.find(t => t.id === selectedTypes[0]);
            return type ? type.name : 'Loại nhà đất';
        } else {
            return `${selectedTypes.length} loại đã chọn`;
        }
    };

    if (loading) {
        return (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại nhà đất
                </label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                        <span className="text-gray-500">Đang tải...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại nhà đất
            </label>
            <div className="relative" ref={dropdownRef}>
                {/* Main dropdown button */}
                <div 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 cursor-pointer bg-white"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            {selectedTypes.length > 0 && !isAllSelected && (
                                <div className="flex flex-wrap gap-1 mb-1">
                                    {getSelectedTypeNames().slice(0, 2).map((name, index) => (
                                        <span 
                                            key={selectedTypes[index]}
                                            className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-md"
                                        >
                                            {name}
                                            <X
                                                className="h-3 w-3 ml-1 cursor-pointer hover:text-red-600"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeType(selectedTypes[index]);
                                                }}
                                            />
                                        </span>
                                    ))}
                                    {selectedTypes.length > 2 && (
                                        <span className="text-xs text-gray-500">
                                            +{selectedTypes.length - 2} khác
                                        </span>
                                    )}
                                </div>
                            )}
                            <span className={`block truncate ${selectedTypes.length > 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                                {getDisplayText()}
                            </span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-500 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>

                {/* Dropdown menu */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-xl z-40 mt-1 max-h-60 overflow-y-auto">
                        <div className="p-2">
                            {/* Tất cả option */}
                            <div 
                                className="flex items-center px-3 py-2 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                                onClick={handleSelectAll}
                            >
                                <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                                    isAllSelected 
                                        ? 'bg-red-500 border-red-500' 
                                        : 'border-gray-300'
                                }`}>
                                    {isAllSelected && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <span className={`flex-1 ${isAllSelected ? 'font-medium text-red-600' : 'text-gray-700'}`}>
                                    Tất cả
                                </span>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-200 my-2"></div>

                            {/* Individual property types */}
                            {propertyTypes.map((type) => (
                                <div 
                                    key={type.id}
                                    className="flex items-center px-3 py-2 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                                    onClick={() => handleSelectType(type.id)}
                                >
                                    <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                                        selectedTypes.includes(type.id) 
                                            ? 'bg-red-500 border-red-500' 
                                            : 'border-gray-300'
                                    }`}>
                                        {selectedTypes.includes(type.id) && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                    <span className={`flex-1 ${selectedTypes.includes(type.id) ? 'font-medium text-red-600' : 'text-gray-700'}`}>
                                        {type.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PropertyTypeSelect;