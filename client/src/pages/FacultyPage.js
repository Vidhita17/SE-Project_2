import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

function FacultyPage() {
  const { userRole, currentUser, authToken } = useContext(AuthContext);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  // Profile edit form state
  const [profileData, setProfileData] = useState({
    name: '',
    designation: '',
    school: '',
    email: '',
    cabinLocation: '',
    freeTimings: [{ day: 'Monday', hours: '10:00 AM - 12:00 PM' }],
    overview: ''
  });
  
  // Project form state
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

  // Function to handle profile picture upload
  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${authToken}`
        }
      };
      
      const response = await axios.put(
        `http://localhost:9000/api/faculty/${selectedFaculty._id}`,
        formData,
        config
      );
      
      // Update the selected faculty with the updated data
      setSelectedFaculty(prev => ({
        ...prev,
        profilePictureUrl: response.data.profilePictureUrl
      }));
      
      setSuccess('Profile picture updated successfully');
    } catch (err) {
      console.error('Error updating profile picture:', err);
      setError('Failed to update profile picture');
    }
  };

  // Fetch all faculty
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:9000/api/faculty');
        setFaculty(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching faculty:', err);
        setError('Failed to load faculty data. Please try again later.');
        setLoading(false);
      }
    };

    fetchFaculty();
  }, []);

  // Fetch individual faculty details when selected
  useEffect(() => {
    if (selectedFaculty && selectedFaculty._id) {
      const facultyId = selectedFaculty._id;
      
      const fetchFacultyDetails = async () => {
        try {
          const response = await axios.get(`http://localhost:9000/api/faculty/${facultyId}`);
          
          // Only update if we're still looking at the same faculty
          // This prevents state updates if user has already navigated away
          if (selectedFaculty && selectedFaculty._id === facultyId) {
            // Use functional update to avoid dependency on selectedFaculty
            setSelectedFaculty(prevState => {
              // If data is the same, don't trigger an update
              if (JSON.stringify(prevState) === JSON.stringify(response.data)) {
                return prevState;
              }
              return response.data;
            });
            
            // Initialize form data if entering edit mode
            if (editMode) {
              setProfileData({
                name: response.data.name || '',
                designation: response.data.designation || '',
                school: response.data.school || '',
                email: response.data.email || '',
                cabinLocation: response.data.cabinLocation || '',
                freeTimings: response.data.freeTimings && response.data.freeTimings.length > 0 
                  ? response.data.freeTimings 
                  : [{ day: 'Monday', hours: '10:00 AM - 12:00 PM' }],
                overview: response.data.overview || ''
              });
            }
          }
        } catch (err) {
          console.error('Error fetching faculty details:', err);
          setError('Failed to load faculty details. Please try again later.');
        }
      };

      fetchFacultyDetails();
    }
  }, [selectedFaculty, editMode]);

  // Handle profile form input changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle free timings changes
  const handleTimingChange = (index, field, value) => {
    setProfileData(prev => {
      const newTimings = [...prev.freeTimings];
      newTimings[index] = { ...newTimings[index], [field]: value };
      return { ...prev, freeTimings: newTimings };
    });
  };

  // Add new timing slot
  const addTimingSlot = () => {
    setProfileData(prev => ({
      ...prev,
      freeTimings: [...prev.freeTimings, { day: 'Monday', hours: '10:00 AM - 12:00 PM' }]
    }));
  };

  // Remove timing slot
  const removeTimingSlot = (index) => {
    setProfileData(prev => {
      const newTimings = [...prev.freeTimings];
      newTimings.splice(index, 1);
      return { ...prev, freeTimings: newTimings };
    });
  };

  // Handle project form changes
  const handleProjectChange = (e) => {
    const { name, value } = e.target;
    setProjectData(prev => ({
      ...prev,
      [name]: value
    }));
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
      setProjectData(prev => ({
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
    setProjectData(prev => {
      const newAttachments = [...prev.attachmentUrls];
      newAttachments.splice(index, 1);
      return { ...prev, attachmentUrls: newAttachments };
    });
  };

  // Submit profile updates
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFaculty || !currentUser) return;
    
    // Verify the user has permission to edit this profile
    if (currentUser.id !== selectedFaculty._id && userRole !== 'admin') {
      setError('You do not have permission to edit this profile');
      return;
    }
    
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      };
      
      const response = await axios.put(
        `http://localhost:9000/api/faculty/${selectedFaculty._id}`,
        profileData,
        config
      );
      
      setSelectedFaculty(response.data);
      setEditMode(false);
      
      // Update faculty in the list
      setFaculty(prev => 
        prev.map(f => f._id === response.data._id ? response.data : f)
      );
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    }
  };

  // Submit new project
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFaculty || !currentUser) return;
    
    // Verify the user has permission to add projects for this faculty
    if (currentUser.id !== selectedFaculty._id && userRole !== 'admin') {
      setError('You do not have permission to add projects for this faculty member');
      return;
    }
    
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      };
      
      // Prepare payload
      const projectPayload = {
        ...projectData,
        members: projectData.members.split(',').map(m => m.trim()),
        requiredSkills: projectData.requiredSkills.split(',').map(s => s.trim())
      };
      
      const response = await axios.post(
        `http://localhost:9000/api/faculty/${selectedFaculty._id}/projects`,
        projectPayload,
        config
      );
      
      // Update selected faculty with new project
      setSelectedFaculty(prev => ({
        ...prev,
        projects: [...(prev.projects || []), response.data]
      }));
      
      // Reset form and hide it
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
      console.error('Error adding project:', err);
      setError(err.response?.data?.message || 'Failed to add project. Please try again.');
    }
  };

  // Determine if current user can edit this profile
  const canEdit = currentUser && selectedFaculty && 
    (currentUser.id === selectedFaculty._id || userRole === 'admin');

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button when viewing a faculty profile */}
        {selectedFaculty && (
          <button
            onClick={() => {
              setSelectedFaculty(null);
              setEditMode(false);
            }}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Faculty Directory
          </button>
        )}

        {/* Faculty List View */}
        {!selectedFaculty && (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Faculty Directory</h1>
            
            {faculty.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 text-lg">No faculty members found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {faculty.map(member => (
                  <div 
                    key={member._id}
                    className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedFaculty(member)}
                  >
                    <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                      {member.profilePictureUrl ? (
                        <img 
                          src={`http://localhost:9000${member.profilePictureUrl}`}
                          alt={member.name}
                          className="h-32 w-32 rounded-full object-cover border-4 border-white"
                        />
                      ) : (
                        <div className="h-32 w-32 rounded-full bg-white flex items-center justify-center">
                          <span className="text-4xl font-bold text-gray-700">{member.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h2 className="text-xl font-semibold mb-2">{member.name}</h2>
                      <p className="text-blue-600 mb-1">{member.designation || "Faculty Member"}</p>
                      <p className="text-gray-600 text-sm mb-3">{member.school || "School of Engineering"}</p>
                      <p className="text-gray-700 mb-4">
                        <a href={`mailto:${member.email}`} className="hover:text-blue-600" onClick={e => e.stopPropagation()}>
                          {member.email}
                        </a>
                      </p>
                      
                      {/* Projects count indicator */}
                      {member.projects && member.projects.length > 0 && (
                        <div className="px-4 py-2 bg-gray-50 text-xs text-gray-600 border-t border-gray-100 mt-auto">
                          {member.projects.length} {member.projects.length === 1 ? 'Project' : 'Projects'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Faculty Detail View */}
        {selectedFaculty && !editMode && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-48 flex justify-between items-center px-8">
              <div className="flex items-center">
                {selectedFaculty.profilePictureUrl ? (
                  <img 
                    src={`http://localhost:9000${selectedFaculty.profilePictureUrl}`}
                    alt={selectedFaculty.name}
                    className="h-32 w-32 rounded-full object-cover border-4 border-white mr-6"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-white flex items-center justify-center mr-6">
                    <span className="text-5xl font-bold text-gray-700">{selectedFaculty.name.charAt(0)}</span>
                  </div>
                )}
                <div className="text-white">
                  <h1 className="text-3xl font-bold">{selectedFaculty.name}</h1>
                  <p className="text-xl opacity-90">{selectedFaculty.designation || "Faculty Member"}</p>
                  <p className="opacity-75">{selectedFaculty.school || "School of Engineering"}</p>
                </div>
              </div>
              
              {/* Edit Profile Button - Only visible to profile owner or admin */}
              {canEdit && (
                <button 
                  onClick={() => setEditMode(true)}
                  className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Contact & Location Info */}
                <div className="md:col-span-1">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">Contact Information</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-4">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-800">
                        <a href={`mailto:${selectedFaculty.email}`} className="hover:text-blue-600">
                          {selectedFaculty.email}
                        </a>
                      </p>
                    </div>
                    
                    {selectedFaculty.cabinLocation && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">Cabin Location</p>
                        <p className="text-gray-800">{selectedFaculty.cabinLocation}</p>
                      </div>
                    )}
                    
                    {selectedFaculty.freeTimings && selectedFaculty.freeTimings.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Office Hours</p>
                        <ul className="space-y-1">
                          {selectedFaculty.freeTimings.map((timing, idx) => (
                            <li key={idx} className="text-gray-800">
                              <span className="font-medium">{timing.day}:</span> {timing.hours}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Overview/Bio */}
                <div className="md:col-span-2">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">About</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-line">
                      {selectedFaculty.overview || "No overview information available."}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Research Projects Section */}
              <div className="mt-10">
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">Research Projects</h2>
                    
                    {/* Add Project Button - Only visible to profile owner or admin */}
                    {canEdit && (
                      <button
                        onClick={() => setShowProjectForm(!showProjectForm)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                      >
                        {showProjectForm ? 'Cancel' : 'Add Project'}
                      </button>
                    )}
                  </div>
                  
                  {/* New Project Form - Only visible if the user has permission */}
                  {showProjectForm && canEdit && (
                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-center mb-6">Add New Project</h3>
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
                              Domain
                            </label>
                            <input 
                              type="text" 
                              id="domain" 
                              name="domain"
                              value={projectData.domain}
                              onChange={handleProjectChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g. Machine Learning, Web Development"
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
                              placeholder="e.g. Dr. Smith, Graduate Students"
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
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                        >
                          Create Project
                        </button>
                      </form>
                    </div>
                  )}
                  
                  {/* Projects List */}
                  <div className="p-6">
                    {(!selectedFaculty.projects || selectedFaculty.projects.length === 0) ? (
                      <div className="text-center py-8">
                        <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="text-gray-500">No research projects available.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedFaculty.projects.map((project, idx) => (
                          <div key={idx} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                            {/* Status indicator */}
                            <div className={`h-1.5 w-full ${
                              project.status === 'In Progress' ? 'bg-yellow-400' :
                              project.status === 'Completed' ? 'bg-green-400' :
                              'bg-blue-400'
                            }`}></div>
                            
                            <div className="p-5">
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="text-lg font-semibold mb-1 line-clamp-2">{project.title}</h3>
                                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                  project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {project.status}
                                </span>
                              </div>
                              
                              {project.domain && (
                                <div className="mb-2">
                                  <span className="inline-block text-sm font-medium text-indigo-600">
                                    Domain: {project.domain}
                                  </span>
                                </div>
                              )}
                              
                              <p className="text-gray-600 text-sm mb-3 line-clamp-3">{project.description}</p>
                              
                              {/* Skills Tags */}
                              {project.requiredSkills && project.requiredSkills.length > 0 && (
                                <div className="mb-3">
                                  <div className="flex flex-wrap gap-1.5">
                                    {project.requiredSkills.map((skill, index) => (
                                      <span key={index} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="mt-3 border-t border-gray-100 pt-3 flex flex-wrap justify-between text-xs text-gray-500">
                                {project.studentsRequired > 0 && (
                                  <div className="mr-3 mb-1">
                                    <span className="font-medium">Students Required:</span> {project.studentsRequired}
                                  </div>
                                )}
                                
                                {project.applicationDeadline && (
                                  <div className="mb-1">
                                    <span className="font-medium">Deadline:</span> {new Date(project.applicationDeadline).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              
                              {/* Project Links */}
                              <div className="mt-4 flex items-center justify-between">
                                <Link 
                                  to={`/projects/${project._id}`}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                                >
                                  View Details
                                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                                  </svg>
                                </Link>
                                
                                {/* Delete button - only visible to profile owner or admin */}
                                {canEdit && (
                                  <button
                                    onClick={async () => {
                                      if (window.confirm('Are you sure you want to delete this project?')) {
                                        try {
                                          await axios.delete(
                                            `http://localhost:9000/api/faculty/${selectedFaculty._id}/projects/${project._id}`,
                                            { headers: { 'Authorization': `Bearer ${authToken}` } }
                                          );
                                          
                                          setSelectedFaculty(prev => ({
                                            ...prev,
                                            projects: prev.projects.filter(p => p._id !== project._id)
                                          }));
                                          
                                          setSuccess('Project deleted successfully');
                                        } catch (err) {
                                          console.error('Error deleting project:', err);
                                          setError('Failed to delete project');
                                        }
                                      }
                                    }}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit Profile Form - Only accessible to profile owner or admin */}
        {selectedFaculty && editMode && canEdit && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
              <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
            </div>
            
            <div className="p-8">
              <form onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="name">
                      Full Name
                    </label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="email">
                      Email (Read Only)
                    </label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email"
                      value={profileData.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      readOnly 
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="designation">
                      Designation
                    </label>
                    <input 
                      type="text" 
                      id="designation" 
                      name="designation"
                      value={profileData.designation}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Assistant Professor" 
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="school">
                      School/Department
                    </label>
                    <input 
                      type="text" 
                      id="school" 
                      name="school"
                      value={profileData.school}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. School of Engineering"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="cabinLocation">
                      Cabin Location
                    </label>
                    <input 
                      type="text" 
                      id="cabinLocation" 
                      name="cabinLocation"
                      value={profileData.cabinLocation}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Building A, Room 204"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="profilePicture">
                      Profile Picture
                    </label>
                    <input 
                      type="file" 
                      id="profilePicture" 
                      name="profilePicture"
                      onChange={handleProfilePictureUpload}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      accept="image/jpeg, image/png, image/gif"
                    />
                    <p className="mt-1 text-xs text-gray-500">Accepted formats: JPEG, PNG, GIF. Max size: 5MB</p>
                  </div>
                  
                  <div className="md:col-span-2 mb-4">
                    <label className="block text-gray-700 mb-2">
                      Free Timings / Office Hours
                    </label>
                    
                    {profileData.freeTimings.map((timing, index) => (
                      <div key={index} className="flex space-x-4 mb-2">
                        <select
                          value={timing.day}
                          onChange={(e) => handleTimingChange(index, 'day', e.target.value)}
                          className="w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                          <option value="Sunday">Sunday</option>
                        </select>
                        
                        <input 
                          type="text"
                          value={timing.hours}
                          onChange={(e) => handleTimingChange(index, 'hours', e.target.value)}
                          placeholder="10:00 AM - 12:00 PM"
                          className="w-2/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        
                        <button
                          type="button"
                          onClick={() => removeTimingSlot(index)}
                          className="text-red-600 hover:text-red-800"
                          disabled={profileData.freeTimings.length <= 1}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={addTimingSlot}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Another Time Slot
                    </button>
                  </div>
                  
                  <div className="md:col-span-2 mb-6">
                    <label className="block text-gray-700 mb-2" htmlFor="overview">
                      Overview / Bio
                    </label>
                    <textarea 
                      id="overview" 
                      name="overview"
                      value={profileData.overview}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="6"
                      placeholder="Describe your background, research interests, teaching philosophy, etc."
                    ></textarea>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <button 
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-md"
                  >
                    Save Changes
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
        )}
      </div>
    </div>
  );
}

export default FacultyPage;
