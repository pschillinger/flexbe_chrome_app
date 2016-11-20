Behaviorlib = new (function() {
	var that = this;

	var behaviorlib = [];


	this.getByName = function(behavior_name) {
		return behaviorlib.findElement(function(element) {
			return element.getBehaviorName() == behavior_name;
		});
	}

	this.getByClass = function(class_name) {
		return behaviorlib.findElement(function(element) {
			return element.getStateClass() == class_name;
		});
	}

	this.getBehaviorList = function() {
		list = []
		for (var i=0; i<behaviorlib.length; ++i) {
			list.push(behaviorlib[i].getBehaviorName());
		}
		return list.sort(function(a,b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });
	}

	this.parseLib = function(state) {
		behaviorlib = [];
		T.logInfo("Parsing available behaviors...");
		BehaviorLoader.parseBehaviorList(function (be_list) {
			be_list.forEach(function(manifest) {
				BehaviorLoader.loadBehaviorInterface(manifest, function(ifc) {
					if (manifest.class_name != ifc.class_name) {
						T.logwarn("Inconsistent class name for: " + manifest.class_name + " / " + ifc.class_name);
						return;
					}

					behaviorlib.push(new BehaviorStateDefinition(manifest, ifc.smi_outcomes, ifc.smi_input, ifc.smi_output));
				});
			});
		});
	}

	this.updateEntry = function(be_entry, callback) {
		BehaviorLoader.loadBehaviorInterface(be_entry.getBehaviorManifest(), function(ifc) {
			if (be_entry.getBehaviorManifest().class_name != ifc.class_name) {
				T.logwarn("Inconsistent class name for: " + be_entry.getBehaviorManifest().class_name + " / " + ifc.class_name);
				return;
			}
			behaviorlib.remove(be_entry);
			behaviorlib.push(new BehaviorStateDefinition(be_entry.getBehaviorManifest(), ifc.smi_outcomes, ifc.smi_input, ifc.smi_output, callback));
		});
	}

}) ();