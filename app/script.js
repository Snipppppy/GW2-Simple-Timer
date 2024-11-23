let events = await fetch('/app/events.json')
    .then(response => response.json())
    .then(obj => { return obj })
    .catch(error => console.error("Could not fetch event data: ", error));
let alertSound = new Audio("app/assets/alert.mp3");

const eventTable = document.getElementById("event-table")
const cardTemplate = document.getElementById("event-card-template")
const toggleTemplate = document.getElementById("tgl-template")
const categoryList = document.getElementById("category-list")
const categoryTemplate = document.getElementById("tgl-category-template")

let allEvents = []

let now = new Date();
const minTimeToShowCountdown = 20 * 60 * 1000
const maxTimeToShowCards = 5 * 60 * 60 * 1000

class EventClass {
    constructor(parentEvent, event, start) {
        this.parentEvent = parentEvent;
        this.event = event;
        this.eventid = start + parentEvent.key
        this.localStartTime = getLocalTime(start)
        this.color = getObjByKey(events.categories, parentEvent.categoryKey).color
        if (this.localStartTime < now) {this.localStartTime.setDate(this.localStartTime.getDate() +1 )}
        this.reminderMSbeforEvent = "no"
        this.remainingMS = null
        this.timeoutID = null
        this.intervalID = null
        this.card = null
    }
    addEventToDOM() {
        let clone = cardTemplate.content.cloneNode(true)
        clone.querySelector(".event-card-element").id =  this.eventid
        clone.querySelector(".event-card-element").classList.add(this.parentEvent.key)
        clone.querySelector(".event-card-element").style.borderColor =  this.color
        clone.querySelector('.done-icon').classList.add(`di-${this.parentEvent.key}`)
        clone.querySelector(".wiki-link").href = this.parentEvent.wiki
        clone.querySelector(".fastf-link").href = this.parentEvent.fastF
        clone.querySelector(".event-start-time").textContent = getTimeAsStr(this.localStartTime)
        clone.querySelector(".event-name").textContent = this.parentEvent.name
        clone.querySelector(".note").textContent = this.parentEvent.note
        clone.querySelector(".event-map").textContent = this.event.map

        eventTable.appendChild(clone)
        this.card = document.getElementById(this.eventid)

        // Waypoint Link
        let wp = this.card.querySelector(".waypoint-link")
        let copy = `${getTimeAsStr(this.localStartTime)} || ${this.parentEvent.name} || ${this.event.waypoint}`
        wp.addEventListener("click", () => {  navigator.clipboard.writeText(copy)    })
        wp.addEventListener("mousemove", () => {this.card.querySelector(".waypoint-icon").src = "app/assets/waypoint_active.svg"})
        wp.addEventListener("mouseout", () => {this.card.querySelector(".waypoint-icon").src = "app/assets/waypoint.svg"})

        //Reminder Link
        let rl = this.card.querySelector(".reminder-link")
        rl.addEventListener("click", () => { updateAlert(this) } )
        rl.addEventListener("mouseover", () => { rl.style.backgroundColor = "var(--accent-color)" } )
        rl.addEventListener("mouseout", () => { rl.style.backgroundColor = "var(--alt-bg-color)" } )

        // [fast] FarmingLink
        if (this.parentEvent.fastF === "") {
            this.card.querySelector(".fastf-link").style.visibility = "hidden"
        }

        //Done Link
        let dl = this.card.querySelector(".done-link")
        let toggleCheckbox = document.getElementById(`dcb-${this.parentEvent.key}`)
        dl.addEventListener("click", () => {
            toggleCheckbox.click()
        } )

        if (toggleCheckbox.checked) {
            this.card.querySelector(".done-icon").src = "app/assets/done_outline_75FB4C_.svg"
        }

        //Toggle Visibility based on localStorage Settings
        let visibility = getVisibilityFromLocalStorage(this.parentEvent.key)
        toggleVisibility(this.parentEvent.key, visibility)



    }
    updateCard() {
        this.remainingMS = this.localStartTime - now
        if (this.localStartTime > now.getTime() + maxTimeToShowCards) {return}
        if (!this.card) {this.addEventToDOM()}
        if (this.remainingMS < minTimeToShowCountdown) {this.updateCountDown()}
        if (this.remainingMS < 0) {
            this.card.remove()
            this.localStartTime.setDate(this.localStartTime.getDate() +1)
            clearInterval(this.intervalID)
        }
    }
    updateCountDown() {
        let element = this.card.querySelector(".remaining-time")
        let min = Math.floor((this.remainingMS % (1000*60*60))/(1000*60));
        let sec = Math.floor((this.remainingMS % (1000*60))/(1000));
        let secStr = String(sec).padStart(2,"0");
        element.textContent = min + ":" + secStr
    }
}

