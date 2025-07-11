function openModal(el) {
    $(el).addClass('is-active');
}

function closeModal(el) {
    $(el).removeClass('is-active');
}

function closeAllModals() {
    let modals = $('.modal');
    for(let modal of modals){
        closeModal(modal);
    };
}


function addActionRow(action){
    let nameInput = $(`<input name="action-name" class="input" type="text" placeholder="Contact Name">`);
    let numberInput = $(`<input name="action-number" class="input" type="text" placeholder="Contact Phone Number">`);
    let voiceMailChecked = "";
    if(action){
        if(action.name){
            nameInput.val(action.name);
        }
        if(action.number){
            numberInput.val(action.number);
        }
        if(action.voicemail){
            voiceMailChecked = "checked";
        }
    }
    let row = $('<tr class="action-row">');
    row.append(
        $('<td class="custom-cell">').append($(`<button name="action-delete" class="button">`).append(
            $(`<span class="icon"><i class="fas fa-trash" aria-hidden="true"></i></span>`)
        ).on('click', function(e){
            $(e.currentTarget.parentNode.parentNode).remove();
        })),
        $('<td class="custom-cell">').append(nameInput),
        $('<td class="custom-cell">').append(numberInput),
        $('<td class="custom-cell pt-4">').append($(`<label class="checkbox"><input name="action-voicemail" type="checkbox" ${voiceMailChecked}/> Voicemail Enabled</label>`))
    );
    $('#contacts-settings').append(row)
}


function fillSettings(data){
    customLog('fillSettings data:');
    customLog(data);
    $("#modal-settings-error").empty();
    for(let item of allInputs){
        let itemKey = item.id;
        let value;
        if(data){
            let dataKey = itemKey.replaceAll("-","_");
            value = data[dataKey];
        }
        try{
            $(`#${itemKey}-settings`).empty();
            let inputItem;
            if(["script", "instructions", "website", "info"].indexOf(itemKey) >= 0){
                let rows = 3;
                if(itemKey === "script"){
                    rows = 2;
                }
                inputItem = $(`<textarea id="${itemKey}-input" class="textarea admin-input" rows="${rows}">`);
            } else {
                inputItem = $(`<input id="${itemKey}-input" class="input admin-input" type="text">`);
            }
            if(value){
                inputItem.val(value);
            }
            $(`#${itemKey}-settings`).append(inputItem);
        } catch(e){
            customLog('fillSettings key error:');
            customLog(e);
        }
    }
    $('#contacts-settings').empty();
    if(data){
        for(let action of data["actions"]){
            customLog('fillSettings action:', action);
            addActionRow(action);
        }
    }
}


function openSettings(entry){
    fillSettings(entry);
    currentEntry = entry;
    if(entry){
        $('#modal-settings-delete').show();
    } else {
        $('#modal-settings-delete').hide();
    }
    openModal('#modal-settings');
    $('#settings-menu').hide();
}


async function saveSettings(){
    console.log('saveSettings currentEntry', currentEntry);
    $("#modal-settings-error").empty();
    let newEntry = {};
    let inputs = $('.admin-input');
    for(let input of inputs){
        newEntry[input.id.replace("-input","").replace("-","_")] = $(input).val();
    }
    let actions = $('#contacts-settings').find('tr');
    newEntry.actions = [];
    for(let action of actions){
        let names = $(action).find('[name="action-name"]:first');
        let numbers = $(action).find('[name="action-number"]:first');
        let voicemails = $(action).find('[name="action-voicemail"]:first');
        if(names.length === 1 && numbers.length === 1){
            let action = {"name": $(names[0]).val(), "number": $(numbers[0]).val()};
            if(voicemails.length === 1 && $(voicemails[0]).is(':checked')){
                action.voicemail = true;
            }
            newEntry.actions.push(action);
        }
    }
    if(currentEntry){
        newEntry["_id"] = currentEntry["_id"];
    }
    console.log("saveSettings newEntry", newEntry);
    let response = await fetch('/admin',{
        method: "POST",
        headers:customHeaders,
        body: JSON.stringify(newEntry)
    });
    let json = await response.json();
    $('#modal-settings-save').removeClass('is-loading');
    customLog("saveSettings POST /admin response:", json);
    if(json.error){
        $("#modal-settings-error").addClass("has-text-danger");
        $("#modal-settings-error").removeClass("has-text-success");
        $("#modal-settings-error").text(json.error);
    } else {
        if(json._id && !currentEntry){
            currentEntry = {"_id": json._id, "company":newEntry.company};
            $('#modal-settings-delete').show();
        }
        $("#modal-settings-error").addClass("has-text-success");
        $("#modal-settings-error").removeClass("has-text-danger");
        $("#modal-settings-error").text("Save successful");
    }
}


