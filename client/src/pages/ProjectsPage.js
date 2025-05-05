import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

function ProjectsPage() {
  const { userRole, authToken, currentUser } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newProject, setNewProject] = useState({ 
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
  const [isFormVisible, setIsFormVisible] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    domain: '',
    facultyName: '',
    status: ''
  });

  // Lists for filter dropdowns
  const [domains, setDomains] = useState([]);
  const [facultyNames, setFacultyNames] = useState([]);
  const [statuses] = useState(['Planning', 'In Progress', 'Completed']);

  // Fetch projects from the API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:9000/api/projects');
        setProjects(response.data);
        
        // Extract unique values for filters
        const uniqueDomains = [...new Set(response.data.map(p => p.domain).filter(Boolean))];
        const uniqueFaculty = [...new Set(response.data.map(p => p.facultyName).filter(Boolean))];
        
        setDomains(uniqueDomains);
        setFacultyNames(uniqueFaculty);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects. Please try again later.');
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject({
      ...newProject,
      [name]: value
    });
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Show uploading state
    setError(null);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${authToken}`
        }
      };
      
      const response = await axios.post('http://localhost:9000/api/upload', formData, config);
      
      // Add the uploaded files to the project data
      setNewProject(prev => ({
        ...prev,
        attachmentUrls: [...(prev.attachmentUrls || []), ...response.data.files.map(file => file.url)]
      }));
      
    } catch (err) {
      console.error('Error uploading files:', err);
      setError('Failed to upload files. Please try again.');
    }
  };

  // Remove attachment
  const removeAttachment = (index) => {
    setNewProject(prev => {
      const newAttachments = [...prev.attachmentUrls];
      newAttachments.splice(index, 1);
      return { ...prev, attachmentUrls: newAttachments };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!authToken) {
      setError('You must be logged in to add a project');
      return;
    }
    
    // Only allow faculty and admin to create projects
    if (userRole !== 'admin' && userRole !== 'faculty') {
      setError('You do not have permission to create projects');
      return;
    }
    
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      };
      
      // Get the current user's ID from the JWT token
      const userId = JSON.parse(atob(authToken.split('.')[1])).userId;
      
      const projectPayload = {
        title: newProject.title,
        description: newProject.description,
        domain: newProject.domain,
        requiredSkills: newProject.requiredSkills.split(',').map(skill => skill.trim()),
        studentsRequired: newProject.studentsRequired,
        applicationDeadline: newProject.applicationDeadline,
        status: newProject.status,
        members: newProject.members.split(',').map(member => member.trim()),
        attachmentUrls: newProject.attachmentUrls
      };
      
      // Faculty members can only create projects for themselves
      const response = await axios.post(
        `http://localhost:9000/api/faculty/${userId}/projects`,
        projectPayload,
        config
      );
      
      // Add the new project to the list with faculty info
      const facultyInfo = await axios.get(`http://localhost:9000/api/faculty/${userId}`);
      
      setProjects([...projects, {
        id: response.data._id,
        ...response.data,
        facultyName: facultyInfo.data.name,
        facultyId: userId
      }]);
      
      // Reset form
      setNewProject({ 
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
      setIsFormVisible(false);
      
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.response?.data?.message || 'Failed to create project. Please try again.');
    }
  };

  // Filter projects based on search term and filters
  const filteredProjects = projects.filter(project => {
    // Search term filter (case insensitive)
    const matchesSearch = !searchTerm || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (project.facultyName && project.facultyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (project.domain && project.domain.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Domain filter
    const matchesDomain = !filters.domain || project.domain === filters.domain;
    
    // Faculty name filter
    const matchesFaculty = !filters.facultyName || project.facultyName === filters.facultyName;
    
    // Status filter
    const matchesStatus = !filters.status || project.status === filters.status;
    
    return matchesSearch && matchesDomain && matchesFaculty && matchesStatus;
  });

  // Handler for search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handler for filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      domain: '',
      facultyName: '',
      status: ''
    });
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
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Research Projects</h1>
          
          {/* Only show add project button for admin and faculty */}
          {(userRole === 'admin' || userRole === 'faculty') && (
            <button 
              onClick={() => setIsFormVisible(!isFormVisible)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200 transform hover:scale-105"
            >
              {isFormVisible ? 'Cancel' : 'Add New Project'}
            </button>
          )}
        </div>
        
        {/* Only show the form if the user has permission */}
        {isFormVisible && (userRole === 'admin' || userRole === 'faculty') && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="title">
                    Project Title*
                  </label>
                  <input 
                    type="text" 
                    id="title" 
                    name="title"
                    value={newProject.title}
                    onChange={handleInputChange}
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
                    value={newProject.domain}
                    onChange={handleInputChange}
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
                    value={newProject.description}
                    onChange={handleInputChange}
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
                    value={newProject.requiredSkills}
                    onChange={handleInputChange}
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
                    value={newProject.studentsRequired}
                    onChange={handleInputChange}
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
                    value={newProject.applicationDeadline}
                    onChange={handleInputChange}
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
                    value={newProject.status}
                    onChange={handleInputChange}
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
                    value={newProject.members}
                    onChange={handleInputChange}
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
                  {newProject.attachmentUrls && newProject.attachmentUrls.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Uploaded files:</p>
                      <ul className="space-y-1">
                        {newProject.attachmentUrls.map((url, idx) => (
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
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md"
              >
                Create Project
              </button>
            </form>
          </div>
        )}
        
        {/* Modern Search and Filters Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 transition-all duration-300">
          {/* Search Bar */}
          <div className="p-5 border-b border-gray-100">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by title, description, faculty, or domain..."
                className="w-full pl-10 pr-4 py-3 border-0 focus:ring-2 focus:ring-blue-500 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 transition duration-200"
              />
            </div>
          </div>
          
          {/* Filters Section */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-800">Filters</h2>
              
              {/* Active filter indicators */}
              <div className="flex items-center space-x-2">
                {(filters.domain || filters.facultyName || filters.status) && (
                  <div className="flex space-x-2 items-center">
                    <span className="text-sm text-gray-500">Active filters:</span>
                    <div className="flex flex-wrap gap-2">
                      {filters.domain && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Domain: {filters.domain}
                          <button 
                            onClick={() => handleFilterChange('domain', '')}
                            className="ml-1.5 text-indigo-500 hover:text-indigo-800 focus:outline-none"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      )}
                      
                      {filters.facultyName && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Faculty: {filters.facultyName}
                          <button 
                            onClick={() => handleFilterChange('facultyName', '')}
                            className="ml-1.5 text-blue-500 hover:text-blue-800 focus:outline-none"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      )}
                      
                      {filters.status && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Status: {filters.status}
                          <button 
                            onClick={() => handleFilterChange('status', '')}
                            className="ml-1.5 text-green-500 hover:text-green-800 focus:outline-none"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {(filters.domain || filters.facultyName || filters.status) && (
                  <button
                    onClick={resetFilters}
                    className="text-sm text-red-500 hover:text-red-700 transition-colors focus:outline-none"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Domain Filter */}
              <div className="relative">
                <label htmlFor="domain-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Domain
                </label>
                <select
                  id="domain-filter"
                  value={filters.domain}
                  onChange={(e) => handleFilterChange('domain', e.target.value)}
                  className={`block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 ${filters.domain ? 'border-indigo-500 bg-indigo-50' : ''}`}
                >
                  <option value="">All Domains</option>
                  {domains.map(domain => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              {/* Faculty Filter */}
              <div className="relative">
                <label htmlFor="faculty-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Faculty Member
                </label>
                <select
                  id="faculty-filter"
                  value={filters.facultyName}
                  onChange={(e) => handleFilterChange('facultyName', e.target.value)}
                  className={`block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 ${filters.facultyName ? 'border-blue-500 bg-blue-50' : ''}`}
                >
                  <option value="">All Faculty</option>
                  {facultyNames.map(faculty => (
                    <option key={faculty} value={faculty}>{faculty}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              {/* Status Filter */}
              <div className="relative">
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Status
                </label>
                <select
                  id="status-filter"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className={`block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 ${filters.status ? 'border-green-500 bg-green-50' : ''}`}
                >
                  <option value="">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm font-medium text-gray-500">
            {filteredProjects.length === 0 
              ? 'No projects found' 
              : filteredProjects.length === 1 
                ? '1 project found'
                : `${filteredProjects.length} projects found`
            }
          </div>
          
          {searchTerm && (
            <div className="text-sm font-medium text-gray-500">
              Search results for: <span className="text-blue-600">"{searchTerm}"</span>
            </div>
          )}
        </div>
        
        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-gray-500 text-lg">No research projects match your search criteria.</p>
            <button 
              onClick={resetFilters} 
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <div key={project.id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow border border-gray-200 flex flex-col overflow-hidden h-full">
                {/* Status indicator at the top */}
                <div className={`h-2 w-full ${
                  project.status === 'In Progress' ? 'bg-yellow-400' :
                  project.status === 'Completed' ? 'bg-green-400' :
                  'bg-blue-400'
                }`}></div>
                
                {/* Project content */}
                <div className="p-6 flex-grow flex flex-col">
                  {/* Title and domain */}
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{project.title}</h2>
                    {project.domain && (
                      <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                        {project.domain}
                      </span>
                    )}
                  </div>
                  
                  {/* Faculty information */}
                  {project.facultyName && (
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{project.facultyName}</span>
                    </div>
                  )}
                  
                  {/* Key stats */}
                  <div className="mt-auto grid grid-cols-2 gap-2 text-xs text-gray-600">
                    {/* Required Skills Summary */}
                    {project.requiredSkills && project.requiredSkills.length > 0 && (
                      <div className="col-span-2 mb-2">
                        <div className="flex flex-wrap gap-1">
                          {project.requiredSkills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">
                              {skill}
                            </span>
                          ))}
                          {project.requiredSkills.length > 3 && (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">
                              +{project.requiredSkills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Students Required */}
                    {project.studentsRequired > 0 && (
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{project.studentsRequired} students</span>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="flex items-center justify-end">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    
                    {/* Deadline if exists */}
                    {project.applicationDeadline && (
                      <div className="flex items-center col-span-2 mt-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Due: {new Date(project.applicationDeadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Footer with action buttons */}
                <div className="border-t border-gray-100 p-4 bg-gray-50 flex items-center justify-between">
                  <Link 
                    to={`/projects/${project.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    View Details
                  </Link>
                  
                  {userRole === 'student' && project.status !== 'Completed' && (
                    <Link
                      to={`/projects/${project.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1.5 px-3 rounded transition-colors"
                    >
                      Apply Now
                    </Link>
                  )}
                  
                  {/* Admin or faculty owner can delete */}
                  {(userRole === 'admin' || (userRole === 'faculty' && currentUser?.id === project.facultyId)) && (
                    <button 
                      onClick={async () => {
                        try {
                          if (window.confirm('Are you sure you want to delete this project?')) {
                            await axios.delete(
                              `http://localhost:9000/api/faculty/${project.facultyId}/projects/${project.id}`,
                              { headers: { 'Authorization': `Bearer ${authToken}` } }
                            );
                            setProjects(projects.filter(p => p.id !== project.id));
                          }
                        } catch (err) {
                          console.error('Error deleting project:', err);
                          setError('Failed to delete project');
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectsPage;
