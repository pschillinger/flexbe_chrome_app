Tools = new (function() {
	var that = this;

	var clipboard = undefined;

	var pasteStateInto = function(s, sm, no_add) {
		var new_state = undefined;
		if (s instanceof Statemachine) {
			var state_def = new StateMachineDefinition(s.getOutcomes(), s.getInputKeys(), s.getOutputKeys());
			new_state = new Statemachine(s.getStateName(), state_def);
			new_state.setConcurrent(s.isConcurrent());
			new_state.setPriority(s.isPriority());
			s.getStates().forEach(function (element) {
				pasteStateInto(element, new_state);
			});
			s.getTransitions().forEach(function (element) {
				if (element.getOutcome() == "" && element.getFrom().getStateName() == "INIT") return;
				var new_from = new_state.getStateByName(element.getFrom().getStateName());
				var new_to = new_state.getStateByName(element.getTo().getStateName());
				if (new_to == undefined) {
					new_to = new_state.getSMOutcomeByName(element.getTo().getStateName());
				}
				new_state.addTransition(new Transition(new_from, new_to, element.getOutcome(), element.getAutonomy()));
			});
			if (s.getInitialState() != undefined) {
				new_state.setInitialState(new_state.getStateByName(s.getInitialState().getStateName()));
			}
		} else if (s instanceof BehaviorState) {
			new_state = new BehaviorState(s.getBehaviorName(), Behaviorlib.getByName(s.getBehaviorName()));
			new_state.setStateName(s.getStateName());
		} else if (s instanceof State) {
			var state_def = Statelib.getFromLib(s.getStateClass());
			new_state = new State(s.getStateName(), state_def);
		}
		
		new_state.setStateName(that.getUniqueName(sm, s.getStateName()));
		new_state.setParameterValues(s.getParameterValues().clone());
		new_state.setAutonomy(s.getAutonomy().clone());
		new_state.setInputMapping(s.getInputMapping().clone());
		new_state.setOutputMapping(s.getOutputMapping().clone());
		new_state.setPosition({x: s.getPosition().x, y: s.getPosition().y});
		if (!no_add) sm.addState(new_state);
		return new_state;
	}

	var deleteAll = function(elements) {
		elements.filter(function(s) {
			return (s instanceof State) || (s instanceof Statemachine) || (s instanceof BehaviorState);
		}).forEach(function(s) {
			s.getContainer().removeState(s);
		});
		UI.Statemachine.refreshView();
	}

	var pasteAll = function(elements, container) {
		var state_list = elements.filter(function(s) {
			return (s instanceof State) || (s instanceof Statemachine) || (s instanceof BehaviorState);
		});
		var transition_list = elements.filter(function(t) {
			return t instanceof Transition;
		});


		var new_states = [];
		var renaming = [];
		for (var i = 0; i < state_list.length; i++) {
			var new_state = pasteStateInto(state_list[i], container, true);
			new_states.push(new_state);
			renaming[state_list[i].getStateName()] = new_state.getStateName();
		}

		new_states.forEach(container.addState);

		var new_transitions = [];
		transition_list.forEach(function (transition) {
			var from_state = new_states.findElement(function(s) { return s.getStateName() == renaming[transition.getFrom().getStateName()]; });
			var to_state = new_states.findElement(function(s) { return s.getStateName() == renaming[transition.getTo().getStateName()]; });
			var new_transition = new Transition(from_state, to_state, transition.getOutcome(), transition.getAutonomy());
			new_state.getContainer().addTransition(new_transition);
			new_transitions.push(new_transition);
		});

		UI.Statemachine.refreshView();

		return new_states.concat(new_transitions);
	}


	this.copy = function() {
		clipboard = UI.Statemachine.getSelectedStatesAndTransitions();
	}

	this.cut = function() {
		that.copy();

		if(RC.Controller.isRunning()) {
			var locked_state = clipboard.findElement(function(el) {
				return ((el instanceof State) || (el instanceof Statemachine) || (el instanceof BehaviorState))
					&& RC.Controller.isOnLockedPath(el.getStatePath());
			});
			if (locked_state != undefined) {
				clipboard.remove(locked_state);
				clipboard.filter(function(el) {
					return (el instanceof Transition)
						&& (el.getFrom().getStateName() == locked_state.getStateName()
							|| el.getTo().getStateName() == locked_state.getStateName());
				}).forEach(function(t) { clipboard.remove(t); });
			}
		}

		var container = UI.Statemachine.getDisplayedSM();
		var container_path = container.getStatePath();

		var paste_clipboard = clipboard.clone();
		var history_clipboard = paste_clipboard.map(function (element) {
			return (element instanceof Transition)? element : element.getStatePath();
		});

		var state_list = paste_clipboard.filter(function(s) {
			return (s instanceof State) || (s instanceof Statemachine) || (s instanceof BehaviorState);
		});
		var transition_list = paste_clipboard.filter(function(t) {
			return t instanceof Transition;
		});

		var initial_state = state_list.findElement(function(element) { 
			return container.getInitialState() != undefined
				&& container.getInitialState().getStateName() == element.getStateName();
		});

		var transitions_out = container.getTransitions().filter(function(t) {
			return transition_list.findElement(function(el) { return el.getFrom() == t.getFrom() && el.getOutcome() == t.getOutcome(); }) == undefined
				&& state_list.findElement(function(el) { return el.getStateName() == t.getFrom().getStateName(); }) != undefined;
		});
		var transitions_in = container.getTransitions().filter(function(t) {
			return t.getFrom().getStateName() != "INIT" 
				&& transition_list.findElement(function(el) { return el.getFrom() == t.getFrom() && el.getOutcome() == t.getOutcome(); }) == undefined
				&& state_list.findElement(function(el) { return el.getStateName() == t.getTo().getStateName(); }) != undefined;
		});

		deleteAll(clipboard);

		ActivityTracer.addActivity(ActivityTracer.ACT_COMPLEX_OPERATION,
			"Cut " + paste_clipboard.length + " elements",
			function() {
				var container = (container_path == "")? Behavior.getStatemachine() : Behavior.getStatemachine().getStateByPath(container_path);
				var pasted_elements = pasteAll(paste_clipboard, container);
				var pasted_states = pasted_elements.filter(function(s) {
					return (s instanceof State) || (s instanceof Statemachine) || (s instanceof BehaviorState);
				});
				if (initial_state != undefined) {
					container.setInitialState(pasted_states.findElement(function(s) {
						return s.getStateName() == initial_state.getStateName();
					}));
				}
				transitions_in.forEach(function(t) {
					t.setFrom(container.getStateByName(t.getFrom().getStateName()));
					t.setTo(pasted_states.findElement(function(s) { return s.getStateName() == t.getTo().getStateName(); }));
					container.addTransition(t);
				});
				transitions_out.forEach(function(t) {
					t.setFrom(pasted_states.findElement(function(s) { return s.getStateName() == t.getFrom().getStateName(); }));
					var out_target = container.getStateByName(t.getTo().getStateName());
					if (out_target == undefined) out_target = container.getSMOutcomeByName(t.getTo().getStateName());
					t.setTo(out_target);
					container.addTransition(t);
				});

				UI.Statemachine.refreshView();
			},
			function() {
				var delete_clipboard = history_clipboard.map(function (element) {
					return (element instanceof Transition)? element : Behavior.getStatemachine().getStateByPath(element);
				});
				deleteAll(delete_clipboard);
			}
		);
	}

	this.paste = function() {
		if (clipboard == undefined) return;
		if (clipboard.length == 0) return;

		var container_path = UI.Statemachine.getDisplayedSM().getStatePath();

		var paste_clipboard = pasteAll(clipboard, UI.Statemachine.getDisplayedSM());

		var history_clipboard = paste_clipboard.map(function (element) {
			return (element instanceof Transition)? element : element.getStatePath();
		});

		ActivityTracer.addActivity(ActivityTracer.ACT_COMPLEX_OPERATION,
			"Pasted " + paste_clipboard.length + " elements",
			function() {
				var delete_clipboard = history_clipboard.map(function (element) {
					return (element instanceof Transition)? element : Behavior.getStatemachine().getStateByPath(element);
				});
				deleteAll(delete_clipboard);
			},
			function() {
				var container = (container_path == "")? Behavior.getStatemachine() : Behavior.getStatemachine().getStateByPath(container_path);
				pasteAll(paste_clipboard, container);
			}
		);
	}

	this.createStatemachine = function(name) {
		that.cut();
		if (clipboard.length == 0) {
			T.clearLog();
			T.show();
			T.logWarn("No states selected!");
			return;
		}
		var sm = UI.Menu.addStatemachineClicked();
		UI.Panels.StateProperties.displayStateProperties(sm);
		document.getElementById("input_prop_sm_name").value = name;
		UI.Panels.StateProperties.statePropNameChanged();
		UI.Panels.StateProperties.openStatemachine();
		that.paste();
		UI.Statemachine.setDisplayedSM(sm.getContainer());
	}

	this.autoconnect = function() {
		var getClosestState = function(pos, state) {
			var dist = undefined;
			var closest = undefined;
			sm.getStates().forEach(function(other) {
				var other_dist = Math.sqrt(Math.pow(other.getPosition().x - pos.x, 2) + Math.pow(other.getPosition().y - pos.y, 2));
				if ((state == undefined || state.getStateName() != other.getStateName())
					&& (dist == undefined || dist > other_dist)) {
					dist = other_dist;
					closest = other;
				}
			});
			return closest;
		};
		var sm = UI.Statemachine.getDisplayedSM();
		sm.getStates().forEach(function(state) {
			var unconnected = state.getOutcomesUnconnected().clone();
			unconnected.forEach(function(outcome, i) {
				if (sm.getOutcomes().contains(outcome)) {
					sm.addTransition(new Transition(state, sm.getSMOutcomeByName(outcome), outcome, 0));
					if (sm.isConcurrent()) sm.tryDuplicateOutcome(outcome);
				} else if (i == 0) {
					var closest = getClosestState(state.getPosition(), state);
					if (closest != undefined) {
						sm.addTransition(new Transition(state, closest, outcome, 0));
					}
				}
			});
		});
		if (sm.getInitialState() == undefined) {
			sm.setInitialState(getClosestState({x: 0, y: 0}));
		}
		UI.Statemachine.refreshView();
	}

	this.getUniqueName = function(sm, state_name) {
		if (sm.getStateByName(state_name) != undefined) {
			var name_pattern = new RegExp(/^/i.source + state_name + /(?:_(\d+))?$/i.source);
			var current_state_list = sm.getStates();
			current_state_list = current_state_list.map(function(element) {
				var result = element.getStateName().match(name_pattern);
				if (result == null) return 0;
				if (result[1] == undefined) return 1;
				return parseInt(result[1]);
			});
			var new_index = current_state_list.reduce(function(prev, cur) {
				return prev > cur? prev : cur;
			}, 0) + 1;
			return state_name + ((new_index>1)? "_" + new_index : "");
		}
		return state_name;
	}

	this.getClipboard = function() {
		return clipboard;
	}

}) ();