// Add toggle list categories
for (let category of events.categories) {
    addToggleCategory(category)
}

// Add visibility toggles
for (let parent of events.parentEvents) {
    addToggleElement(parent)
}

// Init all events
for (let event of events.events) {
    for (let start of event.start) {
        let pEvt =  getObjByKey(events.parentEvents, event.parentKey);
        let evt = new EventClass(pEvt, event, start)
        allEvents.push(evt)
    }
}

//Sort all events
allEvents.sort((a, b) => a.localStartTime - b.localStartTime)

//Hide browser-settings-alert in the SideBar
if (localStorage.length > 0) {
    document.getElementById("browser-settings-alert").remove()
} else {
    try {
        umami.track(`revisited with disabled events`)
    } catch (err) {
        console.log(err)
    }
}

//Add Cards to DOM
updateEventCards()

//Update cards
setInterval(interval, 1000)
function interval(){
    now = new Date();
    updateEventCards()

}

function addToggleCategory(category) {
    let clone = categoryTemplate.content.cloneNode(true)

    clone.querySelector(".categories-name").innerHTML = category.name
    clone.querySelector(".tgl-category-element").style.borderColor = category.color
    clone.querySelector(".tgl-container").id = category.key

    categoryList.appendChild(clone)
}

function addToggleElement(parentEvent) {
    let clone = toggleTemplate.content.cloneNode(true)
    let tglList = document.getElementById(parentEvent.categoryKey)

    clone.querySelector(".tgl-label").textContent = parentEvent.name
    clone.querySelector(".visibility-checkbox").checked = getVisibilityFromLocalStorage(parentEvent.key)
    clone.querySelector(".visibility-checkbox").id = `vcb-${parentEvent.key}`
    clone.querySelector(".tgl-label").htmlFor = `vcb-${parentEvent.key}`
    clone.querySelector(".done-checkbox").checked = getDoneFromLocalStorage(parentEvent.key)
    clone.querySelector(".done-checkbox").id = `dcb-${parentEvent.key}`

    tglList.appendChild(clone)

    let visibilityToggle = document.getElementById(`vcb-${parentEvent.key}`)
    visibilityToggle.addEventListener("change", (e) => {
        toggleVisibility(parentEvent.key, e.target.checked)
        try {
            umami.track(`Toggled ${parentEventKey} ${visibility}`)
        } catch (err){
            console.log(err)
        }
    })

    let doneToggle = document.getElementById(`dcb-${parentEvent.key}`)
    doneToggle.addEventListener("change", (e) => {
        toggleDone(parentEvent.key, e.target.checked)
    })
}

function getVisibilityFromLocalStorage(parentEventKey) {
    let value = localStorage.getItem(parentEventKey)
    if (value === "false") {return false}
    return true
}

function getDoneFromLocalStorage(parentEventKey){
    let value = localStorage.getItem(`done-${parentEventKey}`)
    let valueDate = new Date(value)

    if (now < valueDate ) {
        return true
    }

    localStorage.removeItem(`done-${parentEventKey}`)
    return false
}

function getObjByKey(ArrOfObject, key){
    for (let obj of ArrOfObject) {
        if (obj.key === key) { return obj }
    }
}

function toggleVisibility(parentEventKey, visibility) {
    let elements = document.getElementsByClassName(parentEventKey)
    if (visibility === true) {
        for (let e of elements) {
            e.style.display = "flex"
            localStorage.removeItem(parentEventKey)
        }
    }
    if (visibility === false) {
        for (let e of elements) {
            e.style.display = "none"
            localStorage.setItem(parentEventKey, "false")
        }
    }
}

