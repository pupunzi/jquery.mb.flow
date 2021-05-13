/**
 * Description:
 **/

import {FlowApp} from "../Classes/FlowApp.js";
import {Util} from "../Classes/Util.js";
import {UI} from "../Classes/UI.js";
import {ContextualMenu, Menu} from "../Classes/Menu.js";
import {KeyboardListener} from "../Classes/KeyboardListener.js";
import {Events, EventType} from "../Classes/Events.js";
import {Type} from "../Classes/Node.js";
import {Connection} from "../Classes/Connection.js";

(function ($, d) {
	$(() => {
		//Init Flow
		$.flow.init();
	});

	/*
	 * Flow methods
	 * ---------------------------------------------------- */
	$.flow = {
		metaKeys        : [],
		draggable       : [],
		areaSize        : {},
		selectedNodes   : [],
		latMousePosition: {},

		contextualMenu: {
			//Menu
			boardListElement: (target) => {

				let items = [
					{
						name: 'Rename',
						fn  : function (target) {
							let boardId = $(target).parent().data("board-id");
							$.flow.editBoardName(boardId);
						}
					},
					{
						name: 'Duplicate',
						fn  : function (target) {
							let boardId = $(target).parent().data("board-id");
							$.flow.duplicateBoard(boardId);
						}
					},
					{
						name: 'Export',
						fn  : function (target) {
							let boardId = $(target).parent().data("board-id");
							let boardName = $(target).parent().find(".name").text();
							console.debug("Export board ", boardId);
						}
					}
				];

				let boardId = $(target).parent().data("board-id");
				let board = flowApp.flow.getBoardById(boardId);
				let groups = flowApp.flow.getBoardsGroupsList();

				if (groups.length > 1) {
					items.push({});
					items.push({
						name     : "Move to: ",
						className: "listTitle"
					});
				}
				groups.forEach((groupName) => {
					if (groupName === board._group)
						return;

					let group = {
						name     : groupName,
						className: "listElement",
						fn       : function (target) {
							$.flow.moveBoardToGroup(boardId, groupName);
							let selectedGroup = flowApp.flow.selectedBoardGroup;
							flowApp.drawer.drawBoardList();
							$.flow.showBoardsByGroup(selectedGroup);
						}
					};
					items.push(group);
				});
				items.push({});
				items.push({
					name     : 'Delete',
					className: "alert",
					fn       : function (target) {
						let boardId = $(target).parent().data("board-id");
						$.flow.deleteBoard(boardId, target);
					}
				},);

				return items;
			},
			flows           : [
				{
					name: 'Rename',
					fn  : function (target) {
						let flowId = $(target).parent().data("flow-id");
						console.debug(target, flowId);
						$.flow.editFlowName(flowId);
					}
				},
				{
					name: 'Duplicate', fn: function (target) {
						console.log('Duplicate', $(target).parent().data("flow-id"));
					}
				},
				{},
				{
					name: 'Options', //<i class="icon icon-cog"></i>
					fn  : function (target) {
						let flowId = $(target).parent().data("flow-id");
						let flowName = $(target).parent().find(".name").text();
						console.debug("Export " + flowId + "  -  " + flowName);
					}
				},
				{
					name: 'Export',
					fn  : function (target) {
						let flowId = $(target).parent().data("flow-id");
						let flowName = $(target).parent().find(".name").text();
						console.debug("Export " + flowId + "  -  " + flowName);
					}
				},
				{},
				{
					name     : 'New',
					className: "highlight",
					fn       : function (target) {
						$.flow.addFlow();
					}
				},
				{},
				{
					name     : 'Delete',
					className: "alert",
					fn       : function (target) {
						let flowId = $(target).parent().data("flow-id");
						$.flow.deleteFlow(flowId, target);
					}
				},
			],
			boardsGroups    : () => {
				let items = [];

				let showAll = {
					name: "Show All",
					fn  : function (target) {
						flowApp.flow.selectedBoardGroup = "all";
						$.flow.showBoardsByGroup("all");
					}
				};
				items.push(showAll);

				items.push({});

				let groups = flowApp.flow.getBoardsGroupsList();
				groups.forEach((groupName) => {
					let group = {
						name     : groupName,
						className: "listElement",
						fn       : function (target) {
							//console.debug("filter by group:" + groupName);
							flowApp.flow.selectedBoardGroup = groupName;
							$.flow.showBoardsByGroup(groupName);
						}
					};
					items.push(group);
				});

				items.push({});

				let renameGroup = {
					name: "Rename Group",
					fn  : function (target) {
						let editEl = $(target).parent().find(".name");

						editEl.attr({contentEditable: true});
						editEl.focus();
						let oldName = editEl.text();
						Util.selectElementContents(editEl.get(0));

						editEl.one("blur", () => {
							flowApp.flow.updateGroupName(oldName, editEl.text());
							editEl.attr({contentEditable: false});
						});
					}
				};
				if (flowApp.flow.selectedBoardGroup !== "all")
					items.push(renameGroup);

				let newGroup = {
					name     : "New Group",
					className: "highlight",
					fn       : function (target) {
						UI.dialogue("Add a new Group for <br><b>" + flowApp.flow._name + "</b>", null, "groupName", "Group name", null, "Add", "Cancel", (name) => {
							flowApp.flow.addGroup(name);
							$.flow.showBoardsByGroup(name);
						});
					}
				};
				items.push(newGroup);

				return items;
			},
			nodeMenu        : (target) => {

				let board = $.flow.selectedBoard();
				let nodeId = $(target).parents(".node").data("node-id");
				let node = board.getNodeById(nodeId);

				let items = [
					{
						name: 'Add Line',
						fn  : function (target) {
							let nodeId = $(target).parents(".node").data("node-id");
							let node = board.getNodeById(nodeId);
							Events.register(EventType.addNodeElement, node);
						}
					},
					{},
					{
						name: 'Clone',
						fn  : function (target) {
							let nodeId = $(target).parents(".node").data("node-id");
							let node = board.getNodeById(nodeId);
							console.debug("Clone")
						}
					},
					{
						name     : 'Delete',
						className: "alert",
						fn       : function (target, e) {
							let nodeId = $(target).parents(".node").data("node-id");
							if (nodeId != null) {
								let board = $.flow.selectedBoard();
								board.deleteNodeById(nodeId);
							}
						}
					},
				];

				if (node._connections.length) {
					items.push({});
					items.push({
						name     : 'Remove Connections',
						className: "listTitle"
					});
				}
				if (nodeId != null) {
					let connIdx = 0;
					node._connections.forEach((connection) => {
						items.push({
							name     : 'Connection ' + ++connIdx,
							className: "alert",
							fn       : function (target, e) {
								//console.debug(connection);
								connection._connectionLine.remove();
								node._connections.delete(connection);
								board._connections.delete(connection);
								Events.register(EventType.updateBoard, board);
							},
							hoverFn  : function (target, e) {
								connection._connectionLine.setOptions({color: "red"})
							},
							outFn    : function (target, e) {
								let type = connection._type || 0;
								let color = flowApp.drawer.getConnectionColorByConnectionType(type);
								connection._connectionLine.setOptions({color: color})
							}
						})
					})
				}

				return items;
			},
			cycleMenu       : [
				{
					name: 'List',
					icon: 'icon-list-ol',
					fn  : function (target) {
						let board = $.flow.selectedBoard();
						let nodeId = $(target).parents(".node").data("node-id");
						let node = board.getNodeById(nodeId);
						node._cycleType = "List";
						$(target).attr("class", 'icon icon-list-ol');
						Events.register(EventType.updateBoard, board);
					}
				},
				{
					name: 'Repeat',
					icon: 'icon-repeat',
					fn  : function (target) {
						let board = $.flow.selectedBoard();
						let nodeId = $(target).parents(".node").data("node-id");
						let node = board.getNodeById(nodeId);
						node._cycleType = "Repeat";
						$(target).attr("class", 'icon icon-repeat');
						Events.register(EventType.updateBoard, board);
					}
				},
				{
					name: 'Random',
					icon: 'icon-random',
					fn  : function (target) {
						let board = $.flow.selectedBoard();
						let nodeId = $(target).parents(".node").data("node-id");
						let node = board.getNodeById(nodeId);
						node._cycleType = "Random";
						$(target).attr("class", 'icon icon-random');
						Events.register(EventType.updateBoard, board);
					}
				},
			],
			variables       : () => {
				let items = [];
				let variables = flowApp.flow.getBoardsGroupsList();

				variables.forEach((variable) => {
					let v = {
						name     : variable._key,
						className: "listElement",
						fn       : function (target) {

						}
					};
					items.push(v);
				});

				items.push({});

				let editVariables = {
					name: "Edit Variables",
					fn  : function (target) {
						let editEl = $(target).parent().find(".name");
					}
				};
				items.push(editVariables);

				return items;
			},

			//Contextual Menu
			board      : [
				{
					name: 'New Text Node',
					fn  : function (target, e) {
						let board = $.flow.selectedBoard();
						board.addNode(Type.text, {_x: e.clientX, _y: e.clientY});
					}
				},
				{
					name: 'New Choice Node',
					fn  : function (target, e) {
						let board = $.flow.selectedBoard();
						board.addNode(Type.choices, {_x: e.clientX, _y: e.clientY});
					}
				},
				{
					name: 'New Random Node',
					fn  : function (target, e) {
						let board = $.flow.selectedBoard();
						board.addNode(Type.random, {_x: e.clientX, _y: e.clientY});
					}
				},
				{
					name: 'New Note node',
					fn  : function (target, e) {
						let board = $.flow.selectedBoard();
						board.addNode(Type.note, {_x: e.clientX, _y: e.clientY});
					}
				},
				{
					name: 'New Conditional Node',
					fn  : function (target, e) {
						let board = $.flow.selectedBoard();
						board.addNode(Type.condition, {_x: e.clientX, _y: e.clientY});
					}
				},
			],
			node       : (target) => {
				let items = [
					{
						name: 'Clone',
						fn  : function (target) {
							console.debug("Clone")
						}
					},
					{
						name     : 'Delete',
						className: "alert",
						fn       : function (target, e) {
							let nodeId = $(target).parents(".node").data("node-id");
							if (nodeId != null) {
								let board = $.flow.selectedBoard();
								board.deleteNodeById(nodeId);
							}
						}
					},
				];
				let nodeId = $(target).parents(".node").data("node-id");
				let board = $.flow.selectedBoard();
				let node = board.getNodeById(nodeId);

				if (node._connections.length) {
					items.push({});
					items.push({
						name     : 'Remove Connections',
						className: "listTitle"
					});
				}

				if (nodeId != null) {
					let connIdx = 0;
					node._connections.forEach((connection) => {
						items.push({
							name     : 'Connection ' + ++connIdx,
							className: "alert",
							fn       : function (target, e) {
								console.debug(connection);
								connection._connectionLine.remove();
								node._connections.delete(connection);
								board._connections.delete(connection);
								Events.register(EventType.updateBoard, board);
							},
							hoverFn  : function (target, e) {
								connection._connectionLine.setOptions({color: "red"})
							},
							outFn    : function (target, e) {
								connection._connectionLine.setOptions({color: "gray"})
							}
						})
					})
				}


				return items;
			},
			nodeElement: [
				{
					name: 'Delete Line',
					fn  : function (target, e) {
						let t = $(target).is(".node-content-line") ? $(target) : $(target).parents(".node-content-line")
						let nodeId = t.data("node-id");
						let nodeElementId = t.data("node-element-id");
						console.debug(t, nodeId, nodeElementId);
						Events.register(EventType.deletetNodeElement, {nodeId: nodeId, nodeElementId: nodeElementId});
					}
				},
			]
		},

		flowApp      : () => {
			return flowApp;
		},
		selectedBoard: () => {
			return flowApp.flow.getBoardById(flowApp.flow._selectedBoardId)
		},

		init: () => {
			//Init keys listener
			window.KeyListener = new KeyboardListener();
			//Init Flow App
			window.flowApp = new FlowApp();

			// get last flow opened on previous session
			let lastFlow = $.mbStorage.get("lastFlow");
			if (lastFlow != null)
				flowApp.load(lastFlow);
			else
				$.flow.addFlow();
			//Init Menu
			window.flows_menu = new Menu(".flows-menu", $.flow.contextualMenu.flows, true);
			window.board_list_element_menu = new Menu(".board-list-element-menu", $.flow.contextualMenu.boardListElement, true);
			window.boards_groups = new Menu(".boards-group-menu", $.flow.contextualMenu.boardsGroups, true);
			window.node_menu = new Menu("[data-menu=\"node\"]", $.flow.contextualMenu.nodeMenu, true);
			window.cycle_menu = new Menu("[data-menu=\"cycle\"]", $.flow.contextualMenu.cycleMenu, true);

			//Init Contextual menu
			window.board_contextual_menu = new ContextualMenu(flowApp.ui.placeholders.drawingArea, $.flow.contextualMenu.board, true);
			window.node_contextual_menu = new ContextualMenu(".node", $.flow.contextualMenu.node, false);
			window.variables_contextual_menu = new ContextualMenu(".variables", $.flow.contextualMenu.variables, true);
			window.nodeElement_contextual_menu = new ContextualMenu(".node-content-line", $.flow.contextualMenu.nodeElement, true);

			$(document).on("keypress", "[contenteditable]", (e) => {

				switch (e.key) {
					case "Enter":
						if ($(e.target).parents(".node").length > 0) {
							$.flow.updateConnections();
							if ($.flow.metaKeys.indexOf("Shift") < 0) {
								e.preventDefault();
								$(e.target).blur();
							}

							return;
						}

						e.preventDefault();
						$(e.target).blur();
						break;
					case "Backspace":
						if ($(e.target).parents(".node").length > 0) {
							$.flow.updateConnections();
							return;
						}
						break;
				}
			});
			$(document).on("keydown", (e) => {

				if ($.flow.metaKeys.indexOf("Meta") >= 0) {
					$(".node").draggable("disable");
					//  boardArea.draggable("enable");
					let board = $.flow.selectedBoard();
					e.stopPropagation();
					switch (e.key) {
						case "0":
							e.preventDefault();
							break;
						case "-":
							e.preventDefault();
							break;
						case "+":
							e.preventDefault();
							break;
						case "Backspace":
							e.preventDefault();
							$.flow.selectedNodes.forEach((id) => {
								board.deleteNodeById(id);
							});
							$.flow.selectedNodes = [];
							break;
					}
				}

				if ($.flow.metaKeys.indexOf("Control") >= 0) {
					let board = $.flow.selectedBoard();
					e.stopPropagation();
					switch (e.key) {
						case "n":
							e.preventDefault();
							board.addNode(Type.text, {_x: $.flow.latMousePosition.x, _y: $.flow.latMousePosition.y});
							break;
					}
				}
			});
			$(document).on("keyup", () => {
				$(".node").draggable("enable");
				// boardArea.draggable("disable");
			});

			let boardArea = $(flowApp.ui.placeholders.board);
			boardArea[0].style.zoom = 1;
			let pos = {};
			$(document).on("mousedown.drag", (e) => {

				if ($(e.target).parents(".node").length)
					return;

				if ($.flow.metaKeys.indexOf("Meta") >= 0) {
					$("body").css("cursor", "grab");
					pos = {
						left: boardArea.position().left,
						top : boardArea.position().top,
						x   : e.clientX,
						y   : e.clientY,
					};
				} else if ($.flow.metaKeys.indexOf("Shift") >= 0) {
					//make selection
					flowApp.drawer.drawSelection(e)
				}

				$(document).on("mousemove.drag", (e) => {

					$.flow.latMousePosition = {x: e.clientX, y: e.clientY};

					if ($(e.target).parents(".node").length)
						return;

					if ($.flow.metaKeys.indexOf("Meta") >= 0) {
						$("body").css("cursor", "grabbing");
						const dx = e.clientX - pos.x;
						const dy = e.clientY - pos.y;
						boardArea.css({left: pos.left + dx, top: pos.top + dy});
						$.flow.updateConnections();
					} else if ($.flow.metaKeys.indexOf("Shift") >= 0) {
						flowApp.drawer.drawSelection(e)
					}
				}).one("mouseup.drag", (e) => {
					flowApp.drawer.drawSelection(e);
					if ($.flow.metaKeys.indexOf("Meta") >= 0) {
						let left = parseFloat(boardArea.css("left"));
						let top = parseFloat(boardArea.css("top"));
						boardArea.css({left: left + (left % 30), top: top + (top % 30)});
						$.flow.updateConnections();

						$("body").css("cursor", "default");
						let board = $.flow.getSelectedBoard();

						board._x = parseFloat(boardArea.css("left"));
						board._y = parseFloat(boardArea.css("top"));
						Events.register(EventType.updateBoard, board);
					}
					$(document).off("mousemove.drag");
				});
			});
		},

		/**
		 * Flows Manager
		 * */
		addFlow     : () => {
			let title = "Add a new Flow";
			let text = null;
			let action = function (name) {
				flowApp.addFlow(name);
				$.mbStorage.set("lastFlow", flowApp.flow.id);
				let board = $.flow.getSelectedBoard();
				Events.register(EventType.updateBoard, board);
			};
			UI.dialogue(title, text, "flowName", "Flow Name", null, "Add", "Cancel", action);
		},
		openFlow    : () => {
		},
		editFlowName: () => {
			let editEl = $(flowApp.ui.placeholders.flowName).find("h1");
			editEl.attr({contentEditable: true});
			editEl.focus();
			Util.selectElementContents(editEl.get(0));
			editEl.one("blur", () => {
				flowApp.flow.updateName(editEl.text());
				editEl.attr({contentEditable: false});
			});
		},
		deleteFlow  : (flowId, target) => {
			let title = "Delete Flow";
			let text = "Are you sure you want to delete<br><b>" + $(target).parent().find(".name").text() + "</b>?";
			let action = () => {
				flowApp.deleteFlow(flowId);
				let board = $.flow.getSelectedBoard();
				Events.register(EventType.updateBoard, board);
			};
			UI.dialogue(title, text, null, null, null, "Yes", "Cancel", action, "alert");
		},

		/**
		 * Boards Manager
		 * */
		getSelectedBoard : () => {
			return flowApp.flow.getBoardById(flowApp.flow.selectedBoardId);
		},
		addBoard         : () => {
			let title = "Add a new Board";
			let text = null;
			let action = function (name) {
				flowApp.flow.addBoard(name, flowApp.flow.selectedBoardGroup);
			};
			UI.dialogue(title, text, "boardName", "Board Name", null, "Add", "Cancel", action);
		},
		duplicateBoard   : (boardId) => {
			flowApp.flow.duplicateBoard(boardId);
		},
		moveBoardToGroup : (boardId, groupName) => {
			flowApp.flow.moveBoardToGroup(boardId, groupName);
			let board = $.flow.getSelectedBoard();
			Events.register(EventType.updateBoard, board);
		},
		editBoardName    : (boardId) => {
			let editEl = $(flowApp.ui.placeholders.boardList).find("#board_" + boardId + " .name");
			editEl.attr({contentEditable: true});
			editEl.focus();
			Util.selectElementContents(editEl.get(0));
			editEl.one("blur", () => {
				let board = flowApp.flow.getBoardById(boardId);
				board._name = editEl.text();
				flowApp.drawer.drawBoardList();
			});
		},
		deleteBoard      : (boardId, target) => {
			UI.dialogue("Delete Board", "Are you sure you want to delete<br><b>" + $(target).parent().find(".name").text() + "</b>?", null, null, null, "Yes", "Cancel", () => {
				flowApp.flow.deleteBoard(boardId);
				flowApp.drawer.drawBoardList();
			}, "alert");
		},
		showBoardsByGroup: (groupName) => {
			$(flowApp.ui.placeholders.boardList).find("li").hide();
			if (groupName !== "all") {
				$(flowApp.ui.placeholders.boardList).find("[data-board-group=\"" + groupName + "\"]").show();
			} else {
				$(flowApp.ui.placeholders.boardList).find("li").show();
			}
			$(flowApp.ui.placeholders.boardGroupName).html((groupName !== "all" ? groupName : "All Boards"));
		},

		/**
		 * Connections
		 */
		makeNodeDraggableAndLinkable: (nodeId) => {

			let $node = $("#node_" + nodeId);
			let nodeEl = $node.get(0);

			let board = $.flow.getSelectedBoard();
			let node = board.getNodeById(nodeId);

			$node.draggable({
				handle : $node.find(".menu").length ? ".menu" : null,
				cursor : "grabbing",
				opacity: 0.7,
				snap   : ".vline, .hline",
				zIndex : 100,
				start  : () => {
					nodeEl.startX = $node.position().left;
					nodeEl.startY = $node.position().top;

					if ($.flow.selectedNodes.length > 1) {
						$.flow.selectedNodes.forEach((id) => {
							if (id === nodeId)
								return;
							let $selectedNode = $("#node_" + id);
							let selectedNodeEl = $selectedNode.get(0);
							selectedNodeEl.startX = parseFloat($selectedNode.css("left"));
							selectedNodeEl.startY = parseFloat($selectedNode.css("top"));
						})
					}
				},
				drag   : () => {
					nodeEl.distanceX = $node.position().left - nodeEl.startX;
					nodeEl.distanceY = $node.position().top - nodeEl.startY;
					if ($.flow.selectedNodes.length > 1) {
						$.flow.selectedNodes.forEach((id) => {
							if (id === nodeId)
								return;
							let $selectedNode = $("#node_" + id);
							$selectedNode[0].style.left = $selectedNode[0].startX + nodeEl.distanceX + "px";
							$selectedNode[0].style.top = $selectedNode[0].startY + nodeEl.distanceY + "px";
						})
					}
					$.flow.updateConnections();
				},
				stop   : () => {
					node._x = $(nodeEl).position().left;
					node._y = $(nodeEl).position().top;

					if ($.flow.selectedNodes.length > 1) {
						$.flow.selectedNodes.forEach((id) => {
							if (id === nodeId)
								return;
							let selectedNode = board.getNodeById(id);

							let $selectedNode = $("#node_" + id);
							selectedNode._x = $selectedNode.position().left;
							selectedNode._y = $selectedNode.position().top;
						})
					}

					Events.register(EventType.updateNode, node);
				}
			});

			let anchorOut = $node.is(".anchorOut") ? $node : $node.find(".anchorOut");

			anchorOut.each(function () {

				$(this).on("mousedown", function (e) {

					if ($.flow.metaKeys.indexOf("Meta") >= 0) {

						e.stopPropagation();
						let drawingArea = $(flowApp.ui.placeholders.board);

						let startEl = $node.is(".anchorOut") ? $node : $(this);

						if($.flow.metaKeys.indexOf("Alt") >= 0 && node._type === Type.condition)
							startEl = $node;

						let fakeEl = $("<div id='fakeEl'>").css({
								position  : "absolute",
								width     : 10,
								height    : 10,
								background: "transparent",
								zIndex    : -100,
								left      : e.clientX - drawingArea.position().left,
								top       : e.clientY - drawingArea.position().top,
							}
						);

						fakeEl.appendTo(flowApp.ui.placeholders.board);
						let connColor = $.flow.metaKeys.indexOf("Alt")>=0 && node._type === Type.condition ? "red" : "orange";
						$(this).get(0).line = $.flow.LeaderLine(startEl.is(".anchorOut") || ($.flow.metaKeys.indexOf("Alt") >= 0 && node._type === Type.condition)? startEl : startEl.find(".anchor"), fakeEl, {color: connColor, size: 3});

						$(document).on("mousemove.line", (e) => {
							fakeEl.css({
								left: e.clientX - drawingArea.position().left,
								top : e.clientY - drawingArea.position().top
							});
							$(this).get(0).line.position();

						}).one("mouseup", (e) => {

							/*
							start
							text
							note
							choices
							condition
							random
							jumpToNode
							*/

							let connectionType = 0;
							switch (node._type) {
								case Type.choices:
									connectionType = 1;
									break;
								case Type.condition:
									if(startEl.data("node-element-id") != null)
										connectionType = 2;
									else
										connectionType = 3;
									break;
								case Type.random:
									connectionType = 4;
									break;
							}

							$(document).off("mousemove.line");

							fakeEl.remove();
							$(this).get(0).line.remove();

							let toEl = $(e.target).parents(".node");
							let connection = new Connection(
								null,
								startEl.data("node-id"),
								startEl.data("node-element-id"),
								toEl.data("node-id"),
								connectionType
							);
							Events.register(EventType.addConnection, connection);
						});
					}
				});
			});

		},
		LeaderLine                  : (from, to, opt) => {
			return new LeaderLine(from.get(0), to.get(0), opt);
		},
		updateConnections           : () => {
			let board = $.flow.getSelectedBoard();
			let connections = board._connections;

			connections.forEach((connection) => {
				let line = connection._connectionLine;
				if (!line) {
					connections.delete(connection);
					return;
				}

				if (typeof line.position === "function")
					line.position();
			})
		},

		/**
		 * Node
		 */
		getNodeById            : (nodeId) => {
			let board = $.flow.getSelectedBoard();
			return board.getNodeById(nodeId);
		},
		addToSelectedNodes     : function (nodeId, multi = false) {
			if (multi) {
				if ($.flow.selectedNodes.indexOf(nodeId) < 0) {
					$.flow.selectedNodes.unshift(nodeId);
				}

			} else {
				$.flow.selectedNodes = [];
				$.flow.selectedNodes.unshift(nodeId);
			}

			Events.register(EventType.selectNode, {selectedNodeId: nodeId});
		},
		removeFromSelectedNodes: function (nodeId = null) {
			if (nodeId)
				$.flow.selectedNodes.delete(nodeId);
			else
				$.flow.selectedNodes = [];
		}

	};


	/*
	* Utils
	* ----------------------------------------------------- */

	Array.prototype.delete = function (el) {
		for (let i = 0; i < this.length; i++) {
			if (this[i] === el) {
				this.splice(i, 1);
				i--;
			}
		}
	};

	function insertTextAtCaret(text) {
		var sel, range;
		if (window.getSelection) {
			sel = window.getSelection();
			if (sel.getRangeAt && sel.rangeCount) {
				range = sel.getRangeAt(0);
				range.deleteContents();
				range.insertNode(document.createTextNode(text));
			}
		} else if (document.selection && document.selection.createRange) {
			document.selection.createRange().text = text;
		}
	}

})(jQuery, document);
