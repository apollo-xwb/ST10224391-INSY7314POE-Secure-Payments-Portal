import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { 
  CreditCard, 
  PlusCircle, 
  History, 
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import api from '../services/api';
import CurrencyFlag from '../components/CurrencyFlag';

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch payment statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: async () => {
      const response = await api.get('/payments/stats');
      return response.data.data;
    },
  });

  // Fetch recent payments
  const { data: recentPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['recent-payments'],
    queryFn: async () => {
      const response = await api.get('/payments?limit=5');
      return response.data.data;
    },
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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-4 md:p-6 text-white">
          <h1 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">
            Welcome back, {user?.full_name}! 👋
          </h1>
          <p className="text-primary-100 text-sm md:text-base">
            Manage your international payments securely and efficiently.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/payment/new"
          className="card-glass hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105"
        >
          <div className="card-content flex items-center justify-center min-h-[120px]">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-100/80 dark:bg-primary-900/80 rounded-lg flex items-center justify-center group-hover:bg-primary-200/80 dark:group-hover:bg-primary-800/80 transition-colors backdrop-blur-sm">
                <PlusCircle className="w-6 h-6 text-primary-600 dark:text-primary-300" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">New Payment</h3>
                <p className="text-sm text-gray-600 dark:text-gray-200">Create a new international payment</p>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/payments"
          className="card-glass hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105"
        >
          <div className="card-content flex items-center justify-center min-h-[120px]">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-secondary-100/80 dark:bg-secondary-900/80 rounded-lg flex items-center justify-center group-hover:bg-secondary-200/80 dark:group-hover:bg-secondary-800/80 transition-colors backdrop-blur-sm">
                <History className="w-6 h-6 text-secondary-600 dark:text-secondary-300" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Payment History</h3>
                <p className="text-sm text-gray-600 dark:text-gray-200">View all your transactions</p>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/profile"
          className="card-glass hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105"
        >
          <div className="card-content flex items-center justify-center min-h-[120px]">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-success-100/80 dark:bg-success-900/80 rounded-lg flex items-center justify-center group-hover:bg-success-200/80 dark:group-hover:bg-success-800/80 transition-colors backdrop-blur-sm">
                <CreditCard className="w-6 h-6 text-success-600 dark:text-success-300" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Account Settings</h3>
                <p className="text-sm text-gray-600 dark:text-gray-200">Manage your profile</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="card-content">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-glass">
            <div className="card-content flex items-center justify-center min-h-[120px]">
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-200">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalPayments || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100/80 dark:bg-primary-900/80 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <CreditCard className="w-6 h-6 text-primary-600 dark:text-primary-300" />
                </div>
              </div>
            </div>
          </div>

          <div className="card-glass">
            <div className="card-content flex items-center justify-center min-h-[120px]">
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-200">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    R{stats?.totalAmount?.toLocaleString() || '0'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-300">Total in ZAR</p>
                </div>
                <div className="w-12 h-12 bg-success-100/80 dark:bg-success-900/80 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <DollarSign className="w-6 h-6 text-success-600 dark:text-success-300" />
                </div>
              </div>
            </div>
          </div>

          <div className="card-glass">
            <div className="card-content flex items-center justify-center min-h-[120px]">
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-200">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.pendingPayments || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning-100/80 dark:bg-warning-900/80 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Clock className="w-6 h-6 text-warning-600 dark:text-warning-300" />
                </div>
              </div>
            </div>
          </div>

          <div className="card-glass">
            <div className="card-content flex items-center justify-center min-h-[120px]">
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-200">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.successRate || 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-success-100/80 dark:bg-success-900/80 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6 text-success-600 dark:text-success-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Payments */}
      <div className="card-glass">
        <div className="card-header">
          <h2 className="card-title text-gray-900 dark:text-white">Recent Payments</h2>
          <p className="card-description text-gray-600 dark:text-gray-200">
            Your latest international payment transactions
          </p>
        </div>
        <div className="card-content">
          {paymentsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : recentPayments?.length > 0 ? (
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(payment.status)}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {payment.payee_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        {payment.payee_bank_name} • {payment.payee_bank_country}
                      </p>
                    </div>
                  </div>
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
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No payments yet</p>
              <Link
                to="/payment/new"
                className="btn btn-primary"
              >
                Create Your First Payment
              </Link>
            </div>
          )}
        </div>
        {recentPayments?.length > 0 && (
          <div className="card-footer">
            <Link
              to="/payments"
              className="btn btn-primary btn-lg w-full text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
            >
              View All Payments
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;