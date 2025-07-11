function handleBadge(embedded_app, callCount) {
    embedded_app.context.getSidebar().then((s) => {
        sidebar = s;
        customLog("handleBadge: Show a badge on the sidebar...");
        if (!sidebar) {
            customLog("handleBadge: Sidebar info is not available. Error: ", webex.Application.ErrorCodes[4]);
            return;
        }
        const badge = {
            badgeType: 'count',
            count: callCount,
        };
        customLog(`handleBadge sidebar badge: ${JSON.stringify(badge)}`);
        sidebar.showBadge(badge).then((success) => {
            customLog("handleBadge sidebar.showBadge() successful.", success);
        }).catch((error) => {
            customLog("handleBadge sidebar.showBadge() failed. Error: ", webex.Application.ErrorCodes[error]);
        });
    }).catch((error) => {
        customLog("handleBadge getSidebar() failed. Error: ", webex.Application.ErrorCodes[error]);
    });
}


async function handleCallStateChange(embedded_app, call) {
    currentCallState = call.state;
    $('#call-state').text(call.state);
    $('#main-state').text(call.state);
    if(call.state == "Started") {
        customLog("handleCallStateChange: call started.");
        if(embedded_app.application.states.viewState != "IN_FOCUS"){
            handleBadge(embedded_app, call.remoteParticipants.length);
        }
        let callerId;
        let callerName;
        if(call.remoteParticipants.length > 0){
            callerId = call.remoteParticipants[0].callerID;
            callerName = call.remoteParticipants[0].name;
            $('#caller-id').text(callerId);
        }
        if(!callerId && callerName){
            customLog(`handleCallStateChange: No callerId (${callerId}), but callerName was found, assigning callerName value (${callerName}) to callerId.`)
            callerId = callerName;
        }
        $('#call-id').text(call.id);
        $('#call-type').text(call.callType);
    } else if(call.state == "Connected"){
        customLog("handleCallStateChange: call connected.");
        $('.is-warm').removeAttr('disabled');
    } else if(call.state == "Ended"){
        customLog("handleCallStateChange: call ended.");
        $('#main-state').text("Ready");
        $('.is-warm').attr('disabled', 'disabled');
        $('.is-blind').attr('disabled', 'disabled');
    } else {
        customLog("handleCallStateChange: other call.state:" + call.state);
    }
}