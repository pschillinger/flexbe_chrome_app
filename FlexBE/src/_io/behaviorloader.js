BehaviorLoader = new (function() {
	var that = this;

	var parseCode = function(file_content, manifest_data) {
		var parsingResult;
		try {
			parsingResult = CodeParser.parseCode(file_content);
			T.logInfo("Code parsing completed.");
		} catch (err) {
			T.logError("Code parsing failed: " + err);
			return;
		}
		applyParsingResult(parsingResult, manifest_data);
		T.logInfo("Behavior " + parsingResult.behavior_name + " loaded.");

		var error_string = Checking.checkBehavior();
		if (error_string != undefined) {
			T.logError("The loaded behavior contains errors! Please fix and save:");
			T.logError(error_string);
			RC.Controller.signalChanged();
		}
	}

	var applyParsingResult = function(result, manifest) {
		ModelGenerator.generateBehaviorAttributes(result, manifest);

		T.logInfo("Building behavior state machine...");
		var sm = ModelGenerator.buildStateMachine("", result.root_sm_name, result.sm_defs, result.sm_states);
		Behavior.setStatemachine(sm);
		UI.Statemachine.resetStatemachine();
		T.logInfo("Behavior state machine built.");
		
		ActivityTracer.resetActivities();
	}

	var resetEditor = function() {
		Behavior.resetBehavior();
		UI.Dashboard.resetAllFields();
		UI.Statemachine.resetStatemachine();

		// make sure a new behavior always starts at the dashboard
		UI.Menu.toDashboardClicked();
		UI.Panels.setActivePanel(UI.Panels.NO_PANEL);
	}


	this.importBehavior = function() {
		T.clearLog();
		UI.Panels.Terminal.show();

		// store in file
		chrome.fileSystem.chooseEntry({type: 'openFile'}, function(fileEntry) {
			if (fileEntry == undefined) {
				T.logTnfo("Load cancelled by user.");
				UI.Panels.Terminal.hide();
				return;
			}

			resetEditor();

			fileEntry.file(function(file) {
				var reader = new FileReader();
				reader.onload = function(e) {
					var file_content = e.target.result;
					T.logInfo("Parsing sourcecode...");
					parseCode(file_content);
				};
				reader.readAsText(file);
			});
		});

		T.logInfo("Waiting for a file to load...");
	}

	this.loadBehavior = function(manifest) {
		T.clearLog();
		UI.Panels.Terminal.show();

		resetEditor();

		if (UI.Settings.getBEFolderID() == '') {
			console.log('Unable to load behavior: No flexbe_behaviors folder set!');
			return;
		}

		chrome.fileSystem.restoreEntry(UI.Settings.getBehaviorsFolderID(), function(entry) {
			Filesystem.checkFolderExists(entry, manifest.rosnode_name, function(exists) {
				if (exists) {
					entry.getDirectory(manifest.rosnode_name, { create: true },
						function(dir) {
							dir.getDirectory("src", { create: true },
								function(src_dir) {
									src_dir.getDirectory(manifest.rosnode_name, { create: true },
										function (folder) {
											Filesystem.getFileContent(folder, manifest.codefile_name, function(content) {
												T.logInfo("Parsing sourcecode...");
												parseCode(content, manifest);
											});
										}, 
										function(error) { T.logError("could not access folder " + manifest.rosnode_name + ", " + error); }
									);
								}, 
								function(error) { T.logError("could not access folder src, " + error); }
							);
						}, 
						function(error) { T.logError("could not access folder " + manifest.rosnode_name + ", " + error); }
					);
				} else {
					T.logError("Behavior package not found in current workspace");
				}
			});
		});
	}

	this.loadBehaviorInterface = function(manifest, callback) {
		if (UI.Settings.getBEFolderID() == '') {
			console.log('Unable to load behavior interface: No flexbe_behaviors folder set!');
			return;
		}
		chrome.fileSystem.restoreEntry(UI.Settings.getBehaviorsFolderID(), function(entry) {
			Filesystem.checkFolderExists(entry, manifest.rosnode_name, function(exists) {
				if (exists) {
					entry.getDirectory(manifest.rosnode_name, { create: true },
						function(dir) {
							dir.getDirectory("src", { create: true },
								function(src_dir) {
									src_dir.getDirectory(manifest.rosnode_name, { create: true },
										function (folder) {
											Filesystem.getFileContent(folder, manifest.codefile_name, function(content) {
												try {
													var parsingResult = CodeParser.parseSMInterface(content);
													callback(parsingResult);
												} catch (err) {
													T.logError("Failed to parse behavior interface of " + manifest.name + ": " + err);
													return;
												}
											});
										}, 
										function(error) { T.logError("could not access folder " + manifest.rosnode_name + ", " + error); }
									);
								}, 
								function(error) { T.logError("could not access folder src, " + error); }
							);
						}, 
						function(error) { T.logError("could not access folder " + manifest.rosnode_name + ", " + error); }
					);
				} else {
					T.logError("Behavior package not found in current workspace");
				}
			});
		});
	}

	this.parseBehaviorSM = function(manifest, callback) {
		if (UI.Settings.getBEFolderID() == '') {
			console.log('Unable to parse behavior statemachine: No flexbe_behaviors folder set!');
			return;
		}
		chrome.fileSystem.restoreEntry(UI.Settings.getBehaviorsFolderID(), function(entry) {
			Filesystem.checkFolderExists(entry, manifest.rosnode_name, function(exists) {
				if (exists) {
					entry.getDirectory(manifest.rosnode_name, { create: true },
						function(dir) {
							dir.getDirectory("src", { create: true },
								function(src_dir) {
									src_dir.getDirectory(manifest.rosnode_name, { create: true },
										function (folder) {
											Filesystem.getFileContent(folder, manifest.codefile_name, function(content) {
												console.log("Preparing sourcecode of behavior " + manifest.name + "...");
												try {
													parsingResult = CodeParser.parseCode(content);
												} catch (err) {
													console.log("Code parsing failed: " + err);
													return;
												}
												callback({
													container_name: "",
													container_sm_var_name: parsingResult.root_sm_name,
													sm_defs: parsingResult.sm_defs,
													sm_states: parsingResult.sm_states
												});
											});
										}, 
										function(error) { T.logError("could not access folder " + manifest.rosnode_name + ", " + error); }
									);
								}, 
								function(error) { T.logError("could not access folder src, " + error); }
							);
						}, 
						function(error) { T.logError("could not access folder " + manifest.rosnode_name + ", " + error); }
					);
				} else {
					T.logError("Behavior package not found in current workspace");
				}
			});
		});
	}

	this.parseBehaviorList = function(callback) {
		var updateCounter = function() {
			todo_counter--;
			if (todo_counter == 0) callback(be_list);
		};

		var todo_counter = 0;
		var be_list = []; // {name, description, filename}

		if (UI.Settings.getBEFolderID() == '') {
			console.log('Unable to parse behavior list: No flexbe_behaviors folder set!');
			return;
		}

		chrome.fileSystem.restoreEntry(UI.Settings.getBEFolderID(), function(be_folder) {
			be_folder.getDirectory("behaviors", { create: true },
				function(dir) {
					Filesystem.getFolderContent(dir, function(entries) {
						todo_counter = entries.length;
						entries.sort().forEach(function(entry, i) {
							if(!entry.isDirectory) {
								chrome.fileSystem.getDisplayPath(entry, function(path) {
									var filename = Filesystem.getFileName(path, true);
									if (!filename.endsWith(".xml") || filename[0] == '#') {
										updateCounter();
										return;
									}
									entry.file(function(file) {
										var reader = new FileReader();
										reader.onload = function(e) {
											var content = e.target.result;
											var manifest = ManifestParser.parseManifest(content);
											manifest.filename = filename;
											be_list.push(manifest);
											updateCounter();
										};
										reader.readAsText(file);
									});
								});
							} else {
								updateCounter();
							}
						});
					});
				},
				function(error) { T.logError("could not access folder behaviors, " + error); }
			);
		});
	}

	this.getSourceCodeFileEntry = function(behavior_names, callback) {
		// behavior_names from Behavior.createNames()

		chrome.fileSystem.restoreEntry(UI.Settings.getBehaviorsFolderID(), function(entry) {
			Filesystem.checkFolderExists(entry, behavior_names.rosnode_name, function(exists) {
				if (exists) {
					entry.getDirectory(behavior_names.rosnode_name, { create: true },
						function(dir) {
							dir.getDirectory("src", { create: true },
								function(src_dir) {
									src_dir.getDirectory(behavior_names.rosnode_name, { create: true },
										function (folder) {
											Filesystem.getFolderContent(folder, function(content) {
												for (var i = 0; i < content.length; i++) {
													if (content[i].name == behavior_names.file_name) {
														console.log("Found it!");
														callback(content[i]);
														return;
													}
												};
												console.log("Didn't find file " + behavior_names.file_name);
												console.log(folder);
											});
										}, 
										function(error) { T.logError("could not access folder " + manifest.rosnode_name + ", " + error); }
									);
								}, 
								function(error) { T.logError("could not access folder src, " + error); }
							);
						}, 
						function(error) { T.logError("could not access folder " + manifest.rosnode_name + ", " + error); }
					);
				} else {
					T.logError("Behavior package not found in current workspace");
				}
			});
		});
	}

}) ();