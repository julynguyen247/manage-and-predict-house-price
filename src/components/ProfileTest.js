import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TestTube, User, Shield, ShieldCheck } from 'lucide-react';

const ProfileTest = () => {
  const { user } = useAuth();

  const testUserData = () => {
    // Simulate user data with verification status
    const testData = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      phone: '0123456789',
      address: '123 Test Street, Test City',
      date_of_birth: '1990-01-01',
      bio: 'This is a test user bio',
      avatar: null,
      is_verified: true
    };
    
    console.log('Test user data:', testData);
    return testData;
  };

  const testUnverifiedUser = () => {
    const testData = {
      id: 2,
      username: 'unverifieduser',
      email: 'unverified@example.com',
      first_name: 'Unverified',
      last_name: 'User',
      phone: '0987654321',
      address: '456 Unverified Street, Test City',
      date_of_birth: '1995-05-15',
      bio: 'This is an unverified user',
      avatar: null,
      is_verified: false
    };
    
    console.log('Test unverified user data:', testData);
    return testData;
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center space-x-2 mb-4">
        <TestTube className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Profile Test</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Current user:</span>
          <span className="font-medium">{user?.username || 'Not logged in'}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Verification status:</span>
          <div className="flex items-center space-x-1">
            {user?.is_verified ? (
              <>
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span className="text-green-600 text-sm">Verified</span>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 text-orange-500" />
                <span className="text-orange-600 text-sm">Unverified</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">User ID:</span>
          <span className="font-medium">{user?.id || 'N/A'}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Email:</span>
          <span className="font-medium text-sm">{user?.email || 'N/A'}</span>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <button
          onClick={testUserData}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Test Verified User Data
        </button>
        
        <button
          onClick={testUnverifiedUser}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Test Unverified User Data
        </button>
      </div>
      
      {user && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current user data:</h4>
          <div className="text-xs bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTest;
