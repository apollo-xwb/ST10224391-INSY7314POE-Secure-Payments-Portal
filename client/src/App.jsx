import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PaymentForm from './pages/PaymentForm';
import PaymentHistory from './pages/PaymentHistory';
import PaymentDetails from './pages/PaymentDetails';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Employee Pages
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeePayments from './pages/EmployeePayments';
import EmployeePaymentDetails from './pages/EmployeePaymentDetails';
import EmployeeCustomers from './pages/EmployeeCustomers';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <Router>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Employee routes */}
                <Route path="/employee/login" element={<EmployeeLogin />} />
                <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
                <Route path="/employee/payments" element={<EmployeePayments />} />
                <Route path="/employee/payments/:id" element={<EmployeePaymentDetails />} />
                <Route path="/employee/customers" element={<EmployeeCustomers />} />
                
                {/* Protected routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="payment/new" element={<PaymentForm />} />
                  <Route path="payments" element={<PaymentHistory />} />
                  <Route path="payments/:id" element={<PaymentDetails />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
                
                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              
              {/* Toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
              </div>
            </Router>
          </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
