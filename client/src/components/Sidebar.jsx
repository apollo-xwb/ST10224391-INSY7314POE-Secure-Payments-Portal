import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  PlusCircle, 
  History, 
  User, 
  Shield,
  CheckCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import SafePayLogo from '../assets/SafePay.png';

const Sidebar = () => {
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'New Payment', href: '/payment/new', icon: PlusCircle },
    { name: 'Payment History', href: '/payments', icon: History },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <img 
            src={SafePayLogo} 
            alt="SafePay" 
            className="w-8 h-8 rounded-lg"
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">SafePay</h2>
            <div className="flex items-center space-x-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Secure Portal</p>
              <CheckCircle className="w-3 h-3 text-green-500" />
            </div>
          </div>
        </div>
        
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-r-2 border-primary-600'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  )
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
        
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <Shield className="w-4 h-4" />
            <span>Secure & Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;