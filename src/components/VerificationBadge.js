import React from 'react';
import { Shield, ShieldCheck } from 'lucide-react';

const VerificationBadge = ({ isVerified, showText = false, size = 'sm' }) => {
  const getBadgeConfig = () => {
    if (isVerified) {
      return {
        icon: <ShieldCheck className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} text-green-500`} />,
        text: 'Đã xác thực',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else {
      return {
        icon: <Shield className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} text-orange-500`} />,
        text: 'Chưa xác thực',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.borderColor} ${config.color}`}>
      {config.icon}
      {showText && <span className="ml-1">{config.text}</span>}
    </div>
  );
};

export default VerificationBadge;
