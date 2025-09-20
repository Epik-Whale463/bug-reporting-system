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
    <div style={{maxWidth: 800, margin: '24px auto', padding: '20px'}}>
      {/* Navigation */}
      <div style={{marginBottom: '20px'}}>
        <Link href="/dashboard" style={{color: '#007bff', textDecoration: 'none'}}>Back to Dashboard</Link>
        {issue.project && (
          <>
            {' | '}
            <Link href={`/projects/${issue.project.id}/issues`} style={{color: '#007bff', textDecoration: 'none'}}>
              {issue.project.name} Issues
            </Link>
          </>
        )}
      </div>
      
      {/* Issue Header */}
      <div style={{marginBottom: '30px'}}>
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
          <span style={{fontSize: '14px', color: '#7d8590'}}>
            Reporter: {issue.reporter?.username}
          </span>
          {issue.assignee && (
            <span style={{fontSize: '14px', color: '#7d8590'}}>
              Assignee: {issue.assignee.username}
            </span>
          )}
        </div>
        
        {/* Quick Actions */}
        <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
          <div>
            <label style={{display: 'block', fontSize: '12px', marginBottom: '5px'}}>Status</label>
            <select 
              value={issue.status}
              onChange={e => updateIssue({status: e.target.value})}
              style={{
                padding: '8px', 
                border: '1px solid #30363d', 
                borderRadius: '6px',
                backgroundColor: '#0d1117',
                color: '#f0f6fc'
              }}
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{display: 'block', fontSize: '12px', marginBottom: '5px'}}>Priority</label>
            <select 
              value={issue.priority}
              onChange={e => updateIssue({priority: e.target.value})}
              style={{
                padding: '8px', 
                border: '1px solid #30363d', 
                borderRadius: '6px',
                backgroundColor: '#0d1117',
                color: '#f0f6fc'
              }}
            >
              {priorityOptions.map(priority => (
                <option key={priority} value={priority}>{priority.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{display: 'block', fontSize: '12px', marginBottom: '5px'}}>Assignee</label>
            <select 
              value={issue.assignee?.id || ''}
              onChange={e => updateIssue({assignee_id: e.target.value || null})}
              style={{
                padding: '8px', 
                border: '1px solid #30363d', 
                borderRadius: '6px',
                backgroundColor: '#0d1117',
                color: '#f0f6fc'
              }}
            >
              <option value="">Unassigned</option>
              {Array.isArray(users) && users.map(user => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Issue Description */}
      <div style={{marginBottom: '30px'}}>
        <h3>Description</h3>
        <div style={{
          border: '1px solid #30363d', 
          padding: '15px', 
          borderRadius: '6px', 
          backgroundColor: '#0d1117',
          minHeight: '60px',
          color: '#f0f6fc'
        }}>
          {issue.description ? (
            <div style={{whiteSpace: 'pre-wrap'}}>{issue.description}</div>
          ) : (
            <em style={{color: '#7d8590'}}>No description provided</em>
          )}
        </div>
      </div>
      
      {/* Comments Section */}
      <div>
        <h3>Comments ({comments.length})</h3>
        
        {/* Add Comment Form */}
        <div style={{
          marginBottom: '20px', 
          border: '1px solid #30363d', 
          borderRadius: '6px', 
          padding: '15px',
          backgroundColor: '#0d1117'
        }}>
          <form onSubmit={addComment}>
            <textarea 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              style={{
                width: '100%', 
                padding: '10px', 
                border: '1px solid #30363d', 
                borderRadius: '6px', 
                minHeight: '80px',
                marginBottom: '10px',
                backgroundColor: '#0d1117',
                color: '#f0f6fc',
                resize: 'vertical'
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
          <div style={{color: '#7d8590', fontStyle: 'italic'}}>No comments yet. Be the first to comment!</div>
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
      <div style={{
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#161b22', 
        borderRadius: '6px',
        border: '1px solid #30363d',
        fontSize: '12px',
        color: '#7d8590'
      }}>
        <div>Created: {new Date(issue.created_at).toLocaleString()}</div>
        {issue.updated_at !== issue.created_at && (
          <div>Updated: {new Date(issue.updated_at).toLocaleString()}</div>
        )}
      </div>
    </div>
  )
}