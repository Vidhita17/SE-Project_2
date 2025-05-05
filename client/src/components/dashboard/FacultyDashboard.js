import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import axios from 'axios';

const FacultyDashboard = () => {
  const { currentUser, authToken } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('projects');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({});
  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // State for new project form
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    domain: '',
    requiredSkills: '',
    studentsRequired: 1,
    applicationDeadline: '',
    status: 'Planning',
    members: '',
    attachmentUrls: []
  });

  // Fetch faculty data
  useEffect(() => {
    const fetchFacultyData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch faculty profile and projects
        const facultyResponse = await axios.get(`http://localhost:9000/api/faculty/${currentUser.id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });
        
        setProfile(facultyResponse.data);
        setProjects(facultyResponse.data.projects || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching faculty data:', err);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };

    fetchFacultyData();
  }, [currentUser, authToken]);

  // Fetch applications for a specific project when selected
  useEffect(() => {
    const fetchApplications = async () => {
      if (!selectedProjectId || !currentUser) return;
      
      try {
        setLoading(true);
        
        // Get applications for the selected project
        const applicationsResponse = await axios.get(
          `http://localhost:9000/api/faculty/${currentUser.id}/projects/${selectedProjectId}/applications`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        );
        
        setApplications(applicationsResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load applications. Please try again.');
        setLoading(false);
      }
    };

    if (activeTab === 'applications' && selectedProjectId) {
      fetchApplications();
    }
  }, [selectedProjectId, currentUser, authToken, activeTab]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Reset selected project when switching back to projects tab
    if (tab === 'projects') {
      setSelectedProjectId(null);
    }
  };

  // Handle project form change
  const handleProjectChange = (e) => {
    const { name, value } = e.target;
    setProjectData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file upload for project
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await axios.post(
        'http://localhost:9000/api/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      // Add new URLs to project data
      setProjectData(prev => ({
        ...prev,
        attachmentUrls: [...prev.attachmentUrls, ...response.data.urls]
      }));
      
    } catch (err) {
      console.error('Error uploading files:', err);
      setError('Failed to upload files. Please try again.');
    }
  };

  // Remove attachment from project form
  const removeAttachment = (index) => {
    setProjectData(prev => {
      const newAttachments = [...prev.attachmentUrls];
      newAttachments.splice(index, 1);
      return { ...prev, attachmentUrls: newAttachments };
    });
  };

  // Submit new project
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      const payload = {
        title: projectData.title,
        description: projectData.description,
        domain: projectData.domain,
        requiredSkills: projectData.requiredSkills.split(',').map(skill => skill.trim()),
        studentsRequired: parseInt(projectData.studentsRequired),
        applicationDeadline: projectData.applicationDeadline,
        status: projectData.status,
        members: projectData.members.split(',').map(member => member.trim()),
        attachmentUrls: projectData.attachmentUrls
      };
      
      const response = await axios.post(
        `http://localhost:9000/api/faculty/${currentUser.id}/projects`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      // Add new project to list
      setProjects([...projects, response.data]);
      
      // Reset form
      setProjectData({
        title: '',
        description: '',
        domain: '',
        requiredSkills: '',
        studentsRequired: 1,
        applicationDeadline: '',
        status: 'Planning',
        members: '',
        attachmentUrls: []
      });
      
      setShowProjectForm(false);
      
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project. Please try again.');
    }
  };

  // Update application status
  const handleUpdateApplicationStatus = async (applicationId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change this application status to "${newStatus}"?`)) return;
    
    try {
      await axios.put(
        `http://localhost:9000/api/faculty/${currentUser.id}/projects/${selectedProjectId}/applications/${applicationId}`,
        { status: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      // Update application status in state
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
      
    } catch (err) {
      console.error('Error updating application status:', err);
      setError('Failed to update application status. Please try again.');
    }
  };

  // View project applications
  const handleViewApplications = (projectId) => {
    setSelectedProjectId(projectId);
    setActiveTab('applications');
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
          <h2 className="text-xl font-bold">Faculty Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">{profile.name}</p>
        </div>
        
        <nav>
          <button 
            onClick={() => handleTabChange('projects')}
            className={`w-full text-left py-2 px-4 rounded mb-2 ${activeTab === 'projects' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          >
            My Projects
          </button>
          {selectedProjectId && (
            <button 
              onClick={() => handleTabChange('applications')}
              className={`w-full text-left py-2 px-4 rounded mb-2 ${activeTab === 'applications' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            >
              Applications
            </button>
          )}
          <Link to="/faculty" className="block text-left py-2 px-4 rounded mb-2 hover:bg-gray-700">
            My Profile
          </Link>
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

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">My Research Projects</h1>
              
              <button
                onClick={() => setShowProjectForm(!showProjectForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
              >
                {showProjectForm ? 'Cancel' : 'Add New Project'}
              </button>
            </div>
            
            {/* New Project Form */}
            {showProjectForm && (
              <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
                
                <form onSubmit={handleProjectSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2" htmlFor="title">
                        Project Title*
                      </label>
                      <input 
                        type="text" 
                        id="title" 
                        name="title"
                        value={projectData.title}
                        onChange={handleProjectChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2" htmlFor="domain">
                        Domain*
                      </label>
                      <input 
                        type="text" 
                        id="domain" 
                        name="domain"
                        value={projectData.domain}
                        onChange={handleProjectChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Machine Learning, Web Development"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2 mb-4">
                      <label className="block text-gray-700 mb-2" htmlFor="description">
                        Description*
                      </label>
                      <textarea 
                        id="description" 
                        name="description"
                        value={projectData.description}
                        onChange={handleProjectChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        required
                      ></textarea>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2" htmlFor="requiredSkills">
                        Required Skills (comma-separated)
                      </label>
                      <input 
                        type="text" 
                        id="requiredSkills" 
                        name="requiredSkills"
                        value={projectData.requiredSkills}
                        onChange={handleProjectChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Python, React, Data Analysis"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2" htmlFor="studentsRequired">
                        Number of Students Required
                      </label>
                      <input 
                        type="number" 
                        id="studentsRequired" 
                        name="studentsRequired"
                        value={projectData.studentsRequired}
                        onChange={handleProjectChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2" htmlFor="applicationDeadline">
                        Application Deadline
                      </label>
                      <input 
                        type="date" 
                        id="applicationDeadline" 
                        name="applicationDeadline"
                        value={projectData.applicationDeadline}
                        onChange={handleProjectChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2" htmlFor="status">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={projectData.status}
                        onChange={handleProjectChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Planning">Planning</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2" htmlFor="members">
                        Team Members (comma-separated)
                      </label>
                      <input 
                        type="text" 
                        id="members" 
                        name="members"
                        value={projectData.members}
                        onChange={handleProjectChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Dr. Smith, Dr. Johnson, Graduate Students"
                      />
                    </div>
                    
                    <div className="md:col-span-2 mb-6">
                      <label className="block text-gray-700 mb-2" htmlFor="attachments">
                        Attachments
                      </label>
                      <input 
                        type="file" 
                        id="attachments" 
                        name="attachments"
                        onChange={handleFileUpload}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        multiple
                      />
                      
                      {/* Display uploaded files */}
                      {projectData.attachmentUrls && projectData.attachmentUrls.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 mb-1">Uploaded files:</p>
                          <ul className="space-y-1">
                            {projectData.attachmentUrls.map((url, idx) => (
                              <li key={idx} className="flex items-center text-sm">
                                <a 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline truncate"
                                >
                                  {url.split('/').pop()}
                                </a>
                                <button 
                                  type="button" 
                                  onClick={() => removeAttachment(idx)}
                                  className="ml-2 text-red-500 hover:text-red-700"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-md"
                  >
                    Create Project
                  </button>
                </form>
              </div>
            )}
            
            {/* Projects List */}
            {projects.length === 0 ? (
              <div className="bg-white shadow-md rounded-lg p-6 text-center">
                <p className="text-gray-500">You haven't created any projects yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {projects.map(project => (
                  <div key={project._id} className="bg-white shadow-md rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-semibold">{project.title}</h2>
                        <span className={`inline-block px-2 py-1 mt-1 rounded-full text-xs font-medium 
                          ${project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                          project.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                          'bg-blue-100 text-blue-800'}`}
                        >
                          {project.status}
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewApplications(project._id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded"
                        >
                          View Applications 
                          {project.applicationDetails && project.applicationDetails.length > 0 && (
                            <span className="ml-1 bg-red-500 text-white rounded-full px-2 py-0.5">
                              {project.applicationDetails.length}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {project.domain && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-indigo-600">Domain: {project.domain}</span>
                      </div>
                    )}
                    
                    <p className="text-gray-600 mb-4">{project.description}</p>
                    
                    {project.requiredSkills && project.requiredSkills.length > 0 && (
                      <div className="mb-3">
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Required Skills:</h3>
                        <div className="flex flex-wrap gap-1">
                          {project.requiredSkills.map((skill, index) => (
                            <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        {project.studentsRequired > 0 && (
                          <p className="text-sm"><span className="font-medium">Students Required:</span> {project.studentsRequired}</p>
                        )}
                        
                        {project.applicationDeadline && (
                          <p className="text-sm"><span className="font-medium">Application Deadline:</span> {new Date(project.applicationDeadline).toLocaleDateString()}</p>
                        )}
                      </div>
                      
                      <div>
                        {project.members && project.members.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-1">Team Members:</h3>
                            <ul className="text-sm text-gray-600">
                              {project.members.map((member, index) => (
                                <li key={index}>{member}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {project.attachmentUrls && project.attachmentUrls.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Attachments:</h3>
                        <ul className="text-sm text-blue-600">
                          {project.attachmentUrls.map((url, index) => (
                            <li key={index}>
                              <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                Attachment {index + 1}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {project.applicationDetails && (
                      <div className="mt-4 text-sm text-gray-500">
                        <span className="font-medium">Applications:</span> {project.applicationDetails.length || 0}
                      </div>
                    )}
                    
                    {project.createdAt && (
                      <div className="mt-2 text-xs text-gray-400">
                        Created: {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div>
            <div className="flex items-center mb-6">
              <button
                onClick={() => handleTabChange('projects')}
                className="mr-4 text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Projects
              </button>
              
              <h1 className="text-2xl font-bold">
                Applications for {projects.find(p => p._id === selectedProjectId)?.title}
              </h1>
            </div>
            
            {applications.length === 0 ? (
              <div className="bg-white shadow-md rounded-lg p-6 text-center">
                <p className="text-gray-500">No applications received for this project yet.</p>
              </div>
            ) : (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Applied</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {applications.map(application => (
                      <tr key={application.id}>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium text-gray-900">{application.studentName}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">
                          <a href={`mailto:${application.studentEmail}`} className="text-blue-600 hover:underline">
                            {application.studentEmail}
                          </a>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${application.status === 'Applied' ? 'bg-yellow-100 text-yellow-800' : 
                            application.status === 'Shortlisted' ? 'bg-blue-100 text-blue-800' :
                            application.status === 'Selected' ? 'bg-green-100 text-green-800' :
                            application.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'}`}
                          >
                            {application.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(application.appliedDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {application.status === 'Applied' && (
                              <>
                                <button
                                  onClick={() => handleUpdateApplicationStatus(application.id, 'Shortlisted')}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Shortlist
                                </button>
                                <button
                                  onClick={() => handleUpdateApplicationStatus(application.id, 'Rejected')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            
                            {application.status === 'Shortlisted' && (
                              <>
                                <button
                                  onClick={() => handleUpdateApplicationStatus(application.id, 'Selected')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Select
                                </button>
                                <button
                                  onClick={() => handleUpdateApplicationStatus(application.id, 'Rejected')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            
                            {application.resumeUrl && (
                              <a 
                                href={`http://localhost:9000/api/students/${application.studentId}/resume`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                View Resume
                              </a>
                            )}
                          </div>
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

export default FacultyDashboard;