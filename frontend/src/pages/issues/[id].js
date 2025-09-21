import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import api from '../../lib/api'
import Link from 'next/link'
import CommentThread from '../../components/CommentThread'

export default function IssueDetail() {
  const router = useRouter()
  const { id } = router.query
  
  const [issue, setIssue] = useState(null)
  const [comments, setComments] = useState([])
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Comment form
  const [newComment, setNewComment] = useState('')
  const [commenting, setCommenting] = useState(false)
  
  useEffect(() => {
    if (!id) return
    
    // Check auth
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }
    
    loadData()
    loadCurrentUser()
  }, [id])
  
  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load issue details
      const issueRes = await api.get(`/issues/${id}/`)
      setIssue(issueRes.data)
      
  // Load comments (normalize paginated or non-paginated responses)
  const commentsRes = await api.get(`/issues/${id}/comments/`)
  const commentsPayload = commentsRes.data
  const commentsArray = Array.isArray(commentsPayload) ? commentsPayload : (commentsPayload?.results || [])
  setComments(Array.isArray(commentsArray) ? commentsArray : [])
      
      // Load users for assignment
      try {
        const usersRes = await api.get('/users/')
        const usersPayload = usersRes.data
        const usersArray = Array.isArray(usersPayload) ? usersPayload : (usersPayload?.results || [])
        setUsers(Array.isArray(usersArray) ? usersArray : [])
      } catch {
        // Users endpoint might not exist, that's ok
        setUsers([])
      }
      
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Issue not found')
        return
      }
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
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
  
  const addComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    
    setCommenting(true)
    try {
      await api.post(`/issues/${id}/comments/`, {
        content: newComment
      })
      
      setNewComment('')
      loadData() // Reload comments
    } catch (err) {
      console.error('Comment creation error:', err.response?.data)
      alert('Failed to add comment: ' + (err.response?.data?.detail || err.message))
    } finally {
      setCommenting(false)
    }
  }
  
  const updateIssue = async (updates) => {
    try {
      await api.patch(`/issues/${id}/`, updates)
      loadData()
    } catch (err) {
      alert('Failed to update issue: ' + (err.response?.data?.detail || err.message))
    }
  }

  // Helper function to check if current user is project owner
  const isProjectOwner = () => {
    return currentUser && issue && issue.project && issue.project.owner && currentUser.id === issue.project.owner.id
  }
  
  if (loading) return <div>Loading...</div>
  if (error) return <div style={{color: 'red'}}>Error: {error}</div>
  if (!issue) return <div>Issue not found</div>
  
  const statusOptions = ['open', 'in_progress', 'closed']
  const priorityOptions = ['low', 'medium', 'high', 'critical']
  const statusColors = {
    open: '#238636',
    in_progress: '#9a6700', 
    closed: '#da3633'
  }
  const priorityColors = {
    low: '#6e7781',
    medium: '#0969da',
    high: '#bc4c00',
    critical: '#cf222e'
  }
  
  return (
    <div className="container wide">
      {/* Navigation */}
      <div style={{marginBottom: '32px'}}>
        <Link href="/dashboard" className="gh-btn">Back to Dashboard</Link>
        {issue.project && (
          <>
            {' | '}
            <Link href={`/projects/${issue.project.id}/issues`} style={{color: 'var(--text)', textDecoration: 'none'}}>
              {issue.project.name} Issues
            </Link>
          </>
        )}
      </div>
      
      {/* Issue Header */}
  <div style={{marginBottom: '36px'}}>
        <h1 style={{marginBottom: '10px'}}>{issue.title}</h1>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px'}}>
          <span style={{
            padding: '4px 8px', 
            borderRadius: '4px', 
            fontSize: '12px', 
            backgroundColor: statusColors[issue.status], 
            color: 'white'
          }}>
            {issue.status.replace('_', ' ').toUpperCase()}
          </span>
          <span style={{
            padding: '4px 8px', 
            borderRadius: '4px', 
            fontSize: '12px', 
            backgroundColor: priorityColors[issue.priority], 
            color: 'white'
          }}>
            {issue.priority.toUpperCase()}
          </span>
          <span style={{fontSize: '14px', color: 'var(--muted)'}}>
            Reporter: {issue.reporter?.username}
          </span>
          {issue.assignee && (
            <span style={{fontSize: '14px', color: 'var(--muted)'}}>
              Assignee: {issue.assignee.username}
            </span>
          )}
        </div>
        {/* Issue Description (moved above quick actions) */}
        <div style={{marginBottom: '18px'}}>
          <div style={{
            padding: '20px', 
            borderRadius: '12px', 
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            minHeight: '60px',
            color: 'var(--text)',
            lineHeight: 1.6
          }}>
            {issue.description ? (
              <div style={{whiteSpace: 'pre-wrap'}}>{issue.description}</div>
            ) : (
              <em style={{color: 'var(--muted)'}}>No description provided</em>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{display: 'flex', gap: '20px', marginBottom: '18px'}}>
          <div>
            <label style={{display: 'block', fontSize: '12px', marginBottom: '5px', color: 'var(--muted)'}}>Status</label>
            <select 
              value={issue.status}
              onChange={e => updateIssue({status: e.target.value})}
              className="form-control"
              style={{fontSize: '14px', padding: '8px 12px', minWidth: '120px'}}
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{display: 'block', fontSize: '12px', marginBottom: '5px', color: 'var(--muted)'}}>Priority</label>
            <select 
              value={issue.priority}
              onChange={e => updateIssue({priority: e.target.value})}
              className="form-control"
              style={{fontSize: '14px', padding: '8px 12px', minWidth: '120px'}}
            >
              {priorityOptions.map(priority => (
                <option key={priority} value={priority}>{priority.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{display: 'block', fontSize: '12px', marginBottom: '5px', color: 'var(--muted)'}}>Assignee</label>
            {isProjectOwner() ? (
              <select 
                value={issue.assignee?.id || ''}
                onChange={e => updateIssue({assignee_id: e.target.value || null})}
                className="form-control"
                style={{fontSize: '14px', padding: '8px 12px', minWidth: '140px'}}
              >
                <option value="">Unassigned</option>
                {Array.isArray(users) && users.map(user => (
                  <option key={user.id} value={user.id}>{user.username}</option>
                ))}
              </select>
            ) : (
              <input 
                className="form-control" 
                value={issue.assignee ? issue.assignee.username : 'Unassigned'} 
                disabled 
                style={{fontSize: '14px', padding: '8px 12px', minWidth: '140px', color: 'var(--muted)', backgroundColor: 'var(--input-bg)', cursor: 'not-allowed'}}
                title="Only project owner can assign issues"
              />
            )}
          </div>
        </div>
      </div>
      
      {/* (Description moved above quick actions inside header) */}
      
      {/* Comments Section */}
      <div>
        <h3>Comments ({comments.length})</h3>
        
        {/* Add Comment Form */}
        <div className="card" style={{marginBottom: '24px'}}>
          <form onSubmit={addComment}>
            <textarea 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="form-control"
              style={{
                minHeight: '80px',
                marginBottom: '12px',
                resize: 'vertical',
                fontFamily: 'var(--font-main)',
                fontSize: '14px',
                lineHeight: '1.4'
              }}
            />
            <button 
              type="submit" 
              disabled={commenting || !newComment.trim()}
              className="btn btn-primary"
              style={{
                padding: '8px 16px'
              }}
            >
              {commenting ? 'Adding...' : 'Add Comment'}
            </button>
          </form>
        </div>
        
        {/* Comments List */}
        {comments.length === 0 ? (
          <div style={{
            color: 'var(--muted)', 
            fontStyle: 'italic', 
            textAlign: 'center', 
            padding: '20px',
            fontFamily: 'var(--font-main)',
            fontSize: '14px'
          }}>
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div>
            {comments.map(comment => (
              <CommentThread
                key={comment.id}
                comment={comment}
                issueId={id}
                onCommentAdded={loadData}
                depth={0}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Metadata */}
      <div className="card" style={{
        marginTop: '36px', 
        fontSize: '12px',
        color: 'var(--muted)'
      }}>
        <div>Created: {new Date(issue.created_at).toLocaleString()}</div>
        {issue.updated_at !== issue.created_at && (
          <div>Updated: {new Date(issue.updated_at).toLocaleString()}</div>
        )}
      </div>
    </div>
  )
}