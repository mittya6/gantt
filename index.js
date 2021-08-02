dayjs.locale('ja');
let gantt;
let calendar;
let tasks;


// ganttのduration押下時の処理
window.addEventListener('DOMContentLoaded', (event) => {
    let buttons = document.getElementsByName("ganttDuration");
    buttons.forEach((curButton) => {
        curButton.addEventListener('click', () => {
            let tarButtons = document.querySelectorAll("#durationButtons button");
            tarButtons.forEach((tarButton) => {
                tarButton.classList.remove('bg-gray-900');
                tarButton.classList.add('bg-gray-700');
            });

            curButton.classList.remove('bg-gray-700');
            curButton.classList.add('bg-gray-900');
            gantt.change_view_mode(curButton.innerText);
        });
    });
});


// init Gantt & Calendar
window.addEventListener('DOMContentLoaded', (event) => {
    tasks = [
        {
            id: '1',
            name: 'sample',
            start: dayjs(new Date()).format('YYYY-MM-DD'),
            end: dayjs(new Date()).add(1, 'day').format('YYYY-MM-DD'),
            progress: 20
        }
    ];
    initGant(tasks);
    initCalendar(tasks);
});

// initialize Gantt
function initGant(tarTasks) {
    gantt = new Gantt('#gantt', tasks, {
        language: 'zh',
        on_click: (task) => {
        },
        on_date_change: function (task, start, end) {
            //console.log(task, start, end);
        },
        on_progress_change: function (task, progress) {
            //console.log(task, progress);
        },
        on_view_change: function (mode) {
            //console.log(mode);
        },
        custom_popup_html: function (task) {
            event.stopPropagation();
            task.start = format(task._start, FORMAT.INPUT_VALUE);
            task.end = format(task._end, FORMAT.INPUT_VALUE, -1);
            toggleTask(task);
            return '';
        }
    });
}

// initialize Calendar 
function initCalendar(tarTasks) {
    var calendarEl = document.getElementById('calendar');

    calendar = new FullCalendar.Calendar(calendarEl, {
        headerToolbar: {
            left: 'custom1 dayGridMonth,timeGridWeek,timeGridDay,listMonth today',
            center: 'title',
            right: 'prev,next'
        },
        navLinks: true,
        businessHours: true,
        editable: true,
        eventStartEditable: true,
        eventResizableFromStart: true,
        locale: 'ja',
        customButtons: {
            custom1: {
                text: 'New Task',
                click: openTask
            }
        },
        events: tarTasks.map((curTask)=>toEvent(curTask)),
        eventClick: function (info) {
            const tarTask = tasks.find(element => element.id == info.event.id);
            tarTask.name = info.event.title;
            tarTask.start = format(info.event.start, FORMAT.INPUT_VALUE);
            if(info.event.end){
                tarTask.end = format(info.event.end, FORMAT.INPUT_VALUE,-1);
            }else{
                tarTask.end = format(info.event.start, FORMAT.INPUT_VALUE);
            }
            toggleTask(tarTask);
            //const tarTask = tasks.find(element => element.id == info.event.id);
        },
        eventMouseLeave  : function(info){
            console.log('leave')
            const tarTask = tasks.find(element => element.id == info.event.id);
            tarTask.name = info.event.title;
            tarTask.start = format(info.event.start, FORMAT.INPUT_VALUE);
            if(info.event.end){
                tarTask.end = format(info.event.end, FORMAT.INPUT_VALUE,-1);
            }else{
                tarTask.end = format(info.event.start, FORMAT.INPUT_VALUE);
            }
        },
        dateClick: function (info) {
            toggleTask(
                {
                    id: '',
                    name: '',
                    start: format(info.dateStr, FORMAT.INPUT_VALUE),
                    end: format(info.dateStr, FORMAT.INPUT_VALUE),
                    progress: 0,
                    dependencies: []
                }
            );
        }
    });

    calendar.render();
}

function toEvent(tarTask){
    return{
        id:tarTask.id,
        title:tarTask.name,
        start: format(tarTask.start, FORMAT.CALENDAR_VALUE),
        end: format(tarTask.end, FORMAT.CALENDAR_VALUE, 1)
    }
}

// onclick event for New Task
window.addEventListener('DOMContentLoaded', (event) => {
    event.preventDefault();
    const newTask = document.querySelector('#newTask');
    newTask.addEventListener('click', openTask);
});

function openTask() {
    toggleTask(
        {
            id: '',
            name: '',
            start: dayjs(new Date()).format('YYYY-MM-DD'),
            end: dayjs(new Date()).format('YYYY-MM-DD'),
            progress: 0,
            dependencies: []
        }
    );
}

