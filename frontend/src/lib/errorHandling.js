// Error handling utilities
export const handleApiError = (error, fallbackMessage = 'An unexpected error occurred') => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response
    
    if (status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token')
      window.location.href = '/login'
      return 'Session expired. Please login again.'
    }
    
    if (status === 403) {
      return 'You do not have permission to perform this action.'
    }
    
    if (status === 404) {
      return 'The requested resource was not found.'
    }
    
    if (status === 500) {
      return 'Server error. Please try again later.'
    }
    
    // Extract error message from response
    if (data) {
      if (typeof data === 'string') return data
      if (data.detail) return data.detail
      if (data.message) return data.message
      if (data.error) return data.error
      if (data.non_field_errors) return data.non_field_errors.join(', ')
      
      // Handle field-specific errors
      const fieldErrors = []
      Object.keys(data).forEach(field => {
        if (Array.isArray(data[field])) {
          fieldErrors.push(`${field}: ${data[field].join(', ')}`)
        } else if (typeof data[field] === 'string') {
          fieldErrors.push(`${field}: ${data[field]}`)
        }
      })
      if (fieldErrors.length > 0) return fieldErrors.join('; ')
    }
    
    return `Error ${status}: ${fallbackMessage}`
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection and try again.'
  } else {
    // Something else happened
    return error.message || fallbackMessage
  }
}

export const showNotification = (message, type = 'info') => {
  // Create notification element
  const notification = document.createElement('div')
  notification.className = `notification notification-${type}`
  notification.textContent = message
  
  // Style the notification
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    max-width: 400px;
    word-wrap: break-word;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    transform: translateX(100%);
  `
  
  // Set background color based on type
  const colors = {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6'
  }
  notification.style.backgroundColor = colors[type] || colors.info
  
  document.body.appendChild(notification)
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)'
  }, 10)
  
  // Remove after delay
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)'
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 300)
  }, 5000)
}

export const withErrorHandling = (asyncFn, onError = null) => {
  return async (...args) => {
    try {
      return await asyncFn(...args)
    } catch (error) {
      const errorMessage = handleApiError(error)
      
      if (onError) {
        onError(errorMessage)
      } else {
        showNotification(errorMessage, 'error')
      }
      
      throw error // Re-throw if caller needs to handle it
    }
  }
}