function buildColumns(identifier){
    if(!identifier){
        identifier = "";
    }
    for(let row of firstColumn){
        $(`#first-column${identifier}`).append(
            $(`<div class="column is-one-third has-text-weight-bold has-background-${backgroundColor}-ter mb-1 py-1" style="border-radius: 5px;">`).html(row.name),
            $(`<div id="${row.id}${identifier}" class="column is-two-thirds mb-1 py-1">`)
        )
    }

    for(let row of secondColumn){
        $(`#second-column${identifier}`).append(
            $(`<div class="column is-one-third has-text-weight-bold has-background-${backgroundColor}-ter mb-1 py-1" style="border-radius: 5px;">`).html(row.name),
            $(`<div id="${row.id}${identifier}" class="column is-two-thirds mb-1 py-1">`)
        )
    }
}

function buildCustomer(json){
    if(json.data){
        let data = json.data;
        let fields = ["name", "email", "company"];
        for(let f of fields){
            if(data[f]){
                $(`#api-${f}`).show();
                $(`#api-${f}-text`).text(data[f]);
            } else {
                $(`#api-${f}`).hide();
                $(`#api-${f}-text`).text("?");
            }
        }
    }

    if(json.url){
        $('#api-link-text').attr('href', json.url);
        $('#api-link').show();
    } else {
        $('#api-link').hide();
    }

    if(json.error){
        customLog(`buildCustomer ERROR: ${json.error}`);
    } else {
        $('#api-info-div').show();
    }
}


function buildCompany(callerId, callerName, data){
    customLog('buildCompany data:');
    customLog(data);
    for(let key of Object.keys(data)){
        //customLog(key);
        let useKey = key;
        if(key.indexOf("_") >= 0){
            useKey = key.replaceAll("_","-");
        }
        if(key === "email"){
            let style = "";
            if(color){
                style = `style="color:${color}"`;
            }
            $(`#${key}`).html(`<a href="mailto:${data[key]}" ${style}>${data[key]}</a>`);
        } else if(key === "center_number"){
            $(`#${useKey}`).html(data[key]).append(
                buildButton("Blind Xfer", data[key], callerId, callerName)
            );
        } else if(key === "voicemail"){
            $(`#${useKey}`).html(data[key]).append(
                buildButton("Voicemail", data[key], callerId, callerName)
            );
        } else if(["actions"].indexOf(key) < 0){
            try{
                $(`#${useKey}`).html(data[key]);
            } catch(e){
                customLog('buildCompany key error:');
                customLog(e);
            }
        }
    }
    if(color){
        $('#main-content').find('a').css({"color": color});
    }
}

function buildContacts(callerId, callerName, actionData){
    try{
        $('#contacts').empty();
        for(let data of actionData){
            customLog('buildContacts data:', data);
            let row = $('<tr>')
            row.append(
                $('<th class="custom-cell" style="vertical-align: middle;">').append(
                    $('<span class="panel-icon">').append(
                        $('<i class="fas fa-hashtag" aria-hidden="true">')
                    )
                ),
                $('<td class="custom-cell">').text(data.name),
                $('<td class="custom-cell">'),
                $('<td class="custom-cell">').text(data.number),
                $('<td class="custom-cell">').append(
                    buildButton("Warm Xfer", data.number, callerId, callerName, false, true)
                ),
                $('<td class="custom-cell">').append(
                    buildButton("Blind Xfer", data.number, callerId, callerName)
                )
            );
            let voiceMailButton = $('<td class="custom-cell">')
            if(data.voicemail){
                voiceMailButton.append(
                    buildButton("Voicemail", data.number, callerId, callerName, true)
                );
            }
            row.append(voiceMailButton);
            $('#contacts').append(row)
        }
    } catch(e){
        customLog("buildContacts Error:");
        customLog(e);
    }
}

