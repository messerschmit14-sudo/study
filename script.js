document.addEventListener("DOMContentLoaded", () => {

/* NAVIGATION */

const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

navButtons.forEach(btn => {
  btn.onclick = () => {
    navButtons.forEach(b => b.classList.remove("active"));
    pages.forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.page).classList.add("active");
  };
});

/* THEME */

const body = document.body;
const toggle = document.getElementById("themeToggle");

if(localStorage.getItem("theme") === "dark"){
  body.classList.add("dark");
  toggle.textContent = "☀️";
}

toggle.onclick = () => {
  body.classList.toggle("dark");
  const dark = body.classList.contains("dark");
  toggle.textContent = dark ? "☀️" : "🌙";
  localStorage.setItem("theme", dark ? "dark" : "light");
};

/* DATE */

const d = new Date();
document.getElementById("date").textContent =
  d.toLocaleDateString(undefined,{
    weekday:"long",
    year:"numeric",
    month:"long",
    day:"numeric"
  });

/* TIMER */

let total = 25*60;
let remaining = total;
let running = false;
let interval;

const timeEl = document.getElementById("time");
const statusEl = document.getElementById("status");

function update(){
  const m = Math.floor(remaining/60).toString().padStart(2,"0");
  const s = (remaining%60).toString().padStart(2,"0");
  timeEl.textContent = `${m}:${s}`;
}

update();

document.getElementById("play").onclick = () => {
  if(!running){
    running = true;
    statusEl.textContent = "RUNNING";
    interval = setInterval(()=>{
      if(remaining > 0){
        remaining--;
        update();
      } else {
        clearInterval(interval);
        statusEl.textContent = "DONE";
      }
    },1000);
  } else {
    running = false;
    statusEl.textContent = "PAUSED";
    clearInterval(interval);
  }
};

document.getElementById("reset").onclick = () => {
  remaining = total;
  running = false;
  statusEl.textContent = "PAUSED";
  clearInterval(interval);
  update();
};

document.querySelectorAll(".mode").forEach(btn=>{
  btn.onclick = ()=>{
    document.querySelectorAll(".mode").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    total = btn.dataset.min * 60;
    remaining = total;
    running = false;
    clearInterval(interval);
    statusEl.textContent = "PAUSED";
    update();
  };
});

/* TASKS */

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let completed = JSON.parse(localStorage.getItem("completed")) || [];

const input = document.getElementById("taskText");
const list = document.getElementById("taskList");
const completedList = document.getElementById("completedList");

function saveTasks(){
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("completed", JSON.stringify(completed));
}

function renderTasks(){
  list.innerHTML = "";
  completedList.innerHTML = "";

  tasks.forEach((text,i)=>{
    const li = createTask(text,i,false);
    list.appendChild(li);
  });

  completed.forEach((text,i)=>{
    const li = createTask(text,i,true);
    completedList.appendChild(li);
  });
}

function createTask(text,index,isDone){
  const li = document.createElement("li");
  const span = document.createElement("span");
  span.textContent = text;

  const done = document.createElement("button");
  done.textContent = "✔";

  const del = document.createElement("button");
  del.textContent = "✕";

  done.onclick = ()=>{
    if(!isDone){
      completed.push(text);
      tasks.splice(index,1);
    } else {
      tasks.push(text);
      completed.splice(index,1);
    }
    saveTasks();
    renderTasks();
  };

  del.onclick = ()=>{
    if(isDone) completed.splice(index,1);
    else tasks.splice(index,1);
    saveTasks();
    renderTasks();
  };

  li.append(span,done,del);
  return li;
}

document.getElementById("addTask").onclick = ()=>{
  const text = input.value.trim();
  if(text){
    tasks.push(text);
    input.value="";
    saveTasks();
    renderTasks();
  }
};

input.addEventListener("keydown", e=>{
  if(e.key==="Enter") document.getElementById("addTask").click();
});

document.getElementById("clearTasks").onclick = ()=>{
  tasks=[];
  completed=[];
  saveTasks();
  renderTasks();
};

renderTasks();

/* CALENDAR */

const cal = document.getElementById("calendar");
const dayTasksCard = document.getElementById("dayTasksCard");
const dayTitle = document.getElementById("dayTitle");
const dayInput = document.getElementById("dayTaskInput");
const dayList = document.getElementById("dayTaskList");
const dayAddTask = document.getElementById("dayAddTask");

const now = new Date();
let currentYear = now.getFullYear();
let currentMonth = now.getMonth();

function renderCalendar(year, month) {
  cal.innerHTML = "";
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for(let i=0;i<firstDay;i++) cal.innerHTML += "<div></div>";

  for(let d=1; d<=daysInMonth; d++){
    const day = document.createElement("div");
    day.textContent = d;
    day.classList.add("day");
    if(d === now.getDate() && month === now.getMonth() && year === now.getFullYear()) day.classList.add("today");
    day.onclick = () => openDayTasks(year, month, d);
    cal.appendChild(day);
  }
}

renderCalendar(currentYear,currentMonth);

function getDayKey(year,month,day){ return `${year}-${month}-${day}`; }

function openDayTasks(year,month,day){
  dayTasksCard.style.display="block";
  dayTitle.textContent=`Tasks for ${year}-${month+1}-${day}`;
  const key = getDayKey(year,month,day);
  const tasks = JSON.parse(localStorage.getItem(key)||"[]");
  dayList.innerHTML="";
  tasks.forEach(t=>addDayTask(t,key));
  dayAddTask.dataset.key=key;
}

function addDayTask(text,key){
  const li=document.createElement("li");
  li.textContent=text;
  const del=document.createElement("button");
  del.textContent="✕";
  del.onclick=()=>{ li.remove(); saveDayTasks(key); };
  li.appendChild(del);
  dayList.appendChild(li);
  saveDayTasks(key);
}

function saveDayTasks(key){
  const tasks=Array.from(dayList.querySelectorAll("li"))
    .map(li=>li.firstChild.textContent);
  localStorage.setItem(key,JSON.stringify(tasks));
}

dayAddTask.onclick=()=>{
  const text=dayInput.value.trim();
  if(!text) return;
  const key=dayAddTask.dataset.key;
  addDayTask(text,key);
  dayInput.value="";
};

dayInput.addEventListener("keydown",e=>{
  if(e.key==="Enter") dayAddTask.click();
});

/* =========================
   NOTES SECTION (PRO)
========================= */

let notes = JSON.parse(localStorage.getItem("stickyNotes")) || [];

const notesContainer = document.getElementById("notesContainer");
const saveBtn = document.getElementById("saveNote");
const titleInput = document.getElementById("titleInput");
const contentInput = document.getElementById("contentInput");
const colorPalette = document.getElementById("colorPalette");

/* SAVE */
function saveNotes(){
  localStorage.setItem("stickyNotes", JSON.stringify(notes));
}

/* AUTO TEXT COLOR */
function getBrightness(hex){
  hex = hex.replace("#","");
  const r = parseInt(hex.substring(0,2),16);
  const g = parseInt(hex.substring(2,4),16);
  const b = parseInt(hex.substring(4,6),16);
  return (r*299 + g*587 + b*114) / 1000;
}

/* RENDER */
function renderNotes(){
  notesContainer.innerHTML = "";

  notes.forEach((note,index)=>{

    const card = document.createElement("div");
    card.className = "note";
    card.draggable = true;
    card.dataset.index = index;
    card.style.background = note.color;

    const brightness = getBrightness(note.color);
    card.style.color = brightness < 140 ? "white" : "#111";

    /* DRAG EVENTS */
    card.addEventListener("dragstart", handleDragStart);
    card.addEventListener("dragover", handleDragOver);
    card.addEventListener("drop", handleDrop);
    card.addEventListener("dragend", handleDragEnd);

    /* DELETE BUTTON */
    const del = document.createElement("button");
    del.className = "delete-btn";
    del.textContent = "🗑";
    del.onclick = () => {
      notes.splice(index,1);
      saveNotes();
      renderNotes();
    };

    /* TITLE */
    const title = document.createElement("h3");
    title.contentEditable = true;
    title.spellcheck = false;
    title.innerText = note.title;

    title.oninput = () => {
      notes[index].title = title.innerText;
      saveNotes();
    };

    /* CONTENT */
    const content = document.createElement("p");
    content.contentEditable = true;
    content.spellcheck = false;
    content.innerText = note.content;

    content.oninput = () => {
      notes[index].content = content.innerText;
      saveNotes();
    };

    card.appendChild(del);
    card.appendChild(title);
    card.appendChild(content);

    notesContainer.appendChild(card);
  });
}

/* DRAG LOGIC */

let draggedIndex = null;

function handleDragStart(e){
  draggedIndex = +this.dataset.index;
  this.classList.add("dragging");
}

function handleDragOver(e){
  e.preventDefault();
}

function handleDrop(e){
  const targetIndex = +this.dataset.index;

  if(draggedIndex === targetIndex) return;

  const draggedItem = notes.splice(draggedIndex,1)[0];
  notes.splice(targetIndex,0,draggedItem);

  saveNotes();
  renderNotes();
}

function handleDragEnd(){
  this.classList.remove("dragging");
}

/* COLOR PALETTE */

const defaultColors = [
  "#FDE68A",
  "#BFDBFE",
  "#C7D2FE",
  "#FBCFE8",
  "#BBF7D0",
  "#FED7AA",
  "#E9D5FF",
  "#A7F3D0",
  "#FCA5A5",
  "#DDD6FE"
];

let selectedColor = defaultColors[0];

defaultColors.forEach(color => {
  const swatch = document.createElement("div");
  swatch.className = "color-swatch";
  swatch.style.background = color;

  if(color === selectedColor){
    swatch.classList.add("active");
  }

  swatch.onclick = () => {
    selectedColor = color;

    document.querySelectorAll(".color-swatch")
      .forEach(s => s.classList.remove("active"));

    swatch.classList.add("active");
  };

  colorPalette.appendChild(swatch);
});

/* SAVE NEW NOTE */

saveBtn.onclick = ()=>{
  if(!titleInput.value.trim() && !contentInput.value.trim()) return;

  notes.push({
    title: titleInput.value.trim() || "Untitled",
    content: contentInput.value.trim(),
    color: selectedColor
  });

  titleInput.value = "";
  contentInput.value = "";

  saveNotes();
  renderNotes();
};

renderNotes();


/* HABIT TRACKER */

const tableBody = document.querySelector("#habitTable tbody");
const habitInput = document.getElementById("habitInput");

let habitData = JSON.parse(localStorage.getItem("habitData")) || { habits: [] };

const colors=["#3b82f6","#22c55e","#a855f7","#ef4444","#f59e0b","#14b8a6","#ec4899"];

function saveHabits(){
  localStorage.setItem("habitData",JSON.stringify(habitData));
}

function renderHabits(){
  tableBody.innerHTML="";
  habitData.habits.forEach((habit,hIndex)=>{
    const tr=document.createElement("tr");
    const nameTd=document.createElement("td");
    nameTd.textContent=habit.name;
    tr.appendChild(nameTd);

    habit.days.forEach((day,dIndex)=>{
      const td=document.createElement("td");
      const box=document.createElement("div");
      box.className="checkbox";
      if(day.done){
        box.style.background=habit.color;
        box.style.borderColor=habit.color;
        box.textContent="✓";
      }
      if(day.note) box.classList.add("has-note");
      box.onclick=()=>{
        day.done=!day.done;
        saveHabits();
        renderHabits();
      };
      box.ondblclick=(e)=>{
        e.stopPropagation();
        const input=document.createElement("input");
        input.className="note-input";
        input.value=day.note||"";
        td.innerHTML="";
        td.appendChild(input);
        input.focus();
        input.onkeydown=(e)=>{
          if(e.key==="Enter"){
            day.note=input.value;
            saveHabits();
            renderHabits();
          }
        };
      };
      td.appendChild(box);
      tr.appendChild(td);
    });

    const doneCount=habit.days.filter(d=>d.done).length;
    const percent=Math.round((doneCount/7)*100);
    const statsTd=document.createElement("td");
    statsTd.innerHTML=`
      ${percent}%
      <div class="progress">
        <div class="progress-bar" style="width:${percent}%;background:${habit.color}"></div>
      </div>
    `;
    tr.appendChild(statsTd);

    const delTd=document.createElement("td");
    const delBtn=document.createElement("button");
    delBtn.textContent="✕";
    delBtn.className="delete-btn";
    delBtn.onclick=()=>{
      habitData.habits.splice(hIndex,1);
      saveHabits();
      renderHabits();
    };
    delTd.appendChild(delBtn);
    tr.appendChild(delTd);

    tableBody.appendChild(tr);
  });
}

habitInput.addEventListener("keydown",(e)=>{
  if(e.key==="Enter" && habitInput.value.trim()!==""){
    habitData.habits.push({
      name:habitInput.value.trim(),
      color:colors[habitData.habits.length%colors.length],
      days:Array.from({length:7},()=>({done:false,note:""}))
    });
    habitInput.value="";
    saveHabits();
    renderHabits();
  }
});

renderHabits();

});
