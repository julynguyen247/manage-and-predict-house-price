import React from 'react';
import PropertyMap from './PropertyMap';

const MapTest = () => {
  // Dữ liệu mẫu để test
  const testProperty = {
    coord_x: "106.6297",  // Longitude - Hồ Chí Minh
    coord_y: "10.8231",   // Latitude - Hồ Chí Minh
    title: "Bất động sản test",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    price: "5000",
    area_m2: "100"
  };

  const formatPrice = (price) => {
    if (!price) return '0';
    const numPrice = parseFloat(price);
    if (numPrice >= 1000) {
      return `${(numPrice / 1000).toFixed(1)} tỷ`;
    }
    return `${numPrice.toFixed(0)} triệu`;
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Bản Đồ</h1>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Xem trên bản đồ</h3>
        <PropertyMap property={testProperty} formatPrice={formatPrice} showMarker={true} />
      </div>
      
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <h4 className="font-semibold mb-2">Thông tin test:</h4>
        <p><strong>Tọa độ:</strong> {testProperty.coord_y}, {testProperty.coord_x}</p>
        <p><strong>Tiêu đề:</strong> {testProperty.title}</p>
        <p><strong>Địa chỉ:</strong> {testProperty.address}</p>
        <p><strong>Giá:</strong> {formatPrice(testProperty.price)}</p>
        <p><strong>Diện tích:</strong> {testProperty.area_m2} m²</p>
      </div>
    </div>
  );
};

export default MapTest;
