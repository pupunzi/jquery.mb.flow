/**
 *
 * Description:
 *
 **/
import {Flow} from "./Flow.js";
import {UI} from "./UI.js";
import {Events, EventType} from "./Events.js";
import {Drawer} from "./Drawer.js";
import {Type} from "./Node.js";
import {NodeElement} from "./NodeElement.js";
import {Content} from "./Content.js";

export class FlowApp {

	constructor() {

		this.basePath = null;
		this._endPoint = null;

		this._date = new Date().getTime();
		this._ui = new UI();
		this._events = new Events();
		this._flowsIds = $.mbStorage.get("flows") || [];
		this._flow = null;
		this._drawer = new Drawer(this);

		this._grid = 30;

		this.initEvents();
	}

	get flow() {
		return this._flow;
	}

	set flow(value) {
		this._flow = value;
	}

	get drawer() {
		return this._drawer;
	}

	get events() {
		return this._events;
	}

	get ui() {
		return this._ui;
	}

	get flows() {
		return this._flowsIds;
	}

	initEvents() {

		//Add Flow
		Events.on(EventType.addFlow, (e) => {
			this.drawer.updateFlowName();
			this.drawer.drawBoardList();
		});

		//Remove Flow
		Events.on(EventType.deleteFlow, (e) => {
			let flow = this.flows[0];
			if (flow != null) {
				this.load(flow.id);
				$.mbStorage.set("selectedFlow", flow.id);
			} else
				this.addFlow();
		});

		//Update Flow name
		Events.on(EventType.updateFlowName, (e) => {
			this.drawer.drawBoardList();
		});

		//Load Flow
		Events.on(EventType.loadFlow, (e) => {
			this.flow.selectedBoardGroup = "all";
			this.drawer.updateFlowName();

			for (const variable in this.flow._variables) {
				$.flow.vars[variable] = this.flow._variables[variable]?this.flow._variables[variable]._value : null;
			}


			this.drawer.drawBoardList();
		});

		//Add Group
		Events.on(EventType.addGroup, (e) => {
			this.flow.selectedBoardGroup = e.detail.groupName;
			this.drawer.drawBoardList();
		});

		//Edit Group Name
		Events.on(EventType.updateGroupName, (e) => {
			this.flow.selectedBoardGroup = e.detail.newName;
			this.drawer.drawBoardList();
		});

		//Add Board
		Events.on(EventType.addBoard, (e) => {
			this.drawer.drawBoardList();
		});

		//Delete Board
		Events.on(EventType.deleteBoard, (e) => {
			if (this.flow.boards.length > 0) {
				let board = this.flow.boards[0];
				this.flow.selectBoard(board._id);
			}
			this.drawer.drawBoardList();
		});

		//Duplicated Board
		Events.on(EventType.duplicatedBoard, (e) => {
			this.drawer.drawBoardList();
		});

		//Select Board
		Events.on(EventType.selectBoard, (e) => {
			this.drawer.drawBoardList();
		});

		//Update Board
		Events.on(EventType.updateBoard, (e) => {
			this.save(this.flow.id);
		});

		//Add Node
		Events.on(EventType.addNode, (e) => {
			this.drawer.drawBoard();
		});

		// Update Node
		Events.on(EventType.updateNode, (e) => {
			this.save(this.flow.id);
		});

		//Delete Node
		Events.on(EventType.deleteNode, (e) => {
			this.drawer.drawBoard();
		});

		//Select Node
		Events.on(EventType.selectNode, (e) => {
			let node = e.detail;

			//this.drawer.focusOnSelectedNode();
			//console.debug("selectNode", e.detail);
		});

		//Add NodeElement
		Events.on(EventType.addNodeElement, (e) => {
			let node = e.detail;
			this.addNodeElement(node);
			this.drawer.drawBoard();
		});

		//Delete NodeElement
		Events.on(EventType.deletetNodeElement, (e) => {
			let nodeId = e.detail.nodeId;
			let nodeElementId = e.detail.nodeElementId;
			let board = $.flow.selectedBoard();
			let node = board.getNodeById(nodeId);
			this.deleteNodeElement(node, nodeElementId);
			this.drawer.drawBoard();
		});

		//Add Connection
		Events.on(EventType.addConnection, (e) => {
			let connection = e.detail;
			let board = this.flow.getBoardById(this.flow._selectedBoardId);
			let $board = $(this.ui.placeholders.board);
			let node = board.getNodeById(connection._from);

			board._connections.push(connection);
			node._connections.push(connection);

			if (!connection._to || connection._to === connection._from) {

				node._connections.delete(connection);
				board._connections.delete(connection);

				if (node._type === Type.random) {
					let firstConnection = node._connections[node._connections.length - 1];
					if (firstConnection._connectionLine != null)
						firstConnection._connectionLine.remove();
					node._connections.delete(firstConnection);
					board._connections.delete(firstConnection);
				}

				$board.find("#node_" + connection._from).attr("data-connections-count", node._connections.length);
				Events.register(EventType.updateBoard, board);
				// return;
			}

			node._connections.forEach((c) => {

				if (c === connection)
					return;

				if (c._from === connection._from && c._to === connection._to) {
					if (c._connectionLine != null)
						c._connectionLine.remove();

					node._connections.delete(c);
					board._connections.delete(c);

					return;
				}

				if (c._from === connection._from
					&& c._nodeElementId === connection._nodeElementId
					&& node._type !== Type.random) {

					if (c._connectionLine != null)
						c._connectionLine.remove();

					node._connections.delete(c);
					board._connections.delete(c);
				}
			});

			if (node._connections.length === 0) {
				$board.find("#node_" + connection._from).attr("data-connections-count", 0);
			} else {
				$board.find("#node_" + connection._from).attr("data-connections-count", node._connections.length);
				flowApp.drawer.drawConnection(connection);
			}

			Events.register(EventType.updateBoard, board);
		});

		//Delete Connection
		Events.on(EventType.deleteConnection, (e) => {
			console.debug("deleteConnection", e.detail);
		});
	}

