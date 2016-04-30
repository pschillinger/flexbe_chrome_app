UI.Feed = new (function() {
	var that = this;

	var requestLatestVersion = function(callback) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "https://api.github.com/repos/pschillinger/flexbe_chrome_app/tags", true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if (xhr.responseText != "") {
					var resp = JSON.parse(xhr.responseText);
					var found = false;
					for (var i=0; i<resp.length; i++) {
						if (resp[i].name.match(/^\d+\.\d+\.\d+$/) != null) {
							callback(resp[i].name);
							found = true;
							break;
						}
					}
					if (!found) callback(undefined);
				} else {
					callback(undefined);
				}
			}
		}
		xhr.send();
	}

	var displayVersionIndicator = function(latest_version_label) {
		var current_version_label = chrome.runtime.getManifest().version;
		var status_element = document.getElementById("flexbe_version_status");

		if (latest_version_label == undefined) {
			status_element.setAttribute("src", "img/version_offline.png");
			status_element.setAttribute("title", "Unable to retrieve latest version.");
			console.log("Version: " + current_version_label + " (unknown release version)");
			return;
		}

		var current_version = current_version_label.split(".");
		var latest_version = latest_version_label.split(".");

		current_version = parseInt(current_version[0]) * 1000 * 1000 + parseInt(current_version[1]) * 1000 + parseInt(current_version[2]);
		latest_version = parseInt(latest_version[0]) * 1000 * 1000 + parseInt(latest_version[1]) * 1000 + parseInt(latest_version[2]);

		if (current_version < latest_version) {
			displayPredefinedMessage("msg_notify_update");
			status_element.setAttribute("src", "img/version_old.png");
			status_element.setAttribute("title", "New release available!");
			console.log("Version: " + current_version_label + " (old), Release: " + latest_version_label);

		} else if (current_version > latest_version) {
			status_element.setAttribute("src", "img/version_devel.png");
			status_element.setAttribute("title", "Pre-release development version");
			console.log("Version: " + current_version_label + " (devel), Release: " + latest_version_label);
		
		} else {
			status_element.setAttribute("src", "img/version_latest.png");
			status_element.setAttribute("title", "Running latest release");
			console.log("Version: " + current_version_label + " (latest)");
		}
	}

	var displayPredefinedMessage = function(id) {
		var msg = document.getElementById(id);
		var close_button = document.getElementById(id + "_close");
		close_button.addEventListener('click', function() {
			msg.style.display = "none";
		});
		msg.style.display = "block";
	}

	this.initialize = function() {
		document.getElementById("flexbe_version_label").innerText = chrome.runtime.getManifest().version;

		requestLatestVersion(
			displayVersionIndicator
		);
	}

	this.showAbout = function() {
		displayPredefinedMessage("msg_about");
	}

	this.hideAbout = function() { }

}) ();