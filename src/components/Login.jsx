import { useState } from 'react'
import { login } from '../services/api.js'

export default function Login({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username || !password) {
      setError('Fill all fields')
      return
    }
    try {
      const data = await login(username, password)
      onSuccess(data.token)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="card">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Login</button>
      </form>
    </div>
  )
}
