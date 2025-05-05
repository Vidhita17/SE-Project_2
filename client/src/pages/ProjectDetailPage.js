import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';

function ProjectDetailPage() {
  const { projectId } = useParams();
  const { userRole, currentUser, authToken } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    studentName: '',
    studentEmail: '',
    studentProgram: '',
    studentSkills: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  
  // Add edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    domain: '',
    requiredSkills: '',
    studentsRequired: 1,
    applicationDeadline: '',
    status: 'Planning',
    members: ''
  });

  // Fetch project details
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        
        // Get all projects to find the specific one
        const projectsResponse = await axios.get('http://localhost:9000/api/projects');
        const foundProject = projectsResponse.data.find(p => p.id === projectId);
        
        if (!foundProject) {
          setError('Project not found');
          setLoading(false);
          return;
        }
        
        setProject(foundProject);
        
        // Get faculty details if we have a faculty ID
        if (foundProject.facultyId) {
          const facultyResponse = await axios.get(`http://localhost:9000/api/faculty/${foundProject.facultyId}`);
          setFaculty(facultyResponse.data);
        }
        
        // Check if the student has already applied and fetch student details (only for students)
        if (userRole === 'student' && currentUser && authToken) {
          try {
            // Fetch student profile data
            // Fetch student profile data
            const studentResponse = await axios.get(
              `http://localhost:9000/api/students/${currentUser.id}/profile`,
              { headers: { 'Authorization': `Bearer ${authToken}` } }
            );
            
            setApplicationData(prev => ({
              studentName: studentResponse.data.name || currentUser.name,
              studentEmail: studentResponse.data.email || currentUser.email,
              studentProgram: studentResponse.data.program || '',
              studentSkills: studentResponse.data.skills || ''
            }));
            
            // Check applications
            const applicationsResponse = await axios.get(
              `http://localhost:9000/api/students/${currentUser.id}/applications`,
              { headers: { 'Authorization': `Bearer ${authToken}` } }
            );
            
            // Check if any application is for this project
            const hasAppliedToThisProject = applicationsResponse.data.some(
              app => app.projectId === projectId
            );
            
            setHasApplied(hasAppliedToThisProject);
          } catch (err) {
            console.error('Error checking applications or student details:', err);
            // Don't set error state to avoid affecting the main content
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError('Failed to load project details. Please try again later.');
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId, userRole, currentUser, authToken]);

  // Initialize edit form when project data is loaded or edit mode changes
  useEffect(() => {
    if (project && editMode) {
      setEditFormData({
        title: project.title || '',
        description: project.description || '',
        domain: project.domain || '',
        requiredSkills: project.requiredSkills ? project.requiredSkills.join(', ') : '',
        studentsRequired: project.studentsRequired || 1,
        applicationDeadline: project.applicationDeadline ? new Date(project.applicationDeadline).toISOString().split('T')[0] : '',
        status: project.status || 'Planning',
        members: project.members ? project.members.join(', ') : ''
      });
    }
  }, [project, editMode]);

  const handleApplicationChange = (e) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle edit form input changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser || userRole !== 'student' || !authToken) {
      setError('You must be logged in as a student to apply');
      return;
    }
    
    if (!project || !project.facultyId) {
      setError('Missing project or faculty information');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const applicationPayload = {
        projectId: project.id,
        facultyId: project.facultyId,
        coverLetter: applicationData.coverLetter,
        studentSkills: applicationData.studentSkills,
        studentProgram: applicationData.studentProgram
      };
      
      await axios.post(
        `http://localhost:9000/api/students/${currentUser.id}/applications`,
        applicationPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      setSubmitting(false);
      setApplicationSuccess(true);
      setHasApplied(true);
      
      // Close the modal after a short delay
      setTimeout(() => {
        setShowApplicationModal(false);
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting application:', err);
      setError(err.response?.data?.message || 'Failed to submit application. Please try again.');
      setSubmitting(false);
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!project || !project.facultyId || !authToken) {
      setError('Missing project information or not authorized');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Format data for API
      const projectPayload = {
        title: editFormData.title,
        description: editFormData.description,
        domain: editFormData.domain,
        requiredSkills: editFormData.requiredSkills.split(',').map(skill => skill.trim()).filter(Boolean),
        studentsRequired: parseInt(editFormData.studentsRequired, 10),
        applicationDeadline: editFormData.applicationDeadline || null,
        status: editFormData.status,
        members: editFormData.members.split(',').map(member => member.trim()).filter(Boolean)
      };
      
      // Make API call to update project
      const response = await axios.put(
        `http://localhost:9000/api/faculty/${project.facultyId}/projects/${project.id}`,
        projectPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      // Update local project state with the response data
      const updatedProject = {
        ...project,
        ...response.data
      };
      
      setProject(updatedProject);
      setEditMode(false);
      setSubmitting(false);
      
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err.response?.data?.message || 'Failed to update project. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 py-12 bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <div className="mt-6 text-center">
            <Link to="/projects" className="text-blue-600 hover:text-blue-800">
              &larr; Back to Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-700">Project not found</h2>
          <p className="mt-2 text-gray-600">The project you're looking for doesn't exist or has been removed.</p>
          <Link to="/projects" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            &larr; Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="mb-6">
          <Link to="/projects" className="text-blue-600 hover:text-blue-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Projects
          </Link>
        </nav>
        
        {/* Edit Form - Show when in edit mode */}
        {editMode ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6">
              <h1 className="text-2xl font-bold text-white">Edit Project</h1>
            </div>
            <div className="p-6">
              <form onSubmit={handleEditSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="title">
                      Project Title*
                    </label>
                    <input 
                      type="text" 
                      id="title" 
                      name="title"
                      value={editFormData.title}
                      onChange={handleEditChange}
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
                      value={editFormData.domain}
                      onChange={handleEditChange}
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
                      value={editFormData.description}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="5"
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
                      value={editFormData.requiredSkills}
                      onChange={handleEditChange}
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
                      value={editFormData.studentsRequired}
                      onChange={handleEditChange}
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
                      value={editFormData.applicationDeadline}
                      onChange={handleEditChange}
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
                      value={editFormData.status}
                      onChange={handleEditChange}
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
                      value={editFormData.members}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Dr. Smith, Dr. Johnson, Graduate Students"
                    />
                  </div>
                </div>
                
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4" role="alert">
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="flex space-x-4 mt-6">
                  <button 
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-md shadow-sm"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : 'Save Changes'}
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-6 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Project Header - Prominent with Title and Status */}
            <div className={`p-8 ${
              project.status === 'In Progress' ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-b border-yellow-200' :
              project.status === 'Completed' ? 'bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200' :
              'bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200'
            }`}>
              <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
                    {project.domain && (
                      <p className="text-lg font-medium text-indigo-700">{project.domain}</p>
                    )}
                  </div>
                  <div className="mt-4 md:mt-0">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                      project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                      project.status === 'Completed' ? 'bg-green-100 text-green-800 border border-green-300' :
                      'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        project.status === 'In Progress' ? 'bg-yellow-400' :
                        project.status === 'Completed' ? 'bg-green-400' :
                        'bg-blue-400'
                      }`}></span>
                      {project.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Faculty Information Card - Right below header */}
            {faculty && (
              <div className="border-b border-gray-200 bg-gray-50">
                <div className="max-w-5xl mx-auto py-4 px-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4 mb-4 sm:mb-0">
                      <span className="text-lg font-bold text-indigo-700">{faculty.name?.charAt(0) || 'F'}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Faculty: {faculty.name}</h3>
                      <div className="mt-1 text-sm text-gray-600 flex flex-wrap items-center gap-x-4">
                        {faculty.designation && <span>{faculty.designation}</span>}
                        {faculty.school && <span>• {faculty.school}</span>}
                        <a href={`mailto:${faculty.email}`} className="text-blue-600 hover:text-blue-800 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Email
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Main Content Area with Sidebar */}
            <div className="max-w-5xl mx-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Project Details */}
                <div className="lg:col-span-2">
                  <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 pb-2 border-b border-gray-200">Project Description</h2>
                    <div className="prose prose-blue max-w-none">
                      <p className="text-gray-700 whitespace-pre-line">{project.description}</p>
                    </div>
                  </section>
                  
                  {project.requiredSkills && project.requiredSkills.length > 0 && (
                    <section className="mb-8">
                      <h2 className="text-xl font-semibold mb-4 text-gray-900 pb-2 border-b border-gray-200">Required Skills</h2>
                      <div className="flex flex-wrap gap-2">
                        {project.requiredSkills.map((skill, index) => (
                          <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md shadow-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}
                  
                  {/* Project Team Section */}
                  {project.members && project.members.length > 0 && (
                    <section className="mb-8">
                      <h2 className="text-xl font-semibold mb-4 text-gray-900 pb-2 border-b border-gray-200">Project Team</h2>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        {project.members.map((member, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                            <span className="text-gray-700">{member}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  
                  {/* Project Materials/Attachments */}
                  {project.attachmentUrls && project.attachmentUrls.length > 0 && (
                    <section className="mb-8">
                      <h2 className="text-xl font-semibold mb-4 text-gray-900 pb-2 border-b border-gray-200">Project Materials</h2>
                      <ul className="space-y-2 bg-gray-50 p-4 rounded-lg">
                        {project.attachmentUrls.map((url, index) => (
                          <li key={index}>
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center p-2 hover:bg-gray-100 rounded-md transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {url.split('/').pop()}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
                
                {/* Sidebar with Application Info */}
                <div className="space-y-6">
                  {/* Project Info Card */}
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 pb-2 border-b border-gray-200">Project Details</h3>
                    
                    <div className="space-y-4">
                      {/* Application Deadline with visual prominence */}
                      {project.applicationDeadline && (
                        <div className={`p-3 rounded-md ${
                          new Date(project.applicationDeadline) < new Date() 
                            ? 'bg-red-50 border border-red-200' 
                            : 'bg-green-50 border border-green-200'
                        }`}>
                          <p className="text-sm font-medium text-gray-700">Application Deadline</p>
                          <p className="text-lg font-bold">
                            {new Date(project.applicationDeadline).toLocaleDateString(undefined, { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric'
                            })}
                          </p>
                          {new Date(project.applicationDeadline) < new Date() && (
                            <p className="text-red-600 text-sm mt-1 font-medium">Deadline has passed</p>
                          )}
                        </div>
                      )}
                    
                      {project.studentsRequired > 0 && (
                        <div>
                          <p className="text-sm text-gray-500">Students Required</p>
                          <p className="font-medium text-lg">{project.studentsRequired}</p>
                        </div>
                      )}
                      
                      {project.createdAt && (
                        <div>
                          <p className="text-sm text-gray-500">Posted On</p>
                          <p className="font-medium">{new Date(project.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Application Button - Only for students */}
                  {userRole === 'student' && project.status !== 'Completed' && (
                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">Apply for This Project</h3>
                      
                      {hasApplied ? (
                        <div className="bg-green-50 text-green-800 p-4 rounded-md border border-green-200">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="font-medium">Application Submitted</p>
                          </div>
                          <p className="text-sm mt-2">You have already applied to this project. Check your applications in your dashboard.</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-600 mb-4">Interested in working on this research project? Submit your application now.</p>
                          
                          <button 
                            onClick={() => setShowApplicationModal(true)}
                            className={`w-full py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center ${
                              new Date(project.applicationDeadline) < new Date() 
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm'
                            }`}
                            disabled={new Date(project.applicationDeadline) < new Date()}
                          >
                            {new Date(project.applicationDeadline) < new Date() 
                              ? 'Application Deadline Passed' 
                              : 'Apply Now'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Admin/Owner Actions */}
                  {(userRole === 'admin' || (userRole === 'faculty' && currentUser?.id === project.facultyId)) && (
                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">Project Management</h3>
                      
                      <div className="space-y-3">
                        {/* Edit functionality for faculty */}
                        {userRole === 'faculty' && currentUser?.id === project.facultyId && (
                          <button 
                            onClick={() => setEditMode(true)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors duration-200 shadow-sm"
                          >
                            Edit Project
                          </button>
                        )}
                        
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this project?')) {
                              axios.delete(
                                `http://localhost:9000/api/faculty/${project.facultyId}/projects/${project.id}`,
                                { headers: { 'Authorization': `Bearer ${authToken}` } }
                              )
                              .then(() => navigate('/projects'))
                              .catch(err => {
                                console.error('Error deleting project:', err);
                                setError('Failed to delete project');
                              });
                            }
                          }}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors duration-200 shadow-sm"
                        >
                          Delete Project
                        </button>
                        
                        {faculty && userRole === 'faculty' && (
                          <Link 
                            to="/dashboard"
                            className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors duration-200 shadow-sm"
                          >
                            View Applications
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Application Modal - Improved with student details */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
            <button 
              onClick={() => setShowApplicationModal(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-2xl font-bold mb-1">Apply for Project</h2>
            <p className="text-gray-600 mb-6">Complete the application form below to apply for this project.</p>
            
            {applicationSuccess ? (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Application Submitted!</h3>
                <p className="text-gray-600 mb-4">Your application has been successfully submitted.</p>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplicationSubmit} className="space-y-6">
                {/* Project Info */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">Project: {project.title}</h3>
                      {faculty && (
                        <p className="text-gray-600 text-sm">Faculty: {faculty.name}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
                
                {/* Student Information - Auto-populated */}
                <div>
                  <h3 className="text-lg font-medium mb-4 text-gray-900">Your Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={applicationData.studentName}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={applicationData.studentEmail}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Program/Degree
                      </label>
                      <input
                        type="text"
                        name="studentProgram"
                        value={applicationData.studentProgram}
                        onChange={handleApplicationChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. B.Tech Computer Science"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Relevant Skills
                      </label>
                      <input
                        type="text"
                        name="studentSkills"
                        value={applicationData.studentSkills}
                        onChange={handleApplicationChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Python, React, Data Analysis"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Cover Letter */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="coverLetter">
                    Cover Letter / Statement of Interest*
                  </label>
                  <textarea
                    id="coverLetter"
                    name="coverLetter"
                    value={applicationData.coverLetter}
                    onChange={handleApplicationChange}
                    rows="6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explain why you're interested in this project, what specific skills you bring, and how it aligns with your academic goals..."
                    required
                  ></textarea>
                  <div className="mt-1 flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-500">
                      Highlight your specific skills, relevant coursework or experience, and why you're particularly interested in this project.
                    </p>
                  </div>
                </div>
                
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowApplicationModal(false)}
                    className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetailPage;
