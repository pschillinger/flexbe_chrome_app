BehaviorPacker = new (function() {
	var that = this;

	this.loadBehaviorCode = function(callback) {
		var names = Behavior.createNames();

		chrome.fileSystem.restoreEntry(UI.Settings.getBehaviorsFolderID(), function(entry) {
			entry.getDirectory(names.rosnode_name, { create: false },
				function(dir) {
					dir.getDirectory("src", { create: false },
						function(src_dir) {
							src_dir.getDirectory(names.rosnode_name, { create: false },
								function(innerDir) {
									Filesystem.getFileContent(innerDir, names.file_name, callback);
								}, 
								function(error) { handleError("could not access folder " + names.rosnode_name + ", " + error); }
							);
						}, 
						function(error) { handleError("could not access folder src, " + error); }
					);
				}, 
				function(error) { handleError("could not access folder " + names.rosnode_name + ", " + error); }
			);
		});
	}

}) ();