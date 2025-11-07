import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Shield, UserPlus } from 'lucide-react';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import SafePayLogo from '../assets/SafePay.png';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
      fullName: '',
      idNumber: '',
      accountNumber: '',
      password: '',
      confirmPassword: ''
    }
  });

  const password = watch('password');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data) => {
    const result = await registerUser({
      email: data.email,
      fullName: data.fullName,
      idNumber: data.idNumber,
      accountNumber: data.accountNumber,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });
    
    if (result.success) {
      toast.success('Registration successful! Welcome!');
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={SafePayLogo} 
              alt="SafePay" 
              className="w-16 h-16 rounded-2xl"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Join SafePay
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Create your secure payments account
          </p>
        </div>

        {/* Registration Form */}
        <div className="card-glass">
          <div className="card-content">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="label">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={cn('input', errors.email && 'input-error')}
                  placeholder="you@example.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address',
                    },
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-error-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Full Name Field */}
              <div>
                <label htmlFor="fullName" className="label">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  className={cn('input', errors.fullName && 'input-error')}
                  placeholder="John Doe"
                  {...register('fullName', {
                    required: 'Full name is required',
                    minLength: {
                      value: 2,
                      message: 'Full name must be at least 2 characters',
                    },
                    maxLength: {
                      value: 100,
                      message: 'Full name must not exceed 100 characters',
                    },
                    pattern: {
                      value: /^[a-zA-Z\s'-]+$/,
                      message: 'Full name can only contain letters, spaces, apostrophes, and hyphens',
                    },
                  })}
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-error-600">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* ID Number Field */}
              <div>
                <label htmlFor="idNumber" className="label">
                  ID Number
                </label>
                <input
                  id="idNumber"
                  type="text"
                  autoComplete="off"
                  className={cn('input', errors.idNumber && 'input-error')}
                  placeholder="1234567890123"
                  {...register('idNumber', {
                    required: 'ID number is required',
                    minLength: {
                      value: 13,
                      message: 'ID number must be exactly 13 digits',
                    },
                    maxLength: {
                      value: 13,
                      message: 'ID number must be exactly 13 digits',
                    },
                    pattern: {
                      value: /^[0-9]+$/,
                      message: 'ID number can only contain digits',
                    },
                  })}
                />
                {errors.idNumber && (
                  <p className="mt-1 text-sm text-error-600">
                    {errors.idNumber.message}
                  </p>
                )}
              </div>

              {/* Account Number Field */}
              <div>
                <label htmlFor="accountNumber" className="label">
                  Account Number
                </label>
                <input
                  id="accountNumber"
                  type="text"
                  autoComplete="off"
                  className={cn('input', errors.accountNumber && 'input-error')}
                  placeholder="1234567890"
                  {...register('accountNumber', {
                    required: 'Account number is required',
                    minLength: {
                      value: 10,
                      message: 'Account number must be 10-12 digits',
                    },
                    maxLength: {
                      value: 12,
                      message: 'Account number must be 10-12 digits',
                    },
                    pattern: {
                      value: /^[0-9]+$/,
                      message: 'Account number can only contain numbers',
                    },
                  })}
                />
                {errors.accountNumber && (
                  <p className="mt-1 text-sm text-error-600">
                    {errors.accountNumber.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={cn('input pr-10', errors.password && 'input-error')}
                    placeholder="Create a strong password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                        message: 'Password must contain uppercase, lowercase, number, and special character',
                      },
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-error-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={cn('input pr-10', errors.confirmPassword && 'input-error')}
                    placeholder="Confirm your password"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === password || 'Passwords do not match',
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
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-error-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="alert alert-error">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary btn-lg w-full"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="card-footer">
            <p className="text-sm text-gray-600 text-center w-full">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-500">
          <Shield className="w-4 h-4" />
          <span>Your data is protected with enterprise-grade security</span>
        </div>
      </div>
    </div>
  );
};

export default Register;