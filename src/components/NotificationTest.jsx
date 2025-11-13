import React, { useEffect } from 'react';
import { useNotificationSystem } from '../hooks/useNotificationSystem';
import { TestTube } from 'lucide-react';

const NotificationTest = () => {
  const { 
    notifications, 
    unreadCount, 
    getContactRequests, 
    getUnreadContactRequestsCount,
    clearNotifications 
  } = useNotificationSystem();

  // Listen for test notification events
  useEffect(() => {
    const handleTestNotification = (event) => {
      console.log('Test notification received:', event.detail);
      // The notification will be handled by the NotificationContext
    };

    window.addEventListener('test-notification', handleTestNotification);
    return () => {
      window.removeEventListener('test-notification', handleTestNotification);
    };
  }, []);

  const testContactRequest = () => {
    // Simulate a contact request notification với data thực tế
    const testData = {
      type: 'contact_request',
      property: {
        id: 18,
        title: 'Cập nhật liên tục rỗ hàng bán tháng 08/2025 1PN+ 1 65m2 giá 2.6 tỷ, 2PN 73m2 giá 3.150 tỷ sổ sẵn',
        description: 'Rỗ hàng 08/2025 mới nhất, đang bán giá tốt nhất thị trường, cạnh tranh - 0976 312 ***, căn có thể ko chào ảo.',
        price: '2.60 tỷ',
        area_m2: '65.00',
        address: 'Dự án MT Eastmark City, Đường Trường Lưu, Phường Long Trường, Quận 9, Hồ Chí Minh',
        thumbnail: '/media/properties/property/0704910aa16f4da38cc9164f1fdd18bc.jpg1755746464_103817',
        views: 76,
        time: '14 ngày trước'
      },
      message: 'hello anh em 12345',
      timestamp: new Date().toISOString(),
      from_username: 'hw2125186'
    };

    console.log('🧪 Testing contact request notification:', testData);
    
    // Trigger the notification by dispatching a custom event
    window.dispatchEvent(new CustomEvent('test-notification', { detail: testData }));
  };

  const testMultipleNotifications = () => {
    // Test multiple notifications
    const testUsers = ['user1', 'user2', 'user3'];
    const testProperties = [
      { id: 18, title: 'Căn hộ 1PN 65m2 giá 2.6 tỷ' },
      { id: 19, title: 'Căn hộ 2PN 73m2 giá 3.15 tỷ' },
      { id: 20, title: 'Căn hộ 3PN 100m2 giá 4 tỷ' }
    ];

    testUsers.forEach((username, index) => {
      setTimeout(() => {
        const testData = {
          type: 'contact_request',
          property: {
            ...testProperties[index % testProperties.length],
            price: `${2.6 + index * 0.5} tỷ`,
            area_m2: `${65 + index * 10}.00`,
            address: 'Dự án MT Eastmark City, Quận 9, Hồ Chí Minh',
            thumbnail: '/media/properties/property/0704910aa16f4da38cc9164f1fdd18bc.jpg1755746464_103817'
          },
          message: `Tin nhắn test từ ${username}`,
          timestamp: new Date().toISOString(),
          from_username: username
        };
        
        window.dispatchEvent(new CustomEvent('test-notification', { detail: testData }));
      }, index * 2000); // 2 giây giữa mỗi notification
    });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center space-x-2 mb-4">
        <TestTube className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Notification Test</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total notifications:</span>
          <span className="font-medium">{notifications.length}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Unread count:</span>
          <span className="font-medium text-red-500">{unreadCount}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Contact requests:</span>
          <span className="font-medium">{getContactRequests().length}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Unread contact requests:</span>
          <span className="font-medium text-red-500">{getUnreadContactRequestsCount()}</span>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <button
          onClick={testContactRequest}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Test Single Contact Request
        </button>
        
        <button
          onClick={testMultipleNotifications}
          className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Test Multiple Notifications
        </button>
        
        <button
          onClick={clearNotifications}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Clear All Notifications
        </button>
      </div>
      
      {notifications.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent notifications:</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className="text-xs bg-gray-50 p-2 rounded">
                <div className="font-medium">{notification.type}</div>
                <div className="text-gray-600 truncate">
                  {notification.title || notification.message}
                </div>
                <div className="text-gray-500">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationTest;
