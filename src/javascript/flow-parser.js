/**
 *
 * Description:
 *  Flow Parser library
 **/

;
$.flow = $.flow || {};
$.flow.parser = {};
$.flowApp = $.flow.parser;

//window.Avataaars = window.Avataaars || Avataaars;

// ████ FLOW    ████████████████████████████████████████████████████████████████████████████████████████████████████████
// ███ PARSER ██████████████████████████████████████████████████████████████████████████████████████████████████████████
// ██████    PUPUNZI     ███████████████████████████████████████████████████████████████████████████████████████████████

$.flowApp = {

	source: null,
	boards: [],
	vars  : {},

	selectedBoardId: null,
	selectedNodeId : null,

	load: (flow = null, board = null) => {

		if (typeof flow === "object") {
			$.flowApp.source = flow;
			$.flowApp.selectedBoardId = board._id;
			for (const [key, variable] of Object.entries($.flowApp.source._variables)) {
				$.flowApp.vars[variable._key] = variable._value;
			}
		}
	},

	play: () => {
		PreviewDrawer.Play();

	},

	// ███████ Node █████████████████████████████████████
	node: {
		start: (nodeId = null) => {
			let startNode = null;
			if (nodeId === null) {
				startNode = $.flowApp.node.getByType(Type.start)[0];
				$.flowApp.selectedNodeId = startNode._id;
				$.flowApp.node.next();
			} else {

			}
		},

		get: (nodeId) => {
			let board = $.flowApp.board.getSelected();
			let n = null;
			board._nodes.forEach((node) => {
				if (node._id === nodeId)
					n = node;
			});
			return n;
		},

		getByType: (type) => {
			let nodes = [];
			let board = $.flowApp.board.getSelected();
			board._nodes.forEach((node) => {
				if (node._type === type)
					nodes.push(node);
			});
			return nodes;
		},

		getNext: () => {
		},

		getPrev: () => {
		},

		goTo: (nodeId) => {

		},

		next: (line = 0) => {
			let node = $.flowApp.node.get($.flowApp.selectedNodeId);
			let connection = null;
			if (node != null)
				if (node._elements[line] != null) {
					let lineId = node._elements[line]._id;
					connection = $.flowApp.node.getConnectionByLineId(node, lineId);
				} else {
					connection = node._connections[0];
				}
			$.flowApp.selectedNodeId = connection._to;
			let nextNode = $.flowApp.node.get($.flowApp.selectedNodeId);
			nextNode._previousNodeId = node._id;

			switch (nextNode._type) {
				case Type.condition:
					

					break;
				case Type.random:
					break;
				case Type.jumpToNode:

			}


		},

		prev: () => {
			let node = $.flowApp.node.get($.flowApp.selectedNodeId);
			let lineId = node._elements[line]._id;
			let connection = $.flowApp.node.getConnectionByLineId(node, lineId);
			$.flowApp.selectedNodeId = connection._to;
		},

		getType: (nodeId = null) => {

		},

		evalVariables: (string) => {

		},

		getActor: (nodeId = null) => {

		},

		getConnectionByLineId: (node, nodeElementId) => {
			node._connections.forEach((connection) => {
				if (connection._nodeElementId === nodeElementId)
					return connection;
			});
			return null;
		}
	},

	// ███████ Board █████████████████████████████████████
	board: {
		getSelected: () => {
			let b = null;
			$.flowApp.source._boards.forEach((board) => {
				if (board._id === $.flowApp.selectedBoardId)
					b = board;
			});
			return b;
		}
	},

	// ███████ Actor █████████████████████████████████████
	actor:{
		get:(actorId)=>{
			let a = null;
			$.flowApp.source._actors.forEach((actor)=>{
				if (actor._id === actorId)
					a = actor;
			})
			return a;
		}
	}
};
