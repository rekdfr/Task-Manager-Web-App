import { deleteTask } from '../services/api.js'

export default function TaskList({ tasks, onDelete }) {
  if (tasks.length === 0) {
    return <p className="empty">No tasks yet.</p>
  }

  function handleDelete(id) {
    deleteTask(id).catch(() => onDelete(id))
  }

  return (
    <div id="taskList">
      {tasks.map((task) => (
        <div className="task" key={task.id}>
          <h3>{task.title}</h3>
          <p>{task.description}</p>
          <button className="delete" onClick={() => handleDelete(task.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
