if(mercuryMode){
    let credentials = {
        logger: { level: "debug" },
        credentials : { access_token: accessToken }
    };

    const webexSdk = (window.webexSdk = Webex.init(credentials));

    webexSdk.once("ready", () => {
        customLog(`webex object ready ${webexSdk.version}`);
        finalizeWebexAuth(webexSdk);
    });

    function finalizeWebexAuth(webexSdk){
        if (webexSdk.canAuthorize) {
            customLog("User Authenticated");
            webexSdk.meetings.register().then((data) => {
                customLog("Webex registration done.");
                try{
                    webexSdk.internal.mercury.connect().then(() => {
                        customLog("Mercury Connected.");
                        // webexSdk.internal.mercury.on('event:telephony_calls.originating', (event) => {
                        //         customLog("mercury telephony_calls.originating EVENT:");
                        //         customLog(event);
                        // });

                        // webexSdk.internal.mercury.on('event:telephony_calls.originated', (event) => {
                        //         customLog("mercury telephony_calls.originated EVENT:");
                        //         customLog(event);
                        // });

                        // webexSdk.internal.mercury.on('event:telephony_calls.resumed', (event) => {
                        //         customLog("mercury telephony_calls.resumed EVENT:");
                        //         customLog(event);
                        // });

                        // webexSdk.internal.mercury.on('event:telephony_calls.pickedUp', (event) => {
                        //         customLog("mercury telephony_calls.pickedUp EVENT:");
                        //         customLog(event);
                        // });

                        // webexSdk.internal.mercury.on('event:telephony_calls.retrieved', (event) => {
                        //         customLog("mercury telephony_calls.retrieved EVENT:");
                        //         customLog(event);
                        // });

                        // webexSdk.internal.mercury.on('event:telephony_calls.sync', (event) => {
                        //         customLog("mercury telephony_calls.sync EVENT:");
                        //         customLog(event);
                        // });

                        // webexSdk.internal.mercury.on('event:telephony_calls.updated', (event) => {
                        //         customLog("mercury telephony_calls.updated EVENT:");
                        //         customLog(event);
                        // });

                        webexSdk.internal.mercury.on('event:telephony_calls.received', async (event) => {
                            customLog("mercury telephony_calls.received EVENT:");
                            customLog(event);
                            let queueNumber = "";
                            if(event?.data?.redirections?.length > 0){
                                let redirection = event.data.redirections[0];
                                if(redirection.reason === "callQueue"){
                                    queueNumber = redirection.redirectingParty.number;
                                }
                            }
                            let remoteNumber = event.data.remoteParty.number;
                            let remoteName = event.data.remoteParty.name;
                            let url = `/db?queueNumber=${encodeURIComponent(queueNumber)}&remoteNumber=${encodeURIComponent(remoteNumber)}`
                            console.log(`url:${url}`);
                            let response = await fetch(url);
                            console.log('response:');
                            console.log(response);
                            $('#api-info-div').hide();
                            $('#main-content').hide();
                            $(`#script`).text('');
                            if(response.status < 300){
                                let json = await response.json();
                                console.log(json);
                                if(json?.queue){
                                    $('#caller-info').hide();
                                    buildCompany(remoteNumber, remoteName, json.queue);
                                    buildContacts(remoteNumber, remoteName, json.queue?.actions);
                                    $('#main-content').show();
                                } else {
                                    $('#caller-info').show();
                                    buildCustomer(json.customer);
                                }
                            } else if(response.status === 401){
                                window.location.reload(true);
                            } else {
                                $('#caller-info').show();
                            }
                        });

                        // webexSdk.internal.mercury.on('event:telephony_calls.answered', (event) => {
                        //         customLog("mercury telephony_calls.answered EVENT:");
                        //         customLog(event);
                        // });

                        // webexSdk.internal.mercury.on('event:telephony_calls.forwarded', (event) => {
                        //         customLog("mercury telephony_calls.forwarded EVENT:");
                        //         customLog(event);
                        // });

                    });
                }catch(e){
                    customLog("Mercury connection error:");
                    customLog(e);
                }
                
            }).catch(err => {
                customLog(err);
                customLog("Error registering, redirecting to login...");
                window.location = "/oauth";
            });
        }
    }
} else {
    var socket = io("/",{
        withCredentials: true,
        auth: {
            token: accessToken
        }
    });

    socket.on('connect', (msg) => {
        customLog("socket connected!");
    });

    socket.on('disconnect', (msg) => {
        customLog("socket disconnected!");
    });

    socket.on('message', (msg) => {
        try{
            customLog("socket message:");
            customLog(msg);
            $('#api-info-div').hide();
            if(msg.queue){
                $('#caller-info').hide();
                buildCompany(msg.number, msg.name, msg.queue);
                buildContacts(msg.number, msg.name, msg.queue?.actions);
                $('#main-content').show();
            } else {
                $('#main-content').hide();
                $(`#script`).text('');
                $('#caller-info').show();
                buildCustomer(msg.customer);
            }
            
        }catch(e){
            customLog("socket message error:");
            customLog(e);
        }
    })
}


applyTheme(theme);

$(`#script-settings-div`).append(
    $(`<div id="script-column" class="column is-1 has-text-weight-bold has-background-${backgroundColor}-ter mb-1 py-1" style="border-radius: 5px;">`).html("Script"),
    $(`<div id="script-settings" class="column is-11 mb-1 py-1">`)
)
buildColumns();
buildColumns('-settings')

initializeDOMListeners();

window.addEventListener('load', async function () {
    customLog("Hello, App.");
    adjustUI();

    embedded_app = new window.webex.Application({logs: { logLevel: 1 }});
    embedded_app.onReady().then(() => {
        customLog("onReady()", { message: "EA is ready." });
        customLog(embedded_app.application.states.user);
        customLog(embedded_app.application.states.user.token);
        embedded_app.listen().then(() => {
            embedded_app.on("sidebar:callStateChanged", (call) => {
                customLog("Call State Change:", call);
                handleCallStateChange(embedded_app, call);
            });

            embedded_app.on("application:viewStateChanged", (viewState) => {
                customLog("View state changed. Current view:", viewState);
                switch (viewState) {
                    case "IN_FOCUS":
                        // User has noticed the badge and has responded, so we can remove it...
                        handleBadge(embedded_app, 0);
                        break;
                }
            });
        });
    });

});