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
import {Connection} from "../Classes/Connection.js";

(function ($, d) {
    $(() => {
        //Init Flow
        $.flow.init();
    });

    /*
     * Flow methods
     * ---------------------------------------------------- */
    $.flow = {
        metaKeys: [],
        draggable: [],
        areaSize: {},
        selectedNodes: [],
        latMousePosition: {},

        contextualMenu: {
            //Menu
            boardListElement: (target) => {

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
                            let boardId = $(target).parent().data("board-id");
                            let boardName = $(target).parent().find(".name").text();
                            console.debug("Export board ", boardId);
                        }
                    }
                ];
                items.push({});
                items.push({
                    name: "Move to: ",
                    className: "listTitle"
                });

                let boardId = $(target).parent().data("board-id");
                let board = flowApp.flow.getBoardById(boardId);
                let groups = flowApp.flow.getBoardsGroupsList();
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
                    className: "alert",
                    fn: function (target) {
                        let boardId = $(target).parent().data("board-id");
                        $.flow.deleteBoard(boardId, target);
                    }
                },);

                return items;
            },
            flows: [
                {
                    name: 'Rename',
                    fn: function (target) {
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
                    name: 'Export',
                    className: "highlight",
                    fn: function (target) {
                        let flowId = $(target).parent().data("flow-id");
                        let flowName = $(target).parent().find(".name").text();
                        console.debug("Export " + flowId + "  -  " + flowName);
                    }
                },
                {},
                {
                    name: 'New',
                    className: "highlight",
                    fn: function (target) {
                        $.flow.addFlow();
                    }
                },
                {},
                {
                    name: 'Delete',
                    className: "alert",
                    fn: function (target) {
                        let flowId = $(target).parent().data("flow-id");
                        $.flow.deleteFlow(flowId, target);
                    }
                },
            ],
            boardsGroups: () => {
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

                let groups = flowApp.flow.getBoardsGroupsList();
                groups.forEach((groupName) => {
                    let group = {
                        name: groupName,
                        className: "listElement",
                        fn: function (target) {
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
                    className: "highlight",
                    fn: function (target) {
                        UI.dialogue("Add a new Group for", null, "groupName", "Group name", null, "Add", "Cancel", (name) => {
                            flowApp.flow.addGroup(name);
                            $.flow.showBoardsByGroup(name);
                        });
                    }
                };
                items.push(newGroup);

                return items;
            },
            nodeMenu: (target) => {
                let items = [
                    {
                        name: 'Clone',
                        fn: function (target) {
                            console.debug("Clone")
                        }
                    },
                    {
                        name: 'Delete',
                        className: "alert",
                        fn: function (target, e) {
                            let nodeId = $(target).parents(".node").data("node-id");
                            if (nodeId != null) {
                                let board = $.flow.selectedBoard();
                                board.deleteNodeById(nodeId);
                            }
                        }
                    },
                ];

                let board = $.flow.selectedBoard();
                let nodeId = $(target).parents(".node").data("node-id");
                let node = board.getNodeById(nodeId);

                if(node._connections.length) {
                    items.push({});
                    items.push({
                        name: 'Remove Connections',
                        className: "listTitle"
                    });
                }
                if (nodeId != null) {
                    let connIdx = 0;
                    node._connections.forEach((connection) => {
                        items.push({
                            name: 'Connection ' + ++connIdx,
                            className: "alert",
                            fn: function (target, e) {
                                console.debug(connection);
                                connection._connectionLine.remove();
                                node._connections.delete(connection);
                                board._connections.delete(connection);
                                flowApp.save(flowApp.flow.id);
                            },
                            hoverFn: function (target, e) {
                                connection._connectionLine.setOptions({color:"red"})
                            },
                            outFn: function (target, e) {
                                connection._connectionLine.setOptions({color:"gray"})
                            }
                        })
                    })
                }


                return items;
            },
            variables: () => {
                let items = [];
                let variables = flowApp.flow.getBoardsGroupsList();

                variables.forEach((variable) => {
                    let v = {
                        name: variable._key,
                        className: "listElement",
                        fn: function (target) {

                        }
                    };
                    items.push(v);
                });

                items.push({});

                let editVariables = {
                    name: "Edit Variables",
                    fn: function (target) {
                        let editEl = $(target).parent().find(".name");
                    }
                };
                items.push(editVariables);

                return items;
            },

            //Contextual Menu
            board: [
                {
                    name: 'New Text Node',
                    fn: function (target, e) {
                        let board = $.flow.selectedBoard();
                        board.addNode(Type.text, {_x: e.clientX, _y: e.clientY});
                    }
                },
                {
                    name: 'New Choice Node',
                    fn: function (target, e) {
                        let board = $.flow.selectedBoard();
                        board.addNode(Type.choices, {_x: e.clientX, _y: e.clientY});
                    }
                },
                {
                    name: 'New Random Node',
                    fn: function (target, e) {
                        let board = $.flow.selectedBoard();
                        board.addNode(Type.random, {_x: e.clientX, _y: e.clientY});
                    }
                },
                {
                    name: 'New Note node',
                    fn: function (target, e) {
                        let board = $.flow.selectedBoard();
                        board.addNode(Type.note, {_x: e.clientX, _y: e.clientY});
                    }
                },
                {
                    name: 'New Conditional Node',
                    fn: function (target, e) {
                        let board = $.flow.selectedBoard();
                        board.addNode(Type.condition, {_x: e.clientX, _y: e.clientY});
                    }
                },
            ],
            node: (target) => {
                let items = [
                    {
                        name: 'Clone',
                        fn: function (target) {
                            console.debug("Clone")
                        }
                    },
                    {
                        name: 'Delete',
                        className: "alert",
                        fn: function (target, e) {
                            let nodeId = $(target).parents(".node").data("node-id");
                            if (nodeId != null) {
                                let board = $.flow.selectedBoard();
                                board.deleteNodeById(nodeId);
                            }
                        }
                    },
                ];
                let nodeId = $(target).parents(".node").data("node-id");
                let board = $.flow.selectedBoard();
                let node = board.getNodeById(nodeId);

                if(node._connections.length) {
                    items.push({});
                    items.push({
                        name: 'Remove Connections',
                        className: "listTitle"
                    });
                }

                if (nodeId != null) {
                    let connIdx = 0;
                    node._connections.forEach((connection) => {
                        items.push({
                            name: 'Connection ' + ++connIdx,
                            className: "alert",
                            fn: function (target, e) {
                                console.debug(connection);
                                connection._connectionLine.remove();
                                node._connections.delete(connection);
                                board._connections.delete(connection);
                                flowApp.save(flowApp.flow.id);
                            },
                            hoverFn: function (target, e) {
                                connection._connectionLine.setOptions({color:"red"})
                            },
                            outFn: function (target, e) {
                                connection._connectionLine.setOptions({color:"gray"})
                            }
                        })
                    })
                }


                return items;
            }
        },

        flowApp: () => {
            return flowApp;
        },
        selectedBoard: () => {
            return flowApp.flow.getBoardById(flowApp.flow._selectedBoardId)
        },

        init: () => {
            //Init keys listener
            window.KeyListener = new KeyboardListener();
            //Init Flow App
            window.flowApp = new FlowApp();

            // get last flow opened on previous session
            let lastFlow = $.mbStorage.get("lastFlow");
            if (lastFlow != null)
                flowApp.load(lastFlow);
            else
                $.flow.addFlow();
            //Init Menu
            window.flows_menu = new Menu(".flows-menu", $.flow.contextualMenu.flows, true);
            window.board_list_element_menu = new Menu(".board-list-element-menu", $.flow.contextualMenu.boardListElement, true);
            window.boards_groups = new Menu(".boards-group-menu", $.flow.contextualMenu.boardsGroups, true);
            window.node_menu = new Menu(".node-menu", $.flow.contextualMenu.nodeMenu, true);

            //Init Contextual menu
            window.board_contextual_menu = new ContextualMenu(flowApp.ui.placeholders.drawingArea, $.flow.contextualMenu.board, true);
            window.node_contextual_menu = new ContextualMenu(".node", $.flow.contextualMenu.node, false);
            window.variables_contextual_menu = new ContextualMenu(".variables", $.flow.contextualMenu.variables, true);

            $("body").on("keypress", "[contenteditable]", (e) => {

                switch (e.key) {
                    case "Enter":
                        if ($(e.target).parents(".node").length > 0) {
                            $.flow.updateConnections();
                            if ($.flow.metaKeys.indexOf("Shift") < 0) {
                                e.preventDefault();
                                $(e.target).blur();
                            }

                            return;
                        }

                        e.preventDefault();
                        $(e.target).blur();
                        break;
                    case "Backspace":
                        if ($(e.target).parents(".node").length > 0) {
                            $.flow.updateConnections();
                            return;
                        }
                        break;
                }
            });
            $(document).on("keydown", (e) => {

                if ($.flow.metaKeys.indexOf("Meta") >= 0) {
                    $(".node").draggable("disable");
                    let board = $.flow.selectedBoard();
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

                if ($.flow.metaKeys.indexOf("Control") >= 0) {
                    let board = $.flow.selectedBoard();
                    e.stopPropagation();
                    switch (e.key) {
                        case "n":
                            e.preventDefault();
                            board.addNode(Type.text, {_x: $.flow.latMousePosition.x, _y: $.flow.latMousePosition.y});
                            break;
                    }
                }

            }).on("keyup", () => {
                $(".node").draggable("enable");
            });

            let boardArea = $(flowApp.ui.placeholders.board);
            boardArea[0].style.zoom = 1;
            let pos = {};
            $("body").on("mousedown.drag", (e) => {

                if ($(e.target).parents(".node").length)
                    return;

                if ($.flow.metaKeys.indexOf("Meta") >= 0) {
                    $("body").css("cursor", "grab");
                    pos = {
                        left: boardArea.position().left,
                        top: boardArea.position().top,
                        x: e.clientX,
                        y: e.clientY,
                    };
                } else if ($.flow.metaKeys.indexOf("Shift") >= 0) {
                    //make selection
                    flowApp.drawer.drawSelection(e)
                }

                $("body").on("mousemove.drag", (e) => {

                    $.flow.latMousePosition = {x: e.clientX, y: e.clientY};

                    if ($(e.target).parents(".node").length)
                        return;

                    if ($.flow.metaKeys.indexOf("Meta") >= 0) {
                        $("body").css("cursor", "grabbing");
                        const dx = e.clientX - pos.x;
                        const dy = e.clientY - pos.y;
                        boardArea.css({left: pos.left + dx, top: pos.top + dy});
                        $.flow.updateConnections();
                    } else if ($.flow.metaKeys.indexOf("Shift") >= 0) {
                        flowApp.drawer.drawSelection(e)
                    }
                }).one("mouseup.drag", (e) => {
                    flowApp.drawer.drawSelection(e);
                    $("body").css("cursor", "default");
                    let board = $.flow.getSelectedBoard();
                    board._x = parseFloat(boardArea.css("left"));
                    board._y = parseFloat(boardArea.css("top"));
                    Events.register(EventType.updateBoard, board);
                    $("body").off("mousemove.drag");
                });
            });
        },

        /**
         * Flows Manager
         * */
        addFlow: () => {
            let title = "Add a new Flow";
            let text = null;
            let action = function (name) {
                flowApp.addFlow(name);
                $.mbStorage.set("lastFlow", flowApp.flow.id);
                flowApp.save(flowApp.flow.id);
            };
            UI.dialogue(title, text, "flowName", "Flow Name", null, "Add", "Cancel", action);
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
                flowApp.save()
            };
            UI.dialogue(title, text, null, null, null, "Yes", "Cancel", action, "alert");
        },

        /**
         * Boards Manager
         * */
        getSelectedBoard: () => {
            return flowApp.flow.getBoardById(flowApp.flow.selectedBoardId);
        },
        addBoard: () => {
            let title = "Add a new Board";
            let text = null;
            let action = function (name) {
                flowApp.flow.addBoard(name, flowApp.flow.selectedBoardGroup);
            };
            UI.dialogue(title, text, "boardName", "Board Name", null, "Add", "Cancel", action);
        },
        duplicateBoard: (boardId) => {
            flowApp.flow.duplicateBoard(boardId);
        },
        moveBoardToGroup: (boardId, groupName) => {
            flowApp.flow.moveBoardToGroup(boardId, groupName);
            flowApp.save(flowApp.flow.id);
        },
        editBoardName: (boardId) => {
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
        deleteBoard: (boardId, target) => {
            UI.dialogue("Delete Board", "Are you sure you want to delete<br><b>" + $(target).parent().find(".name").text() + "</b>?", null, null, null, "Yes", "Cancel", () => {
                flowApp.flow.deleteBoard(boardId);
                flowApp.drawer.drawBoardList();
                flowApp.save(flowApp.flow.id);
            }, "alert");
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

        /**
         * Connections
         */
        makeNodeDraggableAndLinkable: (nodeId) => {

            let $node = $("#node_" + nodeId);
            let nodeEl = $node.get(0);

            let board = $.flow.getSelectedBoard();
            let node = board.getNodeById(nodeId);

            $node.draggable({
                handle: $node.find(".menu").length ? ".menu" : null,
                // distance: 10,
                cursor: "grabbing",
                opacity: 0.7,
                snap: ".vline, .hline",
                // snapTolerance: 50,
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

            let anchorOut = $node.is(".anchorOut") ? $node : $node.find(".anchorOut");
            anchorOut.on("mousedown", function (e) {
                if ($.flow.metaKeys.indexOf("Meta") >= 0) {
                    e.stopPropagation();
                    let startEl = $node.is(".anchorOut") ? anchorOut : anchorOut.find(".anchor");

                    let drawingArea = $(flowApp.ui.placeholders.board);

                    let fakeEl = $("<div id='fakeEl'>").css({
                            position: "absolute",
                            width: 10,
                            height: 10,
                            background: "red",
                            zIndex: -100,
                            left: e.clientX - drawingArea.position().left,
                            top: e.clientY - drawingArea.position().top,
                        }
                    );

                    fakeEl.appendTo(flowApp.ui.placeholders.board);
                    anchorOut.get(0).line = $.flow.LeaderLine(startEl, fakeEl, {color: 'orange', size: 3});

                    $(document).on("mousemove.line", (e) => {
                        fakeEl.css({
                            left: e.clientX - drawingArea.position().left,
                            top: e.clientY - drawingArea.position().top
                        });
                        anchorOut.get(0).line.position();

                    }).one("mouseup", (e) => {

                        $(document).off("mousemove.line");

                        fakeEl.remove();
                        anchorOut.get(0).line.remove();

                        let toEl = $(e.target).parents(".node");
                        let connection = new Connection(
                            null,
                            anchorOut.data("node-id"),
                            anchorOut.data("node-element-id"),
                            toEl.data("node-id")
                        );

                        Events.register(EventType.addConnection, connection);
                    });
                }
            });
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

        /**
         * Node
         */
        getNodeById: (nodeId) => {
            let board = $.flow.getSelectedBoard();
            return board.getNodeById(nodeId);
        },
        addToSelectedNodes: function (nodeId, multi = false) {
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
        removeFromSelectedNodes: function (nodeId = null) {
            if (nodeId)
                $.flow.selectedNodes.delete(nodeId);
            else
                $.flow.selectedNodes = [];
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

    function insertTextAtCaret(text) {
        var sel, range;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(text));
            }
        } else if (document.selection && document.selection.createRange) {
            document.selection.createRange().text = text;
        }
    }

})(jQuery, document);
