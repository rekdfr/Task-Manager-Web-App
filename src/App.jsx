import { useState, useEffect } from 'react'
import Navbar from './components/Navbar.jsx'
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'
import TaskForm from './components/TaskForm.jsx'
import TaskList from './components/TaskList.jsx'
import { getTasks } from './services/api.js'

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [showRegister, setShowRegister] = useState(false)
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    if (!token) return
    getTasks()
      .then(setTasks)
      .catch(() => logout())
  }, [token])

  function handleLogin(newToken) {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setShowRegister(false)
  }

  function logout() {
    localStorage.removeItem('token')
    setTasks([])
    setToken(null)
  }

  if (!token) {
    return (
      <div className="container">
        <h1>Task Manager</h1>
        {showRegister ? (
          <Register onBack={() => setShowRegister(false)} />
        ) : (
          <>
            <Login onSuccess={handleLogin} />
            <p className="toggle-text">
              No account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setShowRegister(true) }}>
                Register
              </a>
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="container">
      <Navbar title="Task Manager" onLogout={logout} />
      <div className="card">
        <TaskForm
          onAdd={(task) => setTasks((prev) => [...prev, task])}
        />
      </div>
      <TaskList tasks={tasks} onDelete={(id) => setTasks((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  )
}
