var socket = io.connect( 'https://www.gbfraiders.com:8080/' );
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

function SetRaidStatus( id, status ) {
	console.log( `Setting raid status to "${status}" for raid ${id}` );
	for ( var i = 0; i < raids.length; i++ ) {
		if ( raids[ i ].id === id ) {
			raids[ i ].status = status;
			break;
		}
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

socket.on( 'tweet', function ( data ) {
	console.log( "New raid received. Room: " + data.room + ", ID: " + data.id, data );
	if ( !DoesRaidExist( data.id ) && !stopped ) {
		console.log( "Raid with this ID does not exist. Adding to raids array..." );
		data.status = "unclicked";
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
			SetRaidStatus( raidID, "clicked" );
		}
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

var raidIDDiv = document.createElement( 'div' );
raidIDDiv.id = "id-container";
document.body.appendChild( raidIDDiv );
