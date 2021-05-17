import {UI} from "./UI.js";
import {CycleType, Type} from "./Node.js";
import {Util} from "./Util.js";
import {Events, EventType} from "./Events.js";

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

    static drawAvatar(node, options) {
        return window.Avataaars.create(options);
    }

    static getConnectionColorByConnectionType(type) {
        let color = 'gray';
        switch (type) {
            case 0:
                color = '#c7c0b1';
                break;
            case 1:
                color = '#b17330';
                break;
            case 2:
                color = '#588b48';
                break;
            case 3:
                color = '#a82a14';
                break;
            case 4:
                color = '#900961';
                break;
        }

        return color;
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

        $(flowApp.ui.placeholders.boardList).sortable({
            axis: "y",
            handle: 'i.icon-reorder',
            stop: function () {
                let boards = [];
                $(flowApp.ui.placeholders.boardList).children().each(function () {
                    let boardId = $(this).data("board-id");
                    let board = flowApp.flow.getBoardById(boardId);
                    boards.push(board);
                });

                flowApp.flow._boards = boards;

                let board = $.flow.getSelectedBoard();
                Events.register(EventType.updateBoard, board);

            }
        });

        $.flow.showBoardsByGroup(flowApp.flow.selectedBoardGroup);
        this.drawBoard();
        this.drawGrid();
    }

    drawGrid() {
        let grid = flowApp._grid;
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
        let board = $.flow.getSelectedBoard();
        Events.register(EventType.updateBoard, board);

    }

    focusOnSelected() {

        let $board = $(this.flowApp.ui.placeholders.board);
        // let boardX = parseFloat($board.css("left"));
        // let boardY = parseFloat($board.css("top"));

        let nodesId = $.flow.selectedNodes;
        let firstX = 0, firstY = 0;
        let lastX = 0, lastY = 0;
        nodesId.forEach((nodeId) => {
            let $node = $("#node_" + nodeId);
            let x = parseFloat($node.css("left"));
            let y = parseFloat($node.css("top"));

            if ((!firstX && !firstY) || (x < firstX && y < firstY)) {
                firstX = x;
                firstY = y;
            }
            if ((!lastX && !lastY) || (x > lastX && y < lastY)) {
                lastX = x;
                lastY = y;
            }
        });

        $board.css({
            left: ($board.width() / 2) - (firstX + ((lastX - firstX) / 2)),
            top: ($board.height() / 2) - (firstY + ((lastY - firstY) / 2)),
        });
        $.flow.updateConnections();
    }

    drawNode(node) {
        let flowApp = this.flowApp;
        let board = $.flow.getSelectedBoard();
        let lines = "";
        //Draw Node content
        switch (node._type) {
            case Type.text:
            case Type.note:
            case Type.choices:
            case Type.condition:
                node._elements.forEach((element) => {
                    lines += UI.fillTemplate("node-" + node._type.toLowerCase() + "-line", {
                        nodeId: node._id,
                        nodeElementId: element._id,
                        content: this.flowApp.getContentText(element)
                    });
                });
                break;
        }

        let failConnectionsCount = 0;
        node._connections.forEach((connection) => {
            if (connection._type === 3 && node._type === Type.condition)
                failConnectionsCount++;
        });

        let actor = flowApp.flow.getActorById(node._actorId) || flowApp.flow._nullActor;

        let nodeEl = UI.fillTemplate("node-" + node._type.toLowerCase(), {
            nodeId: node._id,
            flowId: this.flowApp.flow.id,
            boardId: this.flowApp.flow.selectedBoardId,
            actorName: actor != null ? actor._name : "",
            avatar: actor != null ? Drawer.drawAvatar(node, actor._avatar._options) : null,
            lines: lines,
            color: actor._color,
            boardGroup: board._group,
            connectionsCount: node._connections.length,
            cycleIcon: node._cycleType === CycleType.list ? "icon-list-ol" : node._cycleType === CycleType.repeat ? "icon-repeat" : node._cycleType === CycleType.random ? "icon-random" : "icon-list-ol",
            failConnectionsCount: failConnectionsCount
        });
        $(this.flowApp.ui.placeholders.board).append(nodeEl);

        node._connections.forEach((connection) => {
            board._connections.push(connection);
        });

        let $node = $(this.flowApp.ui.placeholders.board).find("#node_" + node._id);
        $node.css({
            left: node._x,
            top: node._y
        });

        if ($node.find(".node-content").children().length > 1)
            $node.find(".node-content").sortable({
                handle: 'i.icon-reorder',
                cursorAt: {left: 5},
                axis: "y",
                tolerance: 'pointer',
                cursor: 'grabbing',
                classes: {
                    "ui-sortable": "highlight"
                },
                sort: () => {
                    $.flow.updateConnections();
                },
                stop: () => {
                    let nodeElements = [];
                    $node.find(".node-content").children().each(function () {
                        let nodeElementId = $(this).data("node-element-id");
                        let nodeElement = flowApp.getNodeElementById(node, nodeElementId);
                        nodeElements.push(nodeElement);
                    });
                    node._elements = nodeElements;
                    $.flow.updateConnections();
                    let board = $.flow.getSelectedBoard();
                    Events.register(EventType.updateBoard, board);
                }
            });

        //Update nodeElement content
        //todo: move to flowApp events

        $node.find(".node-text").on("blur", function () {
            $node.data("height", $node.height());
            let content = $(this).html();
            let sanitized = Util.sanitize(content);
            $(this).html(sanitized);
            //Util.addVariables(sanitized);

            let nodeElementId = $(this).parents(".node-content-line").data("node-element-id");

            /**
             * Update Node Element content
             */
            node._elements.forEach((element) => {
                if (element._id === nodeElementId)
                    flowApp.updateContent(element, sanitized);
            });

            Events.register(EventType.updateBoard, board);

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

        $(this.flowApp.ui.placeholders.drawingArea).off("mousedown.nodes").on("mousedown.nodes", (e) => {

            if ($(e.target).parents(".node").length)
                return;

            $(this.flowApp.ui.placeholders.board).find(".node").removeClass("selected");
            $.flow.removeFromSelectedNodes();
        });
    }

    drawConnection(connection, opt = {}) {

        let type = connection._type || 0;
        let color = Drawer.getConnectionColorByConnectionType(type);
        let option = {
            element: $(this.flowApp.ui.placeholders.board).get(0),
            color: color,
            size: 3,
            path: "fluid",
            startPlug: 'square',
            dash: {animation: true}
        };

        $.extend(option, opt);

        let board = this.flowApp.ui.placeholders.board;
        let node = $.flow.getNodeById(connection._from);
        $(board).find("#node_" + connection._from).attr("data-connections-count", node._connections.length);

        let failConnections = 0;
        node._connections.forEach((connection) => {
            if (connection._type === 3 && node._type === Type.condition)
                failConnections++;
        });

        if (node._type === Type.condition && connection._type === 3)
            $(board).find("#node_" + connection._from).attr("data-fail-connection-count", failConnections);

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

    drawDialogue(content, callback, template) {
        let dialogueWindow = UI.fillTemplate(template, {
            dialogueContent: content
        });

        $("body").append(dialogueWindow);
        $(".flow-overlay").find(".cancel").on("click", () => {
            $(".flow-overlay").remove();
        });
        $(".flow-overlay").find(".ok").on("click", () => {
            console.debug("OK")
            content = $(".flow-overlay").find(".dialogue-content").html();
            callback(content);
            $(".flow-overlay").remove();
        })
    }

}
