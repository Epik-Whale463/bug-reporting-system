import { useState } from 'react'
import api from '../lib/api'
import Link from 'next/link'
import PixelBlast from '../components/PixelBlast'

export default function Register(){
  const [username,setUsername] = useState('')
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError(null)
    if (!username || !password) {
      setError('Username and password are required.')
      setLoading(false)
      return
    }
    try{
      const res = await api.post('/auth/register/', { username, email, password })
      localStorage.setItem('token', res.data.access)
      window.location.href = '/dashboard'
    }catch(err){
      // Show DRF validation errors more clearly
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          setError(err.response.data)
        } else if (typeof err.response.data === 'object') {
          setError(Object.values(err.response.data).join(' '))
        } else {
          setError('Registration failed.')
        }
      } else {
        setError(err.message || 'Registration failed.')
      }
    }finally{ setLoading(false) }
  }

  return (
    <div style={{position:'relative', width:'100%', minHeight:'100vh'}}>
      <PixelBlast variant="circle" pixelSize={6} color="#58a6ff" patternScale={3} patternDensity={1.2} pixelSizeJitter={0.5} enableRipples rippleSpeed={0.4} rippleThickness={0.12} rippleIntensityScale={1.5} liquid liquidStrength={0.12} liquidRadius={1.2} liquidWobbleSpeed={5} speed={0.6} edgeFade={0.25} transparent />
      <div className="container" style={{maxWidth:420, position:'relative', zIndex:2, paddingTop:80, paddingBottom:80}}>
        <div className="card auth-card">
        <div className="auth-header">
          <div className="auth-logo"></div>
          <h2 style={{margin:0}}>Create your account</h2>
        </div>
        <div className="auth-subtle">Join the Bug Reporter app — it’s free and private.</div>
        <form onSubmit={submit}>
          <div style={{marginBottom:12}}>
            <label>Username</label>
            <input className="form-control" value={username} onChange={e=>setUsername(e.target.value)} required />
          </div>
          <div style={{marginBottom:12}}>
            <label>Email</label>
            <input className="form-control" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div style={{marginBottom:12}}>
            <label>Password</label>
            <input className="form-control" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <button disabled={loading} type="submit" className="btn btn-primary" style={{width:'100%'}}>Register</button>
        </form>
        {error && <div style={{color:'var(--danger)', marginTop:12}}>{JSON.stringify(error)}</div>}
        <div style={{marginTop:16,textAlign:'center'}} className="muted">
          Already have an account? <Link href="/" style={{color:'var(--text)'}}>Sign in →</Link>
        </div>
      </div>
      </div>
    </div>
  )
}
