import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import api from '../../../lib/api'
import Link from 'next/link'

export default function ProjectIssues() {
  const router = useRouter()
  const { id } = router.query

  const [project, setProject] = useState(null)
  const [issues, setIssues] = useState([])
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [modalClosing, setModalClosing] = useState(false)
  const [newIssue, setNewIssue] = useState({ title: '', description: '', priority: 'medium', assignee_id: '' })
  const [creating, setCreating] = useState(false)

  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(10)

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchInput)
      setCurrentPage(1) // Reset to first page when search changes
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchInput])

  useEffect(() => {
    if (!id) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      router.push('/')
      return
    }
    loadProjectData()
    loadUsers()
    loadCurrentUser()
  }, [id])

  // Load issues when page, filters, or search changes
  useEffect(() => {
    if (!id) return
    loadIssues()
  }, [id, currentPage, statusFilter, priorityFilter, searchQuery])

  const loadProjectData = async () => {
    try {
      const projectRes = await api.get(`/projects/${id}/`)
      setProject(projectRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  const loadUsers = async () => {
    try {
      const usersRes = await api.get('/users/')
      // API may return a paginated object { results: [...] } or a raw array
      const payload = usersRes.data
      const arr = Array.isArray(payload) ? payload : (payload?.results || [])
      setUsers(Array.isArray(arr) ? arr : [])
    } catch (err) {
      // If users endpoint fails, we'll extract from issues later
      console.warn('Failed to load users:', err)
    }
  }

  const loadCurrentUser = async () => {
    try {
      const userRes = await api.get('/auth/user/')
      setCurrentUser(userRes.data)
    } catch (err) {
      console.warn('Failed to load current user:', err)
    }
  }

  const loadIssues = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      if (statusFilter) {
        params.append('status', statusFilter)
      }
      if (priorityFilter) {
        params.append('priority', priorityFilter)
      }

      const issuesRes = await api.get(`/projects/${id}/issues/?${params.toString()}`)
      
      // Handle paginated response
      if (issuesRes.data.results) {
        setIssues(issuesRes.data.results)
        setTotalCount(issuesRes.data.count)
        setTotalPages(Math.ceil(issuesRes.data.count / pageSize))
      } else {
        // Fallback for non-paginated response
        setIssues(issuesRes.data)
        setTotalCount(issuesRes.data.length)
        setTotalPages(1)
      }

      // Extract users from issues if users weren't loaded separately
      if (!Array.isArray(users) || users.length === 0) {
        const uniqueUsers = []
        const userMap = new Map()
        const issueList = issuesRes.data.results || issuesRes.data
        issueList.forEach(issue => {
          if (issue.reporter && !userMap.has(issue.reporter.id)) {
            userMap.set(issue.reporter.id, issue.reporter)
            uniqueUsers.push(issue.reporter)
          }
          if (issue.assignee && !userMap.has(issue.assignee.id)) {
            userMap.set(issue.assignee.id, issue.assignee)
            uniqueUsers.push(issue.assignee)
          }
        })
        setUsers(uniqueUsers)
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }
  const createIssue = async (e) => {
    e.preventDefault()
    if (!newIssue.title) return
    setCreating(true)
    try {
      await api.post(`/projects/${id}/issues/`, { ...newIssue, assignee_id: newIssue.assignee_id || null })
      setNewIssue({ title: '', description: '', priority: 'medium', assignee_id: '' })
      closeModal()
      loadIssues() // Reload current page
    } catch (err) {
      alert('Failed to create issue: ' + (err.response?.data?.detail || err.message))
    } finally {
      setCreating(false)
    }
  }

  const closeModal = () => {
    setModalClosing(true)
    setTimeout(() => {
      setShowCreateForm(false)
      setModalClosing(false)
    }, 200) // Match animation duration
  }

  const updateIssueStatus = async (issueId, status) => {
    try {
      await api.patch(`/issues/${issueId}/`, { status })
      loadIssues() // Reload current page
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.detail || err.message))
    }
  }

  const updateIssueAssignee = async (issueId, assignee_id) => {
    try {
      await api.patch(`/issues/${issueId}/`, { assignee_id: assignee_id || null })
      loadIssues() // Reload current page
    } catch (err) {
      alert('Failed to update assignee: ' + (err.response?.data?.detail || err.message))
    }
  }

  // Helper function to check if current user is project owner
  const isProjectOwner = () => {
    return currentUser && project && project.owner && currentUser.id === project.owner.id
  }

  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1) // Reset to first page when filters change
    if (filterType === 'status') {
      setStatusFilter(value)
    } else if (filterType === 'priority') {
      setPriorityFilter(value)
    }
  }

  const Pagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20 }}>
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="btn btn-primary"
          style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
        >
          First
        </button>
        
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn btn-primary"
          style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
        >
          Previous
        </button>

        {pages.map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`btn ${page === currentPage ? 'btn-success' : 'btn-primary'}`}
            style={{
              minWidth: 40,
              backgroundColor: page === currentPage ? '#28a745' : undefined
            }}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn btn-primary"
          style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
        >
          Next
        </button>

        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="btn btn-primary"
          style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
        >
          Last
        </button>
      </div>
    )
  }

  if (loading && issues.length === 0) return <div className="container">Loading...</div>
  if (error) return <div className="container" style={{ color: 'red' }}>Error: {error}</div>

  const statusOptions = ['open', 'in_progress', 'closed']
  const priorityOptions = ['low', 'medium', 'high', 'critical']
  const statusColors = { open: '#238636', in_progress: '#9a6700', closed: '#da3633' }
  const priorityColors = { low: '#6e7781', medium: '#0969da', high: '#bc4c00', critical: '#cf222e' }

  return (
    <div className="container wide">
      {/* Navigation Section */}
      <div style={{ marginBottom: 32 }}>
        <Link href="/dashboard" className="gh-btn">
          ← Back to Projects
        </Link>
      </div>

      {/* Project Header Section */}
      <div className="issues-header">
        <h1>{project?.name}</h1>
        {project?.description && (
          <p className="project-description">{project?.description}</p>
        )}
        <div className="section-label">Issues</div>
      </div>

      {/* Actions and Filters Section */}
  <div style={{ marginBottom: 28 }}>
        {/* Create Issue Button */}
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn btn-primary">
            {showCreateForm ? 'Cancel' : 'Create Issue'}
          </button>
        </div>

        {/* Filters Row */}
  <div className="issues-filters-container" style={{ alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search issues..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="form-control"
            style={{ maxWidth: 400, minWidth: 250 }}
          />
          
          <select 
            value={statusFilter} 
            onChange={e => handleFilterChange('status', e.target.value)} 
            className="form-control" 
            style={{ maxWidth: 150 }}
          >
            <option value="">All Status</option>
            {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
          </select>

          <select 
            value={priorityFilter} 
            onChange={e => handleFilterChange('priority', e.target.value)} 
            className="form-control" 
            style={{ maxWidth: 150 }}
          >
            <option value="">All Priority</option>
            {priorityOptions.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
          </select>
          
          {(searchQuery || statusFilter || priorityFilter) && (
            <button 
              onClick={() => {
                setSearchInput('')
                setSearchQuery('')
                setStatusFilter('')
                setPriorityFilter('')
                setCurrentPage(1)
              }} 
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className={`modal-overlay ${modalClosing ? 'closing' : ''}`} onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Issue</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={createIssue}>
              <div style={{marginBottom:'15px'}}>
                <label>Issue Title *</label>
                <input 
                  className="form-control" 
                  value={newIssue.title} 
                  onChange={e => setNewIssue({...newIssue, title: e.target.value})} 
                  required 
                  autoFocus
                />
              </div>
              <div style={{marginBottom:'15px'}}>
                <label>Description</label>
                <textarea 
                  className="form-control" 
                  value={newIssue.description} 
                  onChange={e => setNewIssue({...newIssue, description: e.target.value})} 
                  style={{minHeight:'80px'}} 
                />
              </div>
              <div className="form-row" style={{marginBottom:'15px'}}>
                <div className="col">
                  <label>Priority</label>
                  <select 
                    className="form-control" 
                    value={newIssue.priority} 
                    onChange={e => setNewIssue({...newIssue, priority: e.target.value})}
                  >
                    {priorityOptions.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="col">
                  <label>Assignee</label>
                  {isProjectOwner() ? (
                    <select 
                      className="form-control" 
                      value={newIssue.assignee_id} 
                      onChange={e => setNewIssue({...newIssue, assignee_id: e.target.value})}
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                    </select>
                  ) : (
                    <input 
                      className="form-control" 
                      value="Unassigned (only project owner can assign)" 
                      disabled 
                      style={{color: 'var(--muted)', fontSize: '14px'}}
                    />
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creating || !newIssue.title} className="btn btn-success">
                  {creating ? 'Creating...' : 'Create Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

  <div style={{ marginTop: 8 }}>
        <div className="issue-list-header">
          <h2 style={{margin:0}}>Issues</h2>
          <div className="muted" style={{ fontSize: 14 }}>
            {loading ? 'Loading...' : `Page ${currentPage} of ${totalPages} • ${totalCount} total issues`}
          </div>
        </div>
        
        {issues.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            {searchQuery || statusFilter || priorityFilter ? (
              <div>
                <p>No issues found matching your criteria.</p>
                <p className="muted">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div>
                <p>No issues in this project yet.</p>
                <p className="muted">Create the first issue above!</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {issues.map(issue => (
              <div key={issue.id} className="issue-row">
                <div>
                  <h3><Link href={`/issues/${issue.id}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>{issue.title}</Link></h3>
                  <p className="issue-description muted">{issue.description || 'No description'}</p>
                  <div className="issue-meta">
                    <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, backgroundColor: statusColors[issue.status], color: 'white' }}>{issue.status.replace('_', ' ').toUpperCase()}</span>
                    <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, backgroundColor: priorityColors[issue.priority], color: 'white' }}>{issue.priority.toUpperCase()}</span>
                    <span style={{ fontSize: 12 }} className="muted">Reporter: {issue.reporter?.username}</span>
                    {issue.assignee && <span style={{ fontSize: 12 }} className="muted">Assignee: {issue.assignee.username}</span>}
                  </div>
                </div>

                <div className="issue-row-controls">
                  <select className="form-control" value={issue.status} onChange={e => updateIssueStatus(issue.id, e.target.value)} style={{fontSize:12}}>
                    {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
                  </select>
                  {isProjectOwner() ? (
                    <select className="form-control" value={issue.assignee?.id || ''} onChange={e => updateIssueAssignee(issue.id, e.target.value)} style={{fontSize:12}}>
                      <option value="">Unassigned</option>
                      { (Array.isArray(users) ? users : (users?.results || [])).map(u => <option key={u.id} value={u.id}>{u.username}</option>) }
                    </select>
                  ) : (
                    <input 
                      className="form-control" 
                      value={issue.assignee ? issue.assignee.username : 'Unassigned'} 
                      disabled 
                      style={{fontSize: 12, color: 'var(--muted)', backgroundColor: 'var(--input-bg)', cursor: 'not-allowed'}}
                      title="Only project owner can assign issues"
                    />
                  )}
                </div>
              </div>
            ))}
            
            <Pagination />
          </div>
        )}
      </div>
    </div>
  )
}