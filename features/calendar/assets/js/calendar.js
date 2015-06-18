var cal = {};

function generateEvent() {
    var event = {
        'summary' : '[PM] '+ $('#eventtitle').val(),
        'description' : 'PM for ' + window.location.href
    };
    event.start = {};
    event.start.dateTime = new Date().toISOString();
    event.start.timeZone = cal.timezone;
    event.id = cal.eventId;

    event.end = {};
    var end = new Date();
    end.setHours(end.getHours()+1);
    event.end.dateTime = end.toISOString();
    event.end.timeZone = cal.timezone;

    return event;
}


function showEventLink(event)
{
    var link = $('#calendar-link');
    link.css('float', 'right');

    if(event) {
        link.text('A Post Mortem is scheduled!');
        link.addClass('eventLink');
    } else {
        link.text('Scheduele a Post Mortem for this event!');
    }
}


/**
 * Embeds a Google Calendar at the either the current month,
 * or the month and year of the date given.
 * Expects a string with format "yyyy-MM-....."
 **/
function showCalendar(date) {
    var calendar = document.createElement('IFRAME');
    var src = cal.src + cal.id + '&ctz=' + cal.timeZone;

    if (date != null) {
        // create a month long range for calendar view based off event date
        date = date.split('-');
        var dateRange = '' + date[0] + date[1];
        dateRange = dateRange +'01%2F'+ dateRange + '28';
        src += '&dates=' + dateRange;
    }

    calendar.setAttribute('id', 'calendar-view');
    calendar.setAttribute('src', src);
    calendar.setAttribute('scrolling', 'no');
    calendar.setAttribute('frameborder', '0');

    if (cal.inEvent) {
        calendar.setAttribute('class', 'smallCalendar');
    } else {
        calendar.setAttribute('class', 'bigCalendar');
    }

    $('#calendar-div').append(calendar);
}


function showEvent() 
{
    $('#event-title').text(cal.event.summary);

    var start = new Date(cal.event.start.dateTime);
    var end = new Date(cal.event.end.dateTime);
    
    $('#event-date').text(start.toLocaleDateString());

    start = start.toLocaleTimeString();
    end = end.toLocaleTimeString();

    $('#event-time').text(start +' to '+ end);//+ cal.event.end.dateTime);

    var location = cal.event.location;

    if (typeof location === 'undefined') {
        location = 'No location yet!';
    }
    $('#event-location').text(location);

    var creator = document.createElement('a');
    creator.setAttribute('href', 'mailto:'+cal.event.creator.email);
    creator.innerHTML = cal.event.creator.displayName;

    $('#event-creator').text('Created by ');
    $('#event-creator').append(creator);

    var link = document.createElement('a');
    link.setAttribute('href', cal.event.htmlLink);
    link.innerHTML = 'Edit';

    $('#event-link').append(link);
    $('#event-div').show();
}

/**
 * Check if current user has authorized this application.
 * 
 * @param boolean inEvent - true if the calendar is being loaded on an event page. 
 */
function handleClientLoad(inEvent)
{
    cal.inEvent = inEvent;

    $("#calendar-link").click(function() {
            calendarLinkHandler();
    });

    gapi.client.setApiKey(cal.apiKey);
    window.setTimeout(checkAuth, 1);
}


function checkAuth() 
{
    gapi.auth.authorize({
            client_id: cal.clientId,
            scope: cal.scopes,
            immediate: true
            }, handleAuthResult);
}


/**
 * Handle response from authorization server.
 *
 * @param {Object} authResult Authorization result.
 */
function handleAuthResult(authResult) 
{
    if (authResult && !authResult.error) {
        cal.authorized = true;
        if (cal.inEvent) {
            checkEventExists();
        }
        else {
            hideCalendarLink();
            showCalendar(null);
        }
    }
}


/**
 * Check if calendar event exists for morgue entry
 */
function checkEventExists() 
{
    gapi.client.load('calendar', 'v3', function() {
            var request = gapi.client.calendar.events.get({
                'calendarId': cal.id,
                'eventId': cal.eventId
            });
            request.execute(function(event) {
                if (event.hasOwnProperty('error')) {
                    cal.event = null;
                    showEventLink(false);
                    showCalendar(null);
                } else {
                    cal.event = event;
                    showEventLink(true);
                    showCalendar(event.start.dateTime);
                    showEvent();
                }
            });
    });
}


function createEvent() 
{
    checkEventExists();
    var event = generateEvent();

    gapi.client.load('calendar', 'v3', function() {
        var request = gapi.client.calendar.events.insert({
            'calendarId' : cal.id,
            'resource' : event
        });
        request.execute(function(event) {
                    if (event.hasOwnProperty('error')) {
                        console.log(event);
                    } else {
                        cal.event = event;
                        console.log(event);
                        window.open(event.htmlLink);
                        location.reload();
                    }
            });
        });
}


function calendarLinkHandler() 
{
    if (cal.authorized) {
        if(cal.event === null) {
            createEvent();
        } else {
            window.open(cal.event.htmlLink);
        }
    } else {
        gapi.auth.authorize({
            client_id: cal.clientId,
            scope: cal.scopes,
            immediate: false
            }, handleAuthResult);
    }
}

