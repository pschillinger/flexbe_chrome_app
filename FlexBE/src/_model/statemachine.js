Statemachine = function(sm_name, sm_definition) {
	State.apply(this, [sm_name, sm_definition]);
	var that = this;

	var states = [];
	var transitions = [];
	transitions.push(new Transition(new State("INIT", Statelib.getFromLib(":INIT")), undefined, "", 0));
	var dataflow = [];

	var initial_state = undefined;
	var sm_outcomes = [];

	for (var i = 0; i < sm_definition.getOutcomes().length; i++) {
		var outcome_state = new State(sm_definition.getOutcomes()[i], Statelib.getFromLib(":OUTCOME"));
		outcome_state.setPosition({x: 30 + sm_outcomes.length * 100, y: UI.Statemachine.getR().height / 2});
		sm_outcomes.push(outcome_state);
		outcome_state.setContainer(that);
	}

	// States
	this.getInitialState = function() {
		return initial_state;
	}
	this.setInitialState = function(_initial_state) {
		initial_state = _initial_state;
		var init_trans = that.getInitialTransition();
		if (init_trans != undefined) {
			init_trans.setTo(initial_state);
		} else {
			T.debugWarn("Could not find initial transition.");
		}
	}
	
	this.getStateByName = function(name) {
		for(var i=0; i<states.length; ++i) {
			if (states[i].getStateName() == name)
				return states[i];
		}
		//T.debugWarn("State '" + name + "' not found in " + that.getStateName());
	}
	this.getStateByPath = function(path) {
		var path_elements = path.split("/");

		if (path_elements[0] != that.getStateName()) {
			T.debugWarn("Path '" + path + "' does not match to " + that.getStateName());
			return undefined;
		}

		if (path_elements.length == 1) {
			T.debugWarn("Invalid path: " + path);
			return undefined;
		}

		if (path_elements.length == 2)
			return that.getStateByName(path_elements[1]);

		var child = that.getStateByName(path_elements[1]);
		if (child instanceof BehaviorState) {
			child = child.getBehaviorStatemachine();
		}
		return child.getStateByPath(path.slice(that.getStateName().length + 1));
	}

	this.addState = function(state) {
		states.push(state);
		state.setContainer(that);
	}
	this.removeState = function(state) {
		states.remove(state);
		state.setContainer(undefined);
		if (initial_state != undefined && initial_state.getStateName() == state.getStateName())
			initial_state = undefined;

		// remove connected transitions
		that.removeConnectedTransitions(state);
	}

	// Transitions
	this.getInitialTransition = function() {
		return transitions.findElement(function (element) {
			return element.getOutcome() == "" && element.getFrom().getStateName() == "INIT";
		});
	}

	this.hasTransition = function(transition) {
		return transitions.findElement(function(element) {
			return element.getFrom().getStateName() == transition.getFrom().getStateName()
				&& element.getOutcome() == transition.getOutcome();
		}) != undefined;
	}

	this.addTransition = function(transition) {
		if (that.hasTransition(transition)) {
			T.debugWarn("Trying to add already existing transition from state '" + transition.getFrom().getStateName() + "', outcome '" + transition.getOutcome() + "'");
			return;
		}
		transitions.push(transition);
		transition.getFrom().connect(transition.getOutcome());
	}

	this.removeTransitionObject = function(transition) {
		transitions.remove(transition);
		transition.getFrom().unconnect(transition.getOutcome());
	}

	this.removeTransitionFrom = function(state, outcome) {
		var trans = transitions.findElement(function(element) {
			return element.getFrom() == state && element.getOutcome() == outcome;
		});
		if (trans != undefined) {
			transitions.remove(trans);
		} else {
			T.debugWarn("Transition to remove from state '" + state.getStateName() + "', outcome '" + outcome + "', not found in " + that.getStateName());
		}
	}
	this.removeConnectedTransitions = function(state) {
		var to_remove = transitions.filter(function (element) {
			return element.getFrom() == state || element.getTo() == state;
		});
		to_remove.forEach(function (element, i) {
			if (element.getOutcome() == "" && element.getFrom().getStateName() == "INIT") {
				that.setInitialState(undefined);
			} else {
				that.removeTransitionObject(element);
			}
		});
	}

	// Userdata
	this.getDataflow = function() {
		return dataflow;
	}

	this.updateDataflow = function() {
		dataflow = [];
		states.forEach(function(state) {
			state.getInputMapping().forEach(function(key) {
				addDataEdgeForPredecessors(state, state, key, []);
			});
		});
		sm_outcomes.forEach(function(outcome) {
			that.getOutputKeys().forEach(function(key) {
				addDataEdgeForPredecessors(outcome, outcome, key, []);
			});
		});
	}

	var addDataEdgeForPredecessors = function(state, target, key, checked) {
		transitions.forEach(function(trans) {
			if (trans.getTo() == undefined || trans.getTo().getStateName() != state.getStateName()) return;
			if (trans.getFrom().getStateName() == "INIT") {
				dataflow.push(new Transition(trans.getFrom(), target, key, 0));
			} else if (!checked.contains(trans.getFrom().getStateName())) {
				checked.push(trans.getFrom().getStateName());
				if (trans.getFrom().getOutputMapping().contains(key)) {
					dataflow.push(new Transition(trans.getFrom(), target, key, 0));
				} else {
					addDataEdgeForPredecessors(trans.getFrom(), target, key, checked);
				}
			}
		});
	}


	// Interface
	this.getSMOutcomes = function() {
		return sm_outcomes;
	}

	this.getSMOutcomeByName = function(name) {
		for(var i=0; i<sm_outcomes.length; ++i) {
			if (sm_outcomes[i].getStateName() == name)
				return sm_outcomes[i];
		}
		T.debugWarn("Outcome '" + name + "' not found in " + that.getStateName());
	}

	this.addOutcome = function(outcome) {
		var outcome_state = new State(outcome, Statelib.getFromLib(":OUTCOME"));
		outcome_state.setPosition({x: 30 + sm_outcomes.length * 100, y: UI.Statemachine.getR().height / 2});
		sm_outcomes.push(outcome_state);
		that.getOutcomes().push(outcome);
		that.getOutcomesUnconnected().push(outcome);
		that.getAutonomy().push(-1);
	}

	this.removeOutcome = function(outcome) {
		// remove transition away
		if (that.getContainer() != undefined) {
			that.getContainer().removeTransitionFrom(that, outcome);
		}
		// remove outcome object
		var old_element = sm_outcomes.findElement(function(element) {
			return element.getStateName() == outcome;
		});
		sm_outcomes.remove(old_element);

		// remove transitions to
		that.removeConnectedTransitions(old_element);

		// remove outcome
		that.getOutcomes().remove(outcome);
		if (that.getOutcomesUnconnected().contains(outcome))
			that.getOutcomesUnconnected().remove(outcome);
		else
			that.getOutcomesConnected().remove(outcome);
	}

	this.updateOutcome = function(outcome_old, outcome_new) {
		var oc_element = sm_outcomes.findElement(function(element) {
			return element.getStateName() == outcome_old;
		});
		oc_element.setStateName(outcome_new);
		that.getOutcomes().remove(outcome_old);
		that.getOutcomes().push(outcome_new);
	}

	//
	//	DEPRECATED
	//
		
	this.getStates = function() {
		//T.debugWarn("DEPRECATED: " + "getStates");
		return states;
	}
	this.setStates = function(_states) {
		T.debugWarn("DEPRECATED: " + "setStates");
		states = _states;
	}

	this.getTransitions = function() {
		//T.debugWarn("DEPRECATED: " + "getTransitions");
		return transitions;
	}
	this.setTransitions = function(_transitions) {
		T.debugWarn("DEPRECATED: " + "setTransitions");
		transitions = _transitions;
	}
	this.setSMOutcomes = function(_sm_outcomes) {
		T.debugWarn("DEPRECATED: " + "setSMOutcomes");
		sm_outcomes = _sm_outcomes;
	}

};
Statemachine.prototype = Object.create(State.prototype);