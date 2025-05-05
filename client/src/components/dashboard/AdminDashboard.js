import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
  const { currentUser, authToken } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('projects');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalApplications: 0,
    totalStudents: 0,
    totalFaculty: 0
  });

  // Fetch admin dashboard data
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all projects
        const projectsResponse = await axios.get('http://localhost:9000/api/projects', {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });
        
        setProjects(projectsResponse.data);
        
        // Fetch application statistics
        const statsResponse = await axios.get('http://localhost:9000/api/admin/statistics', {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });
        
        setStats(statsResponse.data);
        
        // Fetch users if on the users tab
        if (activeTab === 'users') {
          const usersResponse = await axios.get('http://localhost:9000/api/admin/users', {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          });
          
          setUsers(usersResponse.data);
        }
        
        // Fetch all applications if on the applications tab
        if (activeTab === 'applications') {
          const applicationsResponse = await axios.get('http://localhost:9000/api/admin/applications', {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          });
          
          setApplications(applicationsResponse.data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [currentUser, authToken, activeTab]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle project deletion
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    
    try {
      await axios.delete(`http://localhost:9000/api/admin/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      // Remove project from state
      setProjects(projects.filter(project => project._id !== projectId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalProjects: prev.totalProjects - 1
      }));
      
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project. Please try again.');
    }
  };

  // Handle user account status toggle
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    if (!window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this user account?`)) return;
    
    try {
      await axios.put(
        `http://localhost:9000/api/admin/users/${userId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      // Update user status in state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, status: newStatus } : user
      ));
      
    } catch (err) {
      console.error('Error updating user status:', err);
      setError('Failed to update user status. Please try again.');
    }
  };

  if (loading && projects.length === 0 && !stats.totalProjects) {
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
          <h2 className="text-xl font-bold">Admin Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">System Management</p>
        </div>
        
        <nav>
          <button 
            onClick={() => handleTabChange('overview')}
            className={`w-full text-left py-2 px-4 rounded mb-2 ${activeTab === 'overview' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => handleTabChange('projects')}
            className={`w-full text-left py-2 px-4 rounded mb-2 ${activeTab === 'projects' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          >
            Projects
          </button>
          <button 
            onClick={() => handleTabChange('applications')}
            className={`w-full text-left py-2 px-4 rounded mb-2 ${activeTab === 'applications' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          >
            Applications
          </button>
          <button 
            onClick={() => handleTabChange('users')}
            className={`w-full text-left py-2 px-4 rounded mb-2 ${activeTab === 'users' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          >
            Users
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">System Overview</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Projects</h2>
                <p className="text-3xl font-bold text-blue-600">{stats.totalProjects}</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Applications</h2>
                <p className="text-3xl font-bold text-green-600">{stats.totalApplications}</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Students</h2>
                <p className="text-3xl font-bold text-purple-600">{stats.totalStudents}</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Faculty</h2>
                <p className="text-3xl font-bold text-orange-600">{stats.totalFaculty}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h2>
              
              <div className="border-t border-gray-200 pt-4">
                <p className="text-gray-500 text-center py-4">Activity feed will be implemented in future updates.</p>
              </div>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">All Projects</h1>
            
            {projects.length === 0 ? (
              <div className="bg-white shadow-md rounded-lg p-6 text-center">
                <p className="text-gray-500">No projects found in the system.</p>
              </div>
            ) : (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Title</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applications</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {projects.map(project => (
                      <tr key={project._id}>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium text-gray-900">{project.title}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">
                          {project.facultyName || "N/A"}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                          {project.domain}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                            project.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                            'bg-blue-100 text-blue-800'}`}
                          >
                            {project.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                          {project.applicationDetails?.length || 0}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteProject(project._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">All Applications</h1>
            
            {applications.length === 0 ? (
              <div className="bg-white shadow-md rounded-lg p-6 text-center">
                <p className="text-gray-500">No applications found in the system.</p>
              </div>
            ) : (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {applications.map(application => (
                      <tr key={application.id}>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium text-gray-900">{application.studentName}</div>
                          <div className="text-sm text-gray-500">{application.studentEmail}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">
                          {application.projectTitle}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">
                          {application.facultyName}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">User Management</h1>
            
            {users.length === 0 ? (
              <div className="bg-white shadow-md rounded-lg p-6 text-center">
                <p className="text-gray-500">No users found in the system.</p>
              </div>
            ) : (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user._id}>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                            user.role === 'faculty' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'}`}
                          >
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                          >
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleToggleUserStatus(user._id, user.status)}
                            className={`${user.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          >
                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
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

export default AdminDashboard;