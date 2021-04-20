/**
 *
 * Description:
 *
 **/
import {FlowApp} from "../Classes/FlowApp.js";
import {UI} from "../Classes/UI.js";
import {ContextualMenu} from "../Classes/ContextualMenu.js";
import {Util} from "../Classes/Util.js";

;

(function ($, d) {
	$(function () {
		window.flowApp = new FlowApp();
		let lastFlow = $.mbStorage.get("lastFlow");
		if (lastFlow != null)
			flowApp.load(lastFlow);
		else
			$.flow.addFlow();

		$.flow.init();

		window.board_list_element_menu = new ContextualMenu(".board-list-element-menu", $.flow.contextualMenu.boardListelement);
		window.flows_menu = new ContextualMenu(".flows-menu", $.flow.contextualMenu.flows, true);
	});

	$.flow = {

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
					name: 'Duplicate', fn: function (target) {
						let boardId = $(target).parent().data("board-id");
						$.flow.duplicateBoard(boardId);
					}
				},
				{},
				{
					name: 'Delete', fn: function (target) {
						let boardId = $(target).parent().data("board-id");
						UI.dialogue("Delete Board", "Are you sure you want to delete<br><b>" + $(target).parent().find(".name").text() + "</b>?", null, null, null, "Yes", "Cancel", () => {
							$.flow.deleteBoard(boardId);
							flowApp.save()
						});
					}
				},
				{},
				{
					name: 'Export', fn: function (target) {
						let boardId = $(target).parent().data("board-id");
						let boardName = $(target).parent().find(".name").text();
						console.debug("Export " + boardId + "  -  " + boardName);
					}
				}

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
					name: 'Delete', fn: function (target) {
						let flowId = $(target).parent().data("flow-id");
						UI.dialogue("Delete Board", "Are you sure you want to delete<br><b>" + $(target).parent().find(".name").text() + "</b>?", null, null, null, "Yes", "Cancel", () => {
							$.flow.deleteBoard(boardId);
							flowApp.save()
						});
					}
				},
				{},
				{
					name: 'Export', fn: function (target) {
						let flowId = $(target).parent().data("flow-id");
						let flowName = $(target).parent().find(".name").text();
						console.debug("Export " + flowId + "  -  " + flowName);
					}
				}
			],
		},

		addFlow: function () {
			let title = "Add a new Flow";
			let text = null;
			let action = function (name) {
				flowApp.addFlow(name);
				$.mbStorage.set("lastFlow", flowApp.flow.id);
				flowApp.save(flowApp.flow.id);
			};
			UI.dialogue(title, text, "flowName", "Flow Name", null, "Add", "Cancel", action);
		},

		openFlow: function () {},

		addBoard: function () {
			let title = "Add a new Board";
			let text = null;
			let action = function (name) {
				flowApp.flow.addBoard(name);
			};
			UI.dialogue(title, text, "boardName", "Board Name", null, "Add", "Cancel", action);
		},

		duplicateBoard: function (boardId) {
			flowApp.flow.duplicateBoard(boardId);
		},

		updateFlowName: function (name) {
			flowApp.flow.updateName(name);
		},

		editFlowName: function (FlowId) {
			let editEl = $(flowApp.ui.placeholders.flowName).find("h1");
			editEl.attr({contentEditable: true});
			editEl.focus();
			Util.selectElementContents(editEl.get(0));
			editEl.one("blur", () => {
				$.flow.updateFlowName(editEl.text());
				editEl.attr({contentEditable: false});
			});
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

		deleteBoard: function (boardId) {
			flowApp.flow.deleteBoard(boardId);
			flowApp.drawer.drawBoardList();
			flowApp.save(flowApp.flow.id);
		}

	};


	Array.prototype.delete = function (el) {
		for (var i = 0; i < this.length; i++) {
			if (this[i] === el) {
				this.splice(i, 1);
				i--;
			}
		}
	};

})(jQuery, document);
