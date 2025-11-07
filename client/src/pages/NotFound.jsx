import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">404</div>
          <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Page Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <Home className="w-5 h-5 mr-2" />
            <span>Go to Dashboard</span>
          </Link>
          
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-600 dark:text-gray-400">
          <p>
            If you believe this is an error, please{' '}
            <a 
              href="mailto:support@securepayments.com" 
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline font-medium"
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;