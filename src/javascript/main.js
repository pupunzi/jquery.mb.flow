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

(function ($, d) {
	$(function () {

		window.flowApp = new FlowApp();

		// get last flow opened on previous session
		let lastFlow = $.mbStorage.get("lastFlow");
		if (lastFlow != null)
			flowApp.load(lastFlow);
		else
			$.flow.addFlow();

		//Init Flow
		$.flow.init();

		//Init Menu
		window.flows_menu = new Menu(".flows-menu", $.flow.contextualMenu.flows, true);
		window.board_list_element_menu = new Menu(".board-list-element-menu", $.flow.contextualMenu.boardListelement);
		window.boards_groups = new Menu(".boards-group-menu", $.flow.contextualMenu.boardsGroups, true);

		//Init Contextual menu
		window.board = new ContextualMenu("#board", $.flow.contextualMenu.board, true);
		window.board = new ContextualMenu(".node", $.flow.contextualMenu.node, true);


		//Init keys listener
		window.KeyListener = new KeyboardListener();
	});

	/*
	 * Flow methods
	 * ---------------------------------------------------- */
	$.flow = {
		selectedFlow : null,
		selectedBoard: () => {
			let board = flowApp.flow.getBoardById(flowApp.flow._selectedBoardId);
			return board;
		},
		selectedNode : null,
		metaKeys     : [],

		draggable: [],

		init: function () {
			$("body").on("keydown", "[contenteditable]", (e) => {
				switch (e.keyCode) {
					case 13:
						e.preventDefault();
						$(e.target).blur();
						break;
				}
			})

		},

		contextualMenu: {
			boardListelement: [
				{
					name: 'Rename',
					fn  : function (target) {
						let boardId = $(target).parent().data("board-id");
						$.flow.editBoardName(boardId);
					}
				},
				{
					name: 'Change Group',
					fn  : function (target) {
						let boardId = $(target).parent().data("board-id");
						$.flow.moveToGroup(boardId);
					}
				},
				{
					name: 'Duplicate',
					fn  : function (target) {
						let boardId = $(target).parent().data("board-id");
						$.flow.duplicateBoard(boardId);
					}
				},
				{},
				{
					name     : 'Export',
					className: "highlight",
					fn       : function (target) {
						let boardId = $(target).parent().data("board-id");
						let boardName = $(target).parent().find(".name").text();
						console.debug("Export board ", boardId);
					}
				},
				{
					name     : 'Delete',
					className: "alert",
					fn       : function (target) {
						let boardId = $(target).parent().data("board-id");
						$.flow.deleteBoard(boardId, target);
					}
				},
			],
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
					name     : 'Export',
					className: "highlight",
					fn       : function (target) {
						let flowId = $(target).parent().data("flow-id");
						let flowName = $(target).parent().find(".name").text();
						console.debug("Export " + flowId + "  -  " + flowName);
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
				let groups = flowApp.flow.getBoardsGroupsList();

				let showAll = {
					name: "Show All",
					fn  : function (target) {
						flowApp.flow.selectedBoardGroup = "all";
						$.flow.showBoardsByGroup("all");
					}
				};
				items.push(showAll);

				items.push({});

				groups.forEach((groupName) => {
					let group = {
						name     : groupName,
						className: "listElement",
						fn       : function (target) {
							console.debug("filter by group:" + groupName);
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
						UI.dialogue("Add a new Group for", null, "groupName", "Group name", null, "Add", "Cancel", (name) => {
							flowApp.flow.addGroup(name);
							$.flow.showBoardsByGroup(name);
						});
					}
				};
				items.push(newGroup);

				return items;
			},

			//Contextual Menu
			board: [
				{
					name: 'New Text Node',
					fn  : function (target, e) {
						let board = $.flow.selectedBoard();
						let node = board.addNode(Type.text, {_x: e.clientX, _y: e.clientY});


						console.debug({
							left: e.clientX + "px",
							top : e.clientY + "px"
						})

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
					name: 'New Note node',
					fn  : function (target) {
						console.debug("New Note Node")
					}
				},
				{
					name: 'New Conditional Node',
					fn  : function (target) {
						console.debug("New Conditional Node")
					}
				},
			],
			node : [
				{
					name: 'Clone',
					fn  : function (target) {
						console.debug("Clone")
					}
				},
				{
					name     : 'Delete',
					className: "alert",
					fn       : function (target) {
						console.debug("Delete")
					}
				},
			]
		},
		/**
		 * Flows
		 * */
		addFlow       : function () {
			let title = "Add a new Flow";
			let text = null;
			let action = function (name) {
				flowApp.addFlow(name);
				$.mbStorage.set("lastFlow", flowApp.flow.id);
				flowApp.save(flowApp.flow.id);
			};
			UI.dialogue(title, text, "flowName", "Flow Name", null, "Add", "Cancel", action);
		},

		openFlow: function () {
		},

		editFlowName: function () {
			let editEl = $(flowApp.ui.placeholders.flowName).find("h1");
			editEl.attr({contentEditable: true});
			editEl.focus();
			Util.selectElementContents(editEl.get(0));
			editEl.one("blur", () => {
				flowApp.flow.updateName(editEl.text());
				editEl.attr({contentEditable: false});
			});
		},

		deleteFlow: function (flowId, target) {
			let title = "Delete Flow";
			let text = "Are you sure you want to delete<br><b>" + $(target).parent().find(".name").text() + "</b>?";
			let action = () => {
				flowApp.deleteFlow(flowId);
				flowApp.save()
			};
			UI.dialogue(title, text, null, null, null, "Yes", "Cancel", action, "alert");
		},

		/**
		 * Boards
		 * */
		addBoard: function () {
			let title = "Add a new Board";
			let text = null;
			let action = function (name) {
				flowApp.flow.addBoard(name, flowApp.flow.selectedBoardGroup);
			};
			UI.dialogue(title, text, "boardName", "Board Name", null, "Add", "Cancel", action);
		},

		duplicateBoard: function (boardId) {
			flowApp.flow.duplicateBoard(boardId);
		},

		editBoardName: function (boardId) {
			let editEl = $(flowApp.ui.placeholders.boardList).find("#board_" + boardId + " .name");
			editEl.attr({contentEditable: true});
			editEl.focus();
			Util.selectElementContents(editEl.get(0));
			editEl.one("blur", () => {
				let board = flowApp.flow.getBoardById(boardId);
				board._name = editEl.text();
				flowApp.save(flowApp.flow.id);
				flowApp.drawer.drawBoardList();
			});
		},

		moveToGroup: function (boardId, target) {
			console.log("Mover to Group");
		},

		deleteBoard: function (boardId, target) {
			UI.dialogue("Delete Board", "Are you sure you want to delete<br><b>" + $(target).parent().find(".name").text() + "</b>?", null, null, null, "Yes", "Cancel", () => {
				flowApp.flow.deleteBoard(boardId);
				flowApp.drawer.drawBoardList();
				flowApp.save(flowApp.flow.id);
			}, "alert");
		},

		showBoardsByGroup: function (groupName) {
			$(flowApp.ui.placeholders.boardList).find("li").hide();
			if (groupName !== "all") {
				$(flowApp.ui.placeholders.boardList).find("[data-board-group=\"" + groupName + "\"]").show();
			} else {
				$(flowApp.ui.placeholders.boardList).find("li").show();
			}
			$(flowApp.ui.placeholders.boardGroupName).html((groupName !== "all" ? groupName : "All Boards"));
		},

		makeDraggable: function (nodeId) {

			let $node = $("#node_" + nodeId);
			let nodeEl = $node.get(0);

			$.flow.draggable["node_" + nodeId] = new PlainDraggable(nodeEl);
			$.flow.draggable["node_" + nodeId].handle = $node.find(".menu").get(0);
			$.flow.draggable["node_" + nodeId].snap = {step: 20};
			$.flow.draggable["node_" + nodeId].autoScroll = true;
			$.flow.draggable["node_" + nodeId].onDragEnd = () => {
				let board = flowApp.flow.getBoardById(flowApp.flow.selectedBoardId);
				let node = board.getNodeById(nodeId);
				node._x = $(nodeEl).position().left;
				node._y = $(nodeEl).position().top;

				Events.register(EventType.updateNode, node);
			};

			let startX = $(flowApp.ui.placeholders.board).offset().left;
			let startY = $(flowApp.ui.placeholders.board).offset().top;

			let anchorOut = $node;
			// let anchorOut = $("#node_" + nodeId).find(".anchorOut");
			anchorOut.on("mousedown", (e) => {
				if ($.flow.metaKeys.indexOf("Meta") >= 0)
					$.flow.draggable["node_" + nodeId].disabled = true;
				else
					return;

				$.flow.draggable["node_" + nodeId].disabled = true;
				e.preventDefault();
				e.stopPropagation();
				let startEl = $("#node_" + nodeId);
				let fakeEl = $("<div id='fakeEl'>").css({
						position: "absolute",
						width   : 1,
						height  : 1,
						zIndex  : -100,
						left    : e.clientX - startX,
						top     : e.clientY - startY,
					}
				);
				fakeEl.appendTo(flowApp.ui.placeholders.board);
				anchorOut.get(0).line = new LeaderLine(startEl.get(0), fakeEl.get(0));

				$(document).on("mousemove.line", (e) => {
					fakeEl.css({
						left           : e.clientX - startX,
						top            : e.clientY - startY,
						backgroundColor: "red"
					});

					anchorOut.get(0).line.position();

				}).one("mouseup", (e) => {
					$(document).off("mousemove.line");

					if (anchorOut.get(0).line)
						anchorOut.get(0).line.remove();

					fakeEl.remove();
					$.flow.draggable["node_" + nodeId].disabled = false;
				});
			});
		},

		/**
		 * Node
		 */
		getNodeById: function (nodeId) {
			return flowApp.flow.getBoardById(nodeId);
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


})(jQuery, document);
