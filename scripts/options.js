console.log( "Options script started. Getting list of raids from background script..." );

chrome.runtime.getBackgroundPage( function ( backgroundPage ) {
	backgroundPage.raidConfigs.sort( function ( a, b ) {
		if ( a.english < b.english ) {
			return -1;
		};
		if ( a.english > b.english ) {
			return 1;
		};
		return 0;
	} );

	if ( backgroundPage.raidConfigs.length > 0 ) {
		document.getElementById( "container" ).children[ 0 ].remove();
	}

	console.log( "Sorted raids. Adding to page..." );
	for ( var i = 0; i < backgroundPage.raidConfigs.length; i++ ) {
		var row = '<tr>';
		row += '<td>' + backgroundPage.raidConfigs[ i ].english + '</td>';
		row += '<td><label for="' + backgroundPage.raidConfigs[ i ].room + '-select">Select</label><input id="' + backgroundPage.raidConfigs[ i ].room + '-select" type="checkbox"></td>';
		row += '<td><label for="' + backgroundPage.raidConfigs[ i ].room + '-track">Track</label><input id="' + backgroundPage.raidConfigs[ i ].room + '-track" type="checkbox"></td>';
		row += '<td>Sound Choice<div id="' + backgroundPage.raidConfigs[ i ].room + '-sound" class="ui selection dropdown"><input id="' + backgroundPage.raidConfigs[ i ].room + '-sound-input" type="hidden" name="formatting" value="none"><i class="dropdown icon"></i><div class="default text">Sound Choice</div><div class="menu">';
		row += '<div class="item" data-value="none">None</div>';
		row += '<div class="item" data-value="beeps">Beeps Appear</div>';
		row += '<div class="item" data-value="lily-event-ringring">GBF - Lily (Event) - Ring Ring</div>';
		row += '<div class="item" data-value="andira-oniichan">GBF - Andira - Onii-chan</div>';
		row += '<div class="item" data-value="titanfall-droppingnow">Titanfall - Dropping Now</div>';
		row += '</div></div></td>';
		row += '</tr>';
		document.getElementById( "container" ).innerHTML += row;
	}

	chrome.storage.sync.get( {
		selectedRaids: []
	}, function ( items ) {
		for ( var i = 0; i < items.selectedRaids.length; i++ ) {
			console.log( "Raid was already subscribed to. Room: " + items.selectedRaids[ i ] );
			document.getElementById( items.selectedRaids[ i ] + '-select' ).checked = true;
			document.getElementById( items.selectedRaids[ i ] + '-select' ).parentElement.parentElement.classList.add( "selected-raid" );
		}
	} );

	chrome.storage.sync.get( {
		trackedRaids: []
	}, function ( items ) {
		for ( var i = 0; i < items.trackedRaids.length; i++ ) {
			console.log( "Raid was already tracked. Room: " + items.trackedRaids[ i ] );
			document.getElementById( items.trackedRaids[ i ] + '-track' ).checked = true;
		}
	} );

	chrome.storage.sync.get( {
		loudRaids: []
	}, function ( items ) {
		for ( var i = 0; i < items.loudRaids.length; i++ ) {
			console.log( "Raid was already loud. Room: " + items.loudRaids[ i ].room );
			document.getElementById( items.loudRaids[ i ].room + '-sound-input' ).value = items.loudRaids[ i ].choice;
		}
		console.log( "Setting up dropdowns..." );
		$( ".ui.selection.dropdown" ).dropdown();
	} );

	chrome.storage.sync.get( {
		showSettings: {
			message: false,
			time: false,
			close: false
		}
	}, function ( items ) {
		if ( items.showSettings.message ) {
			document.getElementById( "show-message-input" ).checked = true;
		}
		if ( items.showSettings.time ) {
			document.getElementById( "show-time-input" ).checked = true;
		}
		if ( items.showSettings.close ) {
			document.getElementById( "close-click-input" ).checked = true;
		}
		console.log( "Setting up checkboxes..." );
		$( '.ui.checkbox' ).checkbox();
	} );

	document.getElementById( "save" ).addEventListener( "click", function ( evt ) {
		console.log( "Saved button clicked." );
		_gaq.push( [ '_trackEvent', "Save", 'clicked' ] );

		var selectedRaids = [];
		for ( var i = 0; i < backgroundPage.raidConfigs.length; i++ ) {
			if ( document.getElementById( backgroundPage.raidConfigs[ i ].room + '-select' ).checked ) {
				selectedRaids.push( backgroundPage.raidConfigs[ i ].room );
			}
		}
		console.log( "Went through all selected raid inputs. Number of selected raids: " + selectedRaids.length );

		var trackedRaids = [];
		for ( var i = 0; i < backgroundPage.raidConfigs.length; i++ ) {
			if ( document.getElementById( backgroundPage.raidConfigs[ i ].room + '-track' ).checked ) {
				trackedRaids.push( backgroundPage.raidConfigs[ i ].room );
			}
		}
		console.log( "Went through all tracked raid inputs. Number of tracked raids: " + trackedRaids.length );

		var loudRaids = [];
		for ( var i = 0; i < backgroundPage.raidConfigs.length; i++ ) {
			if ( document.getElementById( backgroundPage.raidConfigs[ i ].room + '-sound-input' ).value !== "none" ) {
				loudRaids.push( {
					room: backgroundPage.raidConfigs[ i ].room,
					choice: document.getElementById( backgroundPage.raidConfigs[ i ].room + '-sound-input' ).value
				} );
			}
		}
		console.log( "Went through all loud raid inputs. Number of loud raids: " + loudRaids.length );

		var showSettings = {
			message: false,
			time: false,
			close: false
		};
		if ( document.getElementById( "show-message-input" ).checked ) {
			showSettings.message = true;
		}
		if ( document.getElementById( "show-time-input" ).checked ) {
			showSettings.time = true;
		}
		if ( document.getElementById( "close-click-input" ).checked ) {
			showSettings.close = true;
		}

		chrome.storage.sync.set( {
			selectedRaids: selectedRaids,
			trackedRaids: trackedRaids,
			loudRaids: loudRaids,
			showSettings: showSettings
		}, function () {
			console.log( "Saved raids!" );
			document.getElementById( "save" ).innerHTML = "Saved!";
		} );
	} );
} );

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
