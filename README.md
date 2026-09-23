# Task Manager Web App

A full-stack task management application with user authentication. The frontend is a React application built with Vite; the backend is an existing Flask REST API.

## Features

- **User authentication** — Register and log in to obtain a token-protected session
- **Task management** — Create, list, retrieve, and delete tasks
- **Token-based authorization** — Protected API endpoints require a valid auth token
- **In-memory data store** — Simple modular design with no external database required
- **Hot-reload dev server** — Vite dev server with API proxying to the Flask backend

## Project Structure

```
.
├── main.py            # Flask REST API backend
├── requirements.txt   # Python dependencies
├── package.json       # Node.js dependencies & scripts
├── vite.config.js     # Vite configuration
├── index.html         # App entry HTML
├── Dockerfile.frontend   # Frontend container image
├── Dockerfile.backend    # Backend container image
├── deployment.yaml    # Kubernetes Deployment manifest
├── service.yaml       # Kubernetes Service manifest
└── src/               # React frontend
    ├── main.jsx       # React entry point
    ├── App.jsx        # Root component & routing
    ├── App.css        # Global styles
    ├── components/    # UI components
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── Navbar.jsx
    │   ├── TaskForm.jsx
    │   └── TaskList.jsx
    └── services/
        └── api.js     # API client & auth helpers
```

## Architecture

```
Flask Backend
      ↓
  REST API
      ↑
React Frontend
      ↓
  Vite Build
      ↓
npm run build
      ↓
   Jenkins
```

## Tech Stack

### Backend
- **Python 3** — Core language
- **Flask 3.1.1** — Web framework
- **Flask-RESTful 0.3.10** — REST API extension
- **Flask-Cors 6.0.1** — CORS support

### Frontend
- **React 18** — UI library
- **Vite 5** — Build tool and dev server
- **CSS3** — Styling
- **npm** — Package manager and build runner

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login and receive auth token |
| GET | `/task` | Get all tasks |
| POST | `/task` | Create a new task |
| GET | `/task/<id>` | Get a specific task |
| DELETE | `/task/<id>` | Delete a task |

Authentication uses a token returned by `/login`, stored in `localStorage` and sent as the `Authorization` header.

The backend URL defaults to `http://127.0.0.1:5000` and can be overridden with a `VITE_API_URL` environment variable.

## Setup & Running

### Backend

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

Runs at `http://127.0.0.1:5000`.

### Frontend (development)

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173` with hot reload, proxying API calls to the Flask backend.

### Production build

```bash
npm run build
```

Generates the production bundle in `dist/`. Preview it locally with `npm run preview`.

## Jenkins Build Automation

This project demonstrates build automation of a web application using a Jenkins Freestyle Project:

```
GitHub
↓
Checkout
↓
npm install
↓
npm run build
↓
SUCCESS / FAILURE
```

Jenkins only needs Node.js and npm installed. The frontend build is completely independent of Python/Flask — the backend does not need to run during the build.

### Jenkins configuration (Freestyle Project)

1. Source Code Management: Git → repository URL
2. Build → Execute Shell:

```bash
npm install
npm run build
```

A green **SUCCESS** means checkout, dependency installation, and the Vite production build all completed.



test sept2 . part 2 wwwwwwww

HI , THIS IS DEVOPS LAB
THIS IS TO UPDATE THE README 
PUSH TO COLLAB BRANCH 

jenkins


## DOCKER CONFIGURATION 

there are 2 images , one for backend and frontend each 

Use:
``` bash
docker build -t task-frontend -f Dockerfile.frontend .
docker build -t task-backend -f Dockerfile.backend .
docker run -d -p 5000:5000 --name backend task-backend
docker run -d -p 5173:5173 --name frontend task-frontend
```

## KUBERNETES / MINIKUBE DEPLOYMENT

Deploys the two container images as a single pod (backend on port 5000, frontend on port 5173) managed by a Deployment, exposed via a NodePort Service.

### Objects

| Object     | File            | Name                              | Key details                          |
|------------|-----------------|-----------------------------------|--------------------------------------|
| Deployment | `deployment.yaml` | `33351-taskmanager-deployment`  | 2 replicas, containers `task-backend` & `task-frontend`, `imagePullPolicy: Never` |
| Service    | `service.yaml`    | `task-manager-service`          | NodePort, frontend `5173`, backend `5000` |

### Setup

``` bash
# 1. Start minikube
minikube start
minikube status

# 2. Build the images
docker build -t task-backend -f Dockerfile.backend .
docker build -t task-frontend -f Dockerfile.frontend .

# 3. Load the images into minikube (required because imagePullPolicy: Never)
minikube image load task-backend:latest
minikube image load task-frontend:latest
minikube image ls | grep task
```

### Applying the manifests

``` bash
# 4. Create the deployment from YAML
kubectl apply -f deployment.yaml

# 5. Create the service from YAML
kubectl apply -f service.yaml
```

### Inspecting resources

``` bash
kubectl get deployments
kubectl get pods
kubectl get replicasets
kubectl get services          # or: kubectl get svc
kubectl get all               # everything at once
kubectl get nodes

# Detailed info
kubectl describe deployment 33351-taskmanager-deployment
kubectl describe pod <pod-name>
kubectl describe svc task-manager-service

# Logs from a pod (contains both containers)
kubectl logs <pod-name>

# Rollout progress
kubectl rollout status deployment/33351-taskmanager-deployment
kubectl rollout history deployment/33351-taskmanager-deployment
```

### Accessing the app

``` bash
# Open automatically in the browser
minikube service task-manager-service

# Or print the URLs
minikube service task-manager-service --url
```

Frontend: `http://192.168.49.2:30723` · Backend: `http://192.168.49.2:32478` (minikube IP `192.168.49.2`, NodePorts as shown by `kubectl get svc`).

### Scaling

``` bash
kubectl scale deployment 33351-taskmanager-deployment --replicas=4   # scale up
kubectl scale deployment 33351-taskmanager-deployment --replicas=1   # scale down
kubectl scale deployment 33351-taskmanager-deployment --replicas=0   # stop all pods

# Confirm
kubectl get pods
kubectl get deployments
```

A common tweak: change `replicas` in `deployment.yaml`, then `kubectl apply -f deployment.yaml` again.

### Troubleshooting

``` bash
# Fix image pull issues by forcing local images (imagePullPolicy: Never)
kubectl patch deployment 33351-taskmanager-deployment -p '{"spec":{"template":{"spec":{"containers":[{"name":"task-backend","imagePullPolicy":"Never"},{"name":"task-frontend","imagePullPolicy":"Never"}]}}}}'

# Inspect events / errors
kubectl get events --sort-by=.metadata.creationTimestamp
```

### Cleanup

``` bash
kubectl delete -f service.yaml
kubectl delete -f deployment.yaml
minikube stop
```
