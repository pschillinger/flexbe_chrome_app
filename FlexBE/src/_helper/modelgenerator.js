ModelGenerator = new (function() {
	var that = this;

	this.generateBehaviorAttributes = function(data, manifest) {
		UI.Dashboard.setBehaviorName(manifest.name);
		UI.Dashboard.setBehaviorDescription(manifest.description);
		UI.Dashboard.setBehaviorTags(manifest.tags);
		UI.Dashboard.setBehaviorAuthor(manifest.author);
		UI.Dashboard.setBehaviorDate(manifest.date != undefined? manifest.date : data.creation_date);

		Behavior.setManualCodeImport(data.manual_code.manual_import);
		Behavior.setManualCodeInit(data.manual_code.manual_init);
		Behavior.setManualCodeCreate(data.manual_code.manual_create);
		Behavior.setManualCodeFunc(data.manual_code.manual_func);

		data.behavior_comments.forEach(function(element, i) {
			var note = new Note(element.content);
			note.setPosition({x: element.pos_x, y: element.pos_y});
			note.setContainerPath(element.container);
			note.setImportant(element.important);
			Behavior.addCommentNote(note);
		});

		data.private_variables.forEach(function(element, i) {
			UI.Dashboard.addPrivateVariable(element.key, element.value);
		});
		data.default_userdata.forEach(function(element, i) {
			UI.Dashboard.addDefaultUserdata(element.key, element.value);
		});
		data.private_functions.forEach(function(element, i) {
			UI.Dashboard.addPrivateFunction(element.key, element.value);
		});

		data.smi_outcomes.forEach(function(element, i) {
			UI.Dashboard.addBehaviorOutcome(element);
		});
		data.smi_input.forEach(function(element, i) {
			UI.Dashboard.addBehaviorInputKey(element);
		});
		data.smi_output.forEach(function(element, i) {
			UI.Dashboard.addBehaviorOutputKey(element);
		});

		manifest.params.forEach(function(element) {
			UI.Dashboard.addParameter(element.type, element.name);
			Behavior.updateBehaviorParameter(element.name, element.default, "default");
			Behavior.updateBehaviorParameter(element.name, element.label, "label");
			Behavior.updateBehaviorParameter(element.name, element.hint, "hint");
			Behavior.updateBehaviorParameter(element.name, element.additional, "additional");
		});
	}

	this.buildStateMachine = function(container_name, container_sm_var_name, sm_defs, sm_states, silent) {
		var container_sm_def = sm_defs.findElement(function(element) {
			return element.sm_name == container_sm_var_name;
		});
		var container_sm = new Statemachine(container_name, new StateMachineDefinition(
			container_sm_def.sm_params.outcomes,
			container_sm_def.sm_params.input_keys,
			container_sm_def.sm_params.output_keys
		));
		var oc_objs = container_sm.getSMOutcomes();
		var oc_pos_len = Math.min(oc_objs.length, container_sm_def.oc_positions.length);
		for (var i = 0; i < oc_pos_len; i++) {
			oc_objs[i].setPosition(container_sm_def.oc_positions[i]);
		}

		// add states
		var container_states = sm_states.findElement(function(element) {
			return element.sm_name == container_sm_var_name;
		}).sm_states;
		for (var i=0; i<container_states.length; i++) {
			var s_def = container_states[i];
			var s;
			if (s_def.parameter_values == undefined) {
				// statemachine
				s = that.buildStateMachine(s_def.state_name, s_def.state_class, sm_defs, sm_states, silent);
			} else {
				// state
				var state_def = Statelib.getFromLib(s_def.state_class);
				if (state_def == undefined) {
					state_def = Behaviorlib.getByClass(s_def.state_class);
					s = new BehaviorState(s_def.state_name, state_def);
				} else {
					s = new State(s_def.state_name, state_def);
					s.setParameterValues(helper_getSortedValueList(s.getParameters(), s.getParameterValues(), s_def.parameter_values));
				}
			}
			s.setAutonomy(helper_getSortedValueList(s.getOutcomes(), s.getAutonomy(), s_def.autonomy));
			s.setInputMapping(helper_getSortedValueList(s.getInputKeys(), s.getInputMapping(), s_def.remapping));
			s.setOutputMapping(helper_getSortedValueList(s.getOutputKeys(), s.getOutputMapping(), s_def.remapping));
			s.setPosition({x: s_def.state_pos_x, y: s_def.state_pos_y});

			container_sm.addState(s);
			if(!silent) {
				T.logInfo("[+] " + s.getStateName());
			}

			// In SMACH, initial state is always the first one defined
			if (container_sm_def.initial == undefined && i == 0
				|| container_sm_def.initial == s_def.state_name)
			{
				container_sm.setInitialState(s);
			}
		}
		

		// add transitions (requires to have all states)
		for (var i=0; i<container_states.length; i++) {
			var s_def = container_states[i];
			var state_from = container_sm.getStateByName(s_def.state_name);
			for (var j=0; j<s_def.transitions_from.length; j++) {
				var trans_def = s_def.transitions_from[j];
				var state_to;
				if (container_sm.getOutcomes().contains(trans_def.target)) {
					state_to = container_sm.getSMOutcomeByName(trans_def.target);
				} else {
					state_to = container_sm.getStateByName(trans_def.target);
				}
				var autonomy_idx = state_from.getOutcomes().indexOf(trans_def.outcome);
				var autonomy = state_from.getAutonomy()[autonomy_idx];
				var trans = new Transition(state_from, state_to, trans_def.outcome, autonomy);
				container_sm.addTransition(trans);
			}
		}
		
		return container_sm;
	}

	this.parseInstantiationMsg = function(states) {
		var sm_defs = [];
		var sm_states = [];

		states.forEach(function(s) {
			var path_split = s.state_path.split("/");
			var container_name = path_split[path_split.length - 2];
			var state_name = path_split[path_split.length - 1];
			if (state_name != "") {
				var sm_state_list = sm_states.findElement(function(el) { return el.sm_name == container_name; });
				if (sm_state_list == undefined) {
					sm_state_list = { sm_name: container_name, sm_states: [] };
					sm_states.push(sm_state_list);
				}
				var state_class = 	(s.state_class == ":STATEMACHINE")? 	state_name :
									(s.state_class == ":BEHAVIOR")?			s.behavior_class :
																			s.state_class;
				var parameter_values = (s.state_class == ":STATEMACHINE")? undefined : [];
				for (var i=0; i<s.parameter_names.length; i++) {
					parameter_values.push({key: s.parameter_names[i], value: s.parameter_values[i]});
				}
				var autonomy = [];
				for (var i=0; i<s.autonomy.length; i++) {
					autonomy.push({key: s.outcomes[i], value: s.autonomy[i]});
				}
				var remapping = [];
				for (var i=0; i<s.userdata_keys.length; i++) {
					remapping.push({key: s.userdata_keys[i], value: s.userdata_remapping[i]});
				}
				var transitions_from = [];
				for (var i=0; i<s.transitions.length; i++) {
					transitions_from.push({outcome: s.outcomes[i], target: s.transitions[i]});
				}
				var state = {
					state_name: state_name,
					state_class: state_class,
					state_pos_x: 30,
					state_pos_y: 40,
					parameter_values: parameter_values,
					autonomy: autonomy,
					remapping: remapping,
					transitions_from: transitions_from
				};
				sm_state_list.sm_states.push(state);
			}
			if (s.state_class == ":STATEMACHINE") {
				sm_defs.push({
					sm_name: state_name,
					sm_params: {
						outcomes: s.outcomes,
						input_keys: [],
						output_keys: []
					},
					oc_positions: [],
					initial: s.initial_state_name 
				});
			}
		});

		return {
			sm_defs: sm_defs,
			sm_states: sm_states
		};
	}


	var helper_getSortedValueList = function(key_list, default_value, dict) {
		var result = [];
		for (var i=0; i<dict.length; i++) {
			if (dict[i].key == '*') result.push(dict[i].value);
		}
		for (var i=result.length; i<key_list.length; i++) {
			var kv = dict.findElement(function(element) {
				return element.key == key_list[i];
			});
			result[i] = (kv == undefined)? default_value[i] : kv.value;
		}
		return result;
	}

}) ();