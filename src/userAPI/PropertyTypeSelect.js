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
