import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import Link from 'next/link'

export default function Dashboard(){
  const [projects, setProjects] = useState([])
  const [projectStats, setProjectStats] = useState({})
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProject, setNewProject] = useState({name: '', description: ''})
  const [creating, setCreating] = useState(false)

  const [editingProject, setEditingProject] = useState(null)
  const [editProject, setEditProject] = useState({name: '', description: ''})
  const [updating, setUpdating] = useState(false)

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(()=>{
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/'
      return
    }

    loadProjects()
  },[])

  const loadProjects = async () => {
    try {
      const res = await api.get('/projects/')
      // Handle both paginated and non-paginated responses
      const projectsData = res.data.results || res.data
      const validProjects = Array.isArray(projectsData) ? projectsData : []
      setProjects(validProjects)
      
      // Load stats for each project
      const stats = {}
      for (const project of validProjects) {
        try {
          const issuesRes = await api.get(`/projects/${project.id}/issues/`)
          const issues = issuesRes.data.results || issuesRes.data || []
          stats[project.id] = {
            open: issues.filter(issue => issue.status === 'open').length,
            in_progress: issues.filter(issue => issue.status === 'in_progress').length,
            closed: issues.filter(issue => issue.status === 'closed').length,
            total: issues.length
          }
        } catch (err) {
          stats[project.id] = { open: 0, in_progress: 0, closed: 0, total: 0 }
        }
      }
      setProjectStats(stats)
    } catch (err) {
      setError(err.response?.data || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!newProject.name) return
    
    setCreating(true)
    try {
      await api.post('/projects/', newProject)
      setNewProject({name: '', description: ''})
      setShowCreateForm(false)
      loadProjects()
    } catch (err) {
      alert('Failed to create project: ' + (err.response?.data?.detail || err.message))
    } finally {
      setCreating(false)
    }
  }

  const handleEditProject = (project) => {
    setEditingProject(project)
    setEditProject({name: project.name, description: project.description || ''})
  }

  const handleUpdateProject = async (e) => {
    e.preventDefault()
    if (!editProject.name || !editingProject) return
    
    setUpdating(true)
    try {
      await api.put(`/projects/${editingProject.id}/`, editProject)
      setEditingProject(null)
      setEditProject({name: '', description: ''})
      loadProjects()
    } catch (err) {
      alert('Failed to update project: ' + (err.response?.data?.detail || err.message))
    } finally {
      setUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingProject(null)
    setEditProject({name: '', description: ''})
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    window.location.href = '/'
  }

  if(loading) return <div className="dashboard-container"><div className="container">Loading...</div></div>
  if(error) return <div className="dashboard-container"><div className="container" style={{color:'red'}}>{error}</div></div>

  return (
    <div className="dashboard-container">
      <div className="container">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <h1 style={{fontSize:'36px', fontWeight:'700', margin:'0', letterSpacing:'-0.02em'}}>Projects</h1>
        <button onClick={handleLogout} className="btn btn-danger">
          Logout
        </button>
      </div>
      
      <div style={{marginBottom:'20px'}}>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn btn-primary">
          {showCreateForm ? 'Cancel' : 'Create New Project'}
        </button>
      </div>

      {/* Search Projects */}
      {projects && projects.length > 0 && (
        <div style={{marginBottom:'20px'}}>
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Find a project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="project-search-input"
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '12px 16px',
                fontSize: '14px',
                background: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: '6px',
                color: '#f0f6fc'
              }}
            />
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Project</h3>
              <button onClick={() => setShowCreateForm(false)} className="modal-close">×</button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div style={{marginBottom:'15px'}}>
                <label>Project Name *</label>
                <input 
                  className="form-control" 
                  value={newProject.name} 
                  onChange={e => setNewProject({...newProject, name: e.target.value})} 
                  required 
                  autoFocus
                />
              </div>
              <div style={{marginBottom:'15px'}}>
                <label>Description</label>
                <textarea 
                  className="form-control" 
                  value={newProject.description} 
                  onChange={e => setNewProject({...newProject, description: e.target.value})} 
                  style={{minHeight:'80px'}} 
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creating || !newProject.name} className="btn btn-success">
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {projects && projects.length === 0 ? (
        <div className="card" style={{textAlign:'center', padding:'40px'}}>
          <h3 style={{color:'#8b949e', marginBottom:'10px'}}>No Projects Yet</h3>
          <p className="muted">Create your first project to get started!</p>
        </div>
      ) : (
        (() => {
          // Filter projects based on search query
          const filteredProjects = projects.filter(project => {
            if (!searchQuery) return true
            const query = searchQuery.toLowerCase()
            return (
              project.name.toLowerCase().includes(query) ||
              (project.description && project.description.toLowerCase().includes(query))
            )
          })

          return filteredProjects.length === 0 && searchQuery ? (
            <div className="card" style={{textAlign:'center', padding:'40px'}}>
              <h3 style={{color:'#8b949e', marginBottom:'10px'}}>No projects found</h3>
              <p className="muted">Try a different search term</p>
              <button 
                onClick={() => setSearchQuery('')} 
                className="btn btn-primary" 
                style={{marginTop:'10px'}}
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="project-list-container">
              {filteredProjects.map(project => (
                <div key={project.id} className="project-list-item">
                  <div className="project-main-info">
                    <div className="project-header">
                      <Link 
                        href={`/projects/${project.id}/issues`} 
                        className="project-name"
                      >
                        {project.name}
                      </Link>
                      <button
                        className="edit-button"
                        onClick={(e) => {
                          e.preventDefault()
                          handleEditProject(project)
                        }}
                        title="Edit project"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m18 2 4 4-8 8-4 0 0-4 8-8z"/>
                          <path d="M2 22l4-4"/>
                        </svg>
                      </button>
                    </div>
                    
                    {project.description && (
                      <p className="project-description">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="project-meta">
                      <span>Updated {new Date(project.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      })}</span>
                      {projectStats[project.id] && (
                        <span>{projectStats[project.id].total} {projectStats[project.id].total === 1 ? 'issue' : 'issues'}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })()
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Project</h3>
              <button onClick={handleCancelEdit} className="modal-close">×</button>
            </div>
            <form onSubmit={handleUpdateProject}>
              <div style={{marginBottom:'15px'}}>
                <label>Project Name *</label>
                <input 
                  className="form-control" 
                  value={editProject.name} 
                  onChange={e => setEditProject({...editProject, name: e.target.value})} 
                  required 
                />
              </div>
              <div style={{marginBottom:'15px'}}>
                <label>Description</label>
                <textarea 
                  className="form-control" 
                  value={editProject.description} 
                  onChange={e => setEditProject({...editProject, description: e.target.value})} 
                  style={{minHeight:'80px'}} 
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={updating || !editProject.name} className="btn btn-primary">
                  {updating ? 'Updating...' : 'Update Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  )
}
