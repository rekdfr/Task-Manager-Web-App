import { useState } from 'react'
import { register } from '../services/api.js'

export default function Register({ onBack }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username || !password) {
      setSuccess(false)
      setMessage('Fill all fields')
      return
    }
    try {
      await register(username, password)
      setSuccess(true)
      setMessage('Registered! Please login.')
    } catch (err) {
      setSuccess(false)
      setMessage(err.message)
    }
  }

  return (
    <div className="card">
      <h2>Register</h2>
      {message && <p className={success ? 'success' : 'error'}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Register</button>
      </form>
      <p className="toggle-text">
        Already have an account?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); onBack() }}>Login</a>
      </p>
    </div>
  )
}
