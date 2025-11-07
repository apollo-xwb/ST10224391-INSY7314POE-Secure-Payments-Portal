import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  CreditCard
} from 'lucide-react';
import { cn } from '../utils/cn';
import api from '../services/api';
import CurrencyFlag from '../components/CurrencyFlag';

const PaymentHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', { search: searchTerm, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await api.get(`/payments?${params.toString()}`);
      return response.data.data;
    },
    refetchInterval: 15000, // Refetch every 15 seconds for real-time updates
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-error-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success-800 bg-success-100 dark:text-success-200 dark:bg-success-900/80';
      case 'pending':
        return 'text-warning-800 bg-warning-100 dark:text-warning-200 dark:bg-warning-900/80';
      case 'failed':
        return 'text-error-800 bg-error-100 dark:text-error-200 dark:bg-error-900/80';
      default:
        return 'text-gray-800 bg-gray-100 dark:text-gray-200 dark:bg-gray-800/80';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment History</h1>
        <p className="text-gray-600 dark:text-gray-300">View and manage your international payment transactions</p>
      </div>

      {/* Filters */}
      <div className="card-glass">
        <div className="card-content">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="card-glass">
        <div className="card-content p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : payments?.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {payments.map((payment) => (
                <div key={payment._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(payment.status)}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {payment.payee_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          {payment.payee_bank_name} • {payment.payee_bank_country}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-400">
                          {formatDate(payment.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white flex items-center justify-end gap-1">
                          <CurrencyFlag currency={payment.currency} className="w-4 h-4" />
                          {payment.currency === 'ZAR' ? 'R' : payment.currency} {payment.amount.toLocaleString()}
                        </p>
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getStatusColor(payment.status)
                          )}
                        >
                          {payment.status}
                        </span>
                      </div>
                      <Link
                        to={`/payments/${payment._id}`}
                        className="btn btn-ghost btn-sm"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'You haven\'t made any payments yet.'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link to="/payment/new" className="btn btn-primary">
                  Create Your First Payment
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;