function buildButton(text, key, callerId, callerName, voicemail, warm){
    let button;
    if(warm){
        button = $('<button class="button is-warm ml-3" disabled="disabled">').text(text);
    } else {
        button = $('<button class="button is-blind ml-3">').text(text);
    }
    if(textColor){
        button.css({"color":`#${textColor}`});
    }
    if(color){
        button.css({"background-color":`#${color}`});
    } else {
        button.addClass('is-info');
    }
    if(warm){
        button.on('click', async function(){
            await warmXferButton(key);
        });
    } else {
        button.on('click', async function(){
            await blindXferButton(key,callerId,callerName,voicemail);
        });
    }
    return button;
}


async function blindXferButton(number, callerId, callerName, voicemail){
    try{
        customLog("blindXferButton button pressed");
        let destination = updateDestination(number);
        matchedId = await getCall(callerId, callerName);
        customLog("blindXferButton matchedId", matchedId);
        let payload = {
                        callId: matchedId,
                        destination: destination,
                    }
        if(voicemail){
            payload.toVoicemail = true;
        }
        if(matchedId){
            let divertResponse = await divert(payload);
            if(divertResponse.status >= 200 && divertResponse.status < 300){
                //this.updateResultSpan(`Transferred ${remoteNumber} to ${meetingName}.`, "green");
            } else {
                await handleXferError(divertResponse);
            }
        }
    }catch(e){
        customLog("blindXferButton Error:");
        customLog(e);
        $('#modal-error-text').text(e);
        openModal('#modal-error');
    }
}

async function warmXferButton(number){
    try{
        customLog("warmXferButton button pressed");
        let dialResponse = await dial(updateDestination(number));
        if(dialResponse.status >= 200 && dialResponse.status < 300){
            //this.updateResultSpan(`Transferred ${remoteNumber} to ${meetingName}.`, "green");
        } else {
            await handleXferError(dialResponse);
        }
    }catch(e){
        customLog("warmXferButton Error:");
        customLog(e);
        $('#modal-error-text').text(e);
        openModal('#modal-error');
    }
}

function formatErrorJson(errorText){
    return `<br><pre class="py-1 my-2">${JSON.stringify(errorText, null, 2)}</pre>`;
}

async function handleXferError(divertResponse){
    let msg = `Transfer failed. Status: ${divertResponse.status}`
    try{
        let errorText = await divertResponse.json();
        msg += formatErrorJson(errorText);
    }catch(e){}
    $('#modal-error-text').html(msg);
    openModal('#modal-error');
}


function applyTheme(theme){
    customLog("applyTheme theme:", theme)
    if(theme){
        Cookies.set('theme', theme, { expires: 365 });
        if(theme.indexOf("dark") >= 0){
            $('html').addClass("theme-dark");
            $('html').removeClass("theme-light");
            backgroundColor = "black";
            iconColor = 'white';
            $('.column.is-one-third').addClass('has-background-black-ter');
            $('.column.is-one-third').removeClass('has-background-white-ter');
            $('#script-column').addClass('has-background-black-ter');
            $('#script-column').removeClass('has-background-white-ter');
            $('.panel-block.row-item').addClass('has-background-black');
        } else {
            $('html').addClass("theme-light");
            $('html').removeClass("theme-dark");
            backgroundColor = "white";
            iconColor = 'black';
            $('.column.is-one-third').addClass('has-background-white-ter');
            $('.column.is-one-third').removeClass('has-background-black-ter');
            $('#script-column').addClass('has-background-white-ter');
            $('#script-column').removeClass('has-background-black-ter');
            $('.panel-block.row-item').removeClass('has-background-black');
        }
        let colors = theme.split("-");
        if(colors.length > 1 && themes[colors[1]]){
            color = themes[colors[1]].color;
            headerColor = themes[colors[1]].headerColor;
            titleColor = themes[colors[1]].titleColor;
            textColor = themes[colors[1]].textColor;
        }
        $('#main-content').find('button').css({'color':textColor,'background-color':color});
        $('#main-content').find('a').css({'color':color});
        $('#main-title').css({"color":titleColor});
        $('#header-box').css({"background-color":headerColor});
        $('#script-div').css({"color":color});
        if(headerColor){
            $('#header-box').removeClass('has-background-info');
        } else {
            $('#header-box').addClass('has-background-info');
        }
        if(color){
            $('#main-content').find('button').removeClass("is-info");
            $('#script-div').removeClass("is-info");
            $('#script-div').removeClass("is-light");
        } else {
            $('#main-content').find('button').addClass("is-info");
            $('#script-div').addClass("is-info");
            $('#script-div').addClass("is-light");
        }
        
        $('.icon.is-small').remove();
        $(`#${theme}`).append(
            $(`<span class="icon is-small ml-2" style="color:${iconColor};"> <i class="fas fa-check" aria-hidden="true"></i></span>`)
        )
    }
}

