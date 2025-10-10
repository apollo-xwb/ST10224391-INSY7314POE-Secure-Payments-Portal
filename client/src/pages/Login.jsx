import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Shield, Lock } from 'lucide-react';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import SafePayLogo from '../assets/SafePay.png';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => clearError();
  }, []);

  const onSubmit = async (data) => {
    const result = await login(data.idNumber, data.password);
    if (result.success) {
      toast.success('Login successful!');
      navigate(from, { replace: true });
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
            Welcome Back to SafePay
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sign in to your secure payments account
          </p>
        </div>

        {/* Login Form */}
        <div className="card-glass">
          <div className="card-content">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  placeholder="Enter your ID number"
                  {...register('idNumber', {
                    required: 'ID number is required',
                    minLength: {
                      value: 5,
                      message: 'ID number must be at least 5 characters',
                    },
                    maxLength: {
                      value: 20,
                      message: 'ID number must not exceed 20 characters',
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9]+$/,
                      message: 'ID number can only contain letters and numbers',
                    },
                  })}
                />
                {errors.idNumber && (
                  <p className="mt-1 text-sm text-error-600">
                    {errors.idNumber.message}
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
                    autoComplete="current-password"
                    className={cn('input pr-10', errors.password && 'input-error')}
                    placeholder="Enter your password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
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
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4" />
                    <span>Sign In</span>
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="card-footer">
            <p className="text-sm text-gray-600 text-center w-full">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-500">
          <Shield className="w-4 h-4" />
          <span>Your connection is secure and encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default Login;