function toggleDone(parentEventKey, value) {
    let elements = document.getElementsByClassName(`di-${parentEventKey}`)

    if (value === false) {
        for (let e of elements) {
            e.src = "app/assets/done_outline_FFFFFF.svg"
            localStorage.removeItem(`done-${parentEventKey}`)
        }
    }
    if (value === true) {
        for (let e of elements) {
            e.src = "app/assets/done_outline_75FB4C_.svg"
            let ServerResetTime = new Date()
            ServerResetTime.setUTCHours(24)
            ServerResetTime.setUTCMinutes(0)
            ServerResetTime.setUTCSeconds(0)
            ServerResetTime.setUTCMilliseconds(0)
            localStorage.setItem(`done-${parentEventKey}`, ServerResetTime)
        }
    }
}

function getLocalTime(uctZeroStartTimeAsString) {
    let splitTimStr = uctZeroStartTimeAsString.split(":")
    let splitTime = [
        parseInt(splitTimStr[0]),
        parseInt(splitTimStr[1]),
    ]
    let time = new Date()
    time.setUTCHours(splitTime[0])
    time.setUTCMinutes(splitTime[1])
    time.setUTCSeconds(0)
    time.setUTCMilliseconds(0)
    return time
}

function getTimeAsStr(time){
    let hours = String(time.getHours()).padStart(2, " ")
    let min = String(time.getMinutes()).padEnd(2, "0")
    return `${hours}:${min}`
}

function updateEventCards() {
    for (let i = 0; i < allEvents.length; i++) {
        allEvents[i].updateCard()
    }
}

function updateAlert(Event){

    let element = Event.card.querySelector(".reminder-link")

    if (Event.reminderMSbeforEvent === "no" ) {
        Event.reminderMSbeforEvent = 2 * 60000
        if (Event.remainingMS < Event.reminderMSbeforEvent) { setReminderToNo(); return }
        element.textContent = "2m"
    } else
    if (Event.reminderMSbeforEvent === 2 * 60000 ) {
        Event.reminderMSbeforEvent = 5 * 60000
        if (Event.remainingMS < Event.reminderMSbeforEvent) { setReminderToNo(); return }
        element.textContent = "5m"
        clearTimeout(Event.timeoutID)
    } else
    if (Event.reminderMSbeforEvent === 5 * 60000 ) {
        Event.reminderMSbeforEvent = 10 * 60000
        element.textContent = "10m"
        if (Event.remainingMS < Event.reminderMSbeforEvent) { setReminderToNo(); return }
        clearTimeout(Event.timeoutID)
    } else
    if (Event.reminderMSbeforEvent === 10 * 60000) {
        setReminderToNo()
        return;
    }

    let reminderInMS = Event.remainingMS - Event.reminderMSbeforEvent
    Event.timeoutID = setTimeout(()=> {alert()}, reminderInMS);

    function setReminderToNo(){
        Event.reminderMSbeforEvent = "no"
        clearTimeout(Event.timeoutID)
        clearInterval(Event.intervalID)
        element.textContent = ""
        let img = document.createElement('img')
        img.src = "app/assets/notifications_off_FFFFFF.svg"
        img.alt = "Reminder switch 2 5 10 Minutes"
        element.appendChild(img)
    }

    function alert(){
        alertSound.play()

        let x = 0

        let img = document.createElement("img");
        img.src = "app/assets/notifications_active_FFFFFF.svg"
        img.alt = "Reminder"
        element.textContent = ""
        element.appendChild(img)

        Event.intervalID = setInterval(()=>{blink()}, 1000)
        function blink(){
            if (x === 0) { element.style.backgroundColor = "var(--accent-color)"; x=1}
            else { element.style.backgroundColor = "var(--alt-bg-color)"; x=0}
        }

        try {
            umami.track(`A Gamer got notified about ${Event.parentEvent.name}`)
        } catch (err){
            console.log(err)
        }
    }
}