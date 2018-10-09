var socket = io.connect( 'https://www.gbfraiders.com/' );
var raids = [];
var raidConfigs = [];
var trackedRaids = [];
var loudRaids = [];
var showSettings = {
	message: false,
	time: false,
	close: false,
	id: false
};
var notifications = [];
var raidLimit = 30;
var wasDown = false;
var muted = false;
var stopped = false;
var viramateID = "fgpokpknehglcioijejfeebigdnbnokj";
var viramateScript = document.createElement( 'iframe' );
viramateScript.src = "chrome-extension://" + viramateID + "/content/api.html";
viramateScript.id = "viramate-api";
viramateScript.width = 1;
viramateScript.height = 1;
document.body.appendChild( viramateScript );

var beepsSoundNotif = new Audio( '/assets/sounds/Beeps_Appear.wav' );
var lilyRingRingSoundNotif = new Audio( '/assets/sounds/Lily_Event_RingRing.mp3' );
var andiraOniichanSoundNotif = new Audio( '/assets/sounds/Andira_Oniichan.mp3' );
var titanfallDroppingNowSoundNotif = new Audio( '/assets/sounds/Titanfall_DroppingNow.mp3' );

console.log( "Background script started." );

var localeSettings = {
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
}

moment.updateLocale( 'en', localeSettings );

setInterval( function () {
	if ( socket !== null && socket.connected ) {
		console.log( "Connection Status: UP" );
		if ( wasDown ) {
			console.log( "Recovering from connection down..." );
			chrome.storage.sync.get( {
				selectedRaids: []
			}, function ( items ) {
				console.log( "Getting selected raids from storage..." );
				for ( var i = 0; i < items.selectedRaids.length; i++ ) {
					socket.emit( 'subscribe', {
						room: items.selectedRaids[ i ]
					} );
				}
			} );
		}
		wasDown = false;
	} else {
		console.log( "Connection Status: DOWN" );
		wasDown = true;
	}
}, 5000 );

function FindRaid( id ) {
	var result = null;
	for ( var i = 0; i < raids.length; i++ ) {
		if ( raids[ i ].id === id ) {
			result = raids[ i ];
			break;
		}
	}
	return result;
}

function JoinRaid( id ) {
	try {
		document.getElementById( "viramate-api" ).contentWindow.postMessage( {
			type: "tryJoinRaid",
			id: id,
			raidCode: id
		}, "*" );
		console.log( "Sent message to Viramate successfully." );
	} catch ( error ) {
		console.log( "Error sending message to Viramate: " + error );
	}
}

function FindRaidConfig( room ) {
	var result = null;
	for ( var i = 0; i < raidConfigs.length; i++ ) {
		if ( raidConfigs[ i ].room === room ) {
			result = raidConfigs[ i ];
			break;
		}
	}
	return result;
}

function IsTrackedRaid( room ) {
	var result = false;
	for ( var i = 0; i < trackedRaids.length; i++ ) {
		if ( room === trackedRaids[ i ] ) {
			result = true;
			break;
		}
	}
	return result;
}

function IsLoudRaid( room ) {
	var result = false;
	for ( var i = 0; i < loudRaids.length; i++ ) {
		if ( room === loudRaids[ i ].room ) {
			result = true;
			break;
		}
	}
	return result;
}

function DoesRaidExist( id ) {
	var result = false;
	if ( FindRaid( id ) !== null ) {
		result = true;
	}
	return result;
}

function FindRaidIndex( id ) {
	var result = -1;
	for ( var i = 0; i < raids.length; i++ ) {
		if ( raids[ i ].id === id ) {
			result = i;
			break;
		}
	}
	return result;
}

function GetRaidFromNotification( notificationId ) {
	var result = null;
	for ( var i = 0; i < notifications.length; i++ ) {
		if ( notifications[ i ].notification === notificationId ) {
			result = notifications[ i ].raid;
			break;
		}
	}
	return result;
}

function RefreshRaidConfigs() {
	fetch( 'https://www.gbfraiders.com/getraids', { cache: 'no-store' } ).then( function ( response ) {
		console.log( "Got response from server. Parsing to JSON..." );
		return response.json();
	} ).then( function ( tempRaidConfigs ) {
		raidConfigs = tempRaidConfigs;
		console.log( "Parsed server response. Amount of raids: " + raidConfigs.length );
	} );
}

