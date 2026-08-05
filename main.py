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
    app.run(debug=True)