import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  CreditCard,
  Building2,
  Globe,
  DollarSign,
  Calendar,
  User
} from 'lucide-react';
import { cn } from '../utils/cn';
import api from '../services/api';
import CurrencyFlag from '../components/CurrencyFlag';

const PaymentDetails = () => {
  const { id } = useParams();

  const { data: payment, isLoading, error } = useQuery({
    queryKey: ['payment', id],
    queryFn: async () => {
      const response = await api.get(`/payments/${id}`);
      return response.data.data;
    },
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-warning-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-error-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success-800 bg-success-100 border-success-300 dark:text-success-200 dark:bg-success-900/80 dark:border-success-700';
      case 'pending':
        return 'text-warning-800 bg-warning-100 border-warning-300 dark:text-warning-200 dark:bg-warning-900/80 dark:border-warning-700';
      case 'failed':
        return 'text-error-800 bg-error-100 border-error-300 dark:text-error-200 dark:bg-error-900/80 dark:border-error-700';
      default:
        return 'text-gray-800 bg-gray-100 border-gray-300 dark:text-gray-200 dark:bg-gray-800/80 dark:border-gray-600';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="card-glass">
            <div className="card-content">
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card-glass">
          <div className="card-content text-center">
            <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The payment you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link to="/payments" className="btn btn-primary">
              Back to Payments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/payments" className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Details</h1>
          <p className="text-gray-600 dark:text-gray-300">Transaction ID: {payment?._id || 'N/A'}</p>
        </div>
      </div>

      {/* Status Card */}
      <div className={cn('card-glass border-2', getStatusColor(payment?.status || 'pending'))}>
        <div className="card-content flex items-center justify-center min-h-[100px]">
          <div className="flex items-center space-x-3">
            {getStatusIcon(payment?.status || 'pending')}
            <div>
              <h2 className="text-lg font-semibold capitalize">
                Payment {payment?.status || 'pending'}
              </h2>
              <p className="text-sm opacity-75">
                {payment?.status === 'completed' && 'Payment has been successfully processed'}
                {payment?.status === 'pending' && 'Payment is being processed'}
                {payment?.status === 'failed' && 'Payment processing failed'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Information */}
        <div className="card-glass">
          <div className="card-header">
            <h3 className="card-title flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Payment Information</span>
            </h3>
          </div>
          <div className="card-content space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Amount</span>
              <span className="font-semibold text-lg dark:text-white flex items-center gap-1">
                <CurrencyFlag currency={payment.currency || 'ZAR'} className="w-5 h-5" />
                {payment.currency === 'ZAR' ? 'R' : payment.currency} {payment.amount?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Currency</span>
              <span className="font-medium dark:text-white flex items-center gap-1">
                <CurrencyFlag currency={payment.currency || 'ZAR'} className="w-4 h-4" />
                {payment.currency || 'ZAR'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-white">Purpose</span>
              <span className="font-medium text-right max-w-xs">
                {payment.purpose_of_payment || 'Not specified'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-white">Reference</span>
              <span className="font-medium text-right max-w-xs">
                {payment.reference || 'Not provided'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-white">Created</span>
              <span className="font-medium dark:text-white">{payment?.createdAt ? formatDate(payment.createdAt) : 'N/A'}</span>
            </div>
            {payment?.updatedAt && payment?.updatedAt !== payment?.createdAt && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-white">Last Updated</span>
                <span className="font-medium dark:text-white">{formatDate(payment.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payee Information */}
        <div className="card-glass">
          <div className="card-header">
            <h3 className="card-title flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Payee Information</span>
            </h3>
          </div>
          <div className="card-content space-y-4">
            <div>
              <span className="text-gray-600 dark:text-gray-300 block">Name</span>
              <span className="font-medium dark:text-white">{payment?.payee_name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-300 block">Email</span>
              <span className="font-medium dark:text-white">{payment?.payee_email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-300 block">Address</span>
              <span className="font-medium dark:text-white">{payment?.payee_bank_address || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Bank Information */}
        <div className="card-glass">
          <div className="card-header">
            <h3 className="card-title flex items-center space-x-2">
              <Building2 className="w-5 h-5" />
              <span>Bank Information</span>
            </h3>
          </div>
          <div className="card-content space-y-4">
            <div>
              <span className="text-gray-600 block">Bank Name</span>
              <span className="font-medium">{payment?.payee_bank_name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600 block">SWIFT Code</span>
              <span className="font-medium font-mono">{payment?.swift_code || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600 block">Account Number</span>
              <span className="font-medium font-mono">
                {payment?.payee_account_number ? payment.payee_account_number.replace(/(.{4})/g, '$1 ').trim() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="card-glass">
          <div className="card-header">
            <h3 className="card-title flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>Additional Details</span>
            </h3>
          </div>
          <div className="card-content space-y-4">
            <div>
              <span className="text-gray-600 block">Country</span>
              <span className="font-medium">{payment?.payee_bank_country || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600 block">Transaction ID</span>
              <span className="font-medium font-mono text-sm">{payment?._id || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-white block">Reference</span>
              <span className="font-medium">
                {payment?.reference || 'Not provided'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card-glass">
        <div className="card-footer">
          <div className="flex space-x-4">
            <Link to="/payments" className="btn btn-outline btn-lg text-white dark:text-white border-white dark:border-white hover:bg-white hover:text-gray-900 dark:hover:bg-white dark:hover:text-gray-900">
              Back to Payments
            </Link>
            <Link to="/payment/new" className="btn btn-primary btn-lg">
              Create New Payment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;