function toggleTask(tarTask) {
    let curForm = document.forms['inputform'];
    curForm.elements['taskname'].value = tarTask.name;
    curForm.elements['startdate'].type = tarTask.start.length <= 10 ? 'date' : 'datetime-local';
    curForm.elements['startdate'].value = tarTask.start;
    curForm.elements['startOption'].value = curForm.elements['startdate'].type;
    curForm.elements['enddate'].type = tarTask.end.length <= 10 ? 'date' : 'datetime-local';
    curForm.elements['enddate'].value = tarTask.end;
    curForm.elements['endOption'].value = curForm.elements['enddate'].type;
    curForm.elements['progress'].value = tarTask.progress;
    curForm.elements['taskId'].value = tarTask.id;
    let dependenciesSelect = curForm.elements['dependencies'];
    dependenciesSelect.options.length = 0;
    let positionSelect = curForm.elements['position'];
    positionSelect.options.length = 0;
    positionSelect.appendChild(new Option('TOP', '0'));

    let position = tasks.findIndex((curTask) => curTask.id == tarTask.id) - 1;
    position = position < 0 ? tasks.length - 1 : position;
    tasks.filter((curTask) => curTask.id != tarTask.id).
        forEach((curTask, i) => {
            dependenciesSelect.appendChild(new Option(curTask.name, curTask.id, tarTask.dependencies.includes(curTask.id), tarTask.dependencies.includes(curTask.id)));
            positionSelect.appendChild(new Option(curTask.name, curTask.id, i == position, i == position));
        });
    toggleModal();
}

// onclick event for Save & Load
window.addEventListener('DOMContentLoaded', (event) => {

    const save = document.querySelector('#Save');
    save.addEventListener('click', () => {
        event.preventDefault();

        let savedGantt = tasks.map((curTask) => {
            return {
                id: curTask.id,
                name: curTask.name,
                start: format(curTask._start, FORMAT.TASK_VALUE),
                end: format(curTask._end, FORMAT.TASK_VALUE, -1),
                progress: curTask.progress,
                dependencies: curTask.dependencies.join(',')
            }
        });
        let savedData = {
            title: document.querySelector('#title').value ? document.querySelector('#title').value : '',
            gantt: savedGantt
        }
        let blob = new Blob([JSON.stringify(savedData, null, 2)], { type: "text/json;charset=utf-8" });
        saveAs(blob, 'gantt.json');
    });


    const selectElement = document.querySelector('#Load');
    selectElement.addEventListener('change', (event) => {
        var tarFile = event.target.files[0];

        let reader = new FileReader();
        reader.onload = function (event) {
            // ファイルのテキストがここにプリントされる
            savedData = JSON.parse(event.target.result);
            document.querySelector('#title').value = savedData.title;
            gantt.refresh(savedData.gantt);
            tasks = savedData.gantt;
        };
        reader.readAsText(tarFile);
    });
});

let FORMAT = {
    TASK_VALUE: {
        DATE_FORMAT: 'YYYY-MM-DD',
        DATETIME_FORMAT: 'YYYY-MM-DD HH:mm',
    },
    INPUT_VALUE: {
        DATE_FORMAT: 'YYYY-MM-DD',
        DATETIME_FORMAT: 'YYYY-MM-DDTHH:mm',
    },
    CALENDAR_VALUE: {
        DATE_FORMAT: 'YYYY-MM-DD',
        DATETIME_FORMAT: 'YYYY-MM-DDTHH:mm',
    }
}

function format(tarDate, format, dayOffset = 0) {
    let tarDayjs = dayjs(tarDate);
    if (tarDayjs.hour() == 0 && tarDayjs.minute() == 0) {
        return tarDayjs.add(dayOffset, 'day').format(format.DATE_FORMAT);
    }
    return tarDayjs.format(format.DATETIME_FORMAT);
}


// Modal画面自体のイベント登録
window.addEventListener('DOMContentLoaded', (event) => {
    var closemodal = document.querySelectorAll('.modal-open, .modal-close, .modal-overlay')
    for (var i = 0; i < closemodal.length; i++) {
        closemodal[i].addEventListener('click', toggleModal);
    }
});

//画面上でdate ←→ datetimeを切り替えたときの処理。
function optionChange(tarId, type) {
    const tarInput = document.getElementById(tarId);
    let tarDayjs;
    if (tarInput.type == 'date') {
        tarDayjs = dayjs(tarInput.value, "YYYY-MM-DD");

    } else {
        tarDayjs = dayjs(tarInput.value, "YYYY-MM-DDTHH:mm");

    }
    if (type == 'date') {
        tarInput.type = type;
        tarInput.value = tarDayjs.format("YYYY-MM-DD");
    } else {
        tarInput.type = type;
        tarInput.value = tarDayjs.format("YYYY-MM-DDTHH:mm");
    }
}

document.onkeydown = function (evt) {
    evt = evt || window.event;
    var isEscape = false
    if ("key" in evt) {
        isEscape = (evt.key === "Escape" || evt.key === "Esc")
    } else {
        isEscape = (evt.keyCode === 27)
    }
    if (isEscape && document.body.classList.contains('modal-active')) {
        toggleModal();
    }
};

function toggleModal(event) {
    //event = event || window.event;
    //event.preventDefault();
    const body = document.querySelector('body');
    const modal = document.querySelector('.modal');
    modal.classList.toggle('opacity-0');
    modal.classList.toggle('pointer-events-none');
    body.classList.toggle('modal-active');
}

