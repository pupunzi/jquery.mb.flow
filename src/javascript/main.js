/**
 * Description:
 **/

import {FlowApp} from "../Classes/FlowApp.js";
import {UI} from "../Classes/UI.js";
import {ContextualMenu} from "../Classes/ContextualMenu.js";
import {Util} from "../Classes/Util.js";

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

		//Init contextual menus
		window.flows_menu = new ContextualMenu(".flows-menu", $.flow.contextualMenu.flows, true);
		window.board_list_element_menu = new ContextualMenu(".board-list-element-menu", $.flow.contextualMenu.boardListelement);
		window.boards_groups = new ContextualMenu(".boards-group-menu", $.flow.contextualMenu.BoardsGroups, true);

	});

	/*
	 * Flow methods
	 * ---------------------------------------------------- */
	$.flow = {

		selectedFlow: null,
		selectedBoard : null,
		selectedNode: null,

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
			BoardsGroups    : function () {
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
				if (flowApp.flow.selectedBoardGroup != "all")
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
			}
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
				flowApp.removeFlow(flowId);
				flowApp.save()
			};
			UI.dialogue(title, text, null, null, null, "Yes", "Cancel", action);
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

		moveToGroup: function(boardId, target){
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
		}

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
