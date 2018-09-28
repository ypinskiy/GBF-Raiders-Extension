console.log( "Options script started. Getting list of raids from background script..." );

chrome.runtime.getBackgroundPage( function ( backgroundPage ) {
	backgroundPage.RefreshRaidConfigs();
	
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
		row += '<td><label for="' + backgroundPage.raidConfigs[ i ].room + '-select">Select</label><input class="select-box" id="' + backgroundPage.raidConfigs[ i ].room + '-select" type="checkbox"></td>';
		row += '<td><label for="' + backgroundPage.raidConfigs[ i ].room + '-track">Track</label><input class="track-box" id="' + backgroundPage.raidConfigs[ i ].room + '-track" type="checkbox"></td>';
		row += '<td><label for="' + backgroundPage.raidConfigs[ i ].room + '-sound-input">Sound Choice</label><div id="' + backgroundPage.raidConfigs[ i ].room + '-sound" class="ui selection dropdown"><input id="' + backgroundPage.raidConfigs[ i ].room + '-sound-input" type="hidden" name="formatting" value="none"><i class="dropdown icon"></i><div class="default text">Sound Choice</div><div class="menu">';
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
		viramateID: "fgpokpknehglcioijejfeebigdnbnokj"
	}, function ( items ) {
		console.log( "Getting initial viramate ID from storage..." );
		document.getElementById( "viramate-id-input" ).value = items.viramateID;
	} );

	chrome.storage.sync.get( {
		showSettings: {
			message: false,
			time: false,
			close: false,
			if: false
		}
	}, function ( items ) {
		if (items.showSettings.id) {
			document.getElementById("show-id-input").checked = true;
		}
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

	var filterBox = document.getElementById("name-filter");
	var minLevelBox = document.getElementById("level-min");
	var maxLevelBox = document.getElementById("level-max");

	function filter(event) {
		var filter = filterBox.value.toLowerCase();
		var min = parseInt(minLevelBox.value);
		var max = parseInt(maxLevelBox.value);

		var table = document.getElementById("settings-table");
		var tr = table.getElementsByTagName("tr");

		for (i = 0; i < tr.length; i++) {
			td = tr[i].getElementsByTagName("td")[0];
			if (td) {
				console.log(td.innerHTML);
				var level = parseInt(td.innerHTML.match("Lvl\\s(\\d+)\\s.+")[1]);
				if ((td.innerHTML.toLowerCase().indexOf(filter) > -1)
					&& (min <= level)
					&& (max >= level)) {
					tr[i].style.display = "";
				} else {
					tr[i].style.display = "none"
				}
			} 
		}
	};

	filterBox.addEventListener("input", filter);
	minLevelBox.addEventListener("input", filter);
	maxLevelBox.addEventListener("input", filter);

	var selectAllButton = document.getElementById("select-all");
	selectAllButton.addEventListener("click", function(event) {
		selectAllButton.disabled = true;

		Array.from(document.getElementsByClassName("select-box")).map((x) => x.checked = true);

		selectAllButton.disabled = false;
	});

	var selectNoneButton = document.getElementById("select-none");
	selectNoneButton.addEventListener("click", function(event) {
		selectNoneButton.disabled = true;

		Array.from(document.getElementsByClassName("select-box")).map((x) => x.checked = false);

		selectNoneButton.disabled = false;
	});

	var trackAllButton = document.getElementById("track-all");
	trackAllButton.addEventListener("click", function(event) {
		trackAllButton.disabled = true;

		Array.from(document.getElementsByClassName("track-box")).map((x) => x.checked = true);

		trackAllButton.disabled = false;
	});

	var trackNoneButton = document.getElementById("track-none");
	trackNoneButton.addEventListener("click", function(event) {
		trackNoneButton.disabled = true;

		Array.from(document.getElementsByClassName("track-box")).map((x) => x.checked = false);

		trackNoneButton.disabled = false;
	});

	var saveButtons = Array.from(document.getElementsByClassName("save"));
	saveButtons.map((x) => x.addEventListener( "click", function ( evt ) {
		console.log( "Saved button clicked." );
		_gaq.push( [ '_trackEvent', "Save", 'clicked' ] );
		saveButtons.map((x) => x.disabled = true);
		saveButtons.map((x) => x.innerHTML = "Saving...");

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
			close: false,
			id: false
		};
		if (document.getElementById( "show-id-input" ).checked) {
			showSettings.id = true;
		}
		if ( document.getElementById( "show-message-input" ).checked ) {
			showSettings.message = true;
		}
		if ( document.getElementById( "show-time-input" ).checked ) {
			showSettings.time = true;
		}
		if ( document.getElementById( "close-click-input" ).checked ) {
			showSettings.close = true;
		}

		var viramateID = document.getElementById( "viramate-id-input" ).value;

		chrome.storage.sync.set( {
			selectedRaids: selectedRaids,
			trackedRaids: trackedRaids,
			loudRaids: loudRaids,
			showSettings: showSettings,
			viramateID: viramateID
		}, function () {
			console.log( "Saved settings!" );
			saveButtons.map((x) => x.innerHTML = "Saved!");
			setTimeout(function () {
				saveButtons.map((x) => x.disabled = false);
				saveButtons.map((x) => x.innerHTML = "Save");
			}, 1000);
		} );
	} ));
} );

document.getElementById( "viramate-id-input" ).addEventListener( 'keypress', function ( event ) {
	if ( event.which === 32 ) {
		document.getElementById( "viramate-id" ).classList.add("error");
		event.preventDefault();
	} else {
		document.getElementById( "viramate-id" ).classList.remove("error");
	}
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
