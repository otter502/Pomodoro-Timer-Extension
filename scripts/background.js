function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// let timeLengths;
const startWorkTime = 25;
const startBreakTime = 5;

chrome.runtime.onInstalled.addListener( async ()=>{
    await chrome.storage.session.set({"timeLengths": {break: startBreakTime, work: startWorkTime}});
    // timeLengths = (await chrome.storage.session.get("timeLengths")).timeLengths
    
    await chrome.storage.session.set({"paused": true})
    await chrome.storage.session.set({"pausedAlarmInfo": {timeLeft: startWorkTime}})
    await chrome.storage.session.set({"state": "work"});
    console.log("setters placed");
});




chrome.alarms.onAlarm.addListener(async () => {
    let currState = (await chrome.storage.session.get("state")).state
    let messageString = ((currState == "work") ? 
        "its time to take a 5 minute break" :
        "breaks up! time to start working"
    );
    chrome.notifications.clear("alarm notification");

    skipAlarmBG();
    
    let imagePath = link(currState, 256);
    chrome.notifications.create("alarm notification", {
        message: messageString,
        title: "pomodoro",
        type: "basic",
        iconUrl: "../Images/generic_pomodoro_Timer_256.png",
        priority: 1,
    });
})

async function skipAlarmBG() {
    let currState = (await chrome.storage.session.get("state")).state
    let paused = (await chrome.storage.session.get("paused")).paused;
   
    let x = chrome.alarms.clear("main");
    if (currState == "work") await createAlarm("break");
    else if (currState == "break") await createAlarm("work");
    
    sleep(100);
    
    setIconToState((await chrome.storage.session.get("state")).state);

}

async function createAlarm(state) {
    timeLengths = (await chrome.storage.session.get("timeLengths")).timeLengths
    let time = 0;
    switch (state) {
        case "work":
            time = timeLengths.work;
            break;
        case "break":
            time = timeLengths.break;
            break;
        default:
            time = 100;
            break;
    }
    chrome.alarms.create("main", { delayInMinutes: time });
    await chrome.storage.session.set({"state": state})
    console.log(time);
}


let link = (type, res) => "../Images/" + (type ? (type + "Mode/" + type + "_") : "generic_") + "pomodoro_Timer_" + res + ".png";

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