import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

function StudentDashboard() {
  const { currentUser, authToken } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchApplications = async () => {
      if (!currentUser || !authToken) return;
      
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:9000/api/students/${currentUser.id}/applications`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }
        );
        
        setApplications(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load your applications. Please try again.');
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, [currentUser, authToken]);
  
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
      
      // Update applications list
      setApplications(applications.filter(app => app.id !== applicationId));
      
    } catch (err) {
      console.error('Error withdrawing application:', err);
      setError('Failed to withdraw application. Please try again.');
    }
  };
  
  // Helper to render application status badges
  const renderStatusBadge = (status) => {
    const statusClasses = {
      'Applied': 'bg-yellow-100 text-yellow-800',
      'Shortlisted': 'bg-blue-100 text-blue-800',
      'Selected': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Applications</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 mb-4">You haven't applied to any projects yet.</p>
          <Link to="/projects" className="text-blue-600 hover:text-blue-800 font-medium">
            Browse Available Projects
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map(application => (
            <div key={application.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-5 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{application.projectTitle}</h2>
                    <p className="text-sm text-gray-600">with {application.facultyName}</p>
                  </div>
                  {renderStatusBadge(application.status)}
                </div>
              </div>
              
              <div className="p-5">
                <div className="space-y-3 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Applied on:</span> {new Date(application.appliedDate).toLocaleDateString()}
                  </p>
                  
                  {application.coverLetter && (
                    <div>
                      <p className="font-medium text-gray-700">Your Cover Letter:</p>
                      <p className="text-gray-600 mt-1 line-clamp-3">{application.coverLetter}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-5 flex justify-between items-center">
                  <Link 
                    to={`/projects/${application.projectId}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Project
                  </Link>
                  
                  {application.status === 'Applied' && (
                    <button
                      onClick={() => handleWithdrawApplication(application.id)}
                      className="bg-red-100 text-red-700 hover:bg-red-200 text-sm py-1 px-3 rounded transition-colors"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