setInterval( RefreshRaidConfigs, 21600000 );

RefreshRaidConfigs();

chrome.storage.sync.get( {
	selectedRaids: []
}, function ( items ) {
	console.log( "Getting initial selected raids from storage..." );
	for ( var i = 0; i < items.selectedRaids.length; i++ ) {
		socket.emit( 'subscribe', {
			room: items.selectedRaids[ i ]
		} );
	}
} );

chrome.storage.sync.get( {
	trackedRaids: []
}, function ( items ) {
	console.log( "Getting initial tracked raids from storage..." );
	trackedRaids = items.trackedRaids;
} );

chrome.storage.sync.get( {
	loudRaids: []
}, function ( items ) {
	console.log( "Getting initial loud raids from storage..." );
	loudRaids = items.loudRaids;
} );

chrome.storage.sync.get( {
	showSettings: {
		message: false,
		time: false
	}
}, function ( items ) {
	console.log( "Getting initial show settings from storage..." );
	showSettings = items.showSettings;
} );

chrome.storage.sync.get( {
	viramateID: "fgpokpknehglcioijejfeebigdnbnokj"
}, function ( items ) {
	console.log( "Getting initial viramate ID from storage..." );
	viramateID = items.viramateID;
	viramateScript.src = "chrome-extension://" + viramateID + "/content/api.html";
} );

socket.on( 'tweet', function ( data ) {
	console.log( "New raid received. Room: " + data.room + ", ID: " + data.id, data );
	if ( !DoesRaidExist( data.id ) && !stopped ) {
		console.log( "Raid with this ID does not exist. Adding to raids array..." );
		raids.unshift( data );
		chrome.runtime.sendMessage( {
			raid: data
		} );
		if ( IsTrackedRaid( data.room ) ) {
			console.log( "Raid is tracked. Sending notification..." );
			try {
				var raidConfig = FindRaidConfig( data.room );
				if ( raidConfig !== null ) {
					var title = "";
					if ( data.language == "JP" ) {
						title = raidConfig.japanese;
					} else {
						title = raidConfig.english;
					}
					try {
						fetch( 'https://www.gbfraiders.com' + raidConfig.image ).then( function ( response ) {
							return response.blob();
						} ).then( function ( myBlob ) {
							var objectURL = URL.createObjectURL( myBlob );
							chrome.notifications.create( {
								type: "basic",
								iconUrl: objectURL,
								title: title,
								message: 'ID:            ' + data.id + '\nTime:        ' + moment( data.time ).format( 'MMM DD HH:mm:ss' ) + '\nUser:        ' + data.user + '\nMessage: ' + data.message,
								isClickable: true
							}, function ( notificationId ) {
								notifications.push( {
									raid: data,
									notification: notificationId
								} );
							} );
						} );
					} catch ( error ) {
						console.log( "Error getting raid image or creating notification: " + error );
					}
				}
				console.log( "Successfully sent raid notification." );
			} catch ( error ) {
				console.log( "Error sending notification: " + error );
			}
		}
		if ( IsLoudRaid( data.room ) && !muted ) {
			for ( var i = 0; i < loudRaids.length; i++ ) {
				if ( loudRaids[ i ].room === data.room ) {
					if ( loudRaids[ i ].choice === "beeps" ) {
						beepsSoundNotif.play();
					} else if ( loudRaids[ i ].choice === "lily-event-ringring" ) {
						lilyRingRingSoundNotif.play();
					} else if ( loudRaids[ i ].choice === "andira-oniichan" ) {
						andiraOniichanSoundNotif.play();
					} else if ( loudRaids[ i ].choice === "titanfall-droppingnow" ) {
						titanfallDroppingNowSoundNotif.play();
					}
					break;
				}
			}
		}
		if ( raids.length > raidLimit ) {
			console.log( "Too many raids. Removing oldest one..." );
			raids.splice( raids.length - 1, 1 );
		}
		console.log( "Updating raids badge..." );
		chrome.browserAction.setBadgeBackgroundColor( {
			color: [ 255, 0, 0, 255 ]
		} );
		chrome.browserAction.setBadgeText( {
			text: raids.length.toString()
		} );
	}
} );

