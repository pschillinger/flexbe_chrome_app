RC.ROS = new (function() {
	var that = this;

	var ros;
	var connected = false;
	var connect_attempts_left = 0;
	var namespace = "";

	this.getROS = function() {
		return ros;
	}

	var setupConnection = function() {
		T.logInfo("ROS connection running!");
		connected = true;
		UI.Settings.updateRosbridgeStatus(true);
		ros.on('error', setupFailed);
		ros.on('close', connectionClosed);

		// at first, not connected to the behavior engine
		// will change as soon as we get any message from the onboard be
		UI.Menu.displayRuntimeStatus("disconnected");
		RC.Sync.register("ROS", 90);
		RC.Sync.setStatus("ROS", RC.Sync.STATUS_ERROR);

	    var param = new ROSLIB.Param({
			ros : ros,
			name : '~namespace'
		});

		param.get(function(ns) {
			if (ns != '') document.getElementById('label_editor_title').innerHTML = ns;
			RC.PubSub.initialize(ros, ns);
		});
	}

	var setupFailed = function() {
		T.logWarn("ROS connection setup failed, staying offline.");
		T.logInfo("If you need runtime control, please check if rosbridge is running and try again.");
	}

	var connectionClosed = function() {
		T.logInfo("ROS connection closed!");
		RC.PubSub.shutdown();
		connected = false;

		UI.Settings.updateRosbridgeStatus(false);
		RC.Controller.signalDisconnected();
		RC.Sync.remove("ROS");
		RC.Sync.shutdown();
	}

	var attemptToConnect = function() {
		ros = new ROSLIB.Ros({
			url : 'ws://' + UI.Settings.getRosbridgeIP() + ':' + UI.Settings.getRosbridgePort()
		});
		ros.on('connection', setupConnection);
		ros.on('error', function() {
			connect_attempts_left--;
			console.log(connect_attempts_left);
			if (connect_attempts_left > 0) {
				setTimeout(attemptToConnect, 1000);
			} else {
				setupFailed();
			}
		});
	}

	this.trySetupConnection = function() {
		T.logInfo("Setting up ROS connection...");
		connect_attempts_left = 10;
		attemptToConnect();
	}

	this.closeConnection = function() {
		T.logInfo("Closing ROS connection...");
		ros.close();
	}

	this.isConnected = function() {
		return connected;
	}

}) ();