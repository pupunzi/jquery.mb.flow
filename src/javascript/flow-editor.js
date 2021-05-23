import {FlowApp} from "./Classes/FlowApp.js";
import {Util} from "./Classes/Util.js";
import {UI} from "./Classes/UI.js";
import {ClassName, ContextualMenu, Menu} from "./Classes/Menu.js";
import {KeyboardListener, KeyType} from "./Classes/KeyboardListener.js";
import {Events, EventType} from "./Classes/Events.js";
import {CycleType, Type} from "./Classes/Node.js";
import {Connection} from "./Classes/Connection.js";
import {ActorsDrawer} from "./Classes/ActorsDrawer.js";
import {AvatarDrawer} from "./Classes/AvatarDrawer.js";
import {Drawer} from "./Classes/Drawer.js";
import {PreviewDrawer} from "./Classes/PreviewDrawer.js";

(function ($, d, w) {

	$(() => {
		$.flow.init();
	});

// ████ FLOW    ████████████████████████████████████████████████████████████████████████████████████████████████████████
// ███ EDITOR ██████████████████████████████████████████████████████████████████████████████████████████████████████████
// ██████    PUPUNZI     ███████████████████████████████████████████████████████████████████████████████████████████████

	$.flow = {

		metaKeys: [],
		draggable: [],
		areaSize: {},
		selectedNodes: [],
		latMousePosition: {},
		vars: {},

		flowApp: () => {
			return flowApp;
		},
		selectedBoard: () => {
			if (flowApp.flow)
				return flowApp.flow.getBoardById(flowApp.flow._selectedBoardId)
		},

		menu: {

			// ███████ Menu ███████████████████████████████████████████

			boardListElementMenu: (target) => {

				let items = [
					{
						name: 'Rename',
						fn: function (target) {
							let boardId = $(target).parent().data("board-id");
							$.flow.editBoardName(boardId);
						}
					},
					{
						name: 'Duplicate',
						fn: function (target) {
							let boardId = $(target).parent().data("board-id");
							$.flow.duplicateBoard(boardId);
						}
					},
					{
						name: 'Export',
						fn: function (target) {
							flowApp.exportToFile();
							//console.debug("Export board ", boardId);
						}
					}
				];

				let boardId = $(target).parent().data("board-id");
				let board = flowApp.flow.getBoardById(boardId);
				let groups = flowApp.flow.getBoardsByGroup();

				if (groups.length > 1) {
					items.push({});
					items.push({
						name: "Move to: ",
						className: ClassName.listTitle
					});
				}
				groups.forEach((groupName) => {
					if (groupName === board._group)
						return;

					let group = {
						name: groupName,
						className: "listElement",
						fn: function (target) {
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
					name: 'Delete',
					className: ClassName.alert,
					fn: function (target) {
						let boardId = $(target).parent().data("board-id");
						$.flow.deleteBoard(boardId, target);
					}
				},);

				return items;
			},
			flowsMenu: (target) => {
				let flowId = $(target).parent().data("flow-id");
				let items = [
					{
						name: 'Rename',
						fn: function (target) {
							console.debug(target, flowId);
							$.flow.editFlowName(flowId);
						}
					},
					{
						name: 'Duplicate',
						fn: function (target) {
							console.log('Duplicate', $(target).parent().data("flow-id"));
						}
					},
					{
						name: 'New',
						// className: "highlight",
						fn: function (target) {
							$.flow.addFlow();
						}
					},
					{},
					{
						name: 'Options',
						icon: "icon-cog",
						fn: function (target) {
						}
					},
					{
						name: 'Flows List',
						icon: "icon-list-ul",
						fn: function (target) {
						}
					},
					{},
					{
						name: 'Export',
						className: ClassName.highlight,
						icon: "icon-download",
						fn: function (target) {
							flowApp.exportToFile()
						}
					},
					{
						name: 'Import',
						icon: "icon-upload",
						className: ClassName.highlight,
						fn: function (target) {
							FlowApp.ImportFromFile()
						}
					},
					{},
					{
						name: 'Delete',
						className: ClassName.alert,
						fn: function (target) {
							$.flow.deleteFlow(flowId, target);
						}
					},
				];

				return items;
			},
			boardsGroupsMenu: (target) => {
				let items = [];

				let showAll = {
					name: "Show All",
					fn: function (target) {
						flowApp.flow.selectedBoardGroup = "all";
						$.flow.showBoardsByGroup("all");
					}
				};
				items.push(showAll);

				items.push({});

				let groups = flowApp.flow.getBoardsByGroup();
				groups.forEach((groupName) => {
					let group = {
						name: groupName,
						className: ClassName.listElement,
						fn: function (target) {
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
					fn: function (target) {
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
					name: "New Group",
					className: ClassName.highlight,
					fn: function (target) {

						let opt = {
							title: "Add a new Group for <br><b>" + flowApp.flow._name + "</b>",
							text: null,
							inputId: "groupName",
							inputValue: null,
							okLabel: "Add",
							cancelLabel: "Cancel",
							action: (name) => {
								flowApp.flow.addGroup(name);
								$.flow.showBoardsByGroup(name);
							},
							className: ""
						};
						UI.dialogue(opt);
					}
				};
				items.push(newGroup);

				return items;
			},
			nodeMenu: (target) => {
				let board = $.flow.selectedBoard();
				let nodeId = $(target).parents(".node").data("node-id");
				let node = board.getNodeById(nodeId);
				let items = [];

				if (node._type !== Type.variables) {
					items.push({
						name: 'Add Line',
						fn: function (target) {
							let nodeId = $(target).parents(".node").data("node-id");
							let node = board.getNodeById(nodeId);
							Events.register(EventType.addNodeElement, node);
						}
					});
					items.push({});
				}
				items.push({
					name: 'Clone',
					fn: function (target) {
						let nodeId = $(target).parents(".node").data("node-id");
						let node = board.getNodeById(nodeId);
						console.debug("Clone")
					}
				});
				items.push({
					name: 'Delete',
					className: ClassName.alert,
					fn: function (target, e) {
						let nodeId = $(target).parents(".node").data("node-id");
						if (nodeId != null) {
							let board = $.flow.selectedBoard();
							board.deleteNodeById(nodeId);
						}
					}
				});


				if (node._connections.length) {
					items.push({});
					items.push({
						name: 'Remove Connections',
						className: ClassName.listTitle
					});
				}
				if (nodeId != null) {
					let connIdx = 0;
					node._connections.forEach((connection) => {
						items.push({
							name: 'Connection ' + ++connIdx,
							className: ClassName.alert,
							fn: function (target, e) {
								//console.debug(connection);
								connection._connectionLine.remove();
								node._connections.delete(connection);
								board._connections.delete(connection);
								flowApp.drawer.drawBoard();
								Events.register(EventType.updateBoard, board);
							},
							hoverFn: function (target, e) {
								connection._connectionLine.setOptions({color: "red"})
								$(".contextual-menu").css({opacity: .5})
							},
							outFn: function (target, e) {
								let type = connection._type || 0;
								let color = Drawer.getConnectionColorByConnectionType(type);
								connection._connectionLine.setOptions({color: color})
								$(".contextual-menu").css({opacity: 1})

							}
						})
					})
				}

				return items;
			},
			cycleMenu: (target) => {
				let board = $.flow.selectedBoard();
				let nodeId = $(target).parents(".node").data("node-id");
				let node = board.getNodeById(nodeId);
				let items = [
					{
						name: 'List',
						icon: 'icon-list-ol',
						className: node._cycleType === "List" ? ClassName.highlight : null,
						fn: function (target) {
							node._cycleType = CycleType.list;
							$(target).attr("class", 'icon icon-list-ol');
							Events.register(EventType.updateBoard, board);
						}
					},
					{
						name: 'Loop',
						icon: 'icon-repeat',
						className: node._cycleType === "Repeat" ? ClassName.highlight : null,
						fn: function (target) {
							let board = $.flow.selectedBoard();
							let nodeId = $(target).parents(".node").data("node-id");
							let node = board.getNodeById(nodeId);
							node._cycleType = CycleType.loop;
							$(target).attr("class", 'icon icon-repeat');
							Events.register(EventType.updateBoard, board);
						}
					},
					{
						name: 'Random',
						icon: 'icon-random',
						className: node._cycleType === "Random" ? ClassName.highlight : null,
						fn: function (target) {
							let board = $.flow.selectedBoard();
							let nodeId = $(target).parents(".node").data("node-id");
							let node = board.getNodeById(nodeId);
							node._cycleType = CycleType.random;
							$(target).attr("class", 'icon icon-random');
							Events.register(EventType.updateBoard, board);
						}
					},
				];

				return items;
			},
			actorMenu: (target) => {
				let board = $.flow.selectedBoard();
				let nodeId = $(target).parents(".node").data("node-id");
				let node = board.getNodeById(nodeId);
				let items = [];
				items.push({
					name: 'Actors',
					className: ClassName.listTitle
				});
				items.push({});
				flowApp.flow._actors.forEach((actor) => {
					items.push({
						name: actor._name,
						className: actor._id === node._actorId ? ClassName.highlight : null,
						fn: function (target) {
							node._actorId = actor._id;
							flowApp.drawer.drawBoard();
						}
					})
				});

				return items;

			},

			//███████ Contextual Menu ████████████████████████████████

			boardMenu: (target) => {
				let board = $.flow.selectedBoard();
				let items = [
					{
						name: 'New Text Node',
						icon: 'icon-commenting',
						fn: function (target, e) {
							board.addNode(Type.text, {_x: e.clientX, _y: e.clientY});
						}
					},
					{
						name: 'New Choice Node',
						icon: 'icon-th-list',
						fn: function (target, e) {
							board.addNode(Type.choices, {_x: e.clientX, _y: e.clientY});
						}
					},
					{
						name: 'New Conditional Node',
						icon: 'icon-sitemap',
						fn: function (target, e) {
							board.addNode(Type.condition, {_x: e.clientX, _y: e.clientY});
						}
					},
					{
						name: 'New Sequence Node',
						icon: 'icon-tasks',
						fn: function (target, e) {
							board.addNode(Type.sequence, {_x: e.clientX, _y: e.clientY});
						}
					},
					{
						name: 'New Note node',
						icon: 'icon-thumb-tack',
						fn: function (target, e) {
							board.addNode(Type.note, {_x: e.clientX, _y: e.clientY});
						}
					},
					{
						name: 'New Variables node',
						icon: 'icon-code',
						fn: function (target, e) {
							board.addNode(Type.variables, {_x: e.clientX, _y: e.clientY});
						}
					},
					{
						name: 'New Random Node',
						icon: 'icon-random',
						fn: function (target, e) {
							board.addNode(Type.random, {_x: e.clientX, _y: e.clientY});
						}
					},
					{
						name: 'New JumpTo Node',
						icon: 'icon-arrow-circle-right',
						fn: function (target, e) {
							board.addNode(Type.jumpToNode, {_x: e.clientX, _y: e.clientY});
						}
					},
				];

				return items;
			},
			nodeElementMenu: (target) => {
				let t = $(target).is(".node-text") ? $(target) : $(target).find(".node-text");
				let caretPos = t.caret();
				let items = [
					{
						name: 'Delete Line',
						icon: "icon-remove",
						className: ClassName.alert,
						fn: function (target, e) {
							let t = $(target).is(".node-content-line") ? $(target) : $(target).parents(".node-content-line")
							let nodeId = t.data("node-id");
							let nodeElementId = t.data("node-element-id");
							//console.debug(t, nodeId, nodeElementId);
							Events.register(EventType.deletetNodeElement, {
								nodeId: nodeId,
								nodeElementId: nodeElementId
							});
						}
					},
				];

				if (t.is("[contenteditable]")) {
					items.push({});
					items.push({
						name: 'enter a calculation',
						icon: "icon-code",
						fn: function (target, e) {
							let opt = {
								title: "Variables",
								text: null,
								inputId: "vars",
								inputValue: null,
								okLabel: "Add",
								cancelLabel: "Cancel",
								action: (content) => {
									let variables = Util.findVariables(content);
									variables.forEach((variable) => {
										content = content.replace(variable, "<i>" + variable + "</i>");
									});
									let c = " <span id='variable_" + Util.setUID() + "' class='variables' contenteditable='false'>{" + content + "}</span><br>";
									t.caret(caretPos);
									pasteHtmlAtCaret(c);
									Util.parseVariables("{" + $(c).text() + "}");
									flowApp.save(flowApp.flow._id);
								},
								className: null
							};
							UI.dialogue(opt);
						}
					});

					if (Object.keys(flowApp.flow._variables).length > 0) {
						items.push({
							name: 'Insert variable:',
							className: ClassName.listTitle
						});

						for (const variable in flowApp.flow._variables) {
							items.push({
								name: variable,
								icon: "icon-code",
								fn: function (target, e) {
									t.caret(caretPos);
									let c = "<span class='eval-variable' contenteditable='false'>" + variable + " </span>&nbsp;";
									pasteHtmlAtCaret(c);
									flowApp.save(flowApp.flow._id);
								}
							});

						}


					}


				}
				return items;
			},
			variablesMenu: (target) => {
				let t = $(target).is(".variables") ? $(target) : $(target).parents(".variables");
				let parent = $(target).parents(".node-text");
				let items = [];
				target._variables = flowApp.flow._variables;
				let editVariables = {
					name: 'Edit variable',
					icon: "icon-code",
					fn: function (target, e) {
						let opt = {
							title: "Variables",
							text: null,
							inputId: "vars",
							inputValue: t.text().replace(/{/g, "").replace(/}/g, ""),
							okLabel: "Update",
							cancelLabel: "Cancel",
							action: (content) => {
								let variables = Util.findVariables(content);
								variables.forEach((variable) => {
									content = content.replace(variable, "<i>" + variable + "</i>");
								});

								let c = "{" + content + "}";
								let v = parent.find("#" + t.attr("id"));
								v.html(c);
								Util.parseVariables(v.text());
								flowApp.save(flowApp.flow._id);
								parent.focus();
							},
							className: null
						};
						UI.dialogue(opt);
					}
				};
				items.push(editVariables);
				return items;
			},
		},

		init: () => {

			w.Avataaars = Avataaars;
			//Init keys listener
			w.KeyListener = new KeyboardListener();
			//Init Flow App
			w.flowApp = new FlowApp();

			// get last flow opened on previous session
			let selectedFlow = $.mbStorage.get("selectedFlow");
			if (selectedFlow != null)
				flowApp.load(selectedFlow);
			else
				$.flow.addFlow();

			//███████ Init Menu ██████████████████████████████████████████████████
			w.flows_menu = new Menu(".flows-menu", $.flow.menu.flowsMenu, true);
			w.board_list_element_menu = new Menu(".board-list-element-menu", $.flow.menu.boardListElementMenu, true);
			w.boards_groups = new Menu(".boards-group-menu", $.flow.menu.boardsGroupsMenu, true);
			w.node_menu = new Menu("[data-menu=\"node\"]", $.flow.menu.nodeMenu, true);
			w.cycle_menu = new Menu("[data-menu=\"cycle\"]", $.flow.menu.cycleMenu, true);
			w.actor_menu = new Menu("[data-menu=\"actor\"]", $.flow.menu.actorMenu, true);

			//███████ Init Contextual menu ██████████████████████████████████████
			w.board_contextual_menu = new ContextualMenu(flowApp.ui.placeholders.drawingArea, $.flow.menu.boardMenu, true);
			w.node_contextual_menu = new ContextualMenu(".node", $.flow.menu.nodeMenu, false);
			w.variables_contextual_menu = new ContextualMenu(".variables", $.flow.menu.variablesMenu, true);
			w.nodeElement_contextual_menu = new ContextualMenu(".node-content-line", $.flow.menu.nodeElementMenu, true);

			//███████ Paste as Simple Text ██████████████████████████████████████
			$(d).on('paste', "[contenteditable]", (e) => {
				e.preventDefault();
				let text = (e.originalEvent || e).clipboardData.getData('text/plain');
				d.execCommand("insertHTML", false, text);
			});

			//███████ Content Editable keys behavior ██████████████████████████████████████
			$(d).on("keypress", "[contenteditable]", (e) => {
				let $node = $(e.target).parents(".node");
				if ($node.length > 0) {
					$(e.target)[0].caretPos = $(e.target).caret();
				}
				switch (e.key) {
					case KeyType.enter:
						if ($node.length > 0) {
							if ($.flow.metaKeys.indexOf(KeyType.shift) >= 0) {
								e.preventDefault();
								$(e.target).blur();
							}
							return;
						} else {
							e.preventDefault();
							$(e.target).blur();
						}
						break;

					case KeyType.backspace:
						if ($(e.target).parents(".node").length > 0) {
							return;
						}
						break;

					default:
						if ($.flow.metaKeys.indexOf(KeyType.meta) >= 0) {
							e.preventDefault();
							return false;
						}
				}
			});
			$(d).on("keyup", "[contenteditable]", (e) => {
				let $node = $(e.target).parents(".node");
				if ($node.length > 0) {
					$.flow.autoShiftNodes($node);
					$.flow.updateConnections();
				}
			});
			$(d).on("click", "[contenteditable]", (e) => {
				e.preventDefault();
				e.stopPropagation();
				return false;
			});

			//███████ General keydown behavior ██████████████████████████████████████
			$(d).on("keydown", (e) => {

				let board = $.flow.selectedBoard();
				if ($.flow.metaKeys.indexOf(KeyType.meta) >= 0 || $.flow.metaKeys.indexOf(KeyType.alt) >= 0) {

					$(".node").draggable("disable");

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

				if ($.flow.metaKeys.indexOf(KeyType.control) >= 0) {
					e.stopPropagation();
					switch (e.key) {
						case "t":
							e.preventDefault();
							board.addNode(Type.text, {
								_x: $.flow.latMousePosition.x,
								_y: $.flow.latMousePosition.y
							});
							break;

						case "n":
							e.preventDefault();
							board.addNode(Type.note, {
								_x: $.flow.latMousePosition.x,
								_y: $.flow.latMousePosition.y
							});
							break;

						case "c":
							e.preventDefault();
							board.addNode(Type.choices, {
								_x: $.flow.latMousePosition.x,
								_y: $.flow.latMousePosition.y
							});
							break;

						case "v":
							e.preventDefault();
							board.addNode(Type.variables, {
								_x: $.flow.latMousePosition.x,
								_y: $.flow.latMousePosition.y
							});
							break;

						case "r":
							e.preventDefault();
							board.addNode(Type.random, {
								_x: $.flow.latMousePosition.x,
								_y: $.flow.latMousePosition.y
							});
							break;

						case "s":
							e.preventDefault();
							board.addNode(Type.sequence, {
								_x: $.flow.latMousePosition.x,
								_y: $.flow.latMousePosition.y
							});
							break;

						case "x":
							e.preventDefault();
							board.addNode(Type.condition, {
								_x: $.flow.latMousePosition.x,
								_y: $.flow.latMousePosition.y
							});
							break;
					}
				}
			});
			$(d).on("keyup", () => {
				$(".node").draggable("enable");
			});

			//███████ Redraw Grid on window resize ██████████████████████████████████████
			$(w).on("resize", () => {
				flowApp.drawer.drawGrid();
			});

			//███████ Move drawing area by dragging ██████████████████████████████████████
			let boardArea = $(flowApp.ui.placeholders.board);
			boardArea[0].style.zoom = 1;
			let pos = {};
			$(d).on("mousedown.drag", (e) => {

				// if ($(e.target).parents(".node").length)
				//     return;

				if ($.flow.metaKeys.indexOf(KeyType.meta) >= 0) {
					e.preventDefault();

					$("body").css("cursor", "grab");

					pos = {
						left: boardArea.offset().left,
						top: boardArea.offset().top,
						x: e.pageX,
						y: e.pageY,
						hasMove: true

					};

				} else if ($.flow.metaKeys.indexOf(KeyType.shift) >= 0) {
					/**
					 * Make selection
					 */
					flowApp.drawer.drawSelection(e)
				}

				$(d).on("mousemove.drag", (e) => {

					$.flow.latMousePosition = {x: e.clientX, y: e.clientY};

					// if ($(e.target).parents(".node").length)
					//     return;

					if ($.flow.metaKeys.indexOf(KeyType.meta) >= 0) {
						e.preventDefault();
						$("body").css("cursor", "grabbing");

						if (pos.hasMove) {
							let left = pos.left + Math.round((e.pageX - pos.x) / flowApp._grid) * flowApp._grid;
							let top = pos.top + Math.round((e.pageY - pos.y) / flowApp._grid) * flowApp._grid;
							boardArea.css({left: left, top: top});
						}

						$.flow.updateConnections();

					} else if ($.flow.metaKeys.indexOf(KeyType.shift) >= 0) {
						flowApp.drawer.drawSelection(e)
					}

				}).one("mouseup.drag", (e) => {
					flowApp.drawer.drawSelection(e);
					pos.hasMove = false;
					$(d).off("mousemove.drag");
					if ($.flow.metaKeys.indexOf(KeyType.meta) >= 0) {
						$.flow.updateConnections();
						$("body").css("cursor", "default");
						let board = $.flow.getSelectedBoard();
						board._x = parseFloat(boardArea.css("left"));
						board._y = parseFloat(boardArea.css("top"));
						Events.register(EventType.updateBoard, board);
					}
				});
			});
		},

		// ███████ Connections ████████████████████████████████████████

		makeNodeDraggableAndLinkable: (nodeId) => {

			let $node = $("#node_" + nodeId);
			let nodeEl = $node.get(0);

			let board = $.flow.getSelectedBoard();
			let node = board.getNodeById(nodeId);

			//███████ Make node draggable ██████████████████████████████████████
			$node.draggable({
				handle: $node.find(".menu").length ? ".menu" : null,
				cursor: "grabbing",
				opacity: 0.7,
				snap: ".vline, .hline",
				zIndex: 100,
				start: () => {
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
				drag: () => {
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
				stop: () => {
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

			//███████ Make node linkable ██████████████████████████████████████
			let anchorOut = $node.is(".anchorOut") ? $node : $node.find(".anchorOut");
			anchorOut.each(function () {

				$(this).on("mousedown", function (e) {
					if ($.flow.metaKeys.indexOf(KeyType.alt) >= 0) {

						e.stopPropagation();
						e.preventDefault();

						let drawingArea = $(flowApp.ui.placeholders.board);
						let startEl = $node.is(".anchorOut") ? $node : $(this);

						if ($.flow.metaKeys.indexOf(KeyType.shift) >= 0 && node._type === Type.condition)
							startEl = $node;

						let fakeEl = $("<div id='fakeEl'>").css({
								position: "absolute",
								width: 10,
								height: 10,
								background: "transparent",
								zIndex: -100,
								left: e.clientX - drawingArea.position().left,
								top: e.clientY - drawingArea.position().top,
							}
						);

						fakeEl.appendTo(flowApp.ui.placeholders.board);
						let connColor = $.flow.metaKeys.indexOf(KeyType.shift) >= 0 && node._type === Type.condition ? "red" : "orange";
						$(this).get(0).line = $.flow.LeaderLine(startEl.is(".anchorOut") || ($.flow.metaKeys.indexOf(KeyType.alt) >= 0 && node._type === Type.condition) ? startEl : startEl.find(".anchor"), fakeEl, {
							color: connColor,
							size: 3
						});

						$(d).on("mousemove.line", (e) => {
							fakeEl.css({
								left: e.clientX - drawingArea.position().left,
								top: e.clientY - drawingArea.position().top
							});
							$(this).get(0).line.position();

						}).one("mouseup.line", (e) => {
							$(d).off("mousemove.line");
							fakeEl.remove();
							$(this).get(0).line.remove();
							let toEl = $(e.target).parents(".node");

							if (
								!toEl.length
								|| toEl.data("node-id") === startEl.data("node-id")
								|| toEl.data("node-id") === startEl.parents(".node").data("node-id")
							)
								return;

							let connectionType = $.flow.getConnectionTypeByNodeType(node, startEl);
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
		getConnectionTypeByNodeType(node, startEl = null) {
			let connectionType = 0;
			switch (node._type) {
				case Type.choices:
					connectionType = 1;
					break;
				case Type.condition:
					if (startEl && startEl.data("node-element-id") != null)
						connectionType = 2;
					else
						connectionType = 3;
					break;
				case Type.random:
					connectionType = 4;
					break;
				case Type.start:
					connectionType = 5;
					break;
				case Type.sequence:
					connectionType = 6;
					break;
			}
			return connectionType;
		},

		// ███████ Flows Manager ██████████████████████████████████████
		addFlow: () => {
			let title = "Add a new Flow";
			let text = null;
			let action = function (name) {
				flowApp.addFlow(name);
				$.mbStorage.set("selectedFlow", flowApp.flow.id);
				let board = $.flow.getSelectedBoard();
				Events.register(EventType.updateBoard, board);
			};

			let opt = {
				title: title,
				text: text,
				inputId: "flowName",
				inputValue: null,
				okLabel: "Add",
				cancelLabel: "Cancel",
				action: action,
				className: null
			};
			UI.dialogue(opt);
		},
		openFlow: () => {
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
		deleteFlow: (flowId, target) => {
			let title = "Delete Flow";
			let text = "Are you sure you want to delete<br><b>" + $(target).parent().find(".name").text() + "</b>?";
			let action = () => {
				flowApp.deleteFlow(flowId);
				let board = $.flow.getSelectedBoard();
				Events.register(EventType.updateBoard, board);
			};

			let opt = {
				title: title,
				text: text,
				inputId: null,
				inputValue: null,
				okLabel: "Yes",
				cancelLabel: "Cancel",
				action: action,
				className: "alert"
			};

			UI.dialogue(opt);
		},

		// ███████ Boards Manager █████████████████████████████████████

		getSelectedBoard: () => {
			return flowApp.flow.getBoardById(flowApp.flow.selectedBoardId);
		},
		addBoard: () => {
			let title = "Add a new Board";
			let text = null;
			let action = function (name) {
				flowApp.flow.addBoard(name, flowApp.flow.selectedBoardGroup);
			};

			let opt = {
				title: title,
				text: text,
				inputId: "boardName",
				inputValue: null,
				okLabel: "Add",
				cancelLabel: "Cancel",
				action: action,
				className: null
			};
			UI.dialogue(opt);
		},
		duplicateBoard: (boardId) => {
			flowApp.flow.duplicateBoard(boardId);
		},
		moveBoardToGroup: (boardId, groupName) => {
			flowApp.flow.moveBoardToGroup(boardId, groupName);
			let board = $.flow.getSelectedBoard();
			Events.register(EventType.updateBoard, board);
		},
		editBoardName: (boardId) => {
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
		deleteBoard: (boardId, target) => {
			let opt = {
				title: "Delete Board",
				text: "Are you sure you want to delete<br><b>" + $(target).parent().find(".name").text() + "</b>?",
				inputId: null,
				inputValue: null,
				okLabel: "Yes",
				cancelLabel: "Cancel",
				action: () => {
					flowApp.flow.deleteBoard(boardId);
					flowApp.drawer.drawBoardList();
				},
				className: "alert"
			};
			UI.dialogue(opt);
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
		LeaderLine: (from, to, opt) => {
			return new LeaderLine(from.get(0), to.get(0), opt);
		},
		updateConnections: () => {
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
		autoShiftNodes: ($node) => {
			let board = $.flow.getSelectedBoard();
			let nodes = board._nodes;
			let left = parseFloat($node.css("left"));
			let top = parseFloat($node.css("top"));

			if (!$node.get(0).h || $node.height() !== $node.get(0).h) {
				nodes.forEach((node) => {
					let $n = $(flowApp.ui.placeholders.board).find("#node_" + node._id);
					let $nLeft = parseFloat($n.css("left"));
					let $nTop = parseFloat($n.css("top"));
					if (($nLeft >= left && $nLeft < left + $node.width()) && $nTop > top) {
						let distance = $node.height() - $node.get(0).h;
						$n.css({top: $nTop + distance});
						node._x = $n.position().left;
						node._y = $n.position().top;
					}
				});
				$node.get(0).h = $node.height();
			}
		},

		// ███████ Node ████████████████████████████████████████████████

		getNodeById: (nodeId) => {
			let board = $.flow.getSelectedBoard();
			return board.getNodeById(nodeId);
		},
		addToSelectedNodes: (nodeId, multi = false) => {
			if ($.flow.selectedNodes.indexOf(nodeId) >= 0)
				return;

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
		removeFromSelectedNodes: (nodeId = null) => {
			if (nodeId)
				$.flow.selectedNodes.delete(nodeId);
			else
				$.flow.selectedNodes = [];
		},

		// ███████ Actors Window ███████████████████████████████████████

		drawActorsWindow: () => {
			ActorsDrawer.openWindow()
		},

		// ███████ Avatar Window ███████████████████████████████████████

		drawAvatarWindow: (actorId) => {
			AvatarDrawer.openWindow(actorId)
		},

		// ███████ Preview Window ███████████████████████████████████████

		openPreview: () => {
			PreviewDrawer.OpenWindow(flowApp.flow, $.flow.getSelectedBoard());
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

	Number.prototype.module = function (n) {
		return ((this % n) + n) % n;
	};


	function pasteHtmlAtCaret(html) {
		var sel, range;
		if (w.getSelection) {
			// IE9 and non-IE
			sel = w.getSelection();
			if (sel.getRangeAt && sel.rangeCount) {
				range = sel.getRangeAt(0);
				range.deleteContents();
				// Range.createContextualFragment() would be useful here but is
				// non-standard and not supported in all browsers (IE9, for one)
				var el = d.createElement("div");
				el.innerHTML = html;
				var frag = d.createDocumentFragment(), node, lastNode;
				while ((node = el.firstChild)) {
					lastNode = frag.appendChild(node);
				}
				range.insertNode(frag);

				// Preserve the selection
				if (lastNode) {
					range = range.cloneRange();
					range.setStartAfter(lastNode);
					range.collapse(true);
					sel.removeAllRanges();
					sel.addRange(range);
				}
			}
		}
	}

})
(jQuery, document, window);