// onclick event for apply, delete, clear button
window.addEventListener('DOMContentLoaded', (event) => {

    const buttonApply = document.querySelector('#apply');
    buttonApply.addEventListener('click', (event) => {
        event.preventDefault();

        let curForm = document.forms['inputform'];

        // validate taskname
        if (!curForm.elements['taskname'].value) {
            curForm.elements['taskname'].classList.remove("border-gray-200");
            curForm.elements['taskname'].classList.add("border-pink-700");
            return;
        } else {
            curForm.elements['taskname'].classList.add("border-gray-200");
            curForm.elements['taskname'].classList.remove("border-pink-700");
        }
        //validate start date, end date
        if (curForm.elements['startdate'].value > curForm.elements['enddate'].value) {
            curForm.elements['startdate'].classList.remove("border-gray-200");
            curForm.elements['startdate'].classList.add("border-pink-700");

            curForm.elements['enddate'].classList.remove("border-gray-200");
            curForm.elements['enddate'].classList.add("border-pink-700");
            return;
        } else {
            curForm.elements['startdate'].classList.add("border-gray-200");
            curForm.elements['startdate'].classList.remove("border-pink-700");

            curForm.elements['enddate'].classList.add("border-gray-200");
            curForm.elements['enddate'].classList.remove("border-pink-700");
        }
        // タスクIDの取得
        let tarId = curForm.elements['taskId'].value;
        // 対象タスクを抽出。なければ新規作成
        let tarTask;
        if (tarId) {
            tarTask = tasks.find(element => element.id == tarId);
        } else {
            const maxTasks = tasks.reduce((a, b) => (a.id > b.id) ? a : b);
            tarTask = { id: maxTasks ? String(Number(maxTasks.id) + 1) : '1' };
        }
        // 対象タスクに各種値の設定
        tarTask.name = curForm.elements['taskname'].value;
        if (curForm.elements['startOption'].value == 'date') {
            tarTask.start = curForm.elements['startdate'].value;
        } else {
            let tarDayjs = dayjs(curForm.elements['startdate'].value, "YYYY-MM-DDTHH:mm");
            tarTask.start = tarDayjs.format("YYYY-MM-DD HH:mm");
        }
        if (curForm.elements['endOption'].value == 'date') {
            tarTask.end = curForm.elements['enddate'].value;
        } else {
            let tarDayjs = dayjs(curForm.elements['enddate'].value, "YYYY-MM-DDTHH:mm");
            tarTask.end = tarDayjs.format("YYYY-MM-DD HH:mm");
        }
        tarTask.progress = curForm.elements['progress'].value;
        const dependenciesOptions = document.querySelectorAll('select[name="dependencies"] option:checked');
        const dependencies = [...dependenciesOptions].map((curOption) => curOption.value);
        tarTask.dependencies = dependencies.join(",");

        // ポジションを入れ替えるため、対象タスクを配列から除去
        tasks = tasks.filter((curTask) => curTask.id != tarTask.id);
        // 指定したポジションに挿入
        const underTaskId = document.querySelector('select[name="position"] option:checked').value;
        const position = tasks.findIndex((curTask) => curTask.id == underTaskId);
        tasks.splice(position + 1, 0, tarTask);

        const tarEvent = calendar.getEventById(tarTask.id);
        if(!tarEvent){
            calendar.addEvent(toEvent(tarTask));
        }else{
            tarEvent.setProp( 'title', tarTask.name );
            console.log(tarTask.start);
            console.log(tarTask.end);
            if(tarTask.start.length > 10 || tarTask.end.length > 10){
                console.log("not all day");
                tarEvent.setAllDay(false);
            }
            tarEvent.setStart(format(tarTask.start,FORMAT.CALENDAR_VALUE));
            tarEvent.setEnd(format(tarTask.end,FORMAT.CALENDAR_VALUE, 1));
        }
        
        gantt.refresh(tasks);
        toggleModal();
    });

    const buttonDelete = document.querySelector('#delete');
    buttonDelete.addEventListener('click', (event) => {
        event.preventDefault();

        let curForm = document.forms['inputform'];
        let tarId = curForm.elements['taskId'].value;
        tasks = tasks.reduce((accumulator, curTask) => {
            // 対象タスクを除外
            if (curTask.id == tarId) {
                return accumulator;
            }
            // dependenciesの参照も除外
            curTask.dependencies = curTask.dependencies.filter((dependency) => dependency != tarId);
            accumulator.push(curTask);
            return accumulator;
        }, []);

        const tarEvent = calendar.getEventById(tarId);
        if(tarEvent){
            tarEvent.remove();
        }
        gantt.refresh(tasks);
        toggleModal();
    });

    const buttonClear = document.querySelector('#clear');
    buttonClear.addEventListener('click', (event) => {
        event.preventDefault();

        const optionDependencies = document.querySelectorAll('select[name="dependencies"] option:checked');
        optionDependencies.forEach((curOption) => curOption.selected = false);
    });
});