import {UI} from "./UI.js";
import {Type} from "./Node.js";

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
			id: flow._id
		});
		$(this.flowApp.ui.placeholders.flowName).html(content);
	}

	drawBoardList() {
		let flowApp = this.flowApp;
		$(flowApp.ui.placeholders.boardList).empty();

		flowApp.flow._boards.forEach((board) => {
			let selected = "";
			if (board._id === flowApp.flow.selectedBoardId)
				selected = "selected";
			let content = UI.fillTemplate("board-list-element", {
				boardName: board._name,
				id: board._id,
				className: selected,
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
		let selectedBoardId = this.flowApp.flow.selectedBoardId;

		if (selectedBoardId === null)
			return;

		let SelectedBoard = this.flowApp.flow.getBoardById(selectedBoardId);
		if (SelectedBoard._nodes.length === 0) {
			SelectedBoard.addNode(Type.start);
		}

		$(this.flowApp.ui.placeholders.board).empty();

		SelectedBoard._nodes.forEach((node) => {
			let nodeEl = UI.fillTemplate("node-" + node._type.toLowerCase(), {
				nodeId: node._id,
				flowId: this.flowApp.flow.id,
				boardId: selectedBoardId._id,
				boardGroup: board._group
			});
			//console.debug(nodeEl, this.flowApp.ui.placeholders.board);
			$(this.flowApp.ui.placeholders.board).append(nodeEl);
			let n = $(this.flowApp.ui.placeholders.board).find("#node_" + node._id);
			n.css({
				left: node._x + "px",
				top: node._y + "px"
			});
			//console.debug({left: node._x + "px", top: node._y + "px"})

			$.flow.makeDraggable(node._id, {leftTop:true});
		});
		this.flowApp.save(this.flowApp.id);
	}

}
