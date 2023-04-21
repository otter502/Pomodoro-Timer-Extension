chrome.runtime.onInstalled.addListener( async ()=>{
    await chrome.storage.session.set({"timeLengths": {break: 5, work: 25}});
    timeLengths = (await chrome.storage.session.get("timeLengths")).timeLengths

    await chrome.storage.session.set({"paused": true})
    await chrome.storage.session.set({"pausedAlarmInfo": {timeLeft: timeLengths.work}})
    await chrome.storage.session.set({"state": "work"});
    console.log("setters placed");
});

let timeLengths;


chrome.alarms.onAlarm.addListener(async () => {
    let currState = (await chrome.storage.session.get("state")).state
    let messageString = ((currState == "work") ? 
        "its time to take a 5 minute break" :
        "breaks up! time to start working"
    );
    chrome.notifications.clear("alarm notification");

    chrome.notifications.create("alarm notification", {
        message: messageString,
        title: "pomodoro",
        type: "basic",
        iconUrl: "../Images/generic_pomodoro_Timer_256.png",
        priority: 1,
    });
    skipAlarmBG();
})

async function skipAlarmBG() {
    let currState = (await chrome.storage.session.get("state")).state
    let paused = (await chrome.storage.session.get("paused")).paused;
    let x = chrome.alarms.clear("main");
    console.log("cleared? " + x); 
    if (currState == "work") createAlarm("break");
    else if (currState == "break") createAlarm("work");
    
    setIconToState(currState);

}

async function createAlarm(state) {
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



function setIconToState(iconState) {
    //icon states: paused, work, break
    let icons;
    let mode = "break";
    let num = 16;
    mode = (iconState == "paused") ? "" : mode;

    let link = (type, res) => "../Images/" + (type ? (type + "Mode/" + type + "_") : "generic_") + "pomodoro_Timer_" + res + ".png";

    icons = {
        "16": link(mode, 16),
        "32": link(mode, 32),
        "48": link(mode, 48),
        "128": link(mode, 128)
    }

    chrome.action.setIcon({path: icons})

}