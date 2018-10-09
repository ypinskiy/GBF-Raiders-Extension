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
			button.classList.add( "ui", "tiny", "button" );
			if ( backgroundPage.raids[ i ].status === "unclicked" ) {
				button.classList.add( "primary" );
				button.innerHTML = "Join";
			} else if ( backgroundPage.raids[ i ].status === "clicked" ) {
				button.classList.add( "grey" );
				button.innerHTML = "Copied";
			} else if ( backgroundPage.raids[ i ].status === "joined" ) {
				button.classList.add( "positive" );
				button.innerHTML = "Joined";
			} else if ( backgroundPage.raids[ i ].status === "error" ) {
				button.classList.add( "negative" );
				button.innerHTML = "Error";
			} else if ( backgroundPage.raids[ i ].status === "no AP" ) {
				button.classList.add( "negative" );
				button.innerHTML = "Insufficient AP";
			} else if ( backgroundPage.raids[ i ].status === "over" ) {
				button.classList.add( "negative" );
				button.innerHTML = "Battle ended";
			} else if ( backgroundPage.raids[ i ].status === "battle not found" ) {
				button.classList.add( "negative" );
				button.innerHTML = "Raid not found";
			} else if ( backgroundPage.raids[ i ].status === "granblue not found" ) {
				button.classList.add( "negative" );
				button.innerHTML = "No Granblue page";
			} else if ( backgroundPage.raids[ i ].status === "api disabled" ) {
				button.classList.add( "negative" );
				button.innerHTML = "Viramate API disabled";
			} else if ( backgroundPage.raids[ i ].status === "battle is full" ) {
				button.classList.add( "negative" );
				button.innerHTML = "Raid full";
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
		console.log( "Received new raid from background page. ID: " + message.raid.id );
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
			button.classList.add( "ui", "tiny", "primary", "button" );
			button.innerHTML = "Join"
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
	} else if ( message.viramate ) {
		console.log( "Received new Viramate message from background page." );
		console.dir( message );
		if ( message.viramate === "refill required" ) {
			document.getElementById( message.id + '-btn' ).classList.remove( "grey" );
			document.getElementById( message.id + '-btn' ).classList.remove( "positive" );
			document.getElementById( message.id + '-btn' ).classList.add( "negative" );
			document.getElementById( message.id + "-btn" ).innerHTML = "Error";
			swal( {
				title: "No more BP!",
				text: "Please refill your BP or try again later.",
				imageUrl: "https://www.gbfraiders.com/assets/stickers/waitup-sticker.png",
				imageSize: '150x150',
				timer: 2000
			} );
		} else if ( message.viramate === "popup: This raid battle has already ended." ) {
			document.getElementById( message.id + '-btn' ).classList.remove( "grey" );
			document.getElementById( message.id + '-btn' ).classList.remove( "positive" );
			document.getElementById( message.id + '-btn' ).classList.add( "negative" );
			document.getElementById( message.id + "-btn" ).innerHTML = "Error";
			swal( {
				title: "Raid has ended!",
				text: "Please try a different raid.",
				imageUrl: "https://www.gbfraiders.com/assets/stickers/fail-sticker.png",
				imageSize: '150x150',
				timer: 2000
			} );
		} else if ( message.viramate === "popup: The number that you entered doesn't match any battle." ) {
			document.getElementById( message.id + '-btn' ).classList.remove( "grey" );
			document.getElementById( message.id + '-btn' ).classList.remove( "positive" );
			document.getElementById( message.id + '-btn' ).classList.add( "negative" );
			document.getElementById( message.id + "-btn" ).innerHTML = "Error";
			swal( {
				title: "Error with Raid ID!",
				text: "Sorry, but that raid ID doesn't match any raid.",
				imageUrl: "https://www.gbfraiders.com/assets/stickers/totallycrushed-sticker.png",
				imageSize: '150x150',
				timer: 2000
			} );
		} else if ( message.viramate.error === "No granblue tab found" ) {
			document.getElementById( message.id + '-btn' ).classList.remove( "grey" );
			document.getElementById( message.id + '-btn' ).classList.remove( "positive" );
			document.getElementById( message.id + '-btn' ).classList.add( "negative" );
			document.getElementById( message.id + "-btn" ).innerHTML = "Error";
			swal( {
				title: "You don't have Granblue open!",
				text: "Please open the game and then try joining a raid.",
				imageUrl: "https://www.gbfraiders.com/assets/stickers/aboutthat-sticker.png",
				imageSize: '150x150',
				timer: 2000
			} );
		} else if ( message.viramate.error === "api disabled" ) {
			document.getElementById( message.id + '-btn' ).classList.remove( "grey" );
			document.getElementById( message.id + '-btn' ).classList.remove( "positive" );
			document.getElementById( message.id + '-btn' ).classList.add( "negative" );
			document.getElementById( message.id + "-btn" ).innerHTML = "Error";
			swal( {
				title: "Viramate Web API is disabled!",
				text: "Please enable the web API in Viramate, refresh your GBF tab, and try again.",
				imageUrl: "https://www.gbfraiders.com/assets/stickers/aboutthat-sticker.png",
				imageSize: '150x150',
				timer: 2000
			} );
		} else if ( message.viramate === "popup: This raid battle is full. You can't participate." ) {
			document.getElementById( message.id + '-btn' ).classList.remove( "grey" );
			document.getElementById( message.id + '-btn' ).classList.remove( "positive" );
			document.getElementById( message.id + '-btn' ).classList.add( "negative" );
			document.getElementById( message.id + "-btn" ).innerHTML = "Error";
			swal( {
				title: "Raid is full!",
				text: "Please try a different raid.",
				imageUrl: "https://www.gbfraiders.com/assets/stickers/sorry-sticker.png",
				imageSize: '150x150',
				timer: 2000
			} );
		} else if ( message.viramate === "already in this raid" ) {
			document.getElementById( message.id + '-btn' ).classList.remove( "grey" );
			document.getElementById( message.id + '-btn' ).classList.remove( "negative" );
			document.getElementById( message.id + '-btn' ).classList.add( "positive" );
			document.getElementById( message.id + "-btn" ).innerHTML = "Joined";
			swal( {
				title: "You are already in this raid!",
				text: "Please try a different raid.",
				imageUrl: "https://www.gbfraiders.com/assets/stickers/whoops-sticker.png",
				imageSize: '150x150',
				timer: 2000
			} );
		} else if ( message.viramate === "ok" ) {
			document.getElementById( message.id + '-btn' ).classList.remove( "grey" );
			document.getElementById( message.id + '-btn' ).classList.remove( "negative" );
			document.getElementById( message.id + '-btn' ).classList.add( "positive" );
			document.getElementById( message.id + "-btn" ).innerHTML = "Joined";
		}
	}
} );

