/**
 *
 * Description:
 *  Flow Parser library
 **/

;
$.flow = $.flow || {};
$.flow.parser = {};
$.flowParser = $.flow.parser;

window.previewDrawer = PreviewDrawer;

//window.Avataaars = window.Avataaars || Avataaars;

// ████ FLOW    ████████████████████████████████████████████████████████████████████████████████████████████████████████
// ███ PARSER ██████████████████████████████████████████████████████████████████████████████████████████████████████████
// ██████    PUPUNZI     ███████████████████████████████████████████████████████████████████████████████████████████████

$.flowParser = {

	source: null,
	boards: [],
	vars  : {},

	selectedBoardId: null,
	selectedNodeId : null,

	load: (flow = null, board = null) => {
		if (typeof flow === "object") {
			// $.flowParser.source = JSON.parse(JSON.stringify(flow));
			$.flowParser.source = Object.assign({}, flow);
			$.flowParser.selectedBoardId = board._id;
			for (const [key, variable] of Object.entries($.flowParser.source._variables)) {
				$.flowParser.vars[variable._key] = variable._value;
			}
		}
	},

	// ███████ Board █████████████████████████████████████
	board: {
		getSelected: () => {
			let b = null;
			$.flowParser.source._boards.forEach((board) => {
				if (board._id === $.flowParser.selectedBoardId)
					b = board;
			});
			return b;
		}
	},

	// ███████ Node █████████████████████████████████████
	node: {
		start: (nodeId = null) => {
			let startNode = null;
			if (nodeId === null) {
				startNode = $.flowParser.node.getByType(Type.start)[0];
				$.flowParser.selectedNodeId = startNode._id;
				startNode._selected = true;
				$.flowParser.node.next();
			} else {

			}
		},

		get: (nodeId) => {
			let board = $.flowParser.board.getSelected();
			let n = null;
			board._nodes.forEach((node) => {
				if (node._id === nodeId)
					n = node;
			});
			return n;
		},

		getByType: (type) => {
			let nodes = [];
			let board = $.flowParser.board.getSelected();
			board._nodes.forEach((node) => {
				if (node._type === type)
					nodes.push(node);
			});
			return nodes;
		},

		getNext: (line = 0) => {
		},

		getPrev: () => {
		},

		goTo: (nodeId) => {

		},

		next: (elementId = null) => {
			let node = $.flowParser.node.get($.flowParser.selectedNodeId);
			let element = $.flowParser.nodeElement.get(node._id, elementId);
			let connection = $.flowParser.connection.getAvailable(elementId);

			if (node._type === Type.choices) {
				let text = $("<div class='temp-element'>").css({display: "none"}).html($.flowParser.node.getText(element));
				let variables = text.find("span.variables");
				variables.each(function () {
					let v = $(this).text().trim();
					let result = $.flowParser.parseVariables(v);
					$(this).remove();
				});
			}

			if (!connection || !connection._to)
				return false;

			if (connection._connectionLine) {
				let color = connection._connectionLine.color;
				connection._connectionLine.setOptions({color: "red"});
				setTimeout(() => {
					connection._connectionLine.setOptions({color: color});
				}, 3000)
			}

			$.flowParser.selectedNodeId = connection._to;
			let nextNode = $.flowParser.node.get($.flowParser.selectedNodeId);
			nextNode._previousNodeId = node._id;

			if (element)
				element._selected = true;

			if (
				nextNode._type === Type.note ||
				nextNode._type === Type.sequence ||
				nextNode._type === Type.random ||
				nextNode._type === Type.variables ||
				nextNode._type === Type.condition
			)
				$.flowParser.node.next();
			return connection;
		},

		getAvailableElement: (nodeId = null) => {
			nodeId = nodeId || $.flowParser.selectedNodeId;
			let node = $.flowParser.node.get(nodeId);
			let cycleType = node._cycleType;
			let element = null;
			let availableElements = node._elements.filter((element) => {
				return !element._selected;
			});

			switch (node._type) {

				case Type.text:
					switch (cycleType) {
						case CycleType.list:
							element = availableElements.length ? availableElements[0] : node._elements[node._elements.length - 1];
							element._selected = true;
							break;

						case CycleType.random:
							availableElements = availableElements.length ? availableElements : node._elements;
							let rnd = availableElements.length > 1 ? Math.floor(Math.random() * availableElements.length) : 0;
							element = availableElements[rnd];
							element._selected = true;
							break;

						case CycleType.loop:
							availableElements = availableElements.length ? availableElements : node._elements;
							element = availableElements[0];
							break;
					}
					break;
				case Type.choices:


			}

			return element;
		},
		getText            : (element = null) => {
			let nodeElement = element || $.flowParser.node.getAvailableElement();
			console.debug(nodeElement);
			return window.flowApp.getContent(nodeElement, window.flowApp.flow._locale)._text;
		},

		getParsedText: (element = null) => {
			let nodeId = element ? element._nodeId : $.flowParser.selectedNodeId;
			let node = $.flowParser.node.get(nodeId);
			let t = $.flowParser.node.getText(element);
			let text = $("<div class='temp-element'>").css({display: "none"}).html(t);

			let variables = text.find("span.variables");
			variables.each(function () {
				let v = $(this).text().trim();

				if (node._type === Type.text)
					$.flowParser.parseVariables(v);

				$(this).remove();
			});


			let variablesToPrint = text.find("span.eval-variable");
			variablesToPrint.each(function () {
				let v = $(this).text().trim();
				let val = $.flowParser.vars[v];
				$(this).replaceWith("<span>" + val + "</span>");
			});
			return text.html();
		}
	},


	// ███████ Node Element █████████████████████████████████████
	nodeElement: {
		get: (nodeId, elementId) => {
			let node = $.flowParser.node.get(nodeId);
			return node._elements.filter((el) => {
				return el._id === elementId;
			})[0];
		}
	},

	// ███████ Connections █████████████████████████████████████
	connection: {

		getAvailable: (lineId = null) => {
			let node = $.flowParser.node.get($.flowParser.selectedNodeId);
			let availableConnection = null;

			switch (node._type) {

				case Type.start:
				case Type.text:
				case Type.note:
					availableConnection = node._connections[0];
					break;

				case Type.choices:
					availableConnection = $.flowParser.connection.getByLineId(node, lineId);
					break;

				case Type.condition:
					node._elements.forEach((element) => {
						let content = window.flowApp.getText(element);
						let result = $.flowParser.parseVariables(content);

						console.debug(content, result);

						if (eval(result.toString()) && !availableConnection) {
							availableConnection = $.flowParser.connection.getByLineId(node, element._id);
						}
					});

					if (!availableConnection)
						availableConnection = $.flowParser.connection.getFail(node);
					break;

				case Type.variables:
					node._elements.forEach((element) => {
						let content = window.flowApp.getText(element);
						let result = $.flowParser.parseVariables(content);
						//let newValue = eval(result.toString());
						//console.debug(result);
					});
					availableConnection = node._connections[0];
					break;

				case Type.random:
					let rnd = Math.floor(Math.random() * node._connections.length);
					//console.debug(node._connections.length, rnd)
					availableConnection = node._connections[rnd];
					break;

				case Type.sequence:
					let possibleElement = node._elements.filter(element => !element._selected)[0];
					if (possibleElement) {
						possibleElement._selected = true;
						availableConnection = $.flowParser.connection.getByLineId(node, possibleElement._id);
					} else {
						node._elements.forEach((element) => {
							element._selected = false;
							availableConnection = $.flowParser.connection.getByLineId(node, node._elements[0]._id);
						});
					}
					break;

				case Type.jumpToNode:
					availableConnection = null;
					break;
			}

			return availableConnection;
		},

		getByLineId(node, nodeElementId) {
			let c = null;
			node._connections.forEach((connection) => {
				if (connection._nodeElementId === nodeElementId)
					c = connection;
			});
			return c;
		},

		getFail: (node) => {
			let c = null;
			node._connections.forEach((connection) => {
				if (connection._type === 3)
					c = connection;
			});
			return c;
		}
	},

	// ███████ Actor █████████████████████████████████████
	actor: {
		get: (actorId) => {
			let a = null;
			$.flowParser.source._actors.forEach((actor) => {
				if (actor._id === actorId)
					a = actor;
			});
			return a;
		}
	},

	parseVariables: (content) => {
		//find anything inside {}
		let str = $("<div>").html(content).text();
		let regExp = /[^{\{]+(?=})/gi;
		let variableBlocks = str.match(regExp);
		if (variableBlocks) {
			variableBlocks.forEach((block) => {
				let vs = $.flowParser.findVariables(block);
				if (vs)
					vs.forEach((v) => {
						str = str.replace(v, "$.flowParser.vars." + v.replace("$", ""));
						v = v.replace("$", "");
						if (!$.flowParser.vars[v]) {
							$.flowParser.vars[v] = null;
						}
					});
			});
			eval(str);
			return str;
		}
		return null
	},
	findVariables : (string) => {
		//returns all the words starting with $
		let regExp = /\$([\w]+)/gi;
		return string.match(regExp);
	}
};
