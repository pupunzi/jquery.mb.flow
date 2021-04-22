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

		$.flow.showBoardsByGroup(flowApp.flow.selectedBoardGroup);
		this.drawBoard();
	}

	drawBoard() {

		let selectedBoardId = this.flowApp.flow.selectedBoardId;
		if (selectedBoardId === null)
			return;

		let SelectedBoard = this.flowApp.flow.getBoardById(selectedBoardId);

		//If there are no nodes in this board create one
		if (SelectedBoard._nodes.length === 0) {
			SelectedBoard.addNode(Type.start);
		}

		//Empty the board from previous nodes
		$(this.flowApp.ui.placeholders.board).empty();

		//draw each node
		SelectedBoard._nodes.forEach((node) => {
			this.drawNode(node);
		});

		//Save the flow
		this.flowApp.save(this.flowApp.id);
	}

	drawNode(node){
		let nodeEl = UI.fillTemplate("node-" + node._type.toLowerCase(), {
			nodeId: node._id,
			flowId: this.flowApp.flow.id,
			boardId: this.flowApp.flow.selectedBoardId,
			boardGroup: board._group
		});
		$(this.flowApp.ui.placeholders.board).append(nodeEl);
		let $node = $(this.flowApp.ui.placeholders.board).find("#node_" + node._id);
		$node.css({
			left: node._x + "px",
			top: node._y + "px"
		});

		$.flow.makeDraggable(node._id, {leftTop:true});

		$node.on("mouseup", (e)=>{
			$(this.flowApp.ui.placeholders.board).find(".node").removeClass("selected");
			$node.addClass("selected");
		});

		$(this.flowApp.ui.placeholders.board).on("mousedown", ()=>{
			$(this.flowApp.ui.placeholders.board).find(".node").removeClass("selected");
		})
	}
}
