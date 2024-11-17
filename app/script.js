let eventData = await fetch('/app/eventData.json')
    .then(response => response.json())
    .then(obj => { return obj })
    .catch(error => console.error("Culd not fetch EventData", error));

const eventTable = document.getElementById("event-table")
const cardTemplate = document.getElementById("event-card-template")
const toggleTemplate = document.getElementById("tgl-template")
let allEvents = []

class event {
    constructor(eventData, startTimeStr) {
        this.parentEventID = eventData.Name.replaceAll(" ", "-")
        this.eventid = startTimeStr+this.parentEventID
        this.name = eventData.Name
        this.map = eventData.Map
        this.waypoint = eventData.Waypoint
        this.wiki = eventData.Wiki
        this.localStartTime = getLocalTime(startTimeStr)
        this.category = eventData.Category
    }
    addEventToDOM() {
        let now = new Date();
        if (this.localStartTime < now) {return}

        let clone = cardTemplate.content.cloneNode(true)

        clone.querySelector(".event-card-element").classList.add(this.parentEventID)
        clone.querySelector(".event-card-element").classList.add(this.category)
        clone.querySelector(".event-card-element").id =  this.eventid
        clone.querySelector(".waypoint-link").id =  `wp${this.eventid}`
        clone.querySelector(".remaining-time").id = `rt-${this.eventid}`
        clone.querySelector(".wiki-link").href = this.wiki
        clone.querySelector(".event-start-time").textContent = getTimeAsStr(this.localStartTime)
        clone.querySelector(".event-name").textContent = this.name
        clone.querySelector(".event-map").textContent = this.map

        eventTable.appendChild(clone)

        let wp = document.getElementById(`wp${this.eventid}`)
        wp.addEventListener("click", () => {  navigator.clipboard.writeText(this.waypoint)    })
        wp.classList.add(this.category)

        let card = document.getElementById(this.eventid)
        let visibility = getVisibility(this.parentEventID)
        toggleVisibility(card, visibility)

    }
    updateCard(now) {
        let card = document.getElementById(this.eventid)
        if (!card) return
        let remainingMS = this.localStartTime - now
        if (remainingMS < 0) {    card.remove()   }
        if (remainingMS < 1800000) {  this.updateCountDown(remainingMS) }
    }
    updateCountDown(remainingMS) {
        let div = document.getElementById(`rt-${this.eventid}`)
        let m = Math.floor((remainingMS % (1000*60*60))/(1000*60));
        let s = Math.floor((remainingMS % (1000*60))/(1000));
        let sStr = String(s).padStart(2,"0");
        div.textContent = m + ":" + sStr
    }
}

// Add Event Toggles
for (let i = 0; i < eventData.length; i++) {
    addVisibilityTgl(eventData[i])
    for (let j = 0; j < eventData[i].uctZeroStartTime.length; j++) {
        let evt = new event(eventData[i], eventData[i].uctZeroStartTime[j])
        allEvents.push(evt)
    }
}

//Sort All Events
allEvents.sort((a, b) => a.localStartTime - b.localStartTime)

// Add Event Cards
for (let i = 0; i < allEvents.length; i++) {
    allEvents[i].addEventToDOM()
}

//Update
setInterval(updateEventCard, 1000)

function addVisibilityTgl(eventData) {
    let clone = toggleTemplate.content.cloneNode(true)
    let parentEventID = eventData.Name.replaceAll(" ", "-")

    clone.querySelector(".tgl-label").textContent = eventData.Name
    clone.querySelector(".tgl-checkbox").checked = getVisibility(parentEventID)
    clone.querySelector(".tgl-checkbox").id = `cb-${parentEventID}`
    clone.querySelector(".tgl-label").htmlFor = `cb-${parentEventID}`


    const tglList = document.getElementById(eventData.Category)
    tglList.appendChild(clone)

    let tgl = document.getElementById(`cb-${parentEventID}`)
    tgl.addEventListener("change", (e) => {
        setVisibility(parentEventID, e.target.checked)
        let elements = document.getElementsByClassName(parentEventID)
        toggleVisibility(elements, e.target.checked)
    })
}

function getVisibility(parentEventID) {
    let value = localStorage.getItem(parentEventID)
    if (value === "false") {return false}
    return true
}

function setVisibility(parentEventID, value) {
    if (value === false) {localStorage.setItem(parentEventID, "false")}
    if (value === true) {localStorage.removeItem(parentEventID)}
}

function toggleVisibility(elements, visibility) {
    if ( !HTMLCollection.prototype.isPrototypeOf(elements) ) {elements = [elements]}

    if (visibility === true) {
        for (let i = 0; i < elements.length; i++) {
            elements[i].style.display = "flex";
        }
    }
    if (visibility === false) {
        for (let i = 0; i < elements.length; i++) {
            elements[i].style.display = "none";
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
    let h = time.getHours()
    let m = String(time.getMinutes()).padEnd(2, "0")
    return `${h}:${m}`
}

function updateEventCard() {
    let now = new Date();
    for (let i = 0; i < allEvents.length; i++) {
        allEvents[i].updateCard(now)
    }
}