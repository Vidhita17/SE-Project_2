import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

function FacultySignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [designation, setDesignation] = useState('');
  const [school, setSchool] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const schools = [
    { value: "ECSE", label: "ECSE - School of Computer Science & Engineering" },
    { value: "SOL", label: "SOL - School of Law" },
    { value: "SOM", label: "SOM - School of Management" },
    { value: "IMSOE", label: "IMSOE - Indira Mahindra School of Education" },
    { value: "SDMC", label: "SDMC - School of Design, Media & Creative Arts" },
    { value: "SODI", label: "SODI - School of Design & Innovation" },
    { value: "SOHM", label: "SOHM - School of Humanities & Mathematics" },
    { value: "CEI", label: "CEI - Center for Entrepreneurship & Innovation" },
    { value: "CEE", label: "CEE - Center for Executive Education" },
    { value: "CLS", label: "CLS - Center for Liberal Studies" },
    { value: "CS", label: "CS - Center for Sustainability" }
  ];

  const designations = [
    "Professor",
    "Associate Professor",
    "Assistant Professor",
    "Visiting Faculty",
    "Adjunct Professor",
    "Research Professor",
    "Emeritus Professor",
    "Dean",
    "Head of Department"
  ];

  const validateEmail = (email) => {
    const regex = /@mahindrauniversity\.edu\.in$/;
    return regex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (password.length < 8) {
      return setError('Password must be at least 8 characters long');
    }
    
    if (!validateEmail(email)) {
      return setError('Email must be a valid Mahindra University email (@mahindrauniversity.edu.in)');
    }

    if (!school) {
      return setError('Please select your school or department');
    }

    if (!designation) {
      return setError('Please select your designation');
    }
    
    try {
      setError('');
      setLoading(true);
      
      console.log('Submitting faculty signup with data:', {
        email,
        name,
        designation,
        school,
        role: 'faculty'
      });
      
      const result = await signup(email, password, {
        name,
        designation,
        school,
        role: 'faculty'
      });
      
      console.log('Signup successful:', result);
      navigate('/');
    } catch (err) {
      console.error('Signup error:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to create an account. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">Faculty Registration</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Mahindra University's academic community
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Dr. John Doe"
              />
            </div>
            
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="john.doe@mahindrauniversity.edu.in"
              />
              <p className="mt-1 text-xs text-gray-500">Must be a valid Mahindra University email address</p>
            </div>
            
            <div>
              <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
              <select
                id="designation"
                name="designation"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="">Select your designation</option>
                {designations.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">School/Department</label>
              <select
                id="school"
                name="school"
                required
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="">Select your school/department</option>
                {schools.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FacultySignupPage;
