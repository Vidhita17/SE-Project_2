import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import axios from 'axios';

const StudentDashboard = () => {
  const { currentUser, authToken } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({});
  const [applications, setApplications] = useState([]);

  // Form states for profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: '',
    rollNumber: '',
    program: '',
    specialization: '',
    school: '',
    github: '',
    linkedin: ''
  });

  // State for resume upload
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch profile data
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch profile
        const profileResponse = await axios.get(`http://localhost:9000/api/students/${currentUser.id}/profile`, {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });
        
        setProfile(profileResponse.data);
        
        // Initialize edited profile with current data
        setEditedProfile({
          name: profileResponse.data.name || '',
          rollNumber: profileResponse.data.rollNumber || '',
          program: profileResponse.data.program || '',
          specialization: profileResponse.data.specialization || '',
          school: profileResponse.data.school || '',
          github: profileResponse.data.github || '',
          linkedin: profileResponse.data.linkedin || ''
        });
        
        // If on applications tab, fetch applications
        if (activeTab === 'applications') {
          const applicationsResponse = await axios.get(`http://localhost:9000/api/students/${currentUser.id}/applications`, {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          });
          
          setApplications(applicationsResponse.data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [currentUser, authToken, activeTab]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle profile edit changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle resume file selection
  const handleResumeChange = (e) => {
    if (e.target.files.length > 0) {
      setResumeFile(e.target.files[0]);
    }
  };

  // Submit profile updates
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      const formData = new FormData();
      
      // Add profile fields to formData
      Object.keys(editedProfile).forEach(key => {
        formData.append(key, editedProfile[key]);
      });
      
      // Add resume if selected
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }
      
      const response = await axios.put(
        `http://localhost:9000/api/students/${currentUser.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${authToken}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      // Update profile state with response data
      setProfile(response.data);
      setIsEditingProfile(false);
      setUploadProgress(0);
      setResumeFile(null);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    }
  };

  // Withdraw application
  const handleWithdrawApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    
    try {
      await axios.delete(
        `http://localhost:9000/api/students/${currentUser.id}/applications/${applicationId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      // Remove application from state
      setApplications(applications.filter(app => app.id !== applicationId));
      
    } catch (err) {
      console.error('Error withdrawing application:', err);
      setError('Failed to withdraw application. Please try again.');
    }
  };

  if (loading && Object.keys(profile).length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4">
        <div className="mb-8">
          <h2 className="text-xl font-bold">Student Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">{profile.name}</p>
        </div>
        
        <nav>
          <button 
            onClick={() => handleTabChange('profile')}
            className={`w-full text-left py-2 px-4 rounded mb-2 ${activeTab === 'profile' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          >
            Profile
          </button>
          <button 
            onClick={() => handleTabChange('applications')}
            className={`w-full text-left py-2 px-4 rounded mb-2 ${activeTab === 'applications' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          >
            My Applications
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Profile</h1>
              
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                >
                  Edit Profile
                </button>
              )}
            </div>
            
            {!isEditingProfile ? (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                      <p className="mb-2"><span className="font-medium">Name:</span> {profile.name}</p>
                      <p className="mb-2"><span className="font-medium">Email:</span> {profile.email}</p>
                      <p className="mb-2"><span className="font-medium">Roll Number:</span> {profile.rollNumber}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Academic Information</h3>
                      <p className="mb-2"><span className="font-medium">School:</span> {profile.school}</p>
                      <p className="mb-2"><span className="font-medium">Program:</span> {profile.program}</p>
                      <p className="mb-2"><span className="font-medium">Specialization:</span> {profile.specialization}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Social Links</h3>
                      {profile.github && (
                        <p className="mb-2">
                          <span className="font-medium">GitHub:</span>{' '}
                          <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {profile.github}
                          </a>
                        </p>
                      )}
                      {profile.linkedin && (
                        <p className="mb-2">
                          <span className="font-medium">LinkedIn:</span>{' '}
                          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {profile.linkedin}
                          </a>
                        </p>
                      )}
                      {!profile.github && !profile.linkedin && (
                        <p className="text-gray-500">No social links added yet.</p>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Resume</h3>
                      {profile.resumeUrl ? (
                        <a 
                          href={`http://localhost:9000/api/students/${currentUser.id}/resume`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded inline-block"
                        >
                          View Resume
                        </a>
                      ) : (
                        <p className="text-gray-500">No resume uploaded yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-6">
                  <form onSubmit={handleProfileSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2" htmlFor="name">
                            Name
                          </label>
                          <input 
                            type="text" 
                            id="name" 
                            name="name"
                            value={editedProfile.name}
                            onChange={handleProfileChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2" htmlFor="email">
                            Email (Read Only)
                          </label>
                          <input 
                            type="email"
                            id="email"
                            value={profile.email}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                            readOnly
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2" htmlFor="rollNumber">
                            Roll Number
                          </label>
                          <input 
                            type="text" 
                            id="rollNumber" 
                            name="rollNumber"
                            value={editedProfile.rollNumber}
                            onChange={handleProfileChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Academic Information</h3>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2" htmlFor="school">
                            School
                          </label>
                          <input 
                            type="text" 
                            id="school" 
                            name="school"
                            value={editedProfile.school}
                            onChange={handleProfileChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2" htmlFor="program">
                            Program
                          </label>
                          <input 
                            type="text" 
                            id="program" 
                            name="program"
                            value={editedProfile.program}
                            onChange={handleProfileChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2" htmlFor="specialization">
                            Specialization
                          </label>
                          <input 
                            type="text" 
                            id="specialization" 
                            name="specialization"
                            value={editedProfile.specialization}
                            onChange={handleProfileChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Social Links</h3>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2" htmlFor="github">
                            GitHub Profile URL
                          </label>
                          <input 
                            type="url" 
                            id="github" 
                            name="github"
                            value={editedProfile.github}
                            onChange={handleProfileChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://github.com/yourusername"
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2" htmlFor="linkedin">
                            LinkedIn Profile URL
                          </label>
                          <input 
                            type="url" 
                            id="linkedin" 
                            name="linkedin"
                            value={editedProfile.linkedin}
                            onChange={handleProfileChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://linkedin.com/in/yourusername"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Resume</h3>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2" htmlFor="resume">
                            Upload Resume (PDF recommended)
                          </label>
                          <input 
                            type="file" 
                            id="resume" 
                            name="resume"
                            onChange={handleResumeChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            accept=".pdf,.doc,.docx"
                          />
                          {resumeFile && (
                            <p className="mt-2 text-sm text-gray-600">Selected: {resumeFile.name}</p>
                          )}
                          {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                          )}
                        </div>
                        
                        {profile.resumeUrl && (
                          <p className="text-sm text-gray-600">
                            Current resume: <a 
                              href={`http://localhost:9000/api/students/${currentUser.id}/resume`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-4 mt-6">
                      <button 
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-md"
                      >
                        Save Changes
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-6 rounded-md"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">My Applications</h1>
            
            {applications.length === 0 ? (
              <div className="bg-white shadow-md rounded-lg p-6 text-center">
                <p className="text-gray-500">You haven't applied to any projects yet.</p>
                <button
                  onClick={() => window.location.href = '/projects'}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                >
                  Browse Projects
                </button>
              </div>
            ) : (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Applied</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {applications.map(application => (
                      <tr key={application.id}>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium text-gray-900">{application.projectTitle}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">
                          {application.facultyName}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${application.status === 'Applied' ? 'bg-yellow-100 text-yellow-800' : 
                            application.status === 'Shortlisted' ? 'bg-blue-100 text-blue-800' :
                            application.status === 'Selected' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'}`}
                          >
                            {application.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(application.appliedDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                          {application.status === 'Applied' && (
                            <button
                              onClick={() => handleWithdrawApplication(application.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Withdraw
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;