let playPauseButton = document.getElementById("playPause");
let resetButton = document.getElementById("reset");
let skipButton = document.getElementById("skip");
let timeLeftP = document.getElementById("timeLeft");

const breakTime = 5
const workTime = 25

const stateArr = ["work", "break"];
const pausedAlarmInfoKey = "pausedAlarmInfo";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//states that need to be stored: paused, work or break,


function setIconToState(iconState) {
    //icon states: paused, work, break
    let mode = (iconState == "paused") ? "" : iconState;

    let link = (type, res) => "../Images/" + (type ? (type + "Mode/" + type + "_") : "generic_") + "pomodoro_Timer_" + res + ".png";

    let icons = {
        "16": link(mode, 16),
        "32": link(mode, 32),
        "48": link(mode, 48),
        "128": link(mode, 128)
    }

    chrome.action.setIcon({path: icons})

}


async function updatePauseButton(){
    let alarm = (await chrome.alarms.get("main"))
    playPauseButton.innerHTML = (alarm == undefined) ? "resume" : "pause";
}

async function createAlarm(state) {
    // timeLengths = (await chrome.storage.session.get("timeLengths")).timeLengths
    let time = 0;
    switch (state) {
        case "work":
            // time = timeLengths.work;
            time = workTime;
            break;
        case "break":
            // time = timeLengths.break;
            time = breakTime;
            break;
        default:
            time = 100;
            break;
    }
    chrome.alarms.create("main", { delayInMinutes: time });
    await chrome.storage.session.set({"state": state})
    console.log(time);
}


async function pauseAlarm() {
    let alarm = (await chrome.alarms.get("main"))
    let minutesLeft = (alarm.scheduledTime - Date.now())/60000

    await chrome.storage.session.set({[pausedAlarmInfoKey]: {timeLeft: minutesLeft}})
    await chrome.storage.session.set({"paused": true})
    chrome.alarms.clear("main");

    setIconToState("paused");
    updatePauseButton();
}

async function resumeAlarm(){
    chrome.alarms.clear("main");
    let currState = (await chrome.storage.session.get("state")).state
    let pausedAlarmInfo = (await chrome.storage.session.get(pausedAlarmInfoKey)).pausedAlarmInfo;
    
    chrome.alarms.create("main", {delayInMinutes: pausedAlarmInfo.timeLeft})
    await chrome.storage.session.set({"paused": false})

    setIconToState(currState);
    updatePauseButton();
}

async function resetAlarm() {
    let currState = (await chrome.storage.session.get("state")).state
    let paused = (await chrome.storage.session.get("paused")).paused;

    chrome.alarms.clear("main");
    createAlarm(currState);
    if (paused) {
        pauseAlarm();
    }

}

async function skipAlarm() {
    //should check if paused then do something different based on that
    let currState = (await chrome.storage.session.get("state")).state
    let paused = (await chrome.storage.session.get("paused")).paused;
    chrome.alarms.clear("main");
    if (currState == "work") createAlarm("break");
    else if (currState == "break") createAlarm("work");
    
    if (paused) {
        pauseAlarm();
    }

    sleep(100);
    setIconToState((await chrome.storage.session.get("state")).state);
    updatePauseButton();
}



playPauseButton.addEventListener('click', async () => {
    console.log("clicked!!!");
    let paused = (await chrome.storage.session.get("paused")).paused;
    if (paused) {
        resumeAlarm();
    } else {
        pauseAlarm();
    }
    console.log(paused);
});

skipButton.addEventListener('click', async () => {
    console.log("clicked!!!");
    skipAlarm();
});
resetButton.addEventListener('click', async () => {
    console.log("clicked!!!");
    resetAlarm();
});

// chrome.alarms.onAlarm.addListener(async () => {
//     await sleep(100);
//     skipAlarm();
// });

function minutesToTimeDisplay(timeInMinutes) {
    let hours = ~~(timeInMinutes / 60);
    let minutes = ~~(timeInMinutes % 60);
    let seconds = ~~((timeInMinutes % 1) * 60);

    return(
        ((hours) ? hours.toString().padStart(2,"0") + ":" : "") + 
        ((minutes || hours) ? minutes.toString().padStart(2,"0") + ":" : "") + 
        ((minutes || hours || seconds) ? seconds.toString().padStart(2,"0") + "s" : "")
    );
    return('${hours}')
}

var x = setInterval(async () => {
    // try {
        let paused = (await chrome.storage.session.get("paused")).paused;
        //do a is paused check, then a undefined alarm check, if its underfined have the output be something like "timer reseting" or something
        let timeLeftValue;
        let isLoading = false;
        if (!paused) {
            let alarm = await chrome.alarms.get("main");
            if (alarm !== undefined) timeLeftValue = (alarm.scheduledTime - Date.now())/60000;
        } else {
            timeLeftValue = (await chrome.storage.session.get(pausedAlarmInfoKey)).pausedAlarmInfo.timeLeft;
        }
        
        if (timeLeftValue == undefined) timeLeftP.innerText = "loading next timer!"
        else timeLeftP.innerText =  minutesToTimeDisplay(timeLeftValue);  
    // } catch (error) {
    //     console.log("uhoh");
    // }
}, 100);

sleep(100)
updatePauseButton();