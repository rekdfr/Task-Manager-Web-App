const API = "http://127.0.0.1:5000/task";

async function loadTasks() {

    const res = await fetch(API);
    const tasks = await res.json();

    const list = document.getElementById("taskList");
    list.innerHTML = "";

    tasks.forEach(task => {

        list.innerHTML += `
        <div class="task">

            <h3>${task.title}</h3>

            <p>${task.description}</p>

            <button class="delete"
            onclick="deleteTask(${task.id})">
            Delete
            </button>

        </div>
        `;

    });

}

async function addTask(){

    const title=document.getElementById("title").value;
    const description=document.getElementById("description").value;

    if(title=="" || description==""){
        alert("Fill all fields");
        return;
    }

    await fetch(API,{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            title,
            description
        })
    });

    document.getElementById("title").value="";
    document.getElementById("description").value="";

    loadTasks();
}

async function deleteTask(id){

    await fetch(API+"/"+id,{
        method:"DELETE"
    });

    loadTasks();

}

loadTasks();