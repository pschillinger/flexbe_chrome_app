Filesystem = new (function() {
	var that = this;

	var toArray = function (list) {
		return Array.prototype.slice.call(list || [], 0);
	}


	this.getFileName = function(path, extension) {
		var name_with_extension = path.slice(path.lastIndexOf("/") + 1);

		if (extension)
			return name_with_extension;

		return name_with_extension.slice(0, name_with_extension.lastIndexOf("."));
	}

	this.createFolder = function(fe, name, callback) {
		fe.getDirectory(name,
			{ create: true },
			callback, 
			function(error) { T.logError("could not create folder " + name + ", " + error);
		});
	}

	this.createFile = function(fe, name, content, callback) {
		fe.getFile(name,
			{ create: true },
			function(file_entry) {
				file_entry.createWriter(function(writer) {
					writer.onerror = function(error) { T.logError("error when writing file " + name + ", " + error); };
					writer.onwriteend = callback;
					writer.write(new Blob([content], {type: 'text/plain'}));
				}, function(e) { T.logError("error when accessing file " + name + ", " + error); });
			},
			function(error) { T.logError("could not create file " + name + ", " + error); }
		);
	}

	this.readFile = function(fe, callback) {
		fe.file(function(file) {
			var reader = new FileReader();
			reader.onload = function(e) {
				callback(e.target.result);
			};
			reader.readAsText(file);
		});
	}

	this.checkFolderExists = function(fe, name, callback) {
		that.getFolderContent(fe, function(entries) {
			var folder = entries.findElement(function(element) {
				return element.isDirectory && element.name == name;
			});
			callback(folder != undefined);
		});
	}

	this.checkFileExists = function(fe, name, callback) {
		that.getFolderContent(fe, function(entries) {
			var folder = entries.findElement(function(element) {
				return element.isFile && element.name == name;
			});
			callback(folder != undefined);
		});
	}

	this.getFileContent = function(fe, name, callback) {
		that.getFolderContent(fe, function(entries) {
			var file_entry = entries.findElement(function(element) {
				return element.isFile && element.name == name;
			});
			if (file_entry == undefined) {
				T.logError("file " + name + " not found in the specified folder");
				return;
			}

			that.readFile(file_entry, callback);
		});
	}

	this.getFolderContent = function(fe, callback) {
		var dirReader = fe.createReader();
		var entries = [];
		
		var readEntries = function() {
			dirReader.readEntries (function(results) {
				if (results.length == 0) {
					callback(entries);
				} else {
					entries = entries.concat(toArray(results));
					readEntries();
				}
			}, function(error) { T.logError("error while reading folder list, " + error); });
		};
		readEntries();
	}



}) ();