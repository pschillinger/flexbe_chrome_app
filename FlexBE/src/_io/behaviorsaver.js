BehaviorSaver = new (function() {
	var that = this;

	var names;

	var completed_counter = 0;

	var storeBehaviorCode = function(generated_code) {
		var create_callback = function(folder) {
			var truncated = false;
			Filesystem.createFile(folder, names.file_name, generated_code, function() { 
				if (!truncated) {
					truncated = true;
					this.truncate(this.position); // will trigger another onwriteend
				} else {
					saveSuccessCallback();
				}
			});
		};
		chrome.fileSystem.restoreEntry(UI.Settings.getBehaviorsFolderID(), function(entry) {
			Filesystem.checkFolderExists(entry, names.rosnode_name, function(exists) {
				if (exists) {
					entry.getDirectory(names.rosnode_name, { create: true },
						function(dir) {
							dir.getDirectory("src", { create: true },
								function(src_dir) {
									src_dir.getDirectory(names.rosnode_name, { create: true },
										function(folder) {
											if (RC.Controller.isConnected()) {
												Filesystem.checkFileExists(folder, names.file_name_tmp, function(exists) {
													if (!exists) {
														Filesystem.getFileContent(folder, names.file_name, function(content_onboard) {
															Filesystem.createFile(folder, names.file_name_tmp, content_onboard, function() { 
																create_callback(folder);
															});
														});
													} else {
														create_callback(folder);
													}
												});
											} else {
												create_callback(folder);
											}
										}, 
										function(error) { handleError("could not access folder " + names.rosnode_name + ", " + error); }
									);
								}, 
								function(error) { handleError("could not access folder src, " + error); }
							);
						}, 
						function(error) { handleError("could not access folder " + names.rosnode_name + ", " + error); }
					);
				} else {
					createBehaviorFolder(entry, create_callback);
				}
			});
		});
	}

	var createBehaviorFolder = function(wfe, create_cb) {
		Filesystem.createFolder(wfe, names.rosnode_name, function(dir) {
			Filesystem.createFolder(dir, "src", function(src_dir) {
				Filesystem.createFolder(src_dir, names.rosnode_name, function(code_dir) {
					Filesystem.createFile(code_dir, "__init__.py", "", function() {});
					create_cb(code_dir);
				});
			});

			Filesystem.createFile(dir, "package.xml", PackageGenerator.generatePackageXML(), function() { T.logInfo("Created package.xml"); });
			Filesystem.createFile(dir, "CMakeLists.txt", PackageGenerator.generateCMake(), function() { T.logInfo("Created CMakeLists.txt"); });
			Filesystem.createFile(dir, "setup.py", PackageGenerator.generateSetupPy(), function() { T.logInfo("Created setup.py"); });
		});
	}

	var storeBehaviorManifest = function(generated_manifest) {
		chrome.fileSystem.restoreEntry(UI.Settings.getBEFolderID(), function(entry) {
			entry.getDirectory("behaviors", { create: true },
				function(dir) {
					var truncated = false;
					Filesystem.createFile(dir, names.rosnode_name + ".xml", generated_manifest, function() { 
						if (!truncated) {
							truncated = true;
							this.truncate(this.position); // will trigger another onwriteend
						} else {
							saveSuccessCallback();
						}
					});
				},
				function(error) { handleError("could not access folder behaviors, " + error); }
			);
		});
	}

	var addBehaviorDependency = function() {
		chrome.fileSystem.restoreEntry(UI.Settings.getBEFolderID(), function(entry) {
			Filesystem.getFileContent(entry, "package.xml", function(content) {
				if (content.indexOf("<run_depend>" + names.rosnode_name + "</run_depend>") > 0) {
					T.logInfo("flexbe_behaviors already has dependency");
					saveSuccessCallback();
					return;
				}
				content_split = content.split('</run_depend>');
				content_split[content_split.length - 1] = "\n  <run_depend>" + names.rosnode_name + "</run_depend>" + content_split[content_split.length - 1];
				content = content_split.join('</run_depend>');
				Filesystem.createFile(entry, "package.xml", content, function() {
					T.logInfo("Added dependency to flexbe_behaviors");
					saveSuccessCallback();
				});
			});
		});
	}

	var handleError = function(error_msg) {
		T.logError("Behavior saving failed: " + error_msg);
	}

	var saveSuccessCallback = function() {
		completed_counter -= 1;
		if (completed_counter == 0) {
			T.logInfo("Save successful!");
			UI.Panels.Terminal.hide();
			Behaviorlib.parseLib();
			UI.Tools.notifyRosCommand('save');
		}
		var scedit = document.getElementById("behavior_sourcecode_edit");
		var n = Behavior.createNames();
		scedit.setAttribute("cmd", 'rosed ' + n.rosnode_name + ' ' + n.file_name+ '\n');
		scedit.style.display = "block";
	}


	this.saveStateMachine = function() {
		T.clearLog();
		UI.Panels.Terminal.show();

		var perform_save = function() {
			// generate sourcecode
			var generated_code = "";
			//try {
				generated_code = CodeGenerator.generateBehaviorCode();
				T.logInfo("Code generation completed.");
			//} catch (err) {
			//	T.logError("Code generation failed: " + err);
			//	return;
			//}

			// generate manifest
			var generated_manifest = "";
			//try {
				generated_manifest = ManifestGenerator.generateManifest();
				T.logInfo("Manifest generation completed.");
			//} catch (err) {
			//	T.logError("Manifest generation failed: " + err);
			//	return;
			//}

			// store in file
			completed_counter = 3;
			storeBehaviorCode(generated_code);
			storeBehaviorManifest(generated_manifest);
			addBehaviorDependency();
		}

		names = Behavior.createNames();
		chrome.fileSystem.restoreEntry(UI.Settings.getBehaviorsFolderID(), function(entry) {
			Filesystem.checkFolderExists(entry, names.rosnode_name, function(exists) {
				if (exists) {
					entry.getDirectory(names.rosnode_name, { create: true },
						function(dir) {
							dir.getDirectory("src", { create: true },
								function(src_dir) {
									src_dir.getDirectory(names.rosnode_name, { create: true },
										function(folder) {
											Filesystem.checkFileExists(folder, names.file_name, function(exists) {
												if (exists) {
													Filesystem.getFileContent(folder, names.file_name, function(content) {
														var extract_result = CodeParser.extractManual(content);
														Behavior.setManualCodeImport(extract_result.manual_import);
														Behavior.setManualCodeInit(extract_result.manual_init);
														Behavior.setManualCodeCreate(extract_result.manual_create);
														Behavior.setManualCodeFunc(extract_result.manual_func);
														perform_save();
													});
												} else {
													perform_save();
												}
											});
										}, 
										function(error) { handleError("could not access folder " + names.rosnode_name + ", " + error); }
									);
								}, 
								function(error) { handleError("could not access folder src, " + error); }
							);
						}, 
						function(error) { handleError("could not access folder " + names.rosnode_name + ", " + error); }
					);
				} else {
					perform_save();
				}
			});
		});
		
	}

}) ();