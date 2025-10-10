import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  CreditCard, 
  Globe, 
  Building2, 
  DollarSign,
  Shield,
  CheckCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import api from '../services/api';
import toast from 'react-hot-toast';
import CurrencyFlag from '../components/CurrencyFlag';

const PaymentForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    trigger,
  } = useForm();

  const watchedFields = watch();
  const selectedCurrency = watch('currency') || 'ZAR';

  // Submit payment mutation
  const submitPaymentMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/payments', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Payment request submitted successfully!');
      navigate(`/payments/${data.data._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit payment');
    },
  });

  const onSubmit = async (data) => {
    await submitPaymentMutation.mutateAsync(data);
  };

  const nextStep = async () => {
    let fieldsToValidate = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['payeeName', 'payeeEmail', 'payeeAddress'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['payeeBank', 'swiftCode', 'accountNumber', 'country'];
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const steps = [
    { number: 1, title: 'Payee Details', icon: CreditCard },
    { number: 2, title: 'Bank Information', icon: Building2 },
    { number: 3, title: 'Payment Amount', icon: DollarSign },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New International Payment</h1>
          <p className="text-gray-600 dark:text-gray-200">Create a secure international payment request</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="card-glass">
        <div className="card-content">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                        isCompleted
                          ? 'bg-success-600 border-success-600 text-white'
                          : isActive
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'bg-gray-100 border-gray-300 text-gray-500'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="hidden md:block">
                      <p className={cn(
                        'text-sm font-medium',
                        isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-300'
                      )}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      'hidden md:block w-16 h-0.5 mx-4',
                      isCompleted ? 'bg-success-600' : 'bg-gray-300'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card-glass">
          <div className="card-content">
            {/* Step 1: Payee Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <CreditCard className="w-6 h-6 text-primary-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Payee Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="payeeName" className="label">
                      Payee Name *
                    </label>
                    <input
                      id="payeeName"
                      type="text"
                      className={cn('input', errors.payeeName && 'input-error')}
                      placeholder="John Doe"
                      {...register('payeeName', {
                        required: 'Payee name is required',
                        minLength: {
                          value: 2,
                          message: 'Name must be at least 2 characters',
                        },
                        pattern: {
                          value: /^[a-zA-Z\s]+$/,
                          message: 'Name can only contain letters and spaces',
                        },
                      })}
                    />
                    {errors.payeeName && (
                      <p className="mt-1 text-sm text-error-600">
                        {errors.payeeName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="payeeEmail" className="label">
                      Payee Email *
                    </label>
                    <input
                      id="payeeEmail"
                      type="email"
                      className={cn('input', errors.payeeEmail && 'input-error')}
                      placeholder="john.doe@example.com"
                      {...register('payeeEmail', {
                        required: 'Payee email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                    />
                    {errors.payeeEmail && (
                      <p className="mt-1 text-sm text-error-600">
                        {errors.payeeEmail.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="payeeAddress" className="label">
                    Payee Address *
                  </label>
                  <textarea
                    id="payeeAddress"
                    rows={3}
                    className={cn('input', errors.payeeAddress && 'input-error')}
                    placeholder="123 Main Street, City, State, Country"
                    {...register('payeeAddress', {
                      required: 'Payee address is required',
                      minLength: {
                        value: 10,
                        message: 'Address must be at least 10 characters',
                      },
                    })}
                  />
                  {errors.payeeAddress && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.payeeAddress.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Bank Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Building2 className="w-6 h-6 text-primary-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Bank Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="payeeBank" className="label">
                      Bank Name *
                    </label>
                    <input
                      id="payeeBank"
                      type="text"
                      className={cn('input', errors.payeeBank && 'input-error')}
                      placeholder="Chase Bank"
                      {...register('payeeBank', {
                        required: 'Bank name is required',
                        minLength: {
                          value: 2,
                          message: 'Bank name must be at least 2 characters',
                        },
                      })}
                    />
                    {errors.payeeBank && (
                      <p className="mt-1 text-sm text-error-600">
                        {errors.payeeBank.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="swiftCode" className="label">
                      SWIFT Code *
                    </label>
                    <input
                      id="swiftCode"
                      type="text"
                      className={cn('input', errors.swiftCode && 'input-error')}
                      placeholder="CHASUS33"
                      {...register('swiftCode', {
                        required: 'SWIFT code is required',
                        pattern: {
                          value: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
                          message: 'Invalid SWIFT code format',
                        },
                      })}
                    />
                    {errors.swiftCode && (
                      <p className="mt-1 text-sm text-error-600">
                        {errors.swiftCode.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="accountNumber" className="label">
                      Account Number *
                    </label>
                    <input
                      id="accountNumber"
                      type="text"
                      className={cn('input', errors.accountNumber && 'input-error')}
                      placeholder="1234567890"
                      {...register('accountNumber', {
                        required: 'Account number is required',
                        pattern: {
                          value: /^[0-9]{8,20}$/,
                          message: 'Account number must be 8-20 digits',
                        },
                      })}
                    />
                    {errors.accountNumber && (
                      <p className="mt-1 text-sm text-error-600">
                        {errors.accountNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="country" className="label">
                      Country *
                    </label>
                    <select
                      id="country"
                      className={cn('input', errors.country && 'input-error')}
                      {...register('country', {
                        required: 'Country is required',
                      })}
                    >
                      <option value="">Select a country</option>
                      <option value="ZA">South Africa</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="AU">Australia</option>
                      <option value="JP">Japan</option>
                      <option value="SG">Singapore</option>
                      <option value="IN">India</option>
                      <option value="BR">Brazil</option>
                    </select>
                    {errors.country && (
                      <p className="mt-1 text-sm text-error-600">
                        {errors.country.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment Amount */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <DollarSign className="w-6 h-6 text-primary-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="amount" className="label">
                      Amount ({selectedCurrency}) *
                    </label>
                    <input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="1"
                      className={cn('input', errors.amount && 'input-error')}
                      placeholder="1000.00"
                      {...register('amount', {
                        required: 'Amount is required',
                        min: {
                          value: 1,
                          message: 'Amount must be at least 1',
                        },
                        max: {
                          value: 1000000,
                          message: 'Amount cannot exceed 1,000,000',
                        },
                      })}
                    />
                    {errors.amount && (
                      <p className="mt-1 text-sm text-error-600">
                        {errors.amount.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="currency" className="label">
                      Currency
                    </label>
                    <select
                      id="currency"
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      {...register('currency', { value: 'ZAR' })}
                    >
                      <option value="ZAR">🇿🇦 ZAR - South African Rand</option>
                      <option value="USD">🇺🇸 USD - US Dollar</option>
                      <option value="EUR">🇪🇺 EUR - Euro</option>
                      <option value="GBP">🇬🇧 GBP - British Pound</option>
                      <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
                      <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
                      <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
                      <option value="CHF">🇨🇭 CHF - Swiss Franc</option>
                      <option value="CNY">🇨🇳 CNY - Chinese Yuan</option>
                      <option value="SEK">🇸🇪 SEK - Swedish Krona</option>
                      <option value="NZD">🇳🇿 NZD - New Zealand Dollar</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="purpose" className="label">
                    Payment Purpose
                  </label>
                  <textarea
                    id="purpose"
                    rows={3}
                    className="input"
                    placeholder="Describe the purpose of this payment..."
                    {...register('purpose')}
                  />
                </div>

                <div>
                  <label htmlFor="reference" className="label">
                    Payment Reference
                  </label>
                  <input
                    id="reference"
                    type="text"
                    className="input"
                    placeholder="e.g., Invoice #12345, Order #ABC123"
                    {...register('reference', {
                      maxLength: {
                        value: 100,
                        message: 'Reference cannot exceed 100 characters',
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9\s\-_#]+$/,
                        message: 'Reference can only contain letters, numbers, spaces, hyphens, underscores, and #',
                      },
                    })}
                  />
                  {errors.reference && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.reference.message}
                    </p>
                  )}
                </div>

                {/* Security Notice */}
                <div className="alert alert-info">
                  <Shield className="w-5 h-5" />
                  <div>
                    <h4 className="font-medium">Security Notice</h4>
                    <p className="text-sm mt-1">
                      Your payment will be processed securely with bank-level encryption. 
                      All transactions are monitored for fraud protection.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="card-footer">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="btn btn-outline btn-md text-white dark:text-white border-white dark:border-white hover:bg-white hover:text-gray-900 dark:hover:bg-white dark:hover:text-gray-900"
              >
                Previous
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary btn-md"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || submitPaymentMutation.isPending}
                  className="btn btn-primary btn-md"
                >
                  {isSubmitting || submitPaymentMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    'Submit Payment'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;