function JoinButtonClicked( id ) {
	console.log( "Join button clicked. ID: " + id );
	_gaq.push( [ '_trackEvent', "Join", 'clicked' ] );

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
			}
		}
	} catch ( error ) {
		console.log( "Error copying ID: " + error );
	}

	try {
		backgroundPage.JoinRaid( id );
		document.getElementById( id + "-btn" ).innerHTML = "Copied";
		document.getElementById( id + '-btn' ).classList.remove( "primary" );
		document.getElementById( id + '-btn' ).classList.add( "grey" );
		backgroundPage.raids[ backgroundPage.FindRaidIndex( id ) ].status = "clicked";
		console.log( "Sent message to Viramate successfully." );
		if ( backgroundPage.showSettings.close ) {
			window.close();
		}
	} catch ( error ) {
		console.log( "Error sending message to Viramate: " + error );
	}
}

var _gaq = _gaq || [];
_gaq.push( [ '_setAccount', 'UA-48921108-4' ] );
_gaq.push( [ '_trackPageview' ] );
( function () {
	var ga = document.createElement( 'script' );
	ga.type = 'text/javascript';
	ga.async = true;
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	var s = document.getElementsByTagName( 'script' )[ 0 ];
	s.parentNode.insertBefore( ga, s );
} )();
