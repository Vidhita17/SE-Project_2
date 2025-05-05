import React from 'react';
import { Link } from 'react-router-dom';

function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">Create a new account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Mahindra University
          </p>
        </div>
        
        <div className="flex flex-col space-y-4 mt-8">
          <p className="text-center text-gray-700 font-medium">I am a:</p>
          
          <Link 
            to="/signup/student" 
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Student
          </Link>
          
          <Link 
            to="/signup/faculty" 
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            Faculty Member
          </Link>
          
          <div className="text-center mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
