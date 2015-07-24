UI.Menu = new (function() {
	var that = this;

	var keys = ["db", "sm", "rc", "se"];

	var current_page = "db";

	var setFocus = function(target) {
		for (var i=0; i<keys.length; ++i) {
			key = keys[i];
			active = (key == target)? "_active" : "";
			document.getElementById("button_to_" + key).setAttribute("class", "category_button" + active);
			document.getElementById("button_to_" + key).children[0].setAttribute("src", "img/" + key + active + ".png");
		}
		current_page = target;
	}

	var button_config_db = [
		[
			["New Behavior", "file_new", function() { UI.Menu.newBehaviorClicked(); }],
			["Load Behavior", "file_load", function() { UI.Menu.loadBehaviorClicked(); }],
			["Save Behavior", "file_save", function() { UI.Menu.saveBehaviorClicked(); }]
		],
		[
			["Check Behavior", "check", function() { UI.Menu.checkBehaviorClicked(); }]
		]
	];
	var button_config_sm = [
		[
			["Add State", "title_add", function() { UI.Menu.addStateClicked(); }],
			["Add Behavior", "title_add", function() { UI.Menu.addBehaviorClicked(); }],
			["Add State Machine", "title_add", function() { UI.Menu.addStatemachineClicked(); }]
		],
		[
			["Data Flow Graph", "dataflow", function() { UI.Statemachine.toggleDataflow(); }],
			["Check Behavior", "check", function() { UI.Menu.checkBehaviorClicked(); }],
			["Save Behavior", "file_save", function() { UI.Menu.saveBehaviorClicked(); }]
		],
		[
			["Undo", "undo", function() { ActivityTracer.undo(); }],
			["Redo", "redo", function() { ActivityTracer.redo(); }],
			["Reset", "cross", function() { ActivityTracer.resetToSave(); }]
		],
		[
			["Write Comment", "note_add", function() { UI.Menu.addCommentClicked(); }],
			["Toggle Comments", "note", function() { UI.Statemachine.toggleComments(); }]
		]
	];
	var button_config_rc = [
		[
			["Show Terminal", "title_terminal", function() { UI.Menu.terminalClicked(); }]
		]
	];
	var button_config_se = [
		[
			["Show Terminal", "title_terminal", function() { UI.Menu.terminalClicked(); }]
		],
		[
			["Connect to ROS", "link", function() { UI.Settings.connectRosbridgeClicked(); }],
			["Disconnect from ROS", "link_break", function() { UI.Settings.disconnectRosbridgeClicked(); }]
		]
	];


	var setMenuButtons = function(config) {
		panel = document.getElementById("title_button_panel");
		panel.innerHTML = "";
		for (var c=0; c<config.length; ++c) {
			column = document.createElement("div");
			column.setAttribute("class", "tool_category");
			table = document.createElement("table");
			table.setAttribute("cellspacing", "0");
			table.setAttribute("cellpadding", "0");
			for (var r=0; r<config[c].length; ++r) {
				button = config[c][r];
				tr = document.createElement("tr");
				td = document.createElement("td");
				td.setAttribute("class", "tool_button");
				td.innerHTML = 
					'<table cellpadding="0" cellspacing="0"><tr><td valign="middle">' +
						'<img src="img/' + button[1] + '.png" />' +
					'</td><td valign="middle" style="padding-left:5px">' +
						button[0] +
					'</td></tr></table>';
				td.addEventListener("click", button[2]);
				tr.appendChild(td);
				table.appendChild(tr);
			}
			column.appendChild(table);
			panel.appendChild(column);
		}
	}

	this.isPageDashboard = function() { return current_page == "db"; }
	this.isPageStatemachine = function() { return current_page == "sm"; }
	this.isPageControl = function() { return current_page == "rc"; }
	this.isPageSettings = function() { return current_page == "se"; }


	this.toDashboardClicked = function() {
		document.getElementById("dashboard").style.left = "0px";
		document.getElementById("statemachine").style.left = "calc(100% + 50px)";
		document.getElementById("runtimecontrol").style.left = "calc((100% + 50px)*2)";
		document.getElementById("settings").style.left = "calc((100% + 50px)*3)";
		setFocus("db");
		setMenuButtons(button_config_db);
	}

	this.toStatemachineClicked = function() {
		document.getElementById("dashboard").style.left = "calc(-100% - 50px)";
		document.getElementById("statemachine").style.left = "0px";
		document.getElementById("runtimecontrol").style.left = "calc(100% + 50px)";
		document.getElementById("settings").style.left = "calc((100% + 50px)*2)";
		setFocus("sm");
		setMenuButtons(button_config_sm);
		UI.Statemachine.refreshView();
	}

	this.toControlClicked = function() {
		document.getElementById("dashboard").style.left = "calc((-100% - 50px)*2)";
		document.getElementById("statemachine").style.left = "calc(-100% - 50px)";
		document.getElementById("runtimecontrol").style.left = "0px";
		document.getElementById("settings").style.left = "calc(100% + 50px)";
		setFocus("rc");
		setMenuButtons(button_config_rc);
	}

	this.toSettingsClicked = function() {
		document.getElementById("dashboard").style.left = "calc((-100% - 50px)*3)";
		document.getElementById("statemachine").style.left = "calc((-100% - 50px)*2)";
		document.getElementById("runtimecontrol").style.left = "calc(-100% - 50px)";
		document.getElementById("settings").style.left = "0px";
		setFocus("se");
		setMenuButtons(button_config_se);
	}

	this.expandDevbanner = function() {
		var banner = document.getElementById("devbanner");
		banner.innerHTML = "<h2>Early Development Version</h2>" +
			"Please handle with care and report any issues you encounter so I can consider them for future improvements. Thank you!<br />" +
			"<br />" + 
			"<h2>Current State</h2>" + 
			"Don't execute unsaved behaviors and don't modify behaviors during execution even if possible.";
	}

	this.shrinkDevbanner = function() {
		var banner = document.getElementById("devbanner");
		banner.innerHTML = "<h2>Early Development Version</h2>" +
			"Please hover here for further information.";
	}

	this.displayRuntimeStatus = function(status) {
		txt = document.getElementById("runtime_status_txt");
		txt.innerHTML = status;
		img = document.getElementById("runtime_status_img");
		color = "#aaa";
		switch(status) {
			case 'offline': img.setAttribute("src", "img/link_break.png"); color = "#aaa"; break;
			case 'disconnected': img.setAttribute("src", "img/cross.png"); color = "#d66"; break;
			case 'online': img.setAttribute("src", "img/link.png"); color = "#aaa"; break;
			case 'running': img.setAttribute("src", "img/tick.png"); color = "#3a3"; break;
			case 'locked': img.setAttribute("src", "img/lock.png"); color = "#b85"; break;
			case 'message': img.setAttribute("src", "img/information.png"); color = "#66b"; break;
			case 'warning': img.setAttribute("src", "img/warning.png"); color = "#b85"; break;
			case 'error': img.setAttribute("src", "img/error.png"); color = "#d66"; break;
		}
		txt.style.color = color;
	}

	this.addStateClicked = function() {
		if (UI.Statemachine.isReadonly()) return;

		UI.Panels.AddState.show();
	}

	this.addBehaviorClicked = function() {
		if (UI.Statemachine.isReadonly()) return;

		UI.Panels.SelectBehavior.setSelectionCallback(function(manifest) {
			BehaviorLoader.loadBehaviorInterface(manifest, function(smi) {
				if (smi.class_name != manifest.class_name) T.logWarn("Class names of behavior " + manifest.name + " do not match!");
				var be_def = Behaviorlib.getByName(manifest.name);
				var be = new BehaviorState(manifest.name, be_def);
				UI.Statemachine.getDisplayedSM().addState(be);
				UI.Statemachine.refreshView();
				UI.Panels.StateProperties.displayStateProperties(be);

				var be_name = manifest.name;
				var state_path = be.getStatePath();
				var container_path = be.getContainer().getStatePath();

				ActivityTracer.addActivity(ActivityTracer.ACT_STATE_ADD,
					"Added new state taken from behavior " + manifest.name,
					function() {
						var state = Behavior.getStatemachine().getStateByPath(state_path);
						state.getContainer().removeState(state);
						if (UI.Panels.StateProperties.isCurrentState(state)) {
							UI.Panels.StateProperties.hide();
						}
						UI.Statemachine.refreshView();
					},
					function() {
						var container = (container_path == "")? Behavior.getStatemachine() : Behavior.getStatemachine().getStateByPath(container_path);
						var redo_state = new BehaviorState(be_name, Behaviorlib.getByName(be_name));
						container.addState(redo_state);
						UI.Statemachine.refreshView();
					}
				);
			});
		});
		UI.Panels.SelectBehavior.show();
	}

	this.addStatemachineClicked = function() {
		if (UI.Statemachine.isReadonly()) return;

		// for testing
		var sm_def = new StateMachineDefinition(['finished', 'failed'], [], []);
		var sm_name_pattern = /Statemachine(?:_(\d+))?/i;
		var current_sm_list = UI.Statemachine.getDisplayedSM().getStates();
		current_sm_list = current_sm_list.map(function(element) {
			var result = element.getStateName().match(sm_name_pattern);
			if (result == null) return 0;
			if (result[1] == undefined) return 1;
			return parseInt(result[1]);
		});
		var new_index = current_sm_list.reduce(function(prev, cur) {
			return prev > cur? prev : cur;
		}, 0) + 1;
		var state_name = "Statemachine" + ((new_index>1)? "_" + new_index : "");
		var sm = new Statemachine(state_name, sm_def);
		UI.Statemachine.getDisplayedSM().addState(sm);
		UI.Statemachine.refreshView();
		UI.Panels.StateProperties.displayStateProperties(sm);

		var state_path = sm.getStatePath();
		var container_path = sm.getContainer().getStatePath();

		ActivityTracer.addActivity(ActivityTracer.ACT_STATE_ADD,
			"Added new state machine",
			function() {
				var state = Behavior.getStatemachine().getStateByPath(state_path);
				state.getContainer().removeState(state);
				if (UI.Panels.StateProperties.isCurrentState(state)) {
					UI.Panels.StateProperties.hide();
				}
				UI.Statemachine.refreshView();
			},
			function() {
				var container = (container_path == "")? Behavior.getStatemachine() : Behavior.getStatemachine().getStateByPath(container_path);
				var redo_state = new Statemachine(state_name, new StateMachineDefinition(['finished', 'failed'], [], []));
				container.addState(redo_state);
				UI.Statemachine.refreshView();
			}
		);

		return sm;
	}

	this.terminalClicked = function() {
		UI.Panels.Terminal.show();
	}

	this.saveBehaviorClicked = function() {
		var check_error_string = Checking.checkBehavior();
		if (check_error_string != undefined) {
			T.clearLog();
			T.show();
			T.logError("Unable to save behavior: " + check_error_string);
			return;
		}
		BehaviorSaver.saveStateMachine();
		ActivityTracer.addSave();
	}

	this.newBehaviorClicked = function() {
		if (RC.Controller.isReadonly()) return;

		// abort behavior execution if running

		Behavior.resetBehavior();
		UI.Dashboard.resetAllFields();
		UI.Statemachine.resetStatemachine();

		// make sure a new behavior always starts at the dashboard
		UI.Menu.toDashboardClicked();
		UI.Panels.setActivePanel(UI.Panels.NO_PANEL);

		UI.Dashboard.addBehaviorOutcome('finished');
		UI.Dashboard.addBehaviorOutcome('failed');

		ActivityTracer.resetActivities();
		var scedit = document.getElementById("behavior_sourcecode_edit");
		scedit.setAttribute("cmd", '');
		scedit.style.display = "none";
	}

	this.loadBehaviorClicked = function() {
		if (RC.Controller.isReadonly()) return;
		
		//BehaviorLoader.importBehavior();
		UI.Panels.SelectBehavior.setSelectionCallback(function(manifest) {
			BehaviorLoader.loadBehavior(manifest);
			var scedit = document.getElementById("behavior_sourcecode_edit");
			scedit.setAttribute("cmd", 'rosed ' + manifest.rosnode_name + ' ' + manifest.codefile_name+ '\n');
			scedit.style.display = "block";
		});
		UI.Panels.SelectBehavior.show();
	}

	this.checkBehaviorClicked = function() {
		T.clearLog();
		T.show();
		T.logInfo("Performing behavior checks...");
		var error_string = Checking.checkBehavior();
		if (error_string != undefined) {
			T.logError("Found error: " + error_string);
		} else {
			T.logInfo("Behavior is valid!");
		}

		// generate warnings
	}

	this.addCommentClicked = function() {
		if (UI.Statemachine.isReadonly()) return;

		var note = new Note("");
		note.setContainerPath(UI.Statemachine.getDisplayedSM().getStatePath());
		Behavior.addCommentNote(note);
		UI.Statemachine.refreshView();
	}

}) ();