StateMachineDefinition = function(outcomes, input_keys, output_keys) {
	var that = this;

	var autonomy = [];
	for (var i = 0; i < outcomes.length; ++i) {
		autonomy.push(-1);
	};

	this.__proto__ = new StateDefinition(":STATEMACHINE", undefined, "", [], 
		outcomes, input_keys, output_keys, [], autonomy, []);
};