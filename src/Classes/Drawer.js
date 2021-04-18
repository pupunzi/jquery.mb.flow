import {UI} from "./UI.js";

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
        let content = UI.fillTemplate("flow-name", {flowName: flow._name, id: "flow_" + flow._id});
        $(this.flowApp.ui.placeholders.flowName).html(content);
    }

    drawBoardList() {
        let flowApp = this.flowApp;
        $(flowApp.ui.placeholders.boardList).empty();

        if (flowApp.flow._boards.length === 0) {
            let board = flowApp.flow.addBoard("My Board");
            flowApp.flow.selectBoard(board);
        }

        flowApp.flow._boards.forEach((board) => {
            let content = UI.fillTemplate("board-list-element", {boardName: board._name, id: board._id});
            $(this.flowApp.ui.placeholders.boardList).append(content);
           // new ContextMenu('#board_' + board._id + " .name", $.flow.contextualMenu.boardListelement);
        })

    }


}
