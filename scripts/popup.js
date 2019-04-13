var backgroundPage = null;
console.log( "Popup script started." );

moment.updateLocale( 'en', {
	relativeTime: {
		future: "in %s",
		past: "%s ago",
		s: "%d seconds",
		ss: "%d seconds",
		m: "%d minutes",
		mm: "%d minutes",
		h: "an hour",
		hh: "%d hours",
		d: "a day",
		dd: "%d days",
		M: "a month",
		MM: "%d months",
		y: "a year",
		yy: "%d years"
	}
} );

setInterval( function () {
	var raidTimes = document.getElementsByClassName( "raidTime" );
	var i;
	for ( i = 0; i < raidTimes.length; i++ ) {
		var timeTD = raidTimes[ i ];
		timeTD.innerHTML = moment( timeTD.getAttribute( "absolute_time" ) ).fromNow();
	}
}, 1000 );

chrome.runtime.getBackgroundPage( function ( tempBackgroundPage ) {
	backgroundPage = tempBackgroundPage;
	console.log( "Got background page. Amount of cached raids: " + backgroundPage.raids.length );
	moment.updateLocale( 'en', backgroundPage.localeSettings );
	backgroundPage.RefreshRaidConfigs();

	document.getElementById( "mute-btn" ).addEventListener( 'click', function ( event ) {
		backgroundPage.muted = !backgroundPage.muted;
		document.getElementById( "mute-btn" ).classList.toggle( "primary" );
		document.getElementById( "mute-btn" ).classList.toggle( "negative" );
		document.getElementById( "mute-btn" ).innerHTML = backgroundPage.muted ? 'Unmute<i class="unmute icon"></i>' : 'Mute<i class="mute icon"></i>';
	} );

	document.getElementById( "stop-btn" ).addEventListener( 'click', function ( event ) {
		backgroundPage.stopped = !backgroundPage.stopped;
		document.getElementById( "stop-btn" ).classList.toggle( "primary" );
		document.getElementById( "stop-btn" ).classList.toggle( "negative" );
		document.getElementById( "stop-btn" ).innerHTML = backgroundPage.stopped ? 'Start<i class="play icon"></i>' : 'Stop<i class="stop icon"></i>';
	} );

	if ( !backgroundPage.showSettings.id ) {
		document.getElementById( "header-container" ).removeChild( document.getElementById( "id-header" ) );
	}
	if ( !backgroundPage.showSettings.message ) {
		document.getElementById( "header-container" ).removeChild( document.getElementById( "message-header" ) );
	}
	if ( !backgroundPage.showSettings.time ) {
		document.getElementById( "header-container" ).removeChild( document.getElementById( "time-header" ) );
	}

	for ( var i = 0; i < backgroundPage.raids.length; i++ ) {
		var raidConfig = backgroundPage.FindRaidConfig( backgroundPage.raids[ i ].room );
		if ( raidConfig !== null ) {
			console.log( "Found raid config. Adding raid row..." )
			var raidRow = document.createElement( "tr" );
			var roomTD = document.createElement( "td" );
			roomTD.innerHTML = raidConfig.english;
			var idTD = document.createElement( "td" );
			idTD.id = backgroundPage.raids[ i ].id + '-label';
			idTD.innerHTML = backgroundPage.raids[ i ].id;
			var messageTD = document.createElement( "td" );
			messageTD.innerHTML = backgroundPage.raids[ i ].message;
			var timeTD = document.createElement( "td" );
			var raidTime = moment( backgroundPage.raids[ i ].time );
			timeTD.setAttribute( "class", "raidTime" );
			timeTD.setAttribute( "absolute_time", raidTime.format() )
			timeTD.innerHTML = raidTime.fromNow();
			var buttonTD = document.createElement( "td" );
			var button = document.createElement( "button" );
			button.id = backgroundPage.raids[ i ].id + '-btn';
			if ( backgroundPage.raids[ i ].status == "unclicked" ) {
				button.classList.add( "ui", "tiny", "primary", "button" );
				button.innerHTML = "Join";
			} else if ( backgroundPage.raids[ i ].status == "clicked" ) {
				button.classList.add( "ui", "tiny", "button" );
				button.innerHTML = "Copied";
			} else if ( backgroundPage.raids[ i ].status == "error" ) {
				button.classList.add( "ui", "tiny", "warning", "button" );
				button.innerHTML = "Error";
			}
			button.addEventListener( 'click', function ( evt ) {
				JoinButtonClicked( evt.target.id.substr( 0, 8 ) );
			} );
			buttonTD.appendChild( button );
			raidRow.appendChild( roomTD );
			if ( backgroundPage.showSettings.id ) {
				raidRow.appendChild( idTD );
			}
			if ( backgroundPage.showSettings.message ) {
				raidRow.appendChild( messageTD );
			}
			if ( backgroundPage.showSettings.time ) {
				raidRow.appendChild( timeTD );
			}
			raidRow.appendChild( buttonTD );
			document.getElementById( "raid-table-body" ).appendChild( raidRow );
		}
	}
} );

