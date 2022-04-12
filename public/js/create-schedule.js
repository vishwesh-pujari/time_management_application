document.getElementById("add_task_btn").addEventListener("click", () => {
    var schedule_table = document.getElementById("schedule-table");
    var tr = document.createElement("tr");
    var td1 = document.createElement("td");
    var td2 = document.createElement("td");
    var td3 = document.createElement("td");
    var td4 = document.createElement("td");
    var td5 = document.createElement("td");
    var td6 = document.createElement("td");
    var td7 = document.createElement("td");

    var input1 = document.createElement("input");
    var input2 = document.createElement("input");
    var input3 = document.createElement("input");
    var input4 = document.createElement("input");
    var input5 = document.createElement("input");
    var input6 = document.createElement("input");
    var button = document.createElement("button");
    var textNode = document.createTextNode("Delete Task");
    input1.setAttribute("type", "text"); input1.setAttribute("name", "title"); input1.setAttribute("id", "title");
    input2.setAttribute("type", "text"); input2.setAttribute("name", "desc"); input2.setAttribute("id", "desc");
    input3.setAttribute("type", "number"); input3.setAttribute("name", "start_time"); input3.setAttribute("id", "start_time");
    input4.setAttribute("type", "number"); input4.setAttribute("name", "end_time"); input4.setAttribute("id", "end_time");
    input5.setAttribute("type", "number"); input5.setAttribute("name", "duration"); input5.setAttribute("id", "duration");
    input6.setAttribute("type", "number"); input6.setAttribute("name", "importance"); input6.setAttribute("id", "importance");
    button.setAttribute("class", "btn btn-primary"); button.appendChild(textNode);
    button.addEventListener("click", deleteTask);

    td1.appendChild(input1); td2.appendChild(input2); td3.appendChild(input3); td4.appendChild(input4); td5.appendChild(input5); td6.appendChild(input6); td7.appendChild(button);
    tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3); tr.appendChild(td4); tr.appendChild(td5); tr.appendChild(td6); tr.appendChild(td7);
    schedule_table.appendChild(tr);
    return;
});

function deleteTask(event) {
    event.target.parentNode.parentNode.parentNode.removeChild(event.target.parentNode.parentNode);
    return;
}