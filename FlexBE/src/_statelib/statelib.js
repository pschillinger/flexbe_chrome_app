Statelib = new (function() {
	var that = this;

	var statedeps = [];

	var statelib = [
		new StateDefinition(":OUTCOME", undefined, "", [], [], [], [], [], [], []),
		new StateDefinition(":CONDITION", undefined, "", [], [], [], [], [], [], []),
		new StateDefinition(":INIT", undefined, "", [], [], [], [], [], [], []),
		new StateDefinition(":CONTAINER", undefined, "", [], [], [], [], [], [], [])
	];


	this.getFromLib = function(state_class) {
		for (var i=0; i<statelib.length; ++i) {
			if (statelib[i].getStateClass() == state_class)
				return statelib[i];
		}
	}

	this.getClassList = function() {
		list = []
		for (var i=0; i<statelib.length; ++i) {
			if (statelib[i].getStateClass().charAt(0) == ":") continue;
			list.push(statelib[i].getStateClass());
		}
		return list;
	}

	this.getDependencyList = function() {
		return statedeps;
	}

	this.resetLib = function() {
		statelib = [
			new StateDefinition(":OUTCOME", undefined, "", [], [], [], [], [], [], []),
			new StateDefinition(":CONDITION", undefined, "", [], [], [], [], [], [], []),
			new StateDefinition(":INIT", undefined, "", [], [], [], [], [], [], []),
			new StateDefinition(":CONTAINER", undefined, "", [], [], [], [], [], [], [])
		];
	}

	this.addToLib = function(state) {
		statelib.push(state);

		//T.logInfo("+" + state.getStateClass());
	}

	this.addDependency = function(import_path) {
		var package_name = import_path.split('.')[0];
		if(!statedeps.contains(package_name)) {
			statedeps.push(package_name);
		}
	}

}) ();