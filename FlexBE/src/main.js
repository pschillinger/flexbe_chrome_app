window.onload = function() {
	Behavior.resetBehavior();
	
	// Initialize gui panel
	UI.Statemachine.initialize();
	UI.Menu.toDashboardClicked();
	UI.Dashboard.resetAllFields();
	UI.Dashboard.addBehaviorOutcome('finished');
	UI.Dashboard.addBehaviorOutcome('failed');
	ActivityTracer.resetActivities();
	UI.RuntimeControl.displayLockBehavior();
	
	RC.Controller.initialize();

	// Initialize runtime control
	var onSettingsLoaded = function() {
		RC.ROS.trySetupConnection();
	}

	// Restore local settings (including statelib)
	UI.Settings.restoreSettings(onSettingsLoaded);

	UI.Feed.initialize();
}