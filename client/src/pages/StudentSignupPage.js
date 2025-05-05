import React, { useState, useContext, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

function StudentSignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [school, setSchool] = useState('');
  const [program, setProgram] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [programs, setPrograms] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const schools = useMemo(() => ({
    "École Centrale School of Engineering(ECSE)": {
      "B.Tech": [
        "AI (Artificial Intelligence)",
        "Biotechnology",
        "Computational Biology",
        "CSE (Computer Science and Engineering)",
        "Civil Engineering",
        "CM (Computation and Mathematics)",
        "ECM (Electronics and Computer Engineering)",
        "Mechanical Engineering (ME)",
        "Mechatronics (MT)",
        "Nanotechnology",
        "ECE (Electronics and Communication Engineering)",
        "Aerospace Engineering",
        "Electronic and Computer Engineering",
        "VLSI Design and Technology"
      ],
      "5 Year Integrated M.Tech": [
        "Computer Science and Engineering",
        "Biotechnology"
      ],
      "M.Tech": [
        "Autonomous Electric Vehicles (A-EV's)",
        "Computer-Aided Structural Engineering",
        "AI and Data Science",
        "Systems Engineering",
        "VLSI Design and Embedded Systems",
        "Smart Grid and Energy Storage Technologies",
        "Robotics",
        "Transportation Engineering",
        "Computational Mechanics",
        "Biomedical Data Science"
      ],
      "Ph.D.": [
        "Physics",
        "Civil Engineering",
        "Electrical and Computer Engineering",
        "Mathematics",
        "Mechanical and Aerospace Engineering",
        "Humanities and Social Sciences",
        "Life Sciences"
      ]
    },
    "School of Management(SOM)": {
      "BBA": [
        "BBA Applied Economics and Finance",
        "BBA Digital Technologies",
        "BBA Computational Business Analytics"
      ],
      "MBA": ["MBA"],
      "Ph.D.": [
        "Ph.D. in Economics",
        "Ph.D. in Finance",
        "Ph.D. in Decision Sciences",
        "Ph.D. in Marketing",
        "Ph.D. in Management (Strategy & Entrepreneurship, Organisational Behaviour & HRM)",
        "Ph.D. in Information Science and Technology"
      ]
    },
    "School Of Law(SOL)": {
      "BA.LL.B.": [
        "Corporate Law",
        "Business Laws",
        "Criminal Law",
        "International Law",
        "Intellectual Property Law",
        "Civil and Private Law",
        "Public Law"
      ],
      "B.B.A.LL.B.": [
        "Corporate Law",
        "Business Laws",
        "Criminal Law",
        "International Law",
        "Intellectual Property Law",
        "Civil and Private Law",
        "Public Law"
      ],
      "3-Years LL.B.(Hons.)": [
        "Corporate Law",
        "Business Laws",
        "Criminal Law",
        "International Law",
        "Intellectual Property Law",
        "Civil and Private Law",
        "Public Law"
      ],
      "B.Tech.-LL.B.(Hons.)": ["Integrated Dual-Degree"],
      "Ph.D.": [
        "Constitutional Law and Administrative Law",
        "Corporate Law and Business Law",
        "International Law",
        "Technology Law",
        "Air and Space Law",
        "Maritime and Defence Law"
      ]
    },
    "Indira Mahindra School of Education(IMSOE)": {
      "Master of Arts (M.A.) in Education": ["M.A. in Education"],
      "Ph.D.": [
        "School Education",
        "Higher Education",
        "Sociology of Education",
        "Educational Leadership and Management",
        "Psychology of Education",
        "Educational Innovations",
        "History of Education",
        "Economics of Education",
        "Teacher Education",
        "Educational Policy Studies",
        "Political Contexts of Education",
        "Curriculum and Pedagogical Studies",
        "Technology and Education"
      ]
    },
    "School of Digital Media and Communication(SDMC)": {
      "B.Tech (Computation and Media)": ["Computation and Media"],
      "Bachelor of Journalism and Mass Communication": ["Journalism and Mass Communication"],
      "MA in Journalism and Mass Communication": ["Journalism and Mass Communication"],
      "Ph.D.": [
        "Journalism Studies",
        "Media Studies",
        "Mass Communication",
        "Film and Television Studies",
        "Strategic Communication",
        "Media and Communication Management",
        "History, Technology and Systems of Media and Communication",
        "Ethics, Policies and Laws of Mediated Communication",
        "Human and Machine-Interface Communication"
      ]
    },
    "School of Design Innovation(SODI)": {
      "B.Des in Design Innovation": ["Design Innovation"],
      "M.Des in Design Innovation": ["Design Innovation"],
      "Ph.D.": [
        "Design Thinking",
        "Online and Scalable Design Education",
        "Design for Sustainability",
        "Design for Empathy in HCI"
      ]
    },
    "School of Hospitality Management(SOHM)": {
      "4-Yr B.Sc.(Hons.) Culinary and Hospitality Management": ["Culinary and Hospitality Management"]
    }
  }), []);

  // Update programs when school changes
  useEffect(() => {
    if (school) {
      const availablePrograms = Object.keys(schools[school] || {});
      setPrograms(availablePrograms);
      setProgram('');
      setSpecialization('');
    } else {
      setPrograms([]);
      setProgram('');
      setSpecialization('');
    }
  }, [school, schools]);

  // Update specializations when program changes
  useEffect(() => {
    if (school && program) {
      const availableSpecializations = schools[school][program] || [];
      setSpecializations(availableSpecializations);
      setSpecialization('');
    } else {
      setSpecializations([]);
      setSpecialization('');
    }
  }, [school, program, schools]);

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

    if (!school || !program || !specialization) {
      return setError('Please select your school, program, and specialization');
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Test server connection first
      console.log('Testing server connection before signup...');
      
      const result = await signup(email, password, {
        name,
        rollNumber,
        dateOfBirth,
        school,
        program,
        specialization,
        role: 'student'
      });
      
      console.log('Signup successful:', result);
      navigate('/');
    } catch (err) {
      console.error('Signup error:', err);
      
      if (err.message?.includes('server')) {
        setError('Server connection error: Make sure the server is running on port 9000.');
      } else if (err.response?.data?.message) {
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
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">Student Registration</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Mahindra University's student community
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
                placeholder="John Doe"
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
              <label htmlFor="roll-number" className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
              <input
                id="roll-number"
                name="rollNumber"
                type="text"
                required
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="MU22XXXX"
              />
            </div>
            
            <div>
              <label htmlFor="date-of-birth" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                id="date-of-birth"
                name="dateOfBirth"
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">School</label>
              <select
                id="school"
                name="school"
                required
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="">Select your school</option>
                {Object.keys(schools).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-1">Program</label>
              <select
                id="program"
                name="program"
                required
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                disabled={!school}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">Select your program</option>
                {programs.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <select
                id="specialization"
                name="specialization"
                required
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                disabled={!program}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">Select your specialization</option>
                {specializations.map((s) => (
                  <option key={s} value={s}>{s}</option>
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

export default StudentSignupPage;