chrome.runtime.onMessage.addListener( function ( message, sender, sendResponse ) {
	if ( message.raid ) {
		console.log( "Received new raid from background page.", message );
		var raidConfig = backgroundPage.FindRaidConfig( message.raid.room );
		if ( raidConfig !== null ) {
			console.log( "Found raid config. Adding raid row..." )
			var raidRow = document.createElement( "tr" );
			var roomTD = document.createElement( "td" );
			roomTD.innerHTML = raidConfig.english;
			var idTD = document.createElement( "td" );
			idTD.id = message.raid.id + '-label';
			idTD.innerHTML = message.raid.id;
			var messageTD = document.createElement( "td" );
			messageTD.innerHTML = message.raid.message;
			var timeTD = document.createElement( "td" );
			var raidTime = moment( message.raid.time );
			timeTD.setAttribute( "class", "raidTime" );
			timeTD.setAttribute( "absolute_time", raidTime.format() )
			timeTD.innerHTML = raidTime.fromNow();
			var buttonTD = document.createElement( "td" );
			var button = document.createElement( "button" );
			button.id = message.raid.id + '-btn';
			if ( message.raid.status == "unclicked" ) {
				button.classList.add( "ui", "tiny", "primary", "button" );
				button.innerHTML = "Join";
			} else if ( message.raid.status == "clicked" ) {
				button.classList.add( "ui", "tiny", "button" );
				button.innerHTML = "Copied";
			} else if ( message.raid.status == "error" ) {
				button.classList.add( "ui", "tiny", "warning", "button" );
				button.innerHTML = "Error";
			}

			button.addEventListener( 'click', function ( evt ) {
				JoinButtonClicked( message.raid.id );
			} );
			buttonTD.appendChild( button );
			raidRow.appendChild( roomTD );
			if ( backgroundPage.showSettings.id ) {
				raidRow.appendChild( idTD );
			}
			if ( backgroundPage.showSettings.message ) {
				raidRow.appendChild( messageTD );
			}
			if ( backgroundPage.showSettings.time ) {
				raidRow.appendChild( timeTD );
			}
			raidRow.appendChild( buttonTD );
			document.getElementById( "raid-table-body" ).insertBefore( raidRow, document.getElementById( "raid-table-body" ).firstChild );

			if ( document.getElementById( "raid-table-body" ).childNodes.length > backgroundPage.raidLimit ) {
				console.log( "Too many raid rows. Removing oldest one..." );
				document.getElementById( "raid-table-body" ).removeChild( document.getElementById( "raid-table-body" ).lastChild );
			}

			chrome.browserAction.setBadgeText( {
				text: ""
			} );
		}
	}
} );

function JoinButtonClicked( id ) {
	console.log( "Join button clicked. ID: " + id );
	try {
		var raidLabel = document.getElementById( id + '-label' );
		if ( raidLabel !== null ) {
			if ( window.getSelection ) {
				raidLabel.focus();
				var selection = window.getSelection();
				var range = document.createRange();
				range.selectNodeContents( raidLabel );
				selection.removeAllRanges();
				selection.addRange( range );
				document.execCommand( "copy" );
				selection.removeAllRanges();
				console.log( "Copied raid ID successfully." );
				document.getElementById( id + '-btn' ).innerHTML = "Copied";
				document.getElementById( id + '-btn' ).classList.remove( "primary" );
				backgroundPage.SetRaidStatus( id, "clicked" );
			}
		}
	} catch ( error ) {
		console.log( "Error copying ID: " + error );
		backgroundPage.SetRaidStatus( id, "error" );
		document.getElementById( id + '-btn' ).innerHTML = "Error";
		document.getElementById( id + '-btn' ).classList.remove( "primary" );
		document.getElementById( id + '-btn' ).classList.add( "warning" );
	}
}
