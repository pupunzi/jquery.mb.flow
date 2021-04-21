import {UI} from "./UI.js";
import {Type} from "./Node.js";
import {Board} from "./Board.js";

/**
 *
 * Description:
 *
 **/

export class Drawer {
	constructor(flowApp) {
		this._flowApp = flowApp;
	}

	get flowApp() {
		return this._flowApp;
	}

	updateFlowName() {
		let flow = this.flowApp.flow;
		let content = UI.fillTemplate("flow-name", {
			flowName: flow._name,
			id      : flow._id
		});
		$(this.flowApp.ui.placeholders.flowName).html(content);
	}

	drawBoardList() {
		let flowApp = this.flowApp;
		$(flowApp.ui.placeholders.boardList).empty();

		flowApp.flow._boards.forEach((board) => {
			let selected = "";
			if (board._id === flowApp.flow.selectedBoard._id)
				selected = "selected";
			let content = UI.fillTemplate("board-list-element", {
				boardName : board._name,
				id        : board._id,
				className : selected,
				boardGroup: board._group
			});

			$(content).on("click", () => {
				console.debug(board._id);
				flowApp.flow.selectBoard(board._id);
			});

			$(flowApp.ui.placeholders.boardList).append(content);
		});

		//https://johnny.github.io/jquery-sortable/
		$(flowApp.ui.placeholders.boardList).sortable({
			handle: 'i.icon-drag_indicator',
			onDrop: function ($item, container, _super) {
				_super($item, container);

				let boards = [];

				$(flowApp.ui.placeholders.boardList).children().each(function () {
					let boardId = $(this).data("board-id");
					let board = flowApp.flow.getBoardById(boardId);
					boards.push(board);
				});

				flowApp.flow._boards = boards;
				flowApp.save(flowApp.flow.id);
			}
		});

		//console.debug("selectedBoardGroup", flowApp.flow.selectedBoardGroup);
		$.flow.showBoardsByGroup(flowApp.flow.selectedBoardGroup);
		this.drawBoard();
	}

	drawBoard() {

		let selectedBoard = this.flowApp.flow.selectedBoard;

		if (selectedBoard.length === 0)
			return;

		let board = new Board();
		let selB = selectedBoard;
		for (const property in selB) {
			board[property] = selB[property];
		}
		selectedBoard = board;

		if (selectedBoard._nodes.length === 0) {
			selectedBoard.addNode(Type.start);
		}

		$(this.flowApp.ui.placeholders.board).empty();
		selectedBoard._nodes.forEach((node) => {
			node = JSON.parse(node);
			let nodeElement = UI.fillTemplate("node-" + node._type.toLowerCase(), {
				nodeId    : node._id,
				flowId    : this.flowApp.flow.id,
				boardId   : selectedBoard._id,
				boardGroup: board._group
			});

			//console.debug(nodeElement, this.flowApp.ui.placeholders.board);
			$(this.flowApp.ui.placeholders.board).append(nodeElement);
			$.flow.makeDraggable(node._id);
		})
	}

}
