import React, { useState } from 'react'
import api from '../lib/api'

const CommentThread = ({ comment, issueId, onCommentAdded, depth = 0 }) => {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [replying, setReplying] = useState(false)

  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    setReplying(true)
    try {
      await api.post(`/issues/${issueId}/comments/`, {
        content: replyContent,
        parent_comment: comment.id
      })
      
      setReplyContent('')
      setShowReplyForm(false)
      onCommentAdded()
    } catch (err) {
      alert('Failed to add reply: ' + (err.response?.data?.detail || err.message))
    } finally {
      setReplying(false)
    }
  }

  const maxDepth = 5 // Maximum nesting depth
  const indentSize = Math.min(depth * 20, maxDepth * 20) // 20px per level, max 100px

  return (
    <div style={{ 
      marginLeft: `${indentSize}px`, 
      marginBottom: '12px',
      borderLeft: depth > 0 ? '2px solid #30363d' : 'none',
      paddingLeft: depth > 0 ? '16px' : '0'
    }}>
      {/* Comment Content */}
      <div style={{
        border: '1px solid #30363d', 
        borderRadius: '6px', 
        padding: '15px', 
        backgroundColor: depth === 0 ? '#161b22' : '#0d1117'
      }}>
        {/* Comment Header */}
        <div style={{
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '10px',
          fontSize: '14px',
          color: '#7d8590'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{color: '#f0f6fc'}}>{comment.author?.username || 'Unknown User'}</strong>
            {comment.reply_count > 0 && (
              <span style={{ 
                fontSize: '12px', 
                backgroundColor: '#21262d', 
                padding: '2px 6px', 
                borderRadius: '10px' 
              }}>
                {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>
          <span>{new Date(comment.created_at).toLocaleString()}</span>
        </div>
        
        {/* Comment Body */}
        <div style={{
          whiteSpace: 'pre-wrap', 
          color: '#f0f6fc',
          lineHeight: '1.5',
          marginBottom: '10px'
        }}>
          {comment.content}
        </div>
        
        {/* Comment Actions */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            style={{
              background: 'none',
              border: 'none',
              color: '#7d8590',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.color = '#f0f6fc'}
            onMouseOut={(e) => e.target.style.color = '#7d8590'}
          >
            {showReplyForm ? 'Cancel' : 'Reply'}
          </button>
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <div style={{ 
          marginTop: '12px',
          marginLeft: '16px',
          border: '1px solid #30363d',
          borderRadius: '6px',
          padding: '12px',
          backgroundColor: '#0d1117'
        }}>
          <form onSubmit={handleReply}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Reply to ${comment.author?.username}...`}
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '8px',
                border: '1px solid #30363d',
                borderRadius: '4px',
                backgroundColor: '#0d1117',
                color: '#f0f6fc',
                resize: 'vertical',
                fontSize: '14px',
                marginBottom: '8px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowReplyForm(false)
                  setReplyContent('')
                }}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={replying || !replyContent.trim()}
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                {replying ? 'Replying...' : 'Reply'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          {comment.replies.map(reply => (
            <CommentThread
              key={reply.id}
              comment={reply}
              issueId={issueId}
              onCommentAdded={onCommentAdded}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CommentThread