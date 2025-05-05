import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

function FacultyDashboardApplications() {
  const { currentUser, authToken } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch faculty projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser || !authToken) return;
      
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:9000/api/faculty/${currentUser.id}`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }
        );
        
        // Filter out projects with applications
        const projectsWithApplications = response.data.projects.filter(
          project => project.applicationDetails && project.applicationDetails.length > 0
        );
        
        setProjects(projectsWithApplications);
        
        // If we have projects, select the first one by default
        if (projectsWithApplications.length > 0) {
          setSelectedProject(projectsWithApplications[0]);
          setApplications(projectsWithApplications[0].applicationDetails || []);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching faculty projects:', err);
        setError('Failed to load your projects. Please try again.');
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, [currentUser, authToken]);

  // Change selected project
  const handleProjectChange = (project) => {
    setSelectedProject(project);
    setApplications(project.applicationDetails || []);
  };

  // Update application status
  const handleUpdateStatus = async (applicationId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change this application status to "${newStatus}"?`)) return;
    
    try {
      await axios.put(
        `http://localhost:9000/api/faculty/${currentUser.id}/projects/${selectedProject._id}/applications/${applicationId}`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update application status in state
      setApplications(applications.map(app => 
        app._id === applicationId ? { ...app, status: newStatus } : app
      ));
      
      // Also update the project in the projects list
      setProjects(projects.map(project => {
        if (project._id === selectedProject._id) {
          const updatedApplications = project.applicationDetails.map(app => 
            app._id === applicationId ? { ...app, status: newStatus } : app
          );
          return { ...project, applicationDetails: updatedApplications };
        }
        return project;
      }));
      
      // Update selected project
      setSelectedProject(prev => ({
        ...prev,
        applicationDetails: prev.applicationDetails.map(app => 
          app._id === applicationId ? { ...app, status: newStatus } : app
        )
      }));
      
    } catch (err) {
      console.error('Error updating application status:', err);
      setError('Failed to update application status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">No Applications</h2>
        <p className="text-gray-600 mb-4">You haven't received any applications for your projects yet.</p>
        <Link to="/projects" className="text-blue-600 hover:text-blue-800 font-medium">
          View Your Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Project Applications</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Project Selection Sidebar */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Your Projects</h2>
          <div className="space-y-2">
            {projects.map(project => (
              <button
                key={project._id}
                onClick={() => handleProjectChange(project)}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  selectedProject && selectedProject._id === project._id
                    ? 'bg-blue-50 border border-blue-200 text-blue-700'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="font-medium">{project.title}</div>
                <div className="text-sm text-gray-600 flex items-center mt-1">
                  <span className="mr-2">Applications:</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {project.applicationDetails?.length || 0}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Applications List */}
        <div className="lg:col-span-3">
          {selectedProject && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="border-b p-4">
                <h2 className="text-xl font-semibold">Applications for: {selectedProject.title}</h2>
                <p className="text-gray-600 text-sm mt-1">
                  {applications.length} application{applications.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              {applications.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-600">No applications for this project.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {applications.map(application => (
                    <div key={application._id} className="p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{application.studentName}</h3>
                          <a href={`mailto:${application.studentEmail}`} className="text-blue-600 hover:underline text-sm">
                            {application.studentEmail}
                          </a>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            application.status === 'Applied' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'Shortlisted' ? 'bg-blue-100 text-blue-800' :
                            application.status === 'Selected' ? 'bg-green-100 text-green-800' :
                            application.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {application.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">
                          Applied on: {new Date(application.appliedDate).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {application.coverLetter && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">Cover Letter:</h4>
                          <div className="bg-gray-50 p-3 rounded border border-gray-200 text-gray-700">
                            <p className="whitespace-pre-line">{application.coverLetter}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Application Actions */}
                      {application.status === 'Applied' && (
                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => handleUpdateStatus(application._id, 'Shortlisted')}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(application._id, 'Selected')}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded"
                          >
                            Select
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(application._id, 'Rejected')}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3 rounded"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      
                      {application.status === 'Shortlisted' && (
                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => handleUpdateStatus(application._id, 'Selected')}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded"
                          >
                            Select
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(application._id, 'Rejected')}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3 rounded"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FacultyDashboardApplications;
