function updateDestination(destination){
    customLog("updateDestination (initial):", destination);
    if(destination[0] !== "+"){
        destination = "+" + destination;
    }
    customLog("updateDestination (updated):", destination);
    return destination;
}

async function getCalls(){
    let callsResponse = await fetch(`${webexUrl}/telephony/calls`, {
        method: 'GET',
        headers: webexHeaders
    });
    return callsResponse;
}

async function getCall(callerId, callerName){
    customLog("getCall callerId", callerId);
    let callsResponse = await getCalls();
    let matchedId;
    if(callsResponse.status === 401){
        window.location.reload(true);
    } else {
        let calls = await callsResponse.json();
        customLog('getCall calls:', calls)
        for(let call of calls.items){
            if(call.remoteParty.number === callerId){
                matchedId = call.id;
                customLog(`getCall matched callId: ${call.id}`);
                break;
            }
        }
        if(!matchedId){
            customLog(`getCall: No matched callId, trying with secondary id.`);
            for(let c of calls.items){
                if(c.remoteParty.number === callerName){
                    customLog("getCall Remote Number matches callerName");
                    matchedId = c.id;
                    customLog(`getCall matched callId: ${matchedId}`);
                    break;
                }
            }
        }
    }
    return matchedId;
}

async function dial(destination){
    let dialResponse = await fetch(`${webexUrl}/telephony/calls/dial`, {
        method: 'POST',
        headers: webexHeaders,
        body: JSON.stringify({destination: destination,})
    });
    customLog(`dial dialResponse.status:${dialResponse.status}`);
    return dialResponse;
}

async function divert(payload){
    let divertResponse = await fetch(`${webexUrl}/telephony/calls/divert`, {
        method: 'POST',
        headers: webexHeaders,
        body: JSON.stringify(payload)
    });
    customLog(divertResponse);
    customLog(`divert divertResponse.status:${divertResponse.status}`);
    return divertResponse;
}