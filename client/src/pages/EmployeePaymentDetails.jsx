import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';
import employeeApi from '../services/employeeApi';
import SafePayLogo from '../assets/SafePay.png';

function EmployeePaymentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');

  const loadPayment = useCallback(async () => {
    try {
      const response = await employeeApi.getPaymentById(id);
      setPayment(response.data.payment);
      setNewStatus(response.data.payment.status);
      setIsLoading(false);
    } catch (error) {
      toast.error('Failed to load payment details');
      navigate('/employee/payments');
    }
  }, [id, navigate]);

  useEffect(() => {
    // Load payment immediately
    loadPayment();

    // Set up polling for real-time updates every 10 seconds
    const interval = setInterval(() => {
      loadPayment();
    }, 10000); // Refresh every 10 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [loadPayment]);

  const handleStatusUpdate = async () => {
    try {
      await employeeApi.updatePaymentStatus(id, newStatus, notes);
      toast.success('Payment status updated');
      loadPayment();
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!payment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src={SafePayLogo} 
                alt="SafePay" 
                className="h-10 w-auto"
              />
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Payment Details
                </h1>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </div>
            <button
              onClick={() => navigate('/employee/payments')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Payments
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                User Reference
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {payment.reference || 'Not provided'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Transaction ID
              </label>
              <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                {payment.payment_reference}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Status
              </label>
              <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${statusColors[payment.status]}`}>
                {payment.status}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Amount
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {payment.currency} {payment.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Customer
              </label>
              <p className="text-gray-900 dark:text-white">
                {payment.user_id?.full_name || 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Payee Name
              </label>
              <p className="text-gray-900 dark:text-white">{payment.payee_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Payee Account Number
              </label>
              <p className="text-gray-900 dark:text-white">{payment.payee_account_number}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Created Date
              </label>
              <p className="text-gray-900 dark:text-white">
                {new Date(payment.createdAt).toLocaleString()}
              </p>
            </div>
            {payment.notes && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Notes
                </label>
                <p className="text-gray-900 dark:text-white">{payment.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Update Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Update Payment Status
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Current status: <span className="font-semibold">{payment.status}</span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="Add notes about this status change..."
              />
            </div>
            <button
              onClick={handleStatusUpdate}
              disabled={newStatus === payment.status}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update Status {newStatus !== payment.status && `(${payment.status} → ${newStatus})`}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EmployeePaymentDetails;

