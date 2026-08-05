const API = "http://127.0.0.1:5000/task";
const AUTH = "http://127.0.0.1:5000";

function getToken() {
    return localStorage.getItem("token");
}

function showAuth() {
    document.getElementById("authSection").style.display = "block";
    document.getElementById("taskApp").style.display = "none";
}

function showTaskApp() {
    document.getElementById("authSection").style.display = "none";
    document.getElementById("taskApp").style.display = "block";
    loadTasks();
}

function showLogin() {
    document.getElementById("loginCard").style.display = "block";
    document.getElementById("registerCard").style.display = "none";
}

function showRegister() {
    document.getElementById("loginCard").style.display = "none";
    document.getElementById("registerCard").style.display = "block";
}

async function register() {
    const username = document.getElementById("regUsername").value;
    const password = document.getElementById("regPassword").value;
    if (!username || !password) {
        alert("Fill all fields");
        return;
    }
    const res = await fetch(AUTH + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
        alert("Registered! Please login.");
        showLogin();
    } else {
        alert(data.message || "Registration failed");
    }
}

async function login() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;
    if (!username || !password) {
        alert("Fill all fields");
        return;
    }
    const res = await fetch(AUTH + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
        localStorage.setItem("token", data.token);
        showTaskApp();
    } else {
        alert(data.message || "Login failed");
    }
}

function logout() {
    localStorage.removeItem("token");
    showAuth();
}

async function loadTasks() {
    const token = getToken();
    if (!token) {
        showAuth();
        return;
    }
    const res = await fetch(API, {
        headers: { "Authorization": token }
    });
    if (res.status === 401) {
        localStorage.removeItem("token");
        showAuth();
        return;
    }
    const tasks = await res.json();
    const list = document.getElementById("taskList");
    list.innerHTML = "";
    tasks.forEach(task => {
        list.innerHTML += `
        <div class="task">
            <h3>${task.title}</h3>
            <p>${task.description}</p>
            <button class="delete" onclick="deleteTask(${task.id})">Delete</button>
        </div>
        `;
    });
}

async function addTask() {
    const token = getToken();
    if (!token) {
        showAuth();
        return;
    }
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    if (!title || !description) {
        alert("Fill all fields");
        return;
    }
    await fetch(API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
        body: JSON.stringify({ title, description })
    });
    document.getElementById("title").value = "";
    document.getElementById("description").value = "";
    loadTasks();
}

async function deleteTask(id) {
    const token = getToken();
    if (!token) {
        showAuth();
        return;
    }
    await fetch(API + "/" + id, {
        method: "DELETE",
        headers: { "Authorization": token }
    });
    loadTasks();
}

(function init() {
    if (getToken()) {
        showTaskApp();
    } else {
        showAuth();
    }
})();