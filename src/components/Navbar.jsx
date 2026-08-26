export default function Navbar({ title, onLogout }) {
  return (
    <div className="navbar">
      <h1>{title}</h1>
      <button className="logout" onClick={onLogout}>Logout</button>
    </div>
  )
}
