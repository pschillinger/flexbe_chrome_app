PackageGenerator = new (function() {
	var that = this;

	this.generateCMake = function() { 
		return "cmake_minimum_required(VERSION 2.8.3)\n" +
			"project(" + Behavior.createNames().rosnode_name + ")\n" +
			"\n" +
			"find_package(catkin REQUIRED)\n" +
			"\n" +
			"## Uncomment this if the package has a setup.py. This macro ensures\n" +
			"## modules and global scripts declared therein get installed\n" +
			"## See http://ros.org/doc/api/catkin/html/user_guide/setup_dot_py.html\n" +
			"catkin_python_setup()\n" +
			"\n" + 
			"# specify catkin-specific information\n" +
			"# INCLUDE_DIRS - The exported include paths (i.e. cflags) for the package\n" +
			"# LIBRARIES - The exported libraries from the project\n" +
			"# CATKIN_DEPENDS - Other catkin projects that this project depends on\n" +
			"# DEPENDS - Non-catkin CMake projects that this project depends on\n" +
			"# CFG_EXTRAS - Additional configuration options \n" +
			"catkin_package(\n" +
			"    INCLUDE_DIRS src\n" +
			"    LIBRARIES ${PROJECT_NAME})" +
			"\n" +
			"install(DIRECTORY src DESTINATION ${CATKIN_PACKAGE_SHARE_DESTINATION})";
	}

	this.generatePackageXML = function() {
		var state_dependencies = '';
		Statelib.getDependencyList().forEach(function(dep) {
			state_dependencies += '  <run_depend>' + dep + '</run_depend>\n';
		});
		return '<package>\n' +
			'  <name>' + Behavior.createNames().rosnode_name + '</name>\n' +
			'  <version>1.0.0</version>\n' +
			'  <description>\n' +
			'     ' + Behavior.getBehaviorDescription() + '\n' +
			'  </description>\n' +
			'  <maintainer email="todo@todo.com">' + Behavior.getAuthor() + '</maintainer>\n' +
			'  <license>BSD</license>\n' +
			'\n' +
			'  <url>http://ros.org/wiki/' + Behavior.createNames().rosnode_name + '</url>\n' +
			'  <author>' + Behavior.getAuthor() + '</author>\n' +
			'\n' +
			'  <buildtool_depend>catkin</buildtool_depend>\n' +
			'\n' +
			'  <run_depend>rospy</run_depend>\n' +
			'  <run_depend>flexbe_core</run_depend>\n' +
			state_dependencies +
			'\n' +
			'</package>';
	}

	this.generateSetupPy = function() {
		return "#!/usr/bin/env python\n" +
			"\n" +
			"from distutils.core import setup\n" +
			"from catkin_pkg.python_setup import generate_distutils_setup\n" +
			"\n" +
			"d = generate_distutils_setup(\n" +
			"    packages = ['" + Behavior.createNames().rosnode_name + "'],\n" +
			"    package_dir = {'': 'src'}\n" +
			")\n" +
			"\n" +
			"setup(**d)";
	}

}) ();