setInterval( function () {
	console.log( "Updating raids badge..." );
	for ( var i = raids.length - 1; i > 0; i-- ) {
		raids[ i ].timer++;
		if ( raids[ i ].timer > 4 ) {
			console.log( "Raid is too old. Removing oldest one..." );
			raids.splice( i, 1 );
		}
	}
	chrome.browserAction.setBadgeBackgroundColor( {
		color: [ 255, 0, 0, 255 ]
	} );
	chrome.browserAction.setBadgeText( {
		text: raids.length.toString()
	} );
}, 60000 )

chrome.storage.onChanged.addListener( function ( changes, namespace ) {
	console.log( "Chrome storage changed." );
	for ( key in changes ) {
		var change = changes[ key ];
		if ( key === "selectedRaids" ) {
			console.log( "Updating selected raids..." );
			for ( raid in change.oldValue ) {
				var room = change.oldValue[ raid ];
				socket.emit( 'unsubscribe', {
					room: room
				} );
			}
			console.log( "Unsubscribed from old raids." );
			for ( raid in change.newValue ) {
				var room = change.newValue[ raid ];
				socket.emit( 'subscribe', {
					room: room
				} );
			}
			console.log( "Subscribed to new raids." );
		} else if ( key === "trackedRaids" ) {
			console.log( "Updating tracked raids..." );
			trackedRaids = change.newValue;
		} else if ( key === "loudRaids" ) {
			console.log( "Updating loud raids..." );
			loudRaids = change.newValue;
		} else if ( key === "showSettings" ) {
			console.log( "Updating show settings..." );
			showSettings = change.newValue;
		} else if ( key === "viramateID" ) {
			console.log( "Updating viramate ID..." );
			viramateID = change.newValue;
			viramateScript.src = "chrome-extension://" + viramateID + "/content/api.html";
		}
	}
	raids = [];
} );

chrome.notifications.onClicked.addListener( function ( notificationId ) {
	var raidID = GetRaidFromNotification( notificationId ).id;
	console.log( "Notification clicked. Raid ID that matched: " + raidID );
	if ( raidID !== null ) {
		var raidLabel = document.getElementById( "id-container" );
		raidLabel.innerHTML = raidID;
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
		JoinRaid( raidID );
		raids[ FindRaidIndex( raidID ) ].status = "clicked";
	}
} );

chrome.notifications.onClosed.addListener( function ( notificationId, byUser ) {
	for ( var i = 0; i < notifications.length; i++ ) {
		if ( notifications.notification === notificationId ) {
			notifications.splice( i, 1 );
			break;
		}
	}
} );

window.addEventListener( "message", onMessage, false );

function onMessage( evt ) {
	console.log( "Got message from Viramate:" );
	console.dir( evt.data );
	if ( evt.data.type !== "result" ) {
		return;
	} else {
		if ( evt.data.result === "refill required" ) {
			raids[ FindRaidIndex( evt.data.id ) ].status = "no AP";
		} else if ( evt.data.result === "popup: This raid battle has already ended." ) {
			raids[ FindRaidIndex( evt.data.id ) ].status = "over";
		} else if ( evt.data.result === "popup: The number that you entered doesn't match any battle." ) {
			raids[ FindRaidIndex( evt.data.id ) ].status = "battle not found";
		} else if ( evt.data.result.error === "No granblue tab found" ) {
			raids[ FindRaidIndex( evt.data.id ) ].status = "granblue not found";
		} else if ( evt.data.result.error === "api disabled" ) {
			raids[ FindRaidIndex( evt.data.id ) ].status = "viramate API disabled";
		} else if ( evt.data.result === "popup: This raid battle is full. You can't participate." ) {
			raids[ FindRaidIndex( evt.data.id ) ].status = "battle is full";
		} else if ( evt.data.result === "already in this raid" ) {
			raids[ FindRaidIndex( evt.data.id ) ].status = "joined";
		} else if ( evt.data.result === "ok" ) {
			raids[ FindRaidIndex( evt.data.id ) ].status = "joined";
		}
		chrome.runtime.sendMessage( {
			viramate: evt.data.result,
			id: evt.data.id
		} );
	}
}

var raidIDDiv = document.createElement( 'div' );
raidIDDiv.id = "id-container";
document.body.appendChild( raidIDDiv );

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