	addNodeElement(node) {
		let nodeElement = new NodeElement(node._type, node._id);
		let content = new Content(nodeElement._id, "", this.flow._locale);
		nodeElement._localizedContents.push(content);
		node._elements.push(nodeElement);
	}

	deleteNodeElement(node, nodeElementId) {
		let el = this.getNodeElementById(node, nodeElementId);
		if (el != null)
			node._elements.delete(el);
	}

	getNodeElementById(node, id) {
		let ne = null;
		node._elements.forEach((element) => {
			if (element._id === id)
				ne = element;
		});
		return ne;
	}

	getContent(nodeElement, localeCode = this.flow._locale) {
		let content = null;
		nodeElement._localizedContents.forEach((localizedContent) => {
			if (localizedContent._localeCode === localeCode)
				content = localizedContent;
		});
		if (content === null) {
			content = new Content(nodeElement._id, "", localeCode);
			nodeElement._localizedContents.push(content);
		}
		return content;
	}

	getContentText(nodeElement, localeCode = this.flow._locale) {
		return this.getContent(nodeElement, localeCode)._text;
	}

	updateContent(nodeElement, text, localeCode = this.flow._locale) {
		let localizedContent = this.getContent(nodeElement, localeCode);
		localizedContent._text = text;
	}

	addFlow(name = "New Flow") {
		this.flow = new Flow(name);
		this._flowsIds.unshift({id: this.flow.id, name: this.flow.name});
		$.mbStorage.set("selectedFlow", this.flow.id);
		let board = this.flow.addBoard("My Board");
		this.flow.selectBoard(board._id);
		Events.register(EventType.addFlow, this.flow);
		Events.register(EventType.updateBoard, board);
		return this.flow;
	}

	deleteFlow(flowId) {
		this._flowsIds.forEach((f) => {
			if (f.id === flowId) {
				this._flowsIds.delete(f);
				$.mbStorage.remove("flow_" + flowId);
			}
		});
		this.save(null);
		Events.register(EventType.deleteFlow, this.flow);
	}

	save(id) {
		$.mbStorage.set("flows", this._flowsIds);
		if (id != null)
			$.mbStorage.set("flow_" + id, this.flow);

		console.debug("FLOW", this.flow);
		Events.register(EventType.saveFlow, this.flow);
	}

	load(id) {
		let flow = $.mbStorage.get("flow_" + id);
		this.flow = new Flow(flow.name);
		for (const property in flow) {
			this.flow[property] = flow[property];
		}
		Events.register(EventType.loadFlow, this.flow);
		return this.flow;
	}

	exportToFile() {
		let flowString = JSON.stringify(this.flow);
		let flow = new Blob([flowString], {type: "text/json;charset=utf-8"});
		FlowApp.saveAs(flow, this.flow._name + ".json")
	}

	static saveAs(blob, filename) {
		// Microsoft Edge/IE 10+
		if (navigator.msSaveOrOpenBlob) {
			navigator.msSaveOrOpenBlob(blob, filename);
			return true;
		}

		if (typeof URL !== 'undefined' && 'download' in HTMLAnchorElement.prototype) {
			let link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = filename;
			link.addEventListener('click', function () {
				requestAnimationFrame(function () {
					URL.revokeObjectURL(link.href);
					link.remove();
				})
			}, false);

			link.dispatchEvent(new MouseEvent('click'));
			return true;
		}
		return false;
	};

	static ImportFromFile(){
		let fileUploader = document.createElement('input');
		fileUploader.type = "file";
		fileUploader.accept = ".flow";
		fileUploader.addEventListener('click', function () {
			requestAnimationFrame(function () {
				URL.revokeObjectURL(fileUploader.href);
				fileUploader.remove();
			})
		}, false);
		fileUploader.dispatchEvent(new MouseEvent('click'));
		return true;
	}
}