function initializeDOMListeners(){
    $('#theme-button').on('click', function(e){
        $('#theme-menu').toggle();
    });

    $('#settings-button').on('click', async function(e){
        if($('#settings-menu').is(":hidden")){
            $('#settings-button').addClass('is-loading');
            $('#settings-menu-content').empty();
            try{
                let response = await fetch('/admin',{
                    method: "GET",
                    headers:customHeaders
                });
                let companyData = await response.json();
                console.log(companyData);
                for(let entry of companyData){
                    $('#settings-menu-content').append(
                        $(`<a id="${entry._id}" href="#" class="dropdown-item"><span>${entry.company}</span></a>`).on('click', async function(e){
                            openSettings(entry);
                        })
                    )
                }
            }catch(e){
                console.error(e);
            }
            $('#settings-menu-content').append(
                $(`<a id="add" href="#" class="dropdown-item"><span class="icon"><i class="fas fa-plus" aria-hidden="true"></i></span><span>Add New</span></a>`)
                    .on('click', async function(e){
                        openSettings();
                    })
            )
            $('#settings-button').removeClass('is-loading');
        }
        $('#settings-menu').toggle();
        //openModal('#modal-settings');
    })

    $('#action-add').on('click', function(e){
        console.log('#action-add add a row');
        addActionRow();
    })

    $('#modal-settings-save').on('click', async function(e){
        console.log('#modal-settings-save save entry');
        $('#modal-settings-save').addClass('is-loading');
        await saveSettings();
    })

    $('#modal-settings-delete').on('click', function(e){
        console.log('#modal-settings-delete delete entry');
        $('#modal-delete-confirm-text').text(`Are you sure you want to delete company profile: "${currentEntry.company}"?`);
        openModal("#modal-delete-confirm");
    })

    $('#modal-delete-confirm-delete').on('click', async function(e){
        $("#modal-delete-confirm-error").empty();
        $('#modal-delete-confirm-delete').addClass('is-loading');
        let response = await fetch('/admin',{
            method: "POST",
            headers:customHeaders,
            body: JSON.stringify({"command":"delete", "_id":currentEntry._id})
        });
        let json = await response.json();
        $('#modal-delete-confirm-delete').removeClass('is-loading');
        customLog("#modal-delete-confirm-delete POST /admin response:", json);
        if(json.error){
            $("#modal-delete-confirm-error").text(json.error);
        } else {
            closeAllModals();
        }
    })

    $('.dropdown-item').on('click', function(e){
        applyTheme(e.currentTarget.id);
        $('#theme-menu').hide();
    });

    $('#api-link').on('click', function(e){
        window.open($('#api-link-text').attr('href'));
    });

    $('#caller-info-button').on('click', function(e){
        if($('#call-behavior-message').is(":visible")){
            $('#call-behavior-message').hide();
        } else {
            $('#call-behavior-message').show();
        }
    });

    $('#delete-api-info').on('click', function(e){
        $('#api-info-div').hide();
    });

    $('#delete-caller-info').on('click', function(e){
        $('#caller-message').empty();
        $('#caller-info').hide();
    });

    $('.close').on('click', function(e){
        //console.log(e.currentTarget.id);
        let parts = e.currentTarget.id.split("-close");
        closeModal(`#${parts[0]}`);
    });
}


function adjustUI(){
    $('body').css({'background-image':`url(${background})`});

    if(logoSize){
        $('#logo').css({'max-height': `${logoSize}px`, 'max-width': `${logoSize}px;`});
    } else {
        $('#logo').css({'max-height': '42px', 'max-width': '42px;'});
    }
    if(logo){
        $('#logo').attr('src', logo);
    } else {
        $('#logo').attr('src', "wxsd-icon.png");
    }
    if(title){
        $('#main-title').text(title);
    }
    if(titleColor){
        $('#main-title').css({"color":`#${titleColor}`});
    }
    if(headerColor){
        $('#header-box').css({"background-color":headerColor});
    } else {
        $('#header-box').addClass('has-background-info');
    }

    if(color){
        $('#script-div').css({"color":color});
    } else {
        $('#script-div').addClass("is-info");
        $('#script-div').addClass("is-light");
    }
}