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

            $(content).on("click", (e) => {
                console.debug(board._id);
                flowApp.flow.selectBoard(board._id);
                e.stopPropagation();
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
        this.drawGrid();
    }

    drawGrid() {
        let grid = 70;
        let gridN = $(window).width() / grid;
        $(this.flowApp.ui.placeholders.grid).empty();

        for (let i = 0; i < gridN; i++) {
            let vline = $("<div>").addClass("vline");
            vline.css({left: grid * i});
            $(this.flowApp.ui.placeholders.grid).append(vline);

            let hline = $("<div>").addClass("hline");
            hline.css({top: grid * i});
            $(this.flowApp.ui.placeholders.grid).append(hline);
        }
    }

    drawBoard() {
        let selectedBoardId = this.flowApp.flow.selectedBoardId;

        if (selectedBoardId === null)
            return;

        let selectedBoard = this.flowApp.flow.getBoardById(selectedBoardId);

        $(this.flowApp.ui.placeholders.board).css({left: selectedBoard._x, top: selectedBoard._y});

        //If there are no nodes in this board create one
        if (selectedBoard._nodes.length === 0) {
            selectedBoard.addNode(Type.start);
        }

        //Empty the board from previous nodes
        $(this.flowApp.ui.placeholders.board).empty();
        $("body svg").remove();

        //draw each node
        selectedBoard._connections = [];
        selectedBoard._nodes.forEach((node) => {
            this.drawNode(node);
        });

        //Connect Nodes
        selectedBoard._connections.forEach((connection) => {
            this.drawConnection(connection)
        });

        //Save the flow
        this.flowApp.save(this.flowApp.id);
    }

    drawNode(node) {
        let board = $.flow.getSelectedBoard();
        let flowApp = this.flowApp;

        let lines = "";
        //Draw Node content
        switch (node._type) {
            case Type.text:
            case Type.choices:
            case Type.condition:
                node._elements.forEach((element) => {
                    lines += UI.fillTemplate("node-" + node._type.toLowerCase() + "-line", {
                        nodeId: node._id,
                        nodeElementId: element._id,
                        content: element._content
                    });
                });
                break;
        }

        let nodeEl = UI.fillTemplate("node-" + node._type.toLowerCase(), {
            nodeId: node._id,
            flowId: this.flowApp.flow.id,
            boardId: this.flowApp.flow.selectedBoardId,
            lines: lines,
            boardGroup: board._group,
            connectionsCount: node._connections.length
        });

        $(this.flowApp.ui.placeholders.board).append(nodeEl);

        node._connections.forEach((connection) => {
            board._connections.push(connection);
        });

        let $node = $(this.flowApp.ui.placeholders.board).find("#node_" + node._id);
        $node.css({
            left: node._x + "px",
            top: node._y + "px"
        });

        //Update nodeElement content
        $node.find(".node-text").on("blur", function () {
            let sanitized = $(this).html().replace(/<div>/g, '<br>').replace(/<\/div>/g, '');
            $(this).html(sanitized);

            UI.getVariables(sanitized);

            let nodeElementId = $(this).parents(".node-content-line").data("node-element-id");
            node._elements.forEach((element) => {
                if (element._id === nodeElementId)
                    element._content = sanitized;
            });

            flowApp.save(flowApp.flow.id);
        });

        $.flow.makeNodeDraggableAndLinkable(node._id, {leftTop: true});

        $node.on("mouseup", (e) => {
            let isMulti = $.flow.metaKeys.indexOf("Shift") >= 0 || $.flow.selectedNodes.length > 1;
            if (!isMulti) {
                $(this.flowApp.ui.placeholders.board).find(".node").removeClass("selected");
            }
            $node.addClass("selected");
            let nodeId = $node.data("node-id");
            $.flow.addToSelectedNodes(nodeId, isMulti);
        });

        $(this.flowApp.ui.placeholders.board).off("mousedown.nodes").on("mousedown.nodes", (e) => {

            if ($(e.target).parents(".node").length)
                return;

            $(this.flowApp.ui.placeholders.board).find(".node").removeClass("selected");
            // let nodeId = $node.data("node-id");
            // let board = this.flowApp.flow.getBoardById(this.flowApp.flow._selectedBoardId);
            $.flow.removeFromSelectedNodes();
        });
    }

    drawConnection(connection, opt = {}) {
        let option = {
            element: $(this.flowApp.ui.placeholders.board).get(0),
            color: 'gray',
            size: 3,
            path: "fluid",
            startPlug: 'square',
            dash: {animation: true}
        };

        $.extend(option,opt);

        let board = this.flowApp.ui.placeholders.board;
        let node = $.flow.getNodeById(connection._from);
        $(board).find("#node_" + connection._from).attr("data-connections-count", node._connections.length);

        let fromNode = null;

        if (connection._nodeElementId !== undefined) { //&& node._type !== Type.text && node._type !== Type.note
            fromNode = $(board).find("[data-node-element-id=\"" + connection._nodeElementId + "\"] .anchor");
        } else {
            fromNode = $(board).find("#node_" + connection._from);
        }
        let toNode = $(board).find("#node_" + connection._to);

        let line = null;

        if (fromNode.get(0) != null && toNode.get(0) != null) {
            line = $.flow.LeaderLine(fromNode, toNode, option);
        }
        connection._connectionLine = line;

        return line;
    }

    drawSelection(e) {

        if (e.type === "mousedown") {

            if ($(e.target).parents(".node").length)
                return;

            $("#selection").remove();

            let selection = $("<div>").attr({id: "selection"});

            this.startX = e.clientX;
            this.startY = e.clientY;
            selection.css({
                left: this.startX,
                top: this.startY
            });

            $("body").append(selection);
        }

        if (e.type === "mousemove") {
            let x = e.clientX;
            let y = e.clientY;
            let width = x - this.startX;
            let height = y - this.startY;

            $("#selection").css({
                width: width,
                height: height
            });

            let topLeft = {x: this.startX, y: this.startY};
            let bottomRight = {x: this.startX + width, y: this.startY + height};

            this.checkForSelectedNode(topLeft, bottomRight);

        }

        if (e.type === "mouseup") {
            $("#selection").remove();

        }
    }

    //todo: check which nodes are selected
    checkForSelectedNode(topLeft, bottomRight) {
        let board = $.flow.selectedBoard();
        let nodes = board._nodes;
        let drawingAreaX = parseFloat($(this.flowApp.ui.placeholders.board).css("left"));
        let drawingAreaY = parseFloat($(this.flowApp.ui.placeholders.board).css("top"));
        let selectionTopX = topLeft.x + drawingAreaX;
        let selectionTopY = topLeft.y + drawingAreaY;
        let selectionBottomX = bottomRight.x + drawingAreaX;
        let selectionBottomY = bottomRight.y + drawingAreaY;

        nodes.forEach((node) => {
            let $node = $(this.flowApp.ui.placeholders.board).find("#node_" + node._id);
            let nodeTopX = $node.offset().left + drawingAreaX;
            let nodeTopY = $node.offset().top + drawingAreaY;
            let nodeBottomX = nodeTopX + $node.width();
            let nodeBottomY = nodeTopY + $node.height();

            if ((nodeTopX > selectionTopX && nodeTopY > selectionTopY)
                && (nodeBottomX < selectionBottomX && nodeBottomY < selectionBottomY)) {
                $node.addClass("selected");
                let nodeId = $node.data("node-id");
                $.flow.addToSelectedNodes(nodeId, true);
            } else {
                $node.removeClass("selected");
                let nodeId = $node.data("node-id");
                $.flow.removeFromSelectedNodes(nodeId);
            }
        })

    }

}
