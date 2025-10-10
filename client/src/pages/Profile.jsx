import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  Eye, 
  EyeOff,
  Shield,
  CheckCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import api from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, logout } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm({
    defaultValues: {
      fullName: user?.full_name || '',
      idNumber: user?.id_number || '',
      accountNumber: user?.account_number || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPasswordForm,
  } = useForm();

  const newPassword = watch('newPassword');

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/auth/profile', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/auth/password', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password updated successfully!');
      resetPasswordForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update password');
    },
  });

  const onProfileSubmit = async (data) => {
    await updateProfileMutation.mutateAsync(data);
  };

  const onPasswordSubmit = async (data) => {
    await updatePasswordMutation.mutateAsync(data);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600">Manage your account information and security settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="card-glass">
            <div className="card-header">
              <h2 className="card-title flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Personal Information</span>
              </h2>
              <p className="card-description">
                Update your personal details and contact information
              </p>
            </div>
            <div className="card-content">
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="label">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    className={cn('input', profileErrors.fullName && 'input-error')}
                    {...registerProfile('fullName', {
                      required: 'Full name is required',
                      minLength: {
                        value: 2,
                        message: 'Full name must be at least 2 characters',
                      },
                      pattern: {
                        value: /^[a-zA-Z\s'-]+$/,
                        message: 'Full name can only contain letters, spaces, apostrophes, and hyphens',
                      },
                    })}
                  />
                  {profileErrors.fullName && (
                    <p className="mt-1 text-sm text-error-600">
                      {profileErrors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="idNumber" className="label">
                      ID Number
                    </label>
                    <input
                      id="idNumber"
                      type="text"
                      className={cn('input', profileErrors.idNumber && 'input-error')}
                      {...registerProfile('idNumber', {
                        required: 'ID number is required',
                        minLength: {
                          value: 5,
                          message: 'ID number must be at least 5 characters',
                        },
                        maxLength: {
                          value: 20,
                          message: 'ID number cannot exceed 20 characters',
                        },
                        pattern: {
                          value: /^[a-zA-Z0-9]+$/,
                          message: 'ID number can only contain letters and numbers',
                        },
                      })}
                    />
                    {profileErrors.idNumber && (
                      <p className="mt-1 text-sm text-error-600">
                        {profileErrors.idNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="accountNumber" className="label">
                      Account Number
                    </label>
                    <input
                      id="accountNumber"
                      type="text"
                      className={cn('input', profileErrors.accountNumber && 'input-error')}
                      {...registerProfile('accountNumber', {
                        required: 'Account number is required',
                        minLength: {
                          value: 8,
                          message: 'Account number must be at least 8 characters',
                        },
                        maxLength: {
                          value: 20,
                          message: 'Account number cannot exceed 20 characters',
                        },
                        pattern: {
                          value: /^[0-9]+$/,
                          message: 'Account number can only contain numbers',
                        },
                      })}
                    />
                    {profileErrors.accountNumber && (
                      <p className="mt-1 text-sm text-error-600">
                        {profileErrors.accountNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProfileSubmitting || updateProfileMutation.isPending}
                  className="btn btn-primary btn-lg"
                >
                  {isProfileSubmitting || updateProfileMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Password Change */}
          <div className="card-glass">
            <div className="card-header">
              <h2 className="card-title flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Change Password</span>
              </h2>
              <p className="card-description">
                Update your password to keep your account secure
              </p>
            </div>
            <div className="card-content">
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="label">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      className={cn('input pr-10', passwordErrors.currentPassword && 'input-error')}
                      {...registerPassword('currentPassword', {
                        required: 'Current password is required',
                      })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-error-600">
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="newPassword" className="label">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      className={cn('input pr-10', passwordErrors.newPassword && 'input-error')}
                      {...registerPassword('newPassword', {
                        required: 'New password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters',
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                          message: 'Password must contain uppercase, lowercase, number, and special character',
                        },
                      })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-error-600">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="label">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={cn('input pr-10', passwordErrors.confirmPassword && 'input-error')}
                      {...registerPassword('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) =>
                          value === newPassword || 'Passwords do not match',
                      })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-error-600">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPasswordSubmitting || updatePasswordMutation.isPending}
                  className="btn btn-primary btn-lg"
                >
                  {isPasswordSubmitting || updatePasswordMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>Update Password</span>
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Account Summary */}
        <div className="space-y-6">
          {/* Account Info */}
          <div className="card-glass">
            <div className="card-header">
              <h3 className="card-title">Account Information</h3>
            </div>
            <div className="card-content space-y-4">
              <div>
                <span className="text-sm text-gray-600">Member Since</span>
                <p className="font-medium">
                  {new Date(user?.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Account Status</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success-600" />
                  <span className="font-medium text-success-700">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="alert alert-info">
            <Shield className="w-5 h-5" />
            <div>
              <h4 className="font-medium">Security Tips</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• Use a strong, unique password</li>
                <li>• Never share your login credentials</li>
                <li>• Log out from shared devices</li>
                <li>• Report suspicious activity immediately</li>
              </ul>
            </div>
          </div>

          {/* Logout */}
          <div className="card-glass">
            <div className="card-content">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Sign Out</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Sign out of your account on this device
              </p>
              <button
                onClick={handleLogout}
                className="btn btn-outline btn-lg w-full text-red-600 dark:text-white border-red-600 dark:border-white hover:bg-red-600 hover:text-white dark:hover:bg-white dark:hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;