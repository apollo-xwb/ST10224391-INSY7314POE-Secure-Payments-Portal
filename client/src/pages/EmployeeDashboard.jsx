import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { CheckCircle } from 'lucide-react';
import employeeApi from '../services/employeeApi';
import SafePayLogo from '../assets/SafePay.png';

function EmployeeDashboard() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const empCookie = Cookies.get('employee');
        if (empCookie) {
          setEmployee(JSON.parse(empCookie));
        }

        const statsResponse = await employeeApi.getPaymentStats();
        const newStats = statsResponse.data.stats;
        
        // Only update state if data actually changed to prevent flashing
        setStats(prevStats => {
          if (!prevStats) return newStats;
          
          // Compare stats to see if anything changed
          const hasChanged = 
            prevStats.totalPayments !== newStats.totalPayments ||
            prevStats.totalCompletedAmount !== newStats.totalCompletedAmount ||
            prevStats.statusCounts.pending !== newStats.statusCounts.pending ||
            prevStats.statusCounts.processing !== newStats.statusCounts.processing ||
            prevStats.statusCounts.completed !== newStats.statusCounts.completed ||
            prevStats.statusCounts.failed !== newStats.statusCounts.failed ||
            prevStats.statusCounts.cancelled !== newStats.statusCounts.cancelled;
          
          // Only update if data changed
          return hasChanged ? newStats : prevStats;
        });
      } catch (error) {
        // Don't show error toast on every refresh, only on initial load
        if (isLoading) {
          toast.error('Failed to load dashboard data');
          navigate('/employee/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Load data immediately
    loadData();

    // Set up polling for real-time updates every 10 seconds
    const interval = setInterval(() => {
      loadData();
    }, 10000); // Refresh every 10 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [navigate, isLoading]);

  const handleLogout = async () => {
    try {
      await employeeApi.logout();
      Cookies.remove('employeeAccessToken');
      Cookies.remove('employeeRefreshToken');
      Cookies.remove('employee');
      toast.success('Logged out successfully');
      navigate('/employee/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src={SafePayLogo} 
                alt="SafePay" 
                className="h-10 w-auto"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Employee Portal
                  </h1>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome, {employee?.full_name} ({employee?.department})
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Payments</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalPayments}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                ${stats.totalCompletedAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</h3>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                {stats.statusCounts.pending}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Processing</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {stats.statusCounts.processing}
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/employee/payments')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-left"
            >
              <div className="font-semibold">View All Payments</div>
              <div className="text-sm opacity-90">Manage customer payments</div>
            </button>
            <button
              onClick={() => navigate('/employee/customers')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-left"
            >
              <div className="font-semibold">View Customers</div>
              <div className="text-sm opacity-90">Browse customer list</div>
            </button>
            <button
              onClick={() => navigate('/employee/payments?status=pending')}
              className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-left"
            >
              <div className="font-semibold">Pending Payments</div>
              <div className="text-sm opacity-90">Review pending transactions</div>
            </button>
          </div>
        </div>

        {/* Status Summary */}
        {stats && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Payment Status Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.statusCounts.completed}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.statusCounts.pending}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.statusCounts.processing}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.statusCounts.failed}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {stats.statusCounts.cancelled}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cancelled</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default EmployeeDashboard;

