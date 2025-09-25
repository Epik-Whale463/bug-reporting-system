import { useState } from 'react'
import api from '../lib/api'
import { handleApiError, showNotification } from '../lib/errorHandling'
import Link from 'next/link'
import PixelBlast from '../components/PixelBlast'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    if (!username || !password) {
      setError('Username and password are required')
      setLoading(false)
      return
    }
    try {
      const res = await api.post('/auth/login/', { username, password })
      localStorage.setItem('token', res.data.access)
      if (res.data.refresh) localStorage.setItem('refreshToken', res.data.refresh)
      showNotification('Login successful!', 'success')
      window.location.href = '/dashboard'
    } catch (err) {
      console.error('Login error:', err)
      const errorMessage = handleApiError(err, 'Login failed')
      setError(errorMessage)
    } finally { setLoading(false) }
  }

  return (
    <div style={{position:'relative', width:'100%', minHeight:'100vh'}}>
      <PixelBlast variant="circle" pixelSize={6} color="#58a6ff" patternScale={3} patternDensity={1.2} pixelSizeJitter={0.5} enableRipples rippleSpeed={0.4} rippleThickness={0.12} rippleIntensityScale={1.5} liquid liquidStrength={0.12} liquidRadius={1.2} liquidWobbleSpeed={5} speed={0.6} edgeFade={0.25} transparent />
      <div className="container" style={{maxWidth:520, position:'relative', zIndex:2, paddingTop:80, paddingBottom:80}}>
  <div className="card auth-card">
        <div className="auth-header">
          <div className="auth-logo"></div>
          <h2 style={{margin:0}}>Sign in to Bug Reporter</h2>
        </div>
        <div className="auth-subtle">Enter your credentials to continue</div>
        <form onSubmit={submit}>
          <div style={{marginBottom:'15px'}}>
            <label>Username</label>
            <input className="form-control" value={username} onChange={e=>setUsername(e.target.value)} required />
          </div>
          <div style={{marginBottom:'15px'}}>
            <label>Password</label>
            <input className="form-control" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{width:'100%'}}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {error && <div style={{color:'var(--danger)', marginTop:'15px', textAlign:'center'}}>{error}</div>}
        <div style={{marginTop:'18px', textAlign:'center'}} className="muted">
          New to this app? <Link href="/register" style={{color:'var(--text)'}}>Create an account</Link>
        </div>
      </div>
      </div>
    </div>
  )
}
