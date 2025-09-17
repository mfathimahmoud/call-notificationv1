function customLog(msg, args){
    let logName = "custom-log:"
    if(args){
      console.log(logName+ msg, args);  
    } else {
      console.log(logName, msg);
    }
}

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let title = urlParams.get('title');
let titleColor = urlParams.get('titleColor');
let headerColor = urlParams.get('headerColor');
let color = urlParams.get('color');
let textColor = urlParams.get('textColor');
let background = urlParams.get('background');
let logo = urlParams.get('logo');
let logoSize = urlParams.get('logoSize');

var embedded_app;
var callingClient;
var currentEntry;
const webexUrl = "https://webexapis.com/v1"
const accessToken = Cookies.get("access_token");
customLog('accessToken:', accessToken);
const mercuryMode = Cookies.get("mercury_mode") === "true";
customLog(`mercuryMode: ${mercuryMode}`);
const isAdmin = Cookies.get("is_admin");
customLog("isAdmin", isAdmin);
if(isAdmin === "true"){
    $("#settings-button").show();
}

let backgroundColor = "white";
let iconColor = "black";
let theme = Cookies.get("theme");

const webexHeaders = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
}

const customHeaders = {
    'accessToken': accessToken,
    'Content-Type': 'application/json'
}

const themes = {
    "blue" : {
        color: '',
        headerColor: '',
        titleColor:'',
    },
    "orange" : {
        color: "ff7900",
        headerColor:"1f2229",
        titleColor: '',
        textColor: "fff"
    }
}

const firstColumn = [
    {id:"company", name:"Company"},
    {id:"number", name:"Main Number"},
    {id:"titan", name:"Titan ID"},
    {id:"center", name:"Center ID"},
    {id:"center-number", name:"Center Number"},
    {id:"email", name:"Center Email"}
]

const secondColumn = [
    {id:"instructions", name:"Instructions"},
    {id:"hours", name:"Hours"},
    {id:"website", name:"Website"},
    {id:"info", name:"Info"},
    {id:"voicemail", name:"Voicemail"}
]

const allInputs = firstColumn.concat(secondColumn).concat([{id:"script"}]);