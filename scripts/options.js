console.log( "Options script started. Getting list of raids from background script..." );

chrome.runtime.getBackgroundPage( function ( backgroundPage ) {
	backgroundPage.raidConfigs.sort( function ( a, b ) {
		if ( a.english < b.english ) {
			return -1
		};
		if ( a.english > b.english ) {
			return 1
		};
		return 0;
	} );

	if ( backgroundPage.raidConfigs.length > 0 ) {
		document.getElementById( "container" ).children[ 0 ].remove();
	}

	console.log( "Sorted raids. Adding to page..." );
	for ( var i = 0; i < backgroundPage.raidConfigs.length; i++ ) {
		document.getElementById( "container" ).innerHTML += '<tr><td>' + backgroundPage.raidConfigs[ i ].english + '</td><td><label for="' + backgroundPage.raidConfigs[ i ].room + '-select">Select</label><input id="' + backgroundPage.raidConfigs[ i ].room + '-select" type="checkbox"></td><td><label for="' + backgroundPage.raidConfigs[ i ].room + '-track">Track</label><input id="' + backgroundPage.raidConfigs[ i ].room + '-track" type="checkbox"></td></tr>';
	}

	chrome.storage.sync.get( {
		selectedRaids: []
	}, function ( items ) {
		for ( var i = 0; i < items.selectedRaids.length; i++ ) {
			console.log( "Raid was already subscribed to. Room: " + items.selectedRaids[ i ] );
			document.getElementById( items.selectedRaids[ i ] + '-select' ).checked = true;
		}
	} );

	chrome.storage.sync.get( {
		trackedRaids: []
	}, function ( items ) {
		for ( var i = 0; i < items.trackedRaids.length; i++ ) {
			console.log( "Raid was already subscribed to. Room: " + items.trackedRaids[ i ] );
			document.getElementById( items.trackedRaids[ i ] + '-track' ).checked = true;
		}
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

		chrome.storage.sync.set( {
			selectedRaids: selectedRaids,
			trackedRaids: trackedRaids
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
