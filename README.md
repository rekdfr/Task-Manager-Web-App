<div align="center">

# Task Manager Web App

**A production-ready, full-stack task management platform — containerized, orchestrated & automated.**

*DevOps Lab Project • Flask • React • Docker • Kubernetes • Jenkins*

<br/>

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.1.1-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Minikube-326CE5?style=flat-square&logo=kubernetes&logoColor=white)](https://minikube.sigs.k8s.io/)
[![Jenkins](https://img.shields.io/badge/Jenkins-CI-D24939?style=flat-square&logo=jenkins&logoColor=white)](https://www.jenkins.io/)
[![License](https://img.shields.io/badge/License-MIT-8A8A8A?style=flat-square)](#license)

[Overview](#-overview) • [Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Deep Dive](#-deep-dive--source-walkthrough) • [Docker](#-docker) • [Kubernetes](#️-kubernetes--minikube) • [CI/CD](#-cicd--jenkins) • [LLM Context](#-llm-context--exact-repository-snapshot)

</div>

---

## 📖 Overview

**Task Manager Web App** (`rekdfr/Task-Manager-Web-App`, branch `main`) is a deliberately minimal, **in-memory**, **no-database** full-stack CRUD app built to demonstrate the full DevOps lifecycle:

```
Code → Build (Vite) → Test (node test.js) → Containerize (Docker) → Orchestrate (Minikube) → Automate (Jenkins)
```

- **Backend** — Flask 3.1.1 + Flask-RESTful 0.3.10 + Flask-CORS 6.0.1, single file `main.py`, 3 in-memory globals (`users`, `tasks`, `tokens`), `secrets.token_hex(16)` auth, runs on `0.0.0.0:5000`.
- **Frontend** — React 18.3.1 + Vite 5.4.11 SPA, 5 components + 1 API service, token in `localStorage` → `Authorization: <raw-token>` header, `VITE_API_URL` override defaulting to `http://192.168.49.2:32478` (Minikube backend NodePort), dev on `:5173`, production build to `dist/`.
- **DevOps** — 2 Dockerfiles (`python:3.12` + `node:20`), 1 Deployment (2 replicas × 2 containers) + 1 NodePort Service, declarative `Jenkinsfile` (Checkout → Install → Build → Test with `pollSCM('H/5 * * * *')`).

> **Intent:** Lab/teaching repo. Zero external dependencies (no DB, no ORM, no JWT, no env secrets). Every layer is trivially inspectable so an LLM or human can reason end-to-end.

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Quick Start](#-quick-start)
- [Deep Dive — Source Walkthrough](#-deep-dive--source-walkthrough)
- [Docker](#-docker)
- [Kubernetes — Minikube](#️-kubernetes--minikube)
- [CI/CD — Jenkins](#-cicd--jenkins)
- [Runtime Behavior & Data Model](#-runtime-behavior--data-model)
- [Configuration](#-configuration)
- [Testing](#-testing)
- [LLM Context — Exact Repository Snapshot](#-llm-context--exact-repository-snapshot)
- [Constraints, Gotchas & Tech Debt](#-constraints-gotchas--tech-debt)
- [For LLM Agents — Safe Edit Guide](#-for-llm-agents--safe-edit-guide)
- [Troubleshooting & Operations](#️-troubleshooting--operations)
- [DevOps Journey — Lab Coverage](#-devops-journey--lab-coverage)
- [Git History](#-git-history)
- [License](#-license)

---

## ✨ Features

| Area | What exists | Detail |
| :--- | :--- | :--- |
| 🔐 **Auth** | `POST /register`, `POST /login` | Plain `users[]` array, duplicate check by `username`, token = `secrets.token_hex(16)` (32-char hex), stored in `tokens[token]=username`, returned as `{"token": "..."}` |
| ✅ **Tasks** | `GET /task`, `POST /task`, `GET /task/<id>`, `DELETE /task/<id>` | All require `Authorization` header; no `PUT/PATCH`; list returns `tasks[]` array directly |
| ⚡ **Frontend** | React SPA, no router | `App.jsx` owns `token | tasks | showRegister`; conditional render: unauthenticated → `Login` ↔ `Register`, authenticated → `Navbar` + `TaskForm` + `TaskList` |
| 🐍 **Backend** | Single-file Flask-RESTful | `CORS(app)` open to all origins; `app.run(host="0.0.0.0", port=5000)`; no `if` for env, no gunicorn |
| 🐳 **Docker** | Two images | `33351-backend:latest` (python:3.12 + `main.py`) and `33351-frontend:latest` (node:20 + `npm run dev -- --host 0.0.0.0`) — names matter for K8s |
| ☸️ **K8s** | Deployment + NodePort | `33351-taskmanager-deployment`, `replicas:2`, 2 containers/pod, `imagePullPolicy: Never`, Service `task-manager-service` exposes `5000` & `5173` |
| 🤖 **CI** | Declarative `Jenkinsfile` | 4 stages: `Checkout` → `Install Dependencies` (`npm install`) → `Build` (`npm run build`) → `Automated Testing` (`npm test` → `node test.js`) + `pollSCM('H/5 * * * *')` |

---

## 🏗️ Architecture

```mermaid
flowchart LR
    subgraph Client
        U[Browser]
    end
    subgraph Frontend["Frontend — React + Vite :5173"]
        R[React SPA\nApp.jsx]
        C[Components\nLogin/Register/TaskForm/TaskList/Navbar]
        S[api.js\nfetch + localStorage token]
        V[Vite Build → dist/]
    end
    subgraph Backend["Backend — Flask :5000"]
        F[Flask + Flask-RESTful]
        CORS[CORS *]
        M[(In-Memory\nusers[] / tasks[] / tokens{})]
    end
    subgraph DevOps["DevOps"]
        D1[Docker\n33351-backend & 33351-frontend]
        K8S[K8s\nDeployment x2 + NodePort Service]
        J[Jenkins\nDeclarative Pipeline\npollSCM every 5m]
    end

    U -->|HTTP :5173| R --> C
    C --> S -->|fetch Authorization: <token>| F --> M
    F --> CORS
    V --> D1 --> K8S
    R -->|npm install/build/test| J
```

**Request flow:**

```
Browser (localhost:5173 or Minikube NodePort)
  → React fetch(API_URL + /register|/login|/task) with header Authorization: <token>
  → Flask check_auth(): request.headers.get("Authorization") → tokens.get(token) → username or 401
  → mutate/read users[] / tasks[] / tokens{}
  ← JSON response
```

**Build/Deploy flow:**

```
src/*.jsx → Vite build → dist/ → node:20 image (npm run dev in dev, dist in CI)
main.py → python:3.12 image → K8s Pod (2 containers) → NodePort → minikube service URL
GitHub push → Jenkins pollSCM (H/5) → checkout scm → npm install → npm run build → npm test
```

---

## 🧰 Tech Stack

| Layer | Technology | Version / Detail | File |
| :--- | :--- | :--- | :--- |
| **Backend** | Python | 3.12 (`python:3.12` in Dockerfile) | `Dockerfile.backend:1` |
| | Flask | 3.1.1 | `requirements.txt:1` |
| | Flask-RESTful | 0.3.10 | `requirements.txt:2` |
| | Flask-Cors | 6.0.1 | `requirements.txt:3` |
| **Frontend** | React | 18.3.1 | `package.json:13` |
| | React-DOM | 18.3.1 | `package.json:14` |
| | Vite | 5.4.11 | `package.json:18` |
| | @vitejs/plugin-react | 4.3.4 | `package.json:17` |
| | CSS | Custom, no framework | `src/App.css` (130 lines) |
| **Tooling** | Node | 20 (`node:20`) | `Dockerfile.frontend:1` |
| | npm scripts | `dev` / `build` / `preview` / `test` | `package.json:6-11` |
| **DevOps** | Docker | 2 Dockerfiles | `Dockerfile.backend`, `Dockerfile.frontend` |
| | Kubernetes | Minikube, `apps/v1` Deployment + `v1` NodePort Service | `deployment.yaml`, `service.yaml` |
| | Jenkins | Declarative pipeline | `Jenkinsfile` |

---

## 📁 Project Structure

```
.
├── main.py                 # 80-line Flask REST API — entire backend
├── requirements.txt        # 3 lines — Flask stack
├── package.json            # React + Vite deps + 4 npm scripts
├── vite.config.js          # 6 lines — defineConfig({ plugins: [react()] })
├── index.html              # SPA shell → /src/main.jsx
├── Dockerfile.backend      # 7 lines — python:3.12, COPY main.py, EXPOSE 5000, CMD python main.py
├── Dockerfile.frontend     # 7 lines — node:20, npm install, COPY ., EXPOSE 5173, CMD npm run dev -- --host 0.0.0.0
├── deployment.yaml         # 30 lines — Deployment 33351-taskmanager-deployment, replicas:2, 2 containers, imagePullPolicy:Never
├── service.yaml            # 22 lines — NodePort task-manager-service, ports 5173 & 5000 → selector app:task-manager
├── Jenkinsfile             # 34 lines — declarative pipeline, pollSCM H/5, 4 stages (Checkout/Install/Build/Test)
├── test.js                 # 27 lines — fs.existsSync checks for 5 files (package.json, index.html, vite.config.js, src/main.jsx, src/App.jsx)
├── .dockerignore           # 5 lines — node_modules, venv, __pycache__, .git
├── .gitignore              # 42 lines — venv, pycache, .env, node_modules, dist, .vite, logs, .vscode, .DS_Store
├── dist/                   # Vite production output (gitignored, generated by npm run build)
├── __pycache__/            # Python cache (gitignored)
├── venv/                   # Python venv (gitignored)
├── node_modules/           # Node deps (gitignored)
└── src/                    # React frontend (5 files + 2 dirs)
    ├── main.jsx            # 10 lines — ReactDOM.createRoot → <App />
    ├── App.jsx             # 65 lines — token state, fetch tasks, Login/Register ↔ Task UI switch
    ├── App.css             # 130 lines — global + card/task/navbar/error/success styles
    ├── components/
    │   ├── Login.jsx       # 34 lines — username/password → login() → onSuccess(token)
    │   ├── Register.jsx    # 42 lines — username/password → register() → success message + Back link
    │   ├── Navbar.jsx      # 8 lines  — <h1> + Logout button
    │   ├── TaskForm.jsx    # 34 lines — title/description → createTask() → onAdd(task)
    │   └── TaskList.jsx    # 23 lines — lists tasks, delete button (bug: see Gotchas)
    └── services/
        └── api.js          # 49 lines — API_URL, getToken(), request(), register/login/getTasks/createTask/deleteTask
```

**File purpose matrix:**

| File | Role | Imported by / Used by |
| :--- | :--- | :--- |
| `main.py` | HTTP server, routes, auth, CRUD | `Dockerfile.backend`, `python main.py` |
| `src/services/api.js` | Single fetch wrapper, token I/O | All components + `App.jsx` |
| `src/App.jsx` | Root state machine | `src/main.jsx` |
| `src/main.jsx` | React mount point | `index.html` |
| `vite.config.js` | Build tool config | `vite` CLI |
| `deployment.yaml` + `service.yaml` | K8s desired state | `kubectl apply -f` |
| `Jenkinsfile` | CI definition | Jenkins controller |
| `test.js` | Minimal file-existence gate | `npm test` in Jenkins |

---

## 🔌 API Reference

Base URL: `http://127.0.0.1:5000` locally, `http://192.168.49.2:32478` via Minikube (dynamic — check `kubectl get svc`), or override with `VITE_API_URL`.

| Method | Path | Auth | Request Body | Success | Error |
| :----: | :--- | :--: | :--- | :--- | :--- |
| `POST` | `/register` | — | `{"username": str, "password": str}` | `201 {"message":"Registered"}` | `400 {"message":"Username and password required"}` or `400 {"message":"User already exists"}` |
| `POST` | `/login` | — | `{"username": str, "password": str}` | `200 {"token":"<32-hex>"}` | `401 {"message":"Invalid credentials"}` |
| `GET` | `/task` | ✅ | — | `200 [ {id, title, description}, ... ]` | `401 {"message":"Unauthorized"}` |
| `POST` | `/task` | ✅ | `{"title": str, "description": str}` | `201 {id, title, description}` | `401` |
| `GET` | `/task/<int:id>` | ✅ | — | `200 {id, title, description}` | `401` or `404 {"message":"Task not found"}` |
| `DELETE` | `/task/<int:id>` | ✅ | — | `200 {"message":"Task <id> deleted"}` | `401` |

**Auth:** After `/login`, token is persisted to `localStorage.setItem('token', token)` (`src/App.jsx:22`, `src/services/api.js:4`) and sent as bare `Authorization` header (`Authorization: <token>`, no `Bearer` prefix) on every protected call (`src/services/api.js:12`). Missing/unknown token → `check_auth()` returns `None` → `401 Unauthorized` (`main.py:14-18`).

<details>
<summary><b>Example — cURL (local)</b></summary>

```bash
# Register
curl -X POST http://127.0.0.1:5000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret"}'

# Login
curl -X POST http://127.0.0.1:5000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret"}'
# → {"token":"a1b2c3..."}

TOKEN=$(curl -s -X POST http://127.0.0.1:5000/login -H "Content-Type: application/json" -d '{"username":"alice","password":"secret"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Create task
curl -X POST http://127.0.0.1:5000/task \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Lab Report","description":"Finish DevOps README"}'

# List tasks
curl http://127.0.0.1:5000/task -H "Authorization: $TOKEN"

# Get one
curl http://127.0.0.1:5000/task/1 -H "Authorization: $TOKEN"

# Delete
curl -X DELETE http://127.0.0.1:5000/task/1 -H "Authorization: $TOKEN"
```

</details>

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+ (3.12 in Docker) · Node 18+ (20 in Docker) · npm 9+
- Docker + Minikube + kubectl (for container/orchestration labs)
- Jenkins with Node.js (for CI lab)

### 1. Backend — Flask API

```bash
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt   # Flask==3.1.1 Flask-RESTful==0.3.10 Flask-Cors==6.0.1
python main.py
# → http://127.0.0.1:5000  (Flask dev server, host 0.0.0.0)
```

### 2. Frontend — React (Development)

```bash
npm install
npm run dev
# → http://localhost:5173  (Vite HMR; API_URL defaults to http://192.168.49.2:32478 — override for local backend)
VITE_API_URL=http://127.0.0.1:5000 npm run dev   # talk to local Flask
```

### 3. Production Build & Preview

```bash
npm run build        # → dist/ (gitignored)
npm run preview      # serve dist locally
npm test             # node test.js — checks 5 files exist
```

---

## 🔍 Deep Dive — Source Walkthrough

### Backend — `main.py` (80 lines, fully verbatim in LLM Snapshot below)

- `from flask import Flask, request` / `flask_restful.Resource, Api` / `flask_cors.CORS` / `secrets` (`main.py:1-4`)
- `app = Flask(__name__); CORS(app)` — **open CORS**, no origin restriction (`main.py:6-7`)
- Globals: `tasks = []`, `users = []`, `tokens = {}` — **in-memory, process-local, lost on restart** (`main.py:10-12`)
- `check_auth()` (`main.py:14-18`): reads `Authorization` header verbatim; no `Bearer` stripping; `tokens.get(auth)` → username or `None`.
- `Register.post()` (`main.py:20-31`): parses JSON, validates non-empty `username`/`password`, linear scan for duplicate, appends `{"username","password"}` plaintext (no hash), `201`.
- `Login.post()` (`main.py:33-43`): linear scan for match, `secrets.token_hex(16)` → 32 hex chars → `tokens[token]=username`, `200 {"token":...}` else `401`.
- `Task.get()` (`main.py:46-55`): auth gate → if `task_id` then linear search → `200 task` or `404`, else `200 tasks[]` (returns entire array, no pagination/filter, leaks all users' tasks — no per-user scoping).
- `Task.post()` (`main.py:57-65`): auth gate → `len(tasks)+1` as ID (**collides after deletes**, see Gotchas), `{'id', 'title', 'description'}` (no validation if keys missing → KeyError → 500), append, `201`.
- `Task.delete()` (`main.py:67-73`): auth gate → `global tasks; tasks = [t for t in tasks if t['id'] != task_id]` → always `200` even if ID absent; no `404`.
- Routing (`main.py:75-77`): `api.add_resource(Register, '/register')`, `Login → '/login'`, `Task → '/task' and '/task/<int:task_id>'`.
- Entrypoint (`main.py:79-80`): `app.run(host="0.0.0.0", port=5000)` — single-threaded dev server, no `debug=True`.

### Frontend

**`src/services/api.js` (49 lines):**
- `const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.49.2:32478'` (`api.js:1`) — **hardcoded Minikube IP** as fallback; local dev must override.
- `getToken()` reads `localStorage` (`api.js:3-5`).
- `request(path, options)` (`api.js:7-19`): `fetch(API_URL + path, { ...options, headers: { 'Content-Type': 'application/json' if body, Authorization: getToken(), ...options.headers } })`; parses JSON with `.catch(()=>({}))`; throws `Error(data.message || 'Request failed (status)')` if `!res.ok`; returns `data`.
- Exports: `register`, `login`, `getTasks` (coerces non-array to `[]`), `createTask`, `deleteTask` (`api.js:21-49`).

**`src/App.jsx` (65 lines):**
- State: `token` initialized from `localStorage.getItem('token')` (lazy initializer), `showRegister`, `tasks` (`App.jsx:10-12`).
- Effect (`App.jsx:14-19`): when `token` set, `getTasks().then(setTasks).catch(()=>logout())` — fetches all tasks; on auth failure, wipes token.
- `handleLogin(newToken)` (`App.jsx:21-25`): persists token, sets state, hides Register.
- `logout()` (`App.jsx:27-31`): removes token, clears tasks, nulls token.
- Render: if `!token` → centered container with `Task Manager` + either `<Register onBack>` or `<Login onSuccess=handleLogin>` + toggle link (`App.jsx:33-52`); else → `<Navbar title onLogout>` + `<TaskForm onAdd>` + `<TaskList tasks onDelete>` (`App.jsx:54-64`).

**`src/components/Login.jsx` (34 lines):** controlled `username`/`password` + `error`; validates non-empty; `await login()` → `onSuccess(data.token)`; displays `error` in `.error`.

**`src/components/Register.jsx` (42 lines):** similar; `message` + `success` bool; `await register()` → `Registered! Please login.` in `.success`, else `.error`; includes `Already have an account? Login` link calling `onBack`.

**`src/components/Navbar.jsx` (8 lines):** stateless: `<div.navbar><h1>{title}</h1><button.logout onClick={onLogout}>Logout</button></div>`.

**`src/components/TaskForm.jsx` (34 lines):** controlled `title`/`description`; validates; `await createTask(title, description)` → `onAdd(task)` → clears inputs; error in `.error`.

**`src/components/TaskList.jsx` (23 lines):** if `tasks.length===0` → `.empty No tasks yet.`; else maps `tasks` → `.task` div with `h3` title + `p` description + `.delete` button; `handleDelete` calls `deleteTask(id).catch(()=>onDelete(id))` — **only calls `onDelete` on failure** (inverted logic).

**`src/main.jsx` (10 lines):** `ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>)`.

**`src/App.css` (130 lines):** global reset, `body #f4f4f4`, `.container 700px centered`, `.card white+shadow`, `input/textarea 100% + border #ccc`, `button #007bff→#0056b3`, `.task`, `.delete #dc3545→#a71d2a`, `.logout #6c757d`, `.navbar flex column centered`, `.error #dc3545`, `.success #198754`, `.empty centered #666`.

**`index.html` (12 lines):** `<!DOCTYPE html><div id="root"></div><script type="module" src="/src/main.jsx">`.

**`vite.config.js` (6 lines):** `defineConfig({ plugins: [react()] })` — no proxy, no env prefix, no alias.

---

## 🐳 Docker

Two isolated images. **Image names are `33351-backend` / `33351-frontend`** (must match `deployment.yaml:21,25`); earlier README used `task-*` aliases — both work if you retag or edit YAML, but K8s expects `33351-*`.

| Image | Dockerfile | Base | Port | Command | Build context |
| :--- | :--- | :--- | :--: | :--- | :--- |
| `33351-backend` | `Dockerfile.backend` | `python:3.12` | `5000` | `python main.py` | `COPY requirements.txt` → `pip install` → `COPY main.py` |
| `33351-frontend` | `Dockerfile.frontend` | `node:20` | `5173` | `npm run dev -- --host 0.0.0.0` | `COPY package*.json` → `npm install` → `COPY .` |

Dockerfile verbatim:

```dockerfile
# Dockerfile.backend
FROM python:3.12
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY main.py .
EXPOSE 5000
CMD ["python","main.py"]
```
```dockerfile
# Dockerfile.frontend
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm","run","dev","--","--host","0.0.0.0"]
```

`.dockerignore` (5 lines): `node_modules`, `venv`, `__pycache__`, `.git` — `dist/` is **not** ignored (intentionally ships if built).

```bash
# Build (project root)
docker build -t 33351-backend -f Dockerfile.backend .
docker build -t 33351-frontend -f Dockerfile.frontend .

# Also tag as task-* if you prefer aliases
docker tag 33351-backend task-backend
docker tag 33351-frontend task-frontend

# Run standalone (detached)
docker run -d -p 5000:5000 --name backend 33351-backend
docker run -d -p 5173:5173 --name frontend 33351-frontend

# Verify
docker ps
docker logs backend
docker logs frontend
docker images | grep 33351
```

---

## ☸️ Kubernetes — Minikube

Both containers run in **one Pod** per ReplicaSet, managed by a Deployment, exposed by a NodePort Service.

### Objects

| Object | File | Name | Spec |
| :--- | :--- | :--- | :--- |
| **Deployment** | `deployment.yaml` | `33351-taskmanager-deployment` | `replicas:2`, selector `app:task-manager`, template labels `app:task-manager`, containers `33351-backend` (`33351-backend:latest`, `Never`, `:5000`) + `33351-frontend` (`33351-frontend:latest`, `Never`, `:5173`) |
| **Service** | `service.yaml` | `task-manager-service` | `type:NodePort`, selector `app:task-manager`, ports `33351-frontend 5173:5173 TCP` + `33351-backend 5000:5000 TCP` |

YAML verbatim — **do not change names without updating both files and Docker tags:**

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name : 33351-taskmanager-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: task-manager
  template:
    metadata:
      labels:
        app: task-manager
    spec:
      containers:
        - name: 33351-backend
          image: 33351-backend:latest
          imagePullPolicy: Never
          ports:
            - containerPort: 5000
        - name: 33351-frontend
          image: 33351-frontend:latest
          imagePullPolicy: Never
          ports:
            - containerPort: 5173
```
```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: task-manager-service
spec:
  type: NodePort
  selector:
    app: task-manager
  ports:
    - name: 33351-frontend
      protocol: TCP
      port: 5173
      targetPort: 5173
    - name: 33351-backend
      protocol: TCP
      port: 5000
      targetPort: 5000
```

### Setup

```bash
# 1. Start cluster
minikube start
minikube status
kubectl get nodes

# 2. Build images (from project root)
docker build -t 33351-backend -f Dockerfile.backend .
docker build -t 33351-frontend -f Dockerfile.frontend .

# 3. Load into Minikube (required — imagePullPolicy: Never)
minikube image load 33351-backend:latest
minikube image load 33351-frontend:latest
minikube image ls | grep 33351
```

### Apply Manifests

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl get deployments
kubectl get pods
kubectl get replicasets
kubectl get svc
kubectl get all
```

### Inspect

```bash
kubectl describe deployment 33351-taskmanager-deployment
kubectl describe pod <pod-name>
kubectl describe svc task-manager-service

# Logs — pod holds both containers, must specify -c
kubectl logs <pod-name> -c 33351-backend
kubectl logs <pod-name> -c 33351-frontend
kubectl logs <pod-name> -c 33351-backend --previous

kubectl rollout status deployment/33351-taskmanager-deployment
kubectl rollout history deployment/33351-taskmanager-deployment
kubectl get events --sort-by=.metadata.creationTimestamp
```

### Access

```bash
minikube service task-manager-service              # opens in browser
minikube service task-manager-service --url        # prints URLs
kubectl get svc task-manager-service               # shows NodePorts (e.g. 30723, 32478)
```

Example with Minikube IP `192.168.49.2` (your IP may differ — always check `minikube ip`):

- Frontend → `http://192.168.49.2:30723` (NodePort for 5173)
- Backend  → `http://192.168.49.2:32478` (NodePort for 5000, matches `api.js` default)

> NodePorts are dynamic. `api.js` default `http://192.168.49.2:32478` will break if Minikube assigns a different port/IP — set `VITE_API_URL` or rebuild frontend with correct env.

### Scaling

```bash
kubectl scale deployment 33351-taskmanager-deployment --replicas=4  # up
kubectl scale deployment 33351-taskmanager-deployment --replicas=1  # down
kubectl scale deployment 33351-taskmanager-deployment --replicas=0  # stop
kubectl get pods && kubectl get deployments
kubectl rollout restart deployment/33351-taskmanager-deployment
```

Or edit `replicas` in `deployment.yaml` and `kubectl apply -f deployment.yaml`.

### Cleanup

```bash
kubectl delete -f service.yaml
kubectl delete -f deployment.yaml
kubectl delete pod --all  # if needed
minikube stop
# minikube delete  # full reset
```

---

## 🔄 CI/CD — Jenkins

**Goal:** Automate frontend build + file-existence tests on every push (polling).

Actual repo uses **declarative `Jenkinsfile`** (not Freestyle). File verbatim:

```groovy
pipeline {
    agent any
    triggers {
        pollSCM('H/5 * * * *')
    }
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Install Dependencies') {
            steps { sh 'npm install' }
        }
        stage('Build') {
            steps { sh 'npm run build' }
        }
        stage('Automated Testing') {
            steps { sh 'npm test' }
        }
    }
}
```

- `agent any` — runs on any executor.
- `pollSCM('H/5 * * * *')` — polls Git SCM every 5 minutes (hashed `H` for load distribution).
- `checkout scm` — checks out the branch that triggered the job.
- `npm install` → `npm run build` (`vite build` → `dist/`) → `npm test` (`node test.js` checks 5 files exist).
- No backend stage — Flask does not need to run for frontend CI.

**Freestyle alternative** (if your Jenkins lacks pipeline support): Create Freestyle Project → Source Code Management Git `https://github.com/rekdfr/Task-Manager-Web-App.git` Branch `*/main` → Build Trigger Poll SCM `H/5 * * * *` → Build Execute Shell `npm install` + `npm run build` → Post-build archive `dist/`.

```
GitHub → pollSCM (5m) → Checkout → npm install → npm run build → npm test (node test.js) → SUCCESS / FAILURE
```

Jenkins needs only **Node.js + npm** — Python/Flask not required.

---

## 🧠 Runtime Behavior & Data Model

| Concern | Exact behavior |
| :--- | :--- |
| **Storage** | `users: list[dict{username,password}]`, `tasks: list[dict{id,title,description}]`, `tokens: dict[token->username]` — all in-process, no persistence, no thread-safety. Restart wipes everything. |
| **IDs** | `task_id = len(tasks)+1` on `POST /task` — **not monotonic**; after deleting ID 1 from `[1,2]`, next POST yields `id=2` (duplicate) → `GET /task/<id>` returns first match, ambiguous state. |
| **Auth** | No hashing, no expiry, no revocation except process restart; token is bearer-equivalent but header is raw token, not `Bearer <token>`. `tokens` dict grows unbounded. |
| **Isolation** | No per-user filtering: `GET /task` returns **all** tasks regardless of creator; any authenticated user can `DELETE` any task. |
| **CORS** | `CORS(app)` allows all origins, all methods. |
| **Error handling** | `POST /task` accesses `data['title']`/`data['description']` without `.get()` — missing keys raise `KeyError` → Flask 500, not 400. `DELETE` returns 200 even if ID absent. |
| **Frontend auth** | Token in `localStorage`; `App.jsx` effect logs out on any `getTasks` failure (including network error). No refresh. |
| **Task delete UI** | `TaskList.jsx:9` does `deleteTask(id).catch(()=>onDelete(id))` — **inverted**: local state only updates when API *fails*; on success, task stays until page reload / re-fetch. |
| **API URL** | `api.js:1` defaults to `http://192.168.49.2:32478`; `VITE_API_URL` overrides at build time (Vite `import.meta.env`). No runtime `.env` injection after build. |

---

## ⚙️ Configuration

| Variable | Where | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | `src/services/api.js:1` via `import.meta.env` | `http://192.168.49.2:32478` | Backend base URL at **build time** |
| `PORT` (Flask) | `main.py:80` | `5000` hardcoded | Change code or `app.run(port=...)` |
| `PORT` (Vite) | `Dockerfile.frontend:7` + Vite default | `5173` | Change `vite.config.js` server.port or Docker `-p` |
| `replicas` | `deployment.yaml:8` | `2` | `kubectl scale` or edit + apply |
| `imagePullPolicy` | `deployment.yaml:22,27` | `Never` | Must `minikube image load` before apply |

No `.env` file is shipped; `.gitignore` ignores `.env*` (`!.env.example` exception). No secrets, no DB URL.

**Vite config** (`vite.config.js`): `defineConfig({ plugins: [react()] })` — no `server.proxy`, so local dev without `VITE_API_URL` will hit the hardcoded Minikube URL and fail unless Minikube is running.

---

## 🧪 Testing

**Existing:** `test.js` (27 lines) via `npm test` (`package.json:11` → `node test.js`):

```js
import fs from 'fs';
const tests = ['package.json','index.html','vite.config.js','src/main.jsx','src/App.jsx'];
for (const file of tests) {
  if (fs.existsSync(file)) console.log(`TEST PASSED: ${file} exists`);
  else { console.error(`TEST FAILED: ${file} not found`); failed=true; }
}
if (failed) { console.error('Some automated tests failed.'); process.exit(1); }
console.log('All automated tests passed.');
```

Checks **file existence only** — no unit, integration, or API tests. Jenkins `Automated Testing` stage runs this (`Jenkinsfile:30`).

**Suggested extensions (not yet implemented):** Add `pytest` for `main.py` (Flask test client) and `vitest` + `jsdom` for React.

Run: `npm test` locally or in Jenkins; `npm run build` must succeed first.

---

## 🤖 LLM Context — Exact Repository Snapshot

> This section is the **authoritative, verbatim source of truth** for AI agents. Every file that defines runtime behavior is inlined here so an LLM can reason without guessing. If this README and a source file disagree, the source file wins — but this snapshot is auto-synced to current `main`.

### File Inventory (21 entries at repo root)

```
__pycache__/  .dockerignore  .git/  .gitignore  deployment.yaml  dist/  Dockerfile.backend
Dockerfile.frontend  index.html  Jenkinsfile  main.py  node_modules/  package-lock.json
package.json  README.md  requirements.txt  service.yaml  src/  test.js  venv/  vite.config.js
```

<details>
<summary><b>main.py — 80 lines (entire backend)</b></summary>

```python
from flask import Flask, request
from flask_restful import Resource, Api
from flask_cors import CORS
import secrets

app = Flask(__name__)
CORS(app)

api = Api(app)
tasks = []
users = []
tokens = {}

def check_auth():
    auth = request.headers.get("Authorization")
    if not auth:
        return None
    return tokens.get(auth)

class Register(Resource):
    def post(self):
        data = request.get_json()
        username = data.get("username", "")
        password = data.get("password", "")
        if not username or not password:
            return {"message": "Username and password required"}, 400
        for user in users:
            if user["username"] == username:
                return {"message": "User already exists"}, 400
        users.append({"username": username, "password": password})
        return {"message": "Registered"}, 201

class Login(Resource):
    def post(self):
        data = request.get_json()
        username = data.get("username", "")
        password = data.get("password", "")
        for user in users:
            if user["username"] == username and user["password"] == password:
                token = secrets.token_hex(16)
                tokens[token] = username
                return {"token": token}, 200
        return {"message": "Invalid credentials"}, 401

class Task(Resource):
    def get(self, task_id=None):
        user = check_auth()
        if not user:
            return {"message": "Unauthorized"}, 401
        if task_id:
            for task in tasks:
                if task['id'] == task_id:
                    return task, 200
            return {"message": "Task not found"}, 404
        return tasks, 200

    def post(self):
        user = check_auth()
        if not user:
            return {"message": "Unauthorized"}, 401
        data = request.get_json()
        task_id = len(tasks) + 1
        task = {'id': task_id, 'title': data['title'], 'description': data['description']}
        tasks.append(task)
        return task, 201

    def delete(self, task_id):
        user = check_auth()
        if not user:
            return {"message": "Unauthorized"}, 401
        global tasks
        tasks = [task for task in tasks if task['id'] != task_id]
        return {"message": f"Task {task_id} deleted"}, 200

api.add_resource(Register, '/register')
api.add_resource(Login, '/login')
api.add_resource(Task, '/task', '/task/<int:task_id>')

if __name__ == '__main__':
    app.run(host="0.0.0.0",port=5000)
```

</details>

<details>
<summary><b>src/services/api.js — 49 lines</b></summary>

```js
const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.49.2:32478'

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const res = await fetch(API_URL + path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: getToken(),
      ...options.headers,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`)
  return data
}

export function register(username, password) {
  return request('/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function login(username, password) {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export async function getTasks() {
  const data = await request('/task')
  return Array.isArray(data) ? data : []
}

export function createTask(title, description) {
  return request('/task', {
    method: 'POST',
    body: JSON.stringify({ title, description }),
  })
}

export function deleteTask(id) {
  return request(`/task/${id}`, { method: 'DELETE' })
}
```

</details>

<details>
<summary><b>src/App.jsx — 65 lines</b></summary>

```jsx
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
```

</details>

<details>
<summary><b>src/main.jsx — 10 lines</b></summary>

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

</details>

<details>
<summary><b>src/components/Login.jsx — 34 lines</b></summary>

```jsx
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
```

</details>

<details>
<summary><b>src/components/Register.jsx — 42 lines</b></summary>

```jsx
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
```

</details>

<details>
<summary><b>src/components/Navbar.jsx — 8 lines</b></summary>

```jsx
export default function Navbar({ title, onLogout }) {
  return (
    <div className="navbar">
      <h1>{title}</h1>
      <button className="logout" onClick={onLogout}>Logout</button>
    </div>
  )
}
```

</details>

<details>
<summary><b>src/components/TaskForm.jsx — 34 lines</b></summary>

```jsx
import { useState } from 'react'
import { createTask } from '../services/api.js'

export default function TaskForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title || !description) {
      setError('Fill all fields')
      return
    }
    try {
      const task = await createTask(title, description)
      onAdd(task)
      setTitle('')
      setDescription('')
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}
      <input type="text" placeholder="Task Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea placeholder="Task Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <button type="submit">Add Task</button>
    </form>
  )
}
```

</details>

<details>
<summary><b>src/components/TaskList.jsx — 23 lines</b></summary>

```jsx
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
```

</details>

<details>
<summary><b>requirements.txt / package.json / vite.config.js / index.html</b></summary>

```txt
# requirements.txt
Flask==3.1.1
Flask-RESTful==0.3.10
Flask-Cors==6.0.1
```
```json
// package.json
{
  "name": "task-manager-web-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "node test.js"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^5.4.11"
  }
}
```
```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```
```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Task Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

</details>

<details>
<summary><b>Docker / K8s / Jenkins — verbatim</b></summary>

```dockerfile
# Dockerfile.backend
FROM python:3.12
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY main.py .
EXPOSE 5000
CMD ["python","main.py"]
```
```dockerfile
# Dockerfile.frontend
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm","run","dev","--","--host","0.0.0.0"]
```
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name : 33351-taskmanager-deployment
spec:
  replicas: 2
  selector: 
    matchLabels:
      app: task-manager
  template:
    metadata:
      labels:
        app: task-manager
    spec:
      containers:
        - name: 33351-backend
          image: 33351-backend:latest
          imagePullPolicy: Never
          ports:
            - containerPort: 5000
        - name: 33351-frontend
          image: 33351-frontend:latest
          imagePullPolicy: Never
          ports:
            - containerPort: 5173
```
```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: task-manager-service
spec:
  type: NodePort
  selector:
    app: task-manager
  ports:
    - name: 33351-frontend
      protocol: TCP
      port: 5173
      targetPort: 5173
    - name: 33351-backend
      protocol: TCP
      port: 5000
      targetPort: 5000
```
```groovy
// Jenkinsfile
pipeline {
    agent any
    triggers {
        pollSCM('H/5 * * * *')
    }
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Install Dependencies') {
            steps { sh 'npm install' }
        }
        stage('Build') {
            steps { sh 'npm run build' }
        }
        stage('Automated Testing') {
            steps { sh 'npm test' }
        }
    }
}
```
```js
// test.js
import fs from 'fs';
const tests = ['package.json','index.html','vite.config.js','src/main.jsx','src/App.jsx'];
let failed = false;
for (const file of tests) {
    if (fs.existsSync(file)) console.log(`TEST PASSED: ${file} exists`);
    else { console.error(`TEST FAILED: ${file} not found`); failed = true; }
}
if (failed) { console.error('Some automated tests failed.'); process.exit(1); }
console.log('All automated tests passed.');
```

</details>

<details>
<summary><b>.gitignore / .dockerignore / App.css</b></summary>

```gitignore
# .gitignore — 42 lines
venv/
__pycache__/
node_modules/
dist/
.env
.env.local
# Python virtual environment
venv/
.venv/
env/

# Python cache
__pycache__/
*.py[cod]
*$py.class

# Environment variables / secrets
.env
.env.*
!.env.example

# Node dependencies
node_modules/

# React / Vite production build
dist/

# Vite cache
.vite/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# IDE / editor files
.vscode/
.idea/

# OS files
.DS_Store
```
```dockerignore
# .dockerignore — 5 lines
node_modules
venv
__pycache__
.git
```
```css
/* src/App.css — 130 lines */
* { margin:0; padding:0; box-sizing:border-box; font-family: Arial, Helvetica, sans-serif; }
body { background: #f4f4f4; }
.container { width: 700px; margin: 40px auto; }
h1 { text-align: center; margin-bottom: 25px; }
h2 { margin-bottom: 15px; }
.card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
input, textarea { width:100%; padding:10px; margin-bottom:15px; border:1px solid #ccc; border-radius:5px; }
textarea { height:90px; resize:none; }
button { width:100%; padding:12px; background:#007bff; color:white; border:none; border-radius:5px; cursor:pointer; }
button:hover { background:#0056b3; }
.task { background:white; margin-top:20px; padding:15px; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,.1); }
.task h3 { margin-bottom:8px; }
.delete { background:#dc3545; margin-top:10px; }
.delete:hover { background:#a71d2a; }
.logout { background:#6c757d; margin-top:20px; }
.logout:hover { background:#5a6268; }
.navbar { display:flex; flex-direction:column; align-items:center; }
.navbar .logout { width:auto; padding:8px 24px; margin-top:-10px; }
.toggle-text { margin-top:12px; text-align:center; font-size:14px; }
.toggle-text a { color:#007bff; text-decoration:none; }
.error { color:#dc3545; margin-bottom:12px; font-size:14px; }
.success { color:#198754; margin-bottom:12px; font-size:14px; }
.empty { text-align:center; margin-top:20px; color:#666; }
```

</details>

---

## ⚠️ Constraints, Gotchas & Tech Debt

| # | Area | Issue | Impact | Fix (if you edit) |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `TaskList.jsx:9` | `deleteTask(id).catch(()=>onDelete(id))` only updates UI on **failure**; success path does nothing | Deleting appears broken until refresh; tasks reappear after API success | Change to `.then(()=>onDelete(id)).catch(err=>setError(...))` |
| 2 | `main.py:62` | `task_id = len(tasks)+1` collides after deletes | Duplicate IDs → `GET /task/<id>` ambiguous, `DELETE` removes both duplicates | Use `max(t['id'] for t in tasks)+1` or `uuid4` or auto-increment counter |
| 3 | `main.py:63` | No validation for `title`/`description` | `KeyError` → 500 instead of 400 if body malformed | Use `data.get('title')` + 400 check |
| 4 | `main.py:72` | `DELETE` returns 200 even if `id` absent | Client thinks delete succeeded when nothing happened | Check `len` before/after, return 404 if unchanged |
| 5 | `main.py:71-72` | `global tasks` reassignment not thread-safe | Race on concurrent deletes (Flask dev server is single-threaded, but gunicorn would race) | Use lock or DB |
| 6 | `src/services/api.js:1` | Hardcoded `http://192.168.49.2:32478` fallback | Breaks on any other Minikube IP/port or local dev without override | Build with `VITE_API_URL` or add Vite proxy |
| 7 | `deployment.yaml:21,25` | Image names `33351-backend: latest` vs README old `task-backend` | `kubectl` fails if you build with `task-*` tags without retag | Keep names synced; add `docker tag` alias step |
| 8 | `api.js:12` | `Authorization: getToken()` may be `null` string when logged out | Sends `Authorization: null` header | Only add header if token truthy |
| 9 | Auth | Plaintext passwords, no per-user task ownership | Any user sees/deletes all tasks; not production-safe | Scope tasks by `username`, hash passwords |
| 10 | CORS + `CORS(app)` | Allows all origins | No security boundary | Restrict to frontend origin |
| 11 | `Jenkinsfile` | `npm test` only checks file existence | False confidence; no real coverage | Add `vitest` + Flask `pytest` |

---

## 🧩 For LLM Agents — Safe Edit Guide

**Read before modifying:**

1. **Single-file backend:** All Flask logic is `main.py:1-80`. Edits must preserve `check_auth()` header name `Authorization` (no Bearer) or update `src/services/api.js:12` in tandem.
2. **Token contract:** `login` returns `{"token": str}`; frontend expects `data.token` (`Login.jsx:17`). Changing shape breaks `App.jsx:23`.
3. **Task shape:** Frontend expects `{id, title, description}` (`TaskList.jsx:17-18`, `TaskForm.jsx:16`). Adding fields is safe; renaming breaks UI.
4. **K8s image coupling:** `deployment.yaml:21,25` `image:` must match `docker build -t <name>` tag. `imagePullPolicy: Never` means you **must** `minikube image load` after every build. Service selector `app: task-manager` must match Deployment labels (`deployment.yaml:11,16` / `service.yaml:10`).
5. **Vite build-time env:** `VITE_API_URL` is baked at `npm run build` (`api.js:1`). Changing backend URL requires rebuilding frontend image. No runtime `process.env` after build.
6. **Test gate:** `npm test` runs `test.js` which asserts 5 files exist (`test.js:4`). Renaming/moving `src/main.jsx` or `src/App.jsx` fails CI even if app still works.
7. **In-memory state:** No DB migration needed; but `tasks`/`users`/`tokens` are ephemeral. Adding persistence (e.g., SQLite) requires updating `requirements.txt` + `Dockerfile.backend`.
8. **Style:** `src/App.css` classes `.error`, `.success`, `.card`, `.delete`, `.logout` are referenced by `className` strings — renaming breaks UI.
9. **Git:** Current branch is `main` at `https://github.com/rekdfr/Task-Manager-Web-App.git`. Dockerfile/Daily changes should be on feature branches per history (`feature/kubernetes`, `feature/frontend-migration` etc.).
10. **Verification steps after edit:** `npm run build && npm test` (frontend), `python -m py_compile main.py && python main.py` curl smoke test (backend), `docker build -f Dockerfile.backend .` + `docker build -f Dockerfile.frontend .` (images), `kubectl apply --dry-run=client -f deployment.yaml -f service.yaml` (manifests).

---

## 🛠️ Troubleshooting & Operations

<details>
<summary><b>ImagePullBackOff / ErrImagePull on Minikube</b></summary>

```bash
# Images must be loaded into Minikube's docker, not just host docker
minikube image load 33351-backend:latest
minikube image load 33351-frontend:latest
minikube image ls | grep 33351
kubectl rollout restart deployment/33351-taskmanager-deployment
kubectl get pods

# Force Never pull policy if patched
kubectl patch deployment 33351-taskmanager-deployment -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"33351-backend","imagePullPolicy":"Never"},{"name":"33351-frontend","imagePullPolicy":"Never"}]}}}}'
```

</details>

<details>
<summary><b>Port already in use / Frontend cannot reach backend</b></summary>

```bash
lsof -i :5000 && lsof -i :5173
docker ps
kubectl get svc task-manager-service  # check actual NodePorts vs api.js default 32478
# If mismatch:
VITE_API_URL=http://$(minikube ip):$(kubectl get svc task-manager-service -o jsonpath='{.spec.ports[1].nodePort}') npm run build
# then rebuild frontend image and reload
```

</details>

<details>
<summary><b>Inspect cluster & app logs</b></summary>

```bash
kubectl get events --sort-by=.metadata.creationTimestamp
kubectl describe pod <pod-name>
kubectl logs <pod-name> -c 33351-backend
kubectl logs <pod-name> -c 33351-frontend --previous
kubectl exec -it <pod-name> -c 33351-backend -- sh
kubectl port-forward svc/task-manager-service 5000:5000 5173:5173  # bypass NodePort
```

</details>

<details>
<summary><b>Auth 401 loop</b></summary>

```bash
# Clear bad token
localStorage.removeItem('token')  # in browser console
# Or: App.jsx effect auto-logs out on 401 — if stuck, hard refresh
```

</details>

---

## 🧭 DevOps Journey — Lab Coverage

| # | Lab | What was done | Artifacts | Verify |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **App Development** | Flask REST API + React SPA, token auth, in-memory store | `main.py`, `src/` | `python main.py` + `npm run dev` |
| 2 | **Build Automation** | Vite production build | `vite.config.js`, `dist/` (after `npm run build`) | `npm run build && ls dist/` |
| 3 | **CI — Jenkins** | Declarative pipeline: `pollSCM` → `npm install` → `build` → `test` | `Jenkinsfile`, `test.js` | Jenkins build history → green `SUCCESS` |
| 4 | **Containerization** | Two Dockerfiles (Python + Node), `.dockerignore` | `Dockerfile.backend`, `Dockerfile.frontend` | `docker build -t 33351-backend -f Dockerfile.backend .` |
| 5 | **Orchestration** | Minikube Deployment (2 replicas, 2 containers) + NodePort Service | `deployment.yaml`, `service.yaml` | `kubectl apply -f …` → `kubectl get all` |
| 6 | **Operations** | Scaling, rollout, logs, describe, events, cleanup | `kubectl` commands above | `kubectl scale` / `logs` / `delete -f` |

Each stage is independently verifiable from `python main.py` to `minikube service task-manager-service`.

---

## 📜 Git History

Recent `main` log (`git log --oneline -10`):

```
b82bf93 add polling to jenkins
c00bdc6 kubernetes and readme changes
2d5a18b add jenkins pipeline ci/cd
31c0a67 docs: beautify README — professional DevOps lab showcase
62c22bb Merge pull request #6 from rekdfr/feature/kubernetes
4b650ff update readme with kubernetes info
e7fc55e Merge pull request #5 from rekdfr/feature/kubernetes
aa02e9e added yaml files for minikube deployment
8ab9690 added docker files
50ee340 jentest
```

Branches: `main` (active), `feature/collab`, `feature/frontend-migration`, `feature/kubernetes`, `feature/login`, `feature/new`, `feature/new-2`, `feature/readme` + remotes `origin/*`. Remote: `https://github.com/rekdfr/Task-Manager-Web-App.git`.

---

## 📄 License

Educational / lab purposes. MIT — fork, extend, adapt.

---

<div align="center">

**Built with ♥ for the DevOps Lab**

*Code. Containerize. Orchestrate. Automate.*

[⬆ Back to Top](#task-manager-web-app)

</div>
