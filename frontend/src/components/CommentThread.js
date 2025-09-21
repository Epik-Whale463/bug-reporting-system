import React, { useState } from 'react'
import api from 'lib/api'

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
  const indentSize = Math.min(depth * 16, maxDepth * 16) // 16px per level, max 80px

  return (
    <div style={{ 
      marginLeft: `${indentSize}px`, 
      marginBottom: '12px',
      borderLeft: depth > 0 ? '2px solid var(--border)' : 'none',
      paddingLeft: depth > 0 ? '12px' : '0'
    }}>
      {/* Comment Content */}
      <div style={{
        background: depth === 0 ? 'var(--panel)' : 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 1px 3px rgba(199,90,58,0.04)'
      }}>
        {/* Comment Header */}
        <div style={{
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <strong className="comment-author">{comment.author?.username || 'Unknown User'}</strong>
            {comment.reply_count > 0 && (
              <span style={{ 
                fontSize: '11px', 
                padding: '1px 6px',
                backgroundColor: 'var(--accent)',
                color: 'white',
                borderRadius: '8px',
                fontWeight: '500',
                fontFamily: 'var(--font-main)'
              }}>
                {comment.reply_count}
              </span>
            )}
          </div>
          <span className="comment-meta">{new Date(comment.created_at).toLocaleString()}</span>
        </div>
        
        {/* Comment Body */}
        <div className="comment-text" style={{
          whiteSpace: 'pre-wrap',
          marginBottom: '8px'
        }}>
          {comment.content}
        </div>
        
        {/* Comment Actions */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: '500',
              fontFamily: 'var(--font-main)',
              transition: 'color 0.2s'
            }}
          >
            {showReplyForm ? 'Cancel' : 'Reply'}
          </button>
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <div style={{ 
          marginTop: '8px',
          marginLeft: '12px',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '10px',
          background: 'var(--bg)'
        }}>
          <form onSubmit={handleReply}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Reply to ${comment.author?.username}...`}
              style={{
                width: '100%',
                minHeight: '50px',
                padding: '8px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                background: 'var(--panel)',
                color: 'var(--text)',
                resize: 'vertical',
                fontSize: '14px',
                fontFamily: 'var(--font-main)',
                lineHeight: '1.4',
                marginBottom: '6px',
                '-webkit-font-smoothing': 'antialiased',
                '-moz-osx-font-smoothing': 'grayscale'
              }}
            />
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowReplyForm(false)
                  setReplyContent('')
                }}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-main)',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={replying || !replyContent.trim()}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: replying ? 'not-allowed' : 'pointer',
                  opacity: replying || !replyContent.trim() ? 0.6 : 1,
                  fontFamily: 'var(--font-main)',
                  fontWeight: '600'
                }}
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