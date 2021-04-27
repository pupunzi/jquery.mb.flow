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

        window.flowApp = new FlowApp();

        // get last flow opened on previous session
        let lastFlow = $.mbStorage.get("lastFlow");
        if (lastFlow != null)
            flowApp.load(lastFlow);
        else
            $.flow.addFlow();

        //Init Flow
        $.flow.init();

    });

    /*
     * Flow methods
     * ---------------------------------------------------- */
    $.flow = {
        flowApp: () => {
            return flowApp;
        },
        selectedBoard: () => {
            return flowApp.flow.getBoardById(flowApp.flow._selectedBoardId)
        },

        global:{},

        metaKeys: [],
        draggable: [],
        areaSize: {},

        init: () => {

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


            let pos = {};
            let drawingArea = $("#draw-area");
            drawingArea[0].style.zoom = 1;

            $(document).on("keydown", (e) => {
                if ($.flow.metaKeys.indexOf("Meta") >= 0) {
                    switch (e.key) {
                        case "0":
                            e.preventDefault();
                            // drawingArea[0].style.zoom = 1;
                            //$("svg").appendTo("body");
                            break;
                        case "-":
                            e.preventDefault();
                            //drawingArea[0].style.zoom -= .1;
                            //$("svg").appendTo(flowApp.ui.placeholders.connections);
                            break;
                        case "+":
                            e.preventDefault();
                            //drawingArea[0].style.zoom = 1;
                            //$("svg").appendTo("body");
                            break;
                    }
                }
            });

            $(document).on("mousedown", (e) => {
                if ($.flow.metaKeys.indexOf("Meta") >= 0) {
                    drawingArea[0].style.cursor = 'grab';
                    pos = {
                        left: drawingArea.position().left,
                        top: drawingArea.position().top,
                        x: e.clientX,
                        y: e.clientY,
                    };
                }

                $(drawingArea).on("mousemove", (e) => {
                    if ($.flow.metaKeys.indexOf("Meta") >= 0) {
                        drawingArea[0].style.cursor = 'grabbing';
                        const dx = e.clientX - pos.x;
                        const dy = e.clientY - pos.y;
                        $(drawingArea).css({left: pos.left + dx, top: pos.top + dy});
                        $.flow.updateConnections();
                    }
                }).one("mouseup", () => {
                    drawingArea[0].style.cursor = 'default';
                    let board = $.flow.getSelectedBoard();
                    board._x = parseFloat($(drawingArea).css("left"));
                    board._y = parseFloat($(drawingArea).css("top"));

                    Events.register(EventType.updateBoard, board);

                    $("#draw-area").off("mousemove");
                });
            });

            //Init Menu
            window.flows_menu = new Menu(".flows-menu", $.flow.contextualMenu.flows, true);
            window.board_list_element_menu = new Menu(".board-list-element-menu", $.flow.contextualMenu.boardListElement);
            window.boards_groups = new Menu(".boards-group-menu", $.flow.contextualMenu.boardsGroups, true);
            window.node_menu = new Menu(".node-menu", $.flow.contextualMenu.nodeMenu, true);

            //Init Contextual menu
            window.board = new ContextualMenu(flowApp.ui.placeholders.board, $.flow.contextualMenu.board, true);
            window.board = new ContextualMenu(".node", $.flow.contextualMenu.node, true);
            window.variables_menu = new ContextualMenu(".variables", $.flow.contextualMenu.variables, true);

            //Init keys listener
            window.KeyListener = new KeyboardListener();
        },

        setAreaSize: () => {

        },

        contextualMenu: {
            boardListElement: [
                {
                    name: 'Rename',
                    fn: function (target) {
                        let boardId = $(target).parent().data("board-id");
                        $.flow.editBoardName(boardId);
                    }
                },
                {
                    name: 'Change Group',
                    fn: function (target) {
                        let boardId = $(target).parent().data("board-id");
                        $.flow.moveToGroup(boardId);
                    }
                },
                {
                    name: 'Duplicate',
                    fn: function (target) {
                        let boardId = $(target).parent().data("board-id");
                        $.flow.duplicateBoard(boardId);
                    }
                },
                {},
                {
                    name: 'Export',
                    className: "highlight",
                    fn: function (target) {
                        let boardId = $(target).parent().data("board-id");
                        let boardName = $(target).parent().find(".name").text();
                        console.debug("Export board ", boardId);
                    }
                },
                {
                    name: 'Delete',
                    className: "alert",
                    fn: function (target) {
                        let boardId = $(target).parent().data("board-id");
                        $.flow.deleteBoard(boardId, target);
                    }
                },
            ],
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
                let groups = flowApp.flow.getBoardsGroupsList();

                let showAll = {
                    name: "Show All",
                    fn: function (target) {
                        flowApp.flow.selectedBoardGroup = "all";
                        $.flow.showBoardsByGroup("all");
                    }
                };
                items.push(showAll);

                items.push({});

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
            nodeMenu: [
                {
                    name: 'Add Line',
                    fn: function (target) {
                        console.debug("Add Line", $(target).parents(".node"));
                    }
                },
                {
                    name: 'Clone', fn: function (target) {
                        console.log('Clone', $(target).parents(".node").data("node-id"));
                        let nodeId = $(target).parents(".node").data("node-id");
                        if (nodeId != null) {
                            let board = $.flow.selectedBoard();
                            //let node = board.deleteNodeById(nodeId);
                            console.debug(node);
                        }
                    }
                },
                {
                    name: 'Delete',
                    className: "alert",
                    fn: function (target) {
                        console.log('Clone', $(target).parents(".node").data("node-id"));
                        let nodeId = $(target).parents(".node").data("node-id");
                        if (nodeId != null) {
                            let board = $.flow.selectedBoard();
                            let node = board.deleteNodeById(nodeId);
                            console.debug(node);
                        }
                    }
                },
            ],

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
            node: [
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

                        // console.log('Delete', target);
                        // console.log('Delete', $(target).parents(".node").data("node-id"));

                        let nodeId = $(target).parents(".node").data("node-id");
                        if (nodeId != null) {
                            let board = $.flow.selectedBoard();
                            let node = board.deleteNodeById(nodeId);
                        }

                    }
                },
            ]
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

        moveToGroup: (boardId, target) => {
            console.log("Mover to Group");
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

        makeNodeDraggableAndLinkable: (nodeId) => {

            let $node = $("#node_" + nodeId);
            let nodeEl = $node.get(0);

            let board = $.flow.getSelectedBoard();
            let node = board.getNodeById(nodeId);

            $.flow.draggable["node_" + nodeId] = new PlainDraggable(nodeEl);
            $.flow.draggable["node_" + nodeId].handle = $node.find(".menu").get(0);
            $.flow.draggable["node_" + nodeId].snap = {step: 20};
            $.flow.draggable["node_" + nodeId].autoScroll = true;
            $.flow.draggable["node_" + nodeId].onDrag = () => {
                $.flow.updateConnections();
            };

            $.flow.draggable["node_" + nodeId].onDragEnd = () => {
                node._x = $(nodeEl).position().left;
                node._y = $(nodeEl).position().top;
                Events.register(EventType.updateNode, node);
            };

            let anchorOut = $node.is(".anchorOut") ? $node : $node.find(".anchorOut");
            anchorOut.on("mousedown", (e) => {

                if ($.flow.metaKeys.indexOf("Meta") >= 0) {
                    $.flow.draggable["node_" + nodeId].disabled = true;
                    e.preventDefault();
                    e.stopPropagation();
                    let startEl = $node.is(".anchorOut") ? anchorOut : anchorOut.find(".anchor");

                    let drawingArea = $("#draw-area");

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

                        $.flow.draggable["node_" + nodeId].disabled = false;
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

/* ===================================================
 *  jquery-sortable.js v0.9.13
 *  http://johnny.github.com/jquery-sortable/
 * ===================================================
 *  Copyright (c) 2012 Jonas von Andrian
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *  * The name of the author may not be used to endorse or promote products
 *    derived from this software without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 *  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 *  DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 *  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 *  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 *  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 *  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 *  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 *  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * ========================================================== */


!function ( $, window, pluginName, undefined){
  var containerDefaults = {
    // If true, items can be dragged from this container
    drag: true,
    // If true, items can be droped onto this container
    drop: true,
    // Exclude items from being draggable, if the
    // selector matches the item
    exclude: "",
    // If true, search for nested containers within an item.If you nest containers,
    // either the original selector with which you call the plugin must only match the top containers,
    // or you need to specify a group (see the bootstrap nav example)
    nested: true,
    // If true, the items are assumed to be arranged vertically
    vertical: true
  }, // end container defaults
  groupDefaults = {
    // This is executed after the placeholder has been moved.
    // $closestItemOrContainer contains the closest item, the placeholder
    // has been put at or the closest empty Container, the placeholder has
    // been appended to.
    afterMove: function ($placeholder, container, $closestItemOrContainer) {
    },
    // The exact css path between the container and its items, e.g. "> tbody"
    containerPath: "",
    // The css selector of the containers
    containerSelector: "ol, ul",
    // Distance the mouse has to travel to start dragging
    distance: 0,
    // Time in milliseconds after mousedown until dragging should start.
    // This option can be used to prevent unwanted drags when clicking on an element.
    delay: 0,
    // The css selector of the drag handle
    handle: "",
    // The exact css path between the item and its subcontainers.
    // It should only match the immediate items of a container.
    // No item of a subcontainer should be matched. E.g. for ol>div>li the itemPath is "> div"
    itemPath: "",
    // The css selector of the items
    itemSelector: "li",
    // The class given to "body" while an item is being dragged
    bodyClass: "dragging",
    // The class giving to an item while being dragged
    draggedClass: "dragged",
    // Check if the dragged item may be inside the container.
    // Use with care, since the search for a valid container entails a depth first search
    // and may be quite expensive.
    isValidTarget: function ($item, container) {
      return true
    },
    // Executed before onDrop if placeholder is detached.
    // This happens if pullPlaceholder is set to false and the drop occurs outside a container.
    onCancel: function ($item, container, _super, event) {
    },
    // Executed at the beginning of a mouse move event.
    // The Placeholder has not been moved yet.
    onDrag: function ($item, position, _super, event) {
      $item.css(position)
    },
    // Called after the drag has been started,
    // that is the mouse button is being held down and
    // the mouse is moving.
    // The container is the closest initialized container.
    // Therefore it might not be the container, that actually contains the item.
    onDragStart: function ($item, container, _super, event) {
      $item.css({
        height: $item.outerHeight(),
        width: $item.outerWidth()
      })
      $item.addClass(container.group.options.draggedClass)
      $("body").addClass(container.group.options.bodyClass)
    },
    // Called when the mouse button is being released
    onDrop: function ($item, container, _super, event) {
      $item.removeClass(container.group.options.draggedClass).removeAttr("style")
      $("body").removeClass(container.group.options.bodyClass)
    },
    // Called on mousedown. If falsy value is returned, the dragging will not start.
    // Ignore if element clicked is input, select or textarea
    onMousedown: function ($item, _super, event) {
      if (!event.target.nodeName.match(/^(input|select|textarea)$/i)) {
        event.preventDefault()
        return true
      }
    },
    // The class of the placeholder (must match placeholder option markup)
    placeholderClass: "placeholder",
    // Template for the placeholder. Can be any valid jQuery input
    // e.g. a string, a DOM element.
    // The placeholder must have the class "placeholder"
    placeholder: '<li class="placeholder"></li>',
    // If true, the position of the placeholder is calculated on every mousemove.
    // If false, it is only calculated when the mouse is above a container.
    pullPlaceholder: true,
    // Specifies serialization of the container group.
    // The pair $parent/$children is either container/items or item/subcontainers.
    serialize: function ($parent, $children, parentIsContainer) {
      var result = $.extend({}, $parent.data())

      if(parentIsContainer)
        return [$children]
      else if ($children[0]){
        result.children = $children
      }

      delete result.subContainers
      delete result.sortable

      return result
    },
    // Set tolerance while dragging. Positive values decrease sensitivity,
    // negative values increase it.
    tolerance: 0
  }, // end group defaults
  containerGroups = {},
  groupCounter = 0,
  emptyBox = {
    left: 0,
    top: 0,
    bottom: 0,
    right:0
  },
  eventNames = {
    start: "touchstart.sortable mousedown.sortable",
    drop: "touchend.sortable touchcancel.sortable mouseup.sortable",
    drag: "touchmove.sortable mousemove.sortable",
    scroll: "scroll.sortable"
  },
  subContainerKey = "subContainers"

  /*
   * a is Array [left, right, top, bottom]
   * b is array [left, top]
   */
  function d(a,b) {
    var x = Math.max(0, a[0] - b[0], b[0] - a[1]),
    y = Math.max(0, a[2] - b[1], b[1] - a[3])
    return x+y;
  }

  function setDimensions(array, dimensions, tolerance, useOffset) {
    var i = array.length,
    offsetMethod = useOffset ? "offset" : "position"
    tolerance = tolerance || 0

    while(i--){
      var el = array[i].el ? array[i].el : $(array[i]),
      // use fitting method
      pos = el[offsetMethod]()
      pos.left += parseInt(el.css('margin-left'), 10)
      pos.top += parseInt(el.css('margin-top'),10)
      dimensions[i] = [
        pos.left - tolerance,
        pos.left + el.outerWidth() + tolerance,
        pos.top - tolerance,
        pos.top + el.outerHeight() + tolerance
      ]
    }
  }

  function getRelativePosition(pointer, element) {
    var offset = element.offset()
    return {
      left: pointer.left - offset.left,
      top: pointer.top - offset.top
    }
  }

  function sortByDistanceDesc(dimensions, pointer, lastPointer) {
    pointer = [pointer.left, pointer.top]
    lastPointer = lastPointer && [lastPointer.left, lastPointer.top]

    var dim,
    i = dimensions.length,
    distances = []

    while(i--){
      dim = dimensions[i]
      distances[i] = [i,d(dim,pointer), lastPointer && d(dim, lastPointer)]
    }
    distances = distances.sort(function  (a,b) {
      return b[1] - a[1] || b[2] - a[2] || b[0] - a[0]
    })

    // last entry is the closest
    return distances
  }

  function ContainerGroup(options) {
    this.options = $.extend({}, groupDefaults, options)
    this.containers = []

    if(!this.options.rootGroup){
      this.scrollProxy = $.proxy(this.scroll, this)
      this.dragProxy = $.proxy(this.drag, this)
      this.dropProxy = $.proxy(this.drop, this)
      this.placeholder = $(this.options.placeholder)

      if(!options.isValidTarget)
        this.options.isValidTarget = undefined
    }
  }

  ContainerGroup.get = function  (options) {
    if(!containerGroups[options.group]) {
      if(options.group === undefined)
        options.group = groupCounter ++

      containerGroups[options.group] = new ContainerGroup(options)
    }

    return containerGroups[options.group]
  }

  ContainerGroup.prototype = {
    dragInit: function  (e, itemContainer) {
      this.$document = $(itemContainer.el[0].ownerDocument)

      // get item to drag
      var closestItem = $(e.target).closest(this.options.itemSelector);
      // using the length of this item, prevents the plugin from being started if there is no handle being clicked on.
      // this may also be helpful in instantiating multidrag.
      if (closestItem.length) {
        this.item = closestItem;
        this.itemContainer = itemContainer;
        if (this.item.is(this.options.exclude) || !this.options.onMousedown(this.item, groupDefaults.onMousedown, e)) {
            return;
        }
        this.setPointer(e);
        this.toggleListeners('on');
        this.setupDelayTimer();
        this.dragInitDone = true;
      }
    },
    drag: function  (e) {
      if(!this.dragging){
        if(!this.distanceMet(e) || !this.delayMet)
          return

        this.options.onDragStart(this.item, this.itemContainer, groupDefaults.onDragStart, e)
        this.item.before(this.placeholder)
        this.dragging = true
      }

      this.setPointer(e)
      // place item under the cursor
      this.options.onDrag(this.item,
                          getRelativePosition(this.pointer, this.item.offsetParent()),
                          groupDefaults.onDrag,
                          e)

      var p = this.getPointer(e),
      box = this.sameResultBox,
      t = this.options.tolerance

      if(!box || box.top - t > p.top || box.bottom + t < p.top || box.left - t > p.left || box.right + t < p.left)
        if(!this.searchValidTarget()){
          this.placeholder.detach()
          this.lastAppendedItem = undefined
        }
    },
    drop: function  (e) {
      this.toggleListeners('off')

      this.dragInitDone = false

      if(this.dragging){
        // processing Drop, check if placeholder is detached
        if(this.placeholder.closest("html")[0]){
          this.placeholder.before(this.item).detach()
        } else {
          this.options.onCancel(this.item, this.itemContainer, groupDefaults.onCancel, e)
        }
        this.options.onDrop(this.item, this.getContainer(this.item), groupDefaults.onDrop, e)

        // cleanup
        this.clearDimensions()
        this.clearOffsetParent()
        this.lastAppendedItem = this.sameResultBox = undefined
        this.dragging = false
      }
    },
    searchValidTarget: function  (pointer, lastPointer) {
      if(!pointer){
        pointer = this.relativePointer || this.pointer
        lastPointer = this.lastRelativePointer || this.lastPointer
      }

      var distances = sortByDistanceDesc(this.getContainerDimensions(),
                                         pointer,
                                         lastPointer),
      i = distances.length

      while(i--){
        var index = distances[i][0],
        distance = distances[i][1]

        if(!distance || this.options.pullPlaceholder){
          var container = this.containers[index]
          if(!container.disabled){
            if(!this.$getOffsetParent()){
              var offsetParent = container.getItemOffsetParent()
              pointer = getRelativePosition(pointer, offsetParent)
              lastPointer = getRelativePosition(lastPointer, offsetParent)
            }
            if(container.searchValidTarget(pointer, lastPointer))
              return true
          }
        }
      }
      if(this.sameResultBox)
        this.sameResultBox = undefined
    },
    movePlaceholder: function  (container, item, method, sameResultBox) {
      var lastAppendedItem = this.lastAppendedItem
      if(!sameResultBox && lastAppendedItem && lastAppendedItem[0] === item[0])
        return;

      item[method](this.placeholder)
      this.lastAppendedItem = item
      this.sameResultBox = sameResultBox
      this.options.afterMove(this.placeholder, container, item)
    },
    getContainerDimensions: function  () {
      if(!this.containerDimensions)
        setDimensions(this.containers, this.containerDimensions = [], this.options.tolerance, !this.$getOffsetParent())
      return this.containerDimensions
    },
    getContainer: function  (element) {
      return element.closest(this.options.containerSelector).data(pluginName)
    },
    $getOffsetParent: function  () {
      if(this.offsetParent === undefined){
        var i = this.containers.length - 1,
        offsetParent = this.containers[i].getItemOffsetParent()

        if(!this.options.rootGroup){
          while(i--){
            if(offsetParent[0] != this.containers[i].getItemOffsetParent()[0]){
              // If every container has the same offset parent,
              // use position() which is relative to this parent,
              // otherwise use offset()
              // compare #setDimensions
              offsetParent = false
              break;
            }
          }
        }

        this.offsetParent = offsetParent
      }
      return this.offsetParent
    },
    setPointer: function (e) {
      var pointer = this.getPointer(e)

      if(this.$getOffsetParent()){
        var relativePointer = getRelativePosition(pointer, this.$getOffsetParent())
        this.lastRelativePointer = this.relativePointer
        this.relativePointer = relativePointer
      }

      this.lastPointer = this.pointer
      this.pointer = pointer
    },
    distanceMet: function (e) {
      var currentPointer = this.getPointer(e)
      return (Math.max(
        Math.abs(this.pointer.left - currentPointer.left),
        Math.abs(this.pointer.top - currentPointer.top)
      ) >= this.options.distance)
    },
    getPointer: function(e) {
      var o = e.originalEvent || e.originalEvent.touches && e.originalEvent.touches[0]
      return {
        left: e.pageX || o.pageX,
        top: e.pageY || o.pageY
      }
    },
    setupDelayTimer: function () {
      var that = this
      this.delayMet = !this.options.delay

      // init delay timer if needed
      if (!this.delayMet) {
        clearTimeout(this._mouseDelayTimer);
        this._mouseDelayTimer = setTimeout(function() {
          that.delayMet = true
        }, this.options.delay)
      }
    },
    scroll: function  (e) {
      this.clearDimensions()
      this.clearOffsetParent() // TODO is this needed?
    },
    toggleListeners: function (method) {
      var that = this,
      events = ['drag','drop','scroll']

      $.each(events,function  (i,event) {
        that.$document[method](eventNames[event], that[event + 'Proxy'])
      })
    },
    clearOffsetParent: function () {
      this.offsetParent = undefined
    },
    // Recursively clear container and item dimensions
    clearDimensions: function  () {
      this.traverse(function(object){
        object._clearDimensions()
      })
    },
    traverse: function(callback) {
      callback(this)
      var i = this.containers.length
      while(i--){
        this.containers[i].traverse(callback)
      }
    },
    _clearDimensions: function(){
      this.containerDimensions = undefined
    },
    _destroy: function () {
      containerGroups[this.options.group] = undefined
    }
  }

  function Container(element, options) {
    this.el = element
    this.options = $.extend( {}, containerDefaults, options)

    this.group = ContainerGroup.get(this.options)
    this.rootGroup = this.options.rootGroup || this.group
    this.handle = this.rootGroup.options.handle || this.rootGroup.options.itemSelector

    var itemPath = this.rootGroup.options.itemPath
    this.target = itemPath ? this.el.find(itemPath) : this.el

    this.target.on(eventNames.start, this.handle, $.proxy(this.dragInit, this))

    if(this.options.drop)
      this.group.containers.push(this)
  }

  Container.prototype = {
    dragInit: function  (e) {
      var rootGroup = this.rootGroup

      if( !this.disabled &&
          !rootGroup.dragInitDone &&
          this.options.drag &&
          this.isValidDrag(e)) {
        rootGroup.dragInit(e, this)
      }
    },
    isValidDrag: function(e) {
      return e.which == 1 ||
        e.type == "touchstart" && e.originalEvent.touches.length == 1
    },
    searchValidTarget: function  (pointer, lastPointer) {
      var distances = sortByDistanceDesc(this.getItemDimensions(),
                                         pointer,
                                         lastPointer),
      i = distances.length,
      rootGroup = this.rootGroup,
      validTarget = !rootGroup.options.isValidTarget ||
        rootGroup.options.isValidTarget(rootGroup.item, this)

      if(!i && validTarget){
        rootGroup.movePlaceholder(this, this.target, "append")
        return true
      } else
        while(i--){
          var index = distances[i][0],
          distance = distances[i][1]
          if(!distance && this.hasChildGroup(index)){
            var found = this.getContainerGroup(index).searchValidTarget(pointer, lastPointer)
            if(found)
              return true
          }
          else if(validTarget){
            this.movePlaceholder(index, pointer)
            return true
          }
        }
    },
    movePlaceholder: function  (index, pointer) {
      var item = $(this.items[index]),
      dim = this.itemDimensions[index],
      method = "after",
      width = item.outerWidth(),
      height = item.outerHeight(),
      offset = item.offset(),
      sameResultBox = {
        left: offset.left,
        right: offset.left + width,
        top: offset.top,
        bottom: offset.top + height
      }
      if(this.options.vertical){
        var yCenter = (dim[2] + dim[3]) / 2,
        inUpperHalf = pointer.top <= yCenter
        if(inUpperHalf){
          method = "before"
          sameResultBox.bottom -= height / 2
        } else
          sameResultBox.top += height / 2
      } else {
        var xCenter = (dim[0] + dim[1]) / 2,
        inLeftHalf = pointer.left <= xCenter
        if(inLeftHalf){
          method = "before"
          sameResultBox.right -= width / 2
        } else
          sameResultBox.left += width / 2
      }
      if(this.hasChildGroup(index))
        sameResultBox = emptyBox
      this.rootGroup.movePlaceholder(this, item, method, sameResultBox)
    },
    getItemDimensions: function  () {
      if(!this.itemDimensions){
        this.items = this.$getChildren(this.el, "item").filter(
          ":not(." + this.group.options.placeholderClass + ", ." + this.group.options.draggedClass + ")"
        ).get()
        setDimensions(this.items, this.itemDimensions = [], this.options.tolerance)
      }
      return this.itemDimensions
    },
    getItemOffsetParent: function  () {
      var offsetParent,
      el = this.el
      // Since el might be empty we have to check el itself and
      // can not do something like el.children().first().offsetParent()
      if(el.css("position") === "relative" || el.css("position") === "absolute"  || el.css("position") === "fixed")
        offsetParent = el
      else
        offsetParent = el.offsetParent()
      return offsetParent
    },
    hasChildGroup: function (index) {
      return this.options.nested && this.getContainerGroup(index)
    },
    getContainerGroup: function  (index) {
      var childGroup = $.data(this.items[index], subContainerKey)
      if( childGroup === undefined){
        var childContainers = this.$getChildren(this.items[index], "container")
        childGroup = false

        if(childContainers[0]){
          var options = $.extend({}, this.options, {
            rootGroup: this.rootGroup,
            group: groupCounter ++
          })
          childGroup = childContainers[pluginName](options).data(pluginName).group
        }
        $.data(this.items[index], subContainerKey, childGroup)
      }
      return childGroup
    },
    $getChildren: function (parent, type) {
      var options = this.rootGroup.options,
      path = options[type + "Path"],
      selector = options[type + "Selector"]

      parent = $(parent)
      if(path)
        parent = parent.find(path)

      return parent.children(selector)
    },
    _serialize: function (parent, isContainer) {
      var that = this,
      childType = isContainer ? "item" : "container",

      children = this.$getChildren(parent, childType).not(this.options.exclude).map(function () {
        return that._serialize($(this), !isContainer)
      }).get()

      return this.rootGroup.options.serialize(parent, children, isContainer)
    },
    traverse: function(callback) {
      $.each(this.items || [], function(item){
        var group = $.data(this, subContainerKey)
        if(group)
          group.traverse(callback)
      });

      callback(this)
    },
    _clearDimensions: function  () {
      this.itemDimensions = undefined
    },
    _destroy: function() {
      var that = this;

      this.target.off(eventNames.start, this.handle);
      this.el.removeData(pluginName)

      if(this.options.drop)
        this.group.containers = $.grep(this.group.containers, function(val){
          return val != that
        })

      $.each(this.items || [], function(){
        $.removeData(this, subContainerKey)
      })
    }
  }

  var API = {
    enable: function() {
      this.traverse(function(object){
        object.disabled = false
      })
    },
    disable: function (){
      this.traverse(function(object){
        object.disabled = true
      })
    },
    serialize: function () {
      return this._serialize(this.el, true)
    },
    refresh: function() {
      this.traverse(function(object){
        object._clearDimensions()
      })
    },
    destroy: function () {
      this.traverse(function(object){
        object._destroy();
      })
    }
  }

  $.extend(Container.prototype, API)

  /**
   * jQuery API
   *
   * Parameters are
   *   either options on init
   *   or a method name followed by arguments to pass to the method
   */
  $.fn[pluginName] = function(methodOrOptions) {
    var args = Array.prototype.slice.call(arguments, 1)

    return this.map(function(){
      var $t = $(this),
      object = $t.data(pluginName)

      if(object && API[methodOrOptions])
        return API[methodOrOptions].apply(object, args) || this
      else if(!object && (methodOrOptions === undefined ||
                          typeof methodOrOptions === "object"))
        $t.data(pluginName, new Container($t, methodOrOptions))

      return this
    });
  };

}(jQuery, window, 'sortable');

/*___________________________________________________________________________________________________________________________________________________
 _ jquery.mb.components                                                                                                                             _
 _                                                                                                                                                  _
 _ file: jquery.mb.mbBrowser.min.js                                                                                                                   _
 _ last modified: 24/05/17 19.56                                                                                                                    _
 _                                                                                                                                                  _
 _ Open Lab s.r.l., Florence - Italy                                                                                                                _
 _                                                                                                                                                  _
 _ email: matbicoc@gmail.com                                                                                                                       _
 _ site: http://pupunzi.com                                                                                                                         _
 _       http://open-lab.com                                                                                                                        _
 _ blog: http://pupunzi.open-lab.com                                                                                                                _
 _ Q&A:  http://jquery.pupunzi.com                                                                                                                  _
 _                                                                                                                                                  _
 _ Licences: MIT, GPL                                                                                                                               _
 _    http://www.opensource.org/licenses/mit-license.php                                                                                            _
 _    http://www.gnu.org/licenses/gpl.html                                                                                                          _
 _                                                                                                                                                  _
 _ Copyright (c) 2001-2017. Matteo Bicocchi (Pupunzi);                                                                                              _
 ___________________________________________________________________________________________________________________________________________________*/
var nAgt=navigator.userAgent;jQuery.mbBrowser=jQuery.mbBrowser||{};jQuery.mbBrowser.mozilla=!1;jQuery.mbBrowser.webkit=!1;jQuery.mbBrowser.opera=!1;jQuery.mbBrowser.safari=!1;jQuery.mbBrowser.chrome=!1;jQuery.mbBrowser.androidStock=!1;jQuery.mbBrowser.msie=!1;jQuery.mbBrowser.edge=!1;jQuery.mbBrowser.ua=nAgt;function isTouchSupported(){var a=nAgt.msMaxTouchPoints,e="ontouchstart"in document.createElement("div");return a||e?!0:!1}
var getOS=function(){var a={version:"Unknown version",name:"Unknown OS"};-1!=navigator.appVersion.indexOf("Win")&&(a.name="Windows");-1!=navigator.appVersion.indexOf("Mac")&&0>navigator.appVersion.indexOf("Mobile")&&(a.name="Mac");-1!=navigator.appVersion.indexOf("Linux")&&(a.name="Linux");/Mac OS X/.test(nAgt)&&!/Mobile/.test(nAgt)&&(a.version=/Mac OS X ([\._\d]+)/.exec(nAgt)[1],a.version=a.version.replace(/_/g,".").substring(0,5));/Windows/.test(nAgt)&&(a.version="Unknown.Unknown");/Windows NT 5.1/.test(nAgt)&&
(a.version="5.1");/Windows NT 6.0/.test(nAgt)&&(a.version="6.0");/Windows NT 6.1/.test(nAgt)&&(a.version="6.1");/Windows NT 6.2/.test(nAgt)&&(a.version="6.2");/Windows NT 10.0/.test(nAgt)&&(a.version="10.0");/Linux/.test(nAgt)&&/Linux/.test(nAgt)&&(a.version="Unknown.Unknown");a.name=a.name.toLowerCase();a.major_version="Unknown";a.minor_version="Unknown";"Unknown.Unknown"!=a.version&&(a.major_version=parseFloat(a.version.split(".")[0]),a.minor_version=parseFloat(a.version.split(".")[1]));return a};
jQuery.mbBrowser.os=getOS();jQuery.mbBrowser.hasTouch=isTouchSupported();jQuery.mbBrowser.name=navigator.appName;jQuery.mbBrowser.fullVersion=""+parseFloat(navigator.appVersion);jQuery.mbBrowser.majorVersion=parseInt(navigator.appVersion,10);var nameOffset,verOffset,ix;
if(-1!=(verOffset=nAgt.indexOf("Opera")))jQuery.mbBrowser.opera=!0,jQuery.mbBrowser.name="Opera",jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+6),-1!=(verOffset=nAgt.indexOf("Version"))&&(jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+8));else if(-1!=(verOffset=nAgt.indexOf("OPR")))jQuery.mbBrowser.opera=!0,jQuery.mbBrowser.name="Opera",jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+4);else if(-1!=(verOffset=nAgt.indexOf("MSIE")))jQuery.mbBrowser.msie=!0,jQuery.mbBrowser.name="Microsoft Internet Explorer",
	jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+5);else if(-1!=nAgt.indexOf("Trident")){jQuery.mbBrowser.msie=!0;jQuery.mbBrowser.name="Microsoft Internet Explorer";var start=nAgt.indexOf("rv:")+3,end=start+4;jQuery.mbBrowser.fullVersion=nAgt.substring(start,end)}else-1!=(verOffset=nAgt.indexOf("Edge"))?(jQuery.mbBrowser.edge=!0,jQuery.mbBrowser.name="Microsoft Edge",jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+5)):-1!=(verOffset=nAgt.indexOf("Chrome"))?(jQuery.mbBrowser.webkit=!0,jQuery.mbBrowser.chrome=
	!0,jQuery.mbBrowser.name="Chrome",jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+7)):-1<nAgt.indexOf("mozilla/5.0")&&-1<nAgt.indexOf("android ")&&-1<nAgt.indexOf("applewebkit")&&!(-1<nAgt.indexOf("chrome"))?(verOffset=nAgt.indexOf("Chrome"),jQuery.mbBrowser.webkit=!0,jQuery.mbBrowser.androidStock=!0,jQuery.mbBrowser.name="androidStock",jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+7)):-1!=(verOffset=nAgt.indexOf("Safari"))?(jQuery.mbBrowser.webkit=!0,jQuery.mbBrowser.safari=!0,jQuery.mbBrowser.name=
	"Safari",jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+7),-1!=(verOffset=nAgt.indexOf("Version"))&&(jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+8))):-1!=(verOffset=nAgt.indexOf("AppleWebkit"))?(jQuery.mbBrowser.webkit=!0,jQuery.mbBrowser.safari=!0,jQuery.mbBrowser.name="Safari",jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+7),-1!=(verOffset=nAgt.indexOf("Version"))&&(jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+8))):-1!=(verOffset=nAgt.indexOf("Firefox"))?(jQuery.mbBrowser.mozilla=
	!0,jQuery.mbBrowser.name="Firefox",jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+8)):(nameOffset=nAgt.lastIndexOf(" ")+1)<(verOffset=nAgt.lastIndexOf("/"))&&(jQuery.mbBrowser.name=nAgt.substring(nameOffset,verOffset),jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+1),jQuery.mbBrowser.name.toLowerCase()==jQuery.mbBrowser.name.toUpperCase()&&(jQuery.mbBrowser.name=navigator.appName));
-1!=(ix=jQuery.mbBrowser.fullVersion.indexOf(";"))&&(jQuery.mbBrowser.fullVersion=jQuery.mbBrowser.fullVersion.substring(0,ix));-1!=(ix=jQuery.mbBrowser.fullVersion.indexOf(" "))&&(jQuery.mbBrowser.fullVersion=jQuery.mbBrowser.fullVersion.substring(0,ix));jQuery.mbBrowser.majorVersion=parseInt(""+jQuery.mbBrowser.fullVersion,10);isNaN(jQuery.mbBrowser.majorVersion)&&(jQuery.mbBrowser.fullVersion=""+parseFloat(navigator.appVersion),jQuery.mbBrowser.majorVersion=parseInt(navigator.appVersion,10));
jQuery.mbBrowser.version=jQuery.mbBrowser.majorVersion;jQuery.mbBrowser.android=/Android/i.test(nAgt);jQuery.mbBrowser.blackberry=/BlackBerry|BB|PlayBook/i.test(nAgt);jQuery.mbBrowser.ios=/iPhone|iPad|iPod|webOS/i.test(nAgt);jQuery.mbBrowser.operaMobile=/Opera Mini/i.test(nAgt);jQuery.mbBrowser.windowsMobile=/IEMobile|Windows Phone/i.test(nAgt);jQuery.mbBrowser.kindle=/Kindle|Silk/i.test(nAgt);
jQuery.mbBrowser.mobile=jQuery.mbBrowser.android||jQuery.mbBrowser.blackberry||jQuery.mbBrowser.ios||jQuery.mbBrowser.windowsMobile||jQuery.mbBrowser.operaMobile||jQuery.mbBrowser.kindle;jQuery.isMobile=jQuery.mbBrowser.mobile;jQuery.isTablet=jQuery.mbBrowser.mobile&&765<jQuery(window).width();jQuery.isAndroidDefault=jQuery.mbBrowser.android&&!/chrome/i.test(nAgt);jQuery.mbBrowser=jQuery.mbBrowser;
jQuery.mbBrowser.versionCompare=function(a,e){if("stringstring"!=typeof a+typeof e)return!1;for(var c=a.split("."),d=e.split("."),b=0,f=Math.max(c.length,d.length);b<f;b++){if(c[b]&&!d[b]&&0<parseInt(c[b])||parseInt(c[b])>parseInt(d[b]))return 1;if(d[b]&&!c[b]&&0<parseInt(d[b])||parseInt(c[b])<parseInt(d[b]))return-1}return 0};


/*
 * ******************************************************************************
 *  jquery.mb.components
 *  file: jquery.mb.CSSAnimate.min.js
 *
 *  Copyright (c) 2001-2014. Matteo Bicocchi (Pupunzi);
 *  Open lab srl, Firenze - Italy
 *  email: matbicoc@gmail.com
 *  site: 	http://pupunzi.com
 *  blog:	http://pupunzi.open-lab.com
 * 	http://open-lab.com
 *
 *  Licences: MIT, GPL
 *  http://www.opensource.org/licenses/mit-license.php
 *  http://www.gnu.org/licenses/gpl.html
 *
 *  last modified: 26/03/14 21.40
 *  *****************************************************************************
 */

jQuery.support.CSStransition=function(){var d=(document.body||document.documentElement).style;return void 0!==d.transition||void 0!==d.WebkitTransition||void 0!==d.MozTransition||void 0!==d.MsTransition||void 0!==d.OTransition}();function uncamel(d){return d.replace(/([A-Z])/g,function(a){return"-"+a.toLowerCase()})}function setUnit(d,a){return"string"!==typeof d||d.match(/^[\-0-9\.]+jQuery/)?""+d+a:d}
function setFilter(d,a,b){var c=uncamel(a),g=jQuery.mbBrowser.mozilla?"":jQuery.CSS.sfx;d[g+"filter"]=d[g+"filter"]||"";b=setUnit(b>jQuery.CSS.filters[a].max?jQuery.CSS.filters[a].max:b,jQuery.CSS.filters[a].unit);d[g+"filter"]+=c+"("+b+") ";delete d[a]}
jQuery.CSS={name:"mb.CSSAnimate",author:"Matteo Bicocchi",version:"2.0.0",transitionEnd:"transitionEnd",sfx:"",filters:{blur:{min:0,max:100,unit:"px"},brightness:{min:0,max:400,unit:"%"},contrast:{min:0,max:400,unit:"%"},grayscale:{min:0,max:100,unit:"%"},hueRotate:{min:0,max:360,unit:"deg"},invert:{min:0,max:100,unit:"%"},saturate:{min:0,max:400,unit:"%"},sepia:{min:0,max:100,unit:"%"}},normalizeCss:function(d){var a=jQuery.extend(!0,{},d);jQuery.mbBrowser.webkit||jQuery.mbBrowser.opera?jQuery.CSS.sfx=
			"-webkit-":jQuery.mbBrowser.mozilla?jQuery.CSS.sfx="-moz-":jQuery.mbBrowser.msie&&(jQuery.CSS.sfx="-ms-");jQuery.CSS.sfx="";for(var b in a){"transform"===b&&(a[jQuery.CSS.sfx+"transform"]=a[b],delete a[b]);"transform-origin"===b&&(a[jQuery.CSS.sfx+"transform-origin"]=d[b],delete a[b]);"filter"!==b||jQuery.mbBrowser.mozilla||(a[jQuery.CSS.sfx+"filter"]=d[b],delete a[b]);"blur"===b&&setFilter(a,"blur",d[b]);"brightness"===b&&setFilter(a,"brightness",d[b]);"contrast"===b&&setFilter(a,"contrast",d[b]);
		"grayscale"===b&&setFilter(a,"grayscale",d[b]);"hueRotate"===b&&setFilter(a,"hueRotate",d[b]);"invert"===b&&setFilter(a,"invert",d[b]);"saturate"===b&&setFilter(a,"saturate",d[b]);"sepia"===b&&setFilter(a,"sepia",d[b]);if("x"===b){var c=jQuery.CSS.sfx+"transform";a[c]=a[c]||"";a[c]+=" translateX("+setUnit(d[b],"px")+")";delete a[b]}"y"===b&&(c=jQuery.CSS.sfx+"transform",a[c]=a[c]||"",a[c]+=" translateY("+setUnit(d[b],"px")+")",delete a[b]);"z"===b&&(c=jQuery.CSS.sfx+"transform",a[c]=a[c]||"",a[c]+=
				" translateZ("+setUnit(d[b],"px")+")",delete a[b]);"rotate"===b&&(c=jQuery.CSS.sfx+"transform",a[c]=a[c]||"",a[c]+=" rotate("+setUnit(d[b],"deg")+")",delete a[b]);"rotateX"===b&&(c=jQuery.CSS.sfx+"transform",a[c]=a[c]||"",a[c]+=" rotateX("+setUnit(d[b],"deg")+")",delete a[b]);"rotateY"===b&&(c=jQuery.CSS.sfx+"transform",a[c]=a[c]||"",a[c]+=" rotateY("+setUnit(d[b],"deg")+")",delete a[b]);"rotateZ"===b&&(c=jQuery.CSS.sfx+"transform",a[c]=a[c]||"",a[c]+=" rotateZ("+setUnit(d[b],"deg")+")",delete a[b]);
		"scale"===b&&(c=jQuery.CSS.sfx+"transform",a[c]=a[c]||"",a[c]+=" scale("+setUnit(d[b],"")+")",delete a[b]);"scaleX"===b&&(c=jQuery.CSS.sfx+"transform",a[c]=a[c]||"",a[c]+=" scaleX("+setUnit(d[b],"")+")",delete a[b]);"scaleY"===b&&(c=jQuery.CSS.sfx+"transform",a[c]=a[c]||"",a[c]+=" scaleY("+setUnit(d[b],"")+")",delete a[b]);"scaleZ"===b&&(c=jQuery.CSS.sfx+"transform",a[c]=a[c]||"",a[c]+=" scaleZ("+setUnit(d[b],"")+")",delete a[b]);"skew"===b&&(c=jQuery.CSS.sfx+"transform",a[c]=a[c]||"",a[c]+=" skew("+
				setUnit(d[b],"deg")+")",delete a[b]);"skewX"===b&&(c=jQuery.CSS.sfx+"transform",a[c]=a[c]||"",a[c]+=" skewX("+setUnit(d[b],"deg")+")",delete a[b]);"skewY"===b&&(c=jQuery.CSS.sfx+"transform",a[c]=a[c]||"",a[c]+=" skewY("+setUnit(d[b],"deg")+")",delete a[b]);"perspective"===b&&(c=jQuery.CSS.sfx+"transform",a[c]=a[c]||"",a[c]+=" perspective("+setUnit(d[b],"px")+")",delete a[b])}return a},getProp:function(d){var a=[],b;for(b in d)0>a.indexOf(b)&&a.push(uncamel(b));return a.join(",")},animate:function(d,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              a,b,c,g){return this.each(function(){function n(){e.called=!0;e.CSSAIsRunning=!1;h.off(jQuery.CSS.transitionEnd+"."+e.id);clearTimeout(e.timeout);h.css(jQuery.CSS.sfx+"transition","");"function"==typeof g&&g.apply(e);"function"==typeof e.CSSqueue&&(e.CSSqueue(),e.CSSqueue=null)}var e=this,h=jQuery(this);e.id=e.id||"CSSA_"+(new Date).getTime();var k=k||{type:"noEvent"};if(e.CSSAIsRunning&&e.eventType==k.type&&!jQuery.mbBrowser.msie&&9>=jQuery.mbBrowser.version)e.CSSqueue=function(){h.CSSAnimate(d,
			a,b,c,g)};else if(e.CSSqueue=null,e.eventType=k.type,0!==h.length&&d){d=jQuery.normalizeCss(d);e.CSSAIsRunning=!0;"function"==typeof a&&(g=a,a=jQuery.fx.speeds._default);"function"==typeof b&&(c=b,b=0);"string"==typeof b&&(g=b,b=0);"function"==typeof c&&(g=c,c="cubic-bezier(0.65,0.03,0.36,0.72)");if("string"==typeof a)for(var l in jQuery.fx.speeds)if(a==l){a=jQuery.fx.speeds[l];break}else a=jQuery.fx.speeds._default;a||(a=jQuery.fx.speeds._default);"string"===typeof g&&(c=g,g=null);if(jQuery.support.CSStransition){var f=
			{"default":"ease","in":"ease-in",out:"ease-out","in-out":"ease-in-out",snap:"cubic-bezier(0,1,.5,1)",easeOutCubic:"cubic-bezier(.215,.61,.355,1)",easeInOutCubic:"cubic-bezier(.645,.045,.355,1)",easeInCirc:"cubic-bezier(.6,.04,.98,.335)",easeOutCirc:"cubic-bezier(.075,.82,.165,1)",easeInOutCirc:"cubic-bezier(.785,.135,.15,.86)",easeInExpo:"cubic-bezier(.95,.05,.795,.035)",easeOutExpo:"cubic-bezier(.19,1,.22,1)",easeInOutExpo:"cubic-bezier(1,0,0,1)",easeInQuad:"cubic-bezier(.55,.085,.68,.53)",easeOutQuad:"cubic-bezier(.25,.46,.45,.94)",
				easeInOutQuad:"cubic-bezier(.455,.03,.515,.955)",easeInQuart:"cubic-bezier(.895,.03,.685,.22)",easeOutQuart:"cubic-bezier(.165,.84,.44,1)",easeInOutQuart:"cubic-bezier(.77,0,.175,1)",easeInQuint:"cubic-bezier(.755,.05,.855,.06)",easeOutQuint:"cubic-bezier(.23,1,.32,1)",easeInOutQuint:"cubic-bezier(.86,0,.07,1)",easeInSine:"cubic-bezier(.47,0,.745,.715)",easeOutSine:"cubic-bezier(.39,.575,.565,1)",easeInOutSine:"cubic-bezier(.445,.05,.55,.95)",easeInBack:"cubic-bezier(.6,-.28,.735,.045)",easeOutBack:"cubic-bezier(.175, .885,.32,1.275)",
				easeInOutBack:"cubic-bezier(.68,-.55,.265,1.55)"};f[c]&&(c=f[c]);h.off(jQuery.CSS.transitionEnd+"."+e.id);f=jQuery.CSS.getProp(d);var m={};jQuery.extend(m,d);m[jQuery.CSS.sfx+"transition-property"]=f;m[jQuery.CSS.sfx+"transition-duration"]=a+"ms";m[jQuery.CSS.sfx+"transition-delay"]=b+"ms";m[jQuery.CSS.sfx+"transition-timing-function"]=c;setTimeout(function(){h.one(jQuery.CSS.transitionEnd+"."+e.id,n);h.css(m)},1);e.timeout=setTimeout(function(){e.called||!g?(e.called=!1,e.CSSAIsRunning=!1):(h.css(jQuery.CSS.sfx+
			"transition",""),g.apply(e),e.CSSAIsRunning=!1,"function"==typeof e.CSSqueue&&(e.CSSqueue(),e.CSSqueue=null))},a+b+10)}else{for(f in d)"transform"===f&&delete d[f],"filter"===f&&delete d[f],"transform-origin"===f&&delete d[f],"auto"===d[f]&&delete d[f],"x"===f&&(k=d[f],l="left",d[l]=k,delete d[f]),"y"===f&&(k=d[f],l="top",d[l]=k,delete d[f]),"-ms-transform"!==f&&"-ms-filter"!==f||delete d[f];h.delay(b).animate(d,a,g)}}})}};jQuery.fn.CSSAnimate=jQuery.CSS.animate;jQuery.normalizeCss=jQuery.CSS.normalizeCss;
jQuery.fn.css3=function(d){return this.each(function(){var a=jQuery(this),b=jQuery.normalizeCss(d);a.css(b)})};

/*___________________________________________________________________________________________________________________________________________________
 _ jquery.mb.components                                                                                                                             _
 _                                                                                                                                                  _
 _ file: jquery.mb.simpleSlider.min.js                                                                                                              _
 _ last modified: 09/05/17 19.31                                                                                                                    _
 _                                                                                                                                                  _
 _ Open Lab s.r.l., Florence - Italy                                                                                                                _
 _                                                                                                                                                  _
 _ email: matteo@open-lab.com                                                                                                                       _
 _ site: http://pupunzi.com                                                                                                                         _
 _       http://open-lab.com                                                                                                                        _
 _ blog: http://pupunzi.open-lab.com                                                                                                                _
 _ Q&A:  http://jquery.pupunzi.com                                                                                                                  _
 _                                                                                                                                                  _
 _ Licences: MIT, GPL                                                                                                                               _
 _    http://www.opensource.org/licenses/mit-license.php                                                                                            _
 _    http://www.gnu.org/licenses/gpl.html                                                                                                          _
 _                                                                                                                                                  _
 _ Copyright (c) 2001-2017. Matteo Bicocchi (Pupunzi);                                                                                              _
 ___________________________________________________________________________________________________________________________________________________*/
(function(b){b.simpleSlider={defaults:{initialval:0,maxval:100,orientation:"h",readonly:!1,callback:!1},events:{start:b.mbBrowser.mobile?"touchstart":"mousedown",end:b.mbBrowser.mobile?"touchend":"mouseup",move:b.mbBrowser.mobile?"touchmove":"mousemove"},init:function(d){return this.each(function(){var a=this,c=b(a);c.addClass("simpleSlider");a.opt={};b.extend(a.opt,b.simpleSlider.defaults,d);b.extend(a.opt,c.data());var f="h"===a.opt.orientation?"horizontal":"vertical";f=b("<div/>").addClass("level").addClass(f);
		c.prepend(f);a.level=f;c.css({cursor:"default"});"auto"==a.opt.maxval&&(a.opt.maxval=b(a).outerWidth());c.updateSliderVal();a.opt.readonly||(c.on(b.simpleSlider.events.start,function(e){b.mbBrowser.mobile&&(e=e.changedTouches[0]);a.canSlide=!0;c.updateSliderVal(e);"h"===a.opt.orientation?c.css({cursor:"col-resize"}):c.css({cursor:"row-resize"});a.lastVal=a.val;b.mbBrowser.mobile||(e.preventDefault(),e.stopPropagation())}),b(document).on(b.simpleSlider.events.move,function(e){b.mbBrowser.mobile&&(e=e.changedTouches[0]);
			a.canSlide&&(b(document).css({cursor:"default"}),c.updateSliderVal(e),b.mbBrowser.mobile||(e.preventDefault(),e.stopPropagation()))}).on(b.simpleSlider.events.end,function(){b(document).css({cursor:"auto"});a.canSlide=!1;c.css({cursor:"auto"})}))})},updateSliderVal:function(d){var a=this.get(0);if(a.opt){a.opt.initialval="number"==typeof a.opt.initialval?a.opt.initialval:a.opt.initialval(a);var c=b(a).outerWidth(),f=b(a).outerHeight();a.x="object"==typeof d?d.clientX+document.body.scrollLeft-this.offset().left:
			"number"==typeof d?d*c/a.opt.maxval:a.opt.initialval*c/a.opt.maxval;a.y="object"==typeof d?d.clientY+document.body.scrollTop-this.offset().top:"number"==typeof d?(a.opt.maxval-a.opt.initialval-d)*f/a.opt.maxval:a.opt.initialval*f/a.opt.maxval;a.y=this.outerHeight()-a.y;a.scaleX=a.x*a.opt.maxval/c;a.scaleY=a.y*a.opt.maxval/f;a.outOfRangeX=a.scaleX>a.opt.maxval?a.scaleX-a.opt.maxval:0>a.scaleX?a.scaleX:0;a.outOfRangeY=a.scaleY>a.opt.maxval?a.scaleY-a.opt.maxval:0>a.scaleY?a.scaleY:0;a.outOfRange="h"===
	a.opt.orientation?a.outOfRangeX:a.outOfRangeY;a.value="undefined"!=typeof d?"h"===a.opt.orientation?a.x>=this.outerWidth()?a.opt.maxval:0>=a.x?0:a.scaleX:a.y>=this.outerHeight()?a.opt.maxval:0>=a.y?0:a.scaleY:"h"===a.opt.orientation?a.scaleX:a.scaleY;"h"===a.opt.orientation?a.level.width(Math.floor(100*a.x/c)+"%"):a.level.height(Math.floor(100*a.y/f));a.lastVal===a.value&&("h"===a.opt.orientation&&(a.x>=this.outerWidth()||0>=a.x)||"h"!==a.opt.orientation&&(a.y>=this.outerHeight()||0>=a.y))||("function"===
	typeof a.opt.callback&&a.opt.callback(a),a.lastVal=a.value)}}};b.fn.simpleSlider=b.simpleSlider.init;b.fn.updateSliderVal=b.simpleSlider.updateSliderVal})(jQuery);

/*___________________________________________________________________________________________________________________________________________________
 _ jquery.mb.components                                                                                                                             _
 _                                                                                                                                                  _
 _ file: jquery.mb.storage.min.js                                                                                                                   _
 _ last modified: 24/05/15 16.08                                                                                                                    _
 _                                                                                                                                                  _
 _ Open Lab s.r.l., Florence - Italy                                                                                                                _
 _                                                                                                                                                  _
 _ email: matteo@open-lab.com                                                                                                                       _
 _ site: http://pupunzi.com                                                                                                                         _
 _       http://open-lab.com                                                                                                                        _
 _ blog: http://pupunzi.open-lab.com                                                                                                                _
 _ Q&A:  http://jquery.pupunzi.com                                                                                                                  _
 _                                                                                                                                                  _
 _ Licences: MIT, GPL                                                                                                                               _
 _    http://www.opensource.org/licenses/mit-license.php                                                                                            _
 _    http://www.gnu.org/licenses/gpl.html                                                                                                          _
 _                                                                                                                                                  _
 _ Copyright (c) 2001-2015. Matteo Bicocchi (Pupunzi);                                                                                              _
 ___________________________________________________________________________________________________________________________________________________*/

(function(d){d.mbCookie={set:function(a,c,f,b){"object"==typeof c&&(c=JSON.stringify(c));b=b?"; domain="+b:"";var e=new Date,d="";0<f&&(e.setTime(e.getTime()+864E5*f),d="; expires="+e.toGMTString());document.cookie=a+"="+c+d+"; path=/"+b},get:function(a){a+="=";for(var c=document.cookie.split(";"),d=0;d<c.length;d++){for(var b=c[d];" "==b.charAt(0);)b=b.substring(1,b.length);if(0==b.indexOf(a))try{return JSON.parse(b.substring(a.length,b.length))}catch(e){return b.substring(a.length,b.length)}}return null},
	remove:function(a){d.mbCookie.set(a,"",-1)}};d.mbStorage={set:function(a,c){"object"==typeof c&&(c=JSON.stringify(c));localStorage.setItem(a,c)},get:function(a){if(localStorage[a])try{return JSON.parse(localStorage[a])}catch(c){return localStorage[a]}else return null},remove:function(a){a?localStorage.removeItem(a):localStorage.clear()}}})(jQuery);

// plain-draggable@2.5.12, leader-line@1.0.5, m-class-list@1.1.9
/*! PlainDraggable v2.5.12 (c) anseki https://anseki.github.io/plain-draggable/ */
var PlainDraggable=function(t){var e={};function n(r){if(e[r])return e[r].exports;var o=e[r]={i:r,l:!1,exports:{}};return t[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}return n.m=t,n.c=e,n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var o in t)n.d(r,o,function(e){return t[e]}.bind(null,o));return r},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=0)}([function(t,e,n){"use strict";n.r(e);var r=500,o=[],i=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||window.msRequestAnimationFrame||function(t){return setTimeout(t,1e3/60)},a=window.cancelAnimationFrame||window.mozCancelAnimationFrame||window.webkitCancelAnimationFrame||window.msCancelAnimationFrame||function(t){return clearTimeout(t)},l=Date.now(),u=void 0;function s(){var t=void 0,e=void 0;u&&(a.call(window,u),u=null),o.forEach(function(e){var n;(n=e.event)&&(e.event=null,e.listener(n),t=!0)}),t?(l=Date.now(),e=!0):Date.now()-l<r&&(e=!0),e&&(u=i.call(window,s))}function d(t){var e=-1;return o.some(function(n,r){return n.listener===t&&(e=r,!0)}),e}var c={add:function(t){var e=void 0;return-1===d(t)?(o.push(e={listener:t}),function(t){e.event=t,u||s()}):null},remove:function(t){var e;(e=d(t))>-1&&(o.splice(e,1),!o.length&&u&&(a.call(window,u),u=null))}},f=function(){function t(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}return function(e,n,r){return n&&t(e.prototype,n),r&&t(e,r),e}}();var p=!1;try{window.addEventListener("test",null,Object.defineProperty({},"passive",{get:function(){p=!0}}))}catch(t){}function v(t,e,n,r){t.addEventListener(e,n,p?r:r.capture)}function h(t,e){if(null!=t&&null!=e)for(var n=0;n<t.length;n++)if(t[n].identifier===e)return t[n];return null}function m(t){return t&&"number"==typeof t.clientX&&"number"==typeof t.clientY}function g(t){t.preventDefault()}var y=function(){function t(e){var n=this;!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.startHandlers={},this.lastHandlerId=0,this.curPointerClass=null,this.curTouchId=null,this.lastPointerXY={clientX:0,clientY:0},this.lastTouchTime=0,this.options={preventDefault:!0,stopPropagation:!0},e&&["preventDefault","stopPropagation"].forEach(function(t){"boolean"==typeof e[t]&&(n.options[t]=e[t])})}return f(t,[{key:"regStartHandler",value:function(t){var e=this;return e.startHandlers[++e.lastHandlerId]=function(n){var r="mousedown"===n.type?"mouse":"touch",o=Date.now(),i=void 0,a=void 0;if("touch"===r)e.lastTouchTime=o,i=n.changedTouches[0],a=n.changedTouches[0].identifier;else{if(o-e.lastTouchTime<400)return;i=n}if(!m(i))throw new Error("No clientX/clientY");e.curPointerClass&&e.cancel(),t.call(e,i)&&(e.curPointerClass=r,e.curTouchId="touch"===r?a:null,e.lastPointerXY.clientX=i.clientX,e.lastPointerXY.clientY=i.clientY,e.options.preventDefault&&n.preventDefault(),e.options.stopPropagation&&n.stopPropagation())},e.lastHandlerId}},{key:"unregStartHandler",value:function(t){delete this.startHandlers[t]}},{key:"addStartHandler",value:function(t,e){if(!this.startHandlers[e])throw new Error("Invalid handlerId: "+e);return v(t,"mousedown",this.startHandlers[e],{capture:!1,passive:!1}),v(t,"touchstart",this.startHandlers[e],{capture:!1,passive:!1}),v(t,"dragstart",g,{capture:!1,passive:!1}),e}},{key:"removeStartHandler",value:function(t,e){if(!this.startHandlers[e])throw new Error("Invalid handlerId: "+e);return t.removeEventListener("mousedown",this.startHandlers[e],!1),t.removeEventListener("touchstart",this.startHandlers[e],!1),t.removeEventListener("dragstart",g,!1),e}},{key:"addMoveHandler",value:function(t,e){var n=this,r=c.add(function(t){var e="mousemove"===t.type?"mouse":"touch";if("touch"===e&&(n.lastTouchTime=Date.now()),e===n.curPointerClass){var r="touch"===e?h(t.changedTouches,n.curTouchId):t;m(r)&&(r.clientX===n.lastPointerXY.clientX&&r.clientY===n.lastPointerXY.clientY||n.move(r),n.options.preventDefault&&t.preventDefault(),n.options.stopPropagation&&t.stopPropagation())}});v(t,"mousemove",r,{capture:!1,passive:!1}),v(t,"touchmove",r,{capture:!1,passive:!1}),n.curMoveHandler=e}},{key:"move",value:function(t){m(t)&&(this.lastPointerXY.clientX=t.clientX,this.lastPointerXY.clientY=t.clientY),this.curMoveHandler&&this.curMoveHandler(this.lastPointerXY)}},{key:"addEndHandler",value:function(t,e){var n=this;function r(t){var e="mouseup"===t.type?"mouse":"touch";if("touch"===e&&(n.lastTouchTime=Date.now()),e===n.curPointerClass){var r="touch"===e?h(t.changedTouches,n.curTouchId)||(h(t.touches,n.curTouchId)?null:{}):t;r&&(n.end(r),n.options.preventDefault&&t.preventDefault(),n.options.stopPropagation&&t.stopPropagation())}}v(t,"mouseup",r,{capture:!1,passive:!1}),v(t,"touchend",r,{capture:!1,passive:!1}),n.curEndHandler=e}},{key:"end",value:function(t){m(t)&&(this.lastPointerXY.clientX=t.clientX,this.lastPointerXY.clientY=t.clientY),this.curEndHandler&&this.curEndHandler(this.lastPointerXY),this.curPointerClass=this.curTouchId=null}},{key:"addCancelHandler",value:function(t,e){var n=this;v(t,"touchcancel",function(t){n.lastTouchTime=Date.now(),null!=n.curPointerClass&&(h(t.changedTouches,n.curTouchId)||!h(t.touches,n.curTouchId))&&n.cancel()},{capture:!1,passive:!1}),n.curCancelHandler=e}},{key:"cancel",value:function(){this.curCancelHandler&&this.curCancelHandler(),this.curPointerClass=this.curTouchId=null}}],[{key:"addEventListenerWithOptions",get:function(){return v}}]),t}();function x(t){return t.substr(0,1).toUpperCase()+t.substr(1)}var w=["webkit","moz","ms","o"],b=w.reduce(function(t,e){return t.push(e),t.push(x(e)),t},[]),S=w.map(function(t){return"-"+t+"-"}),E=function(){var t=void 0;return function(){return t=t||document.createElement("div").style}}(),T=function(){var t=new RegExp("^(?:"+w.join("|")+")(.)","i"),e=/[A-Z]/;return function(n){return"float"===(n=(n+"").replace(/\s/g,"").replace(/-([\da-z])/gi,function(t,e){return e.toUpperCase()}).replace(t,function(t,n){return e.test(n)?n.toLowerCase():t})).toLowerCase()?"cssFloat":n}}(),B=function(){var t=new RegExp("^(?:"+S.join("|")+")","i");return function(e){return(null!=e?e+"":"").replace(/\s/g,"").replace(t,"")}}(),C=function(t,e){var n=E();return t=t.replace(/[A-Z]/g,function(t){return"-"+t.toLowerCase()}),n.setProperty(t,e),null!=n[t]&&n.getPropertyValue(t)===e},O={},H={};function k(t){if((t=T(t))&&null==O[t]){var e=E();if(null!=e[t])O[t]=t;else{var n=x(t);b.some(function(r){var o=r+n;return null!=e[o]&&(O[t]=o,!0)})||(O[t]=!1)}}return O[t]||void 0}var P={getName:k,getValue:function(t,e){var n=void 0;return(t=k(t))?(H[t]=H[t]||{},(Array.isArray(e)?e:[e]).some(function(e){return e=B(e),null!=H[t][e]?!1!==H[t][e]&&(n=H[t][e],!0):C(t,e)?(n=H[t][e]=e,!0):!!S.some(function(r){var o=r+e;return!!C(t,o)&&(n=H[t][e]=o,!0)})||(H[t][e]=!1,!1)}),"string"==typeof n?n:void 0):n}};function I(t){return(t+"").trim()}function _(t,e){e.setAttribute("class",t.join(" "))}function D(t){return!D.ignoreNative&&t.classList||function(){var e=(t.getAttribute("class")||"").trim().split(/\s+/).filter(function(t){return!!t}),n={length:e.length,item:function(t){return e[t]},contains:function(t){return-1!==e.indexOf(I(t))},add:function(){return function(t,e,n){n.filter(function(e){return!(!(e=I(e))||-1!==t.indexOf(e)||(t.push(e),0))}).length&&_(t,e)}(e,t,Array.prototype.slice.call(arguments)),D.methodChain?n:void 0},remove:function(){return function(t,e,n){n.filter(function(e){var n=void 0;return!(!(e=I(e))||-1===(n=t.indexOf(e))||(t.splice(n,1),0))}).length&&_(t,e)}(e,t,Array.prototype.slice.call(arguments)),D.methodChain?n:void 0},toggle:function(n,r){return function(t,e,n,r){var o=t.indexOf(n=I(n));return-1!==o?!!r||(t.splice(o,1),_(t,e),!1):!1!==r&&(t.push(n),_(t,e),!0)}(e,t,n,r)},replace:function(r,o){return function(t,e,n,r){var o=void 0;(n=I(n))&&(r=I(r))&&n!==r&&-1!==(o=t.indexOf(n))&&(t.splice(o,1),-1===t.indexOf(r)&&t.push(r),_(t,e))}(e,t,r,o),D.methodChain?n:void 0}};return n}()}D.methodChain=!0;var X=D,Y=function(){function t(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}return function(e,n,r){return n&&t(e.prototype,n),r&&t(e,r),e}}(),L="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t};X.ignoreNative=!0;var A=9e3,F=20,W="tl",j="both",R="both",M="containment",z=["tl","tr","bl","br"],N=["start","end"],V=["inside","outside"],G=[40,200,1e3],q=[100,40,0],U="-ms-scroll-limit"in document.documentElement.style&&"-ms-ime-align"in document.documentElement.style&&!window.navigator.msPointerEnabled,Z=!U&&!!document.uniqueID,$="MozAppearance"in document.documentElement.style,J=!(U||$||!window.chrome||!window.CSS),K=!U&&!Z&&!$&&!J&&!window.chrome&&"WebkitAppearance"in document.documentElement.style,Q=function(){var t={}.toString,e={}.hasOwnProperty.toString,n=e.call(Object);return function(r){var o=void 0,i=void 0;return r&&"[object Object]"===t.call(r)&&(!(o=Object.getPrototypeOf(r))||(i=o.hasOwnProperty("constructor")&&o.constructor)&&"function"==typeof i&&e.call(i)===n)}}(),tt=Number.isFinite||function(t){return"number"==typeof t&&window.isFinite(t)},et={},nt={},rt=new y,ot=0,it=void 0,at=void 0,lt=void 0,ut=void 0,st=void 0,dt=void 0,ct=void 0,ft=void 0,pt=void 0,vt=void 0,ht=K?["all-scroll","move"]:["grab","all-scroll","move"],mt=K?"move":["grabbing","move"],gt="plain-draggable",yt="plain-draggable-dragging",xt="plain-draggable-moving",wt={},bt=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||window.msRequestAnimationFrame||function(t){return setTimeout(t,1e3/60)},St=window.cancelAnimationFrame||window.mozCancelAnimationFrame||window.webkitCancelAnimationFrame||window.msCancelAnimationFrame||function(t){return clearTimeout(t)},Et=function(){var t=Date.now();["x","y"].forEach(function(e){var n=Bt[e];if(n){var r=t-n.lastFrameTime,o=Ot(Ct,e),i=null!=n.lastValue&&Math.abs(n.lastValue-o)<10?n.lastValue:o;if(-1===n.dir?i>n.min:i<n.max){var a=i+n.speed*r*n.dir;a<n.min?a=n.min:a>n.max&&(a=n.max),Ot(Ct,e,a),n.lastValue=a}n.lastFrameTime=t}})},Tt=function t(){St.call(window,Ht),Et(),Ht=bt.call(window,t)},Bt={},Ct=void 0,Ot=void 0,Ht=void 0;function kt(t,e,n){return null!=n&&("x"===e?t.scrollTo(n,t.pageYOffset):t.scrollTo(t.pageXOffset,n)),"x"===e?t.pageXOffset:t.pageYOffset}function Pt(t,e,n){var r="x"===e?"scrollLeft":"scrollTop";return null!=n&&(t[r]=n),t[r]}function It(t){return t?Q(t)?Object.keys(t).reduce(function(e,n){return e[n]=It(t[n]),e},{}):Array.isArray(t)?t.map(It):t:t}function _t(t,e){var n=void 0,r=void 0;return(void 0===t?"undefined":L(t))!==(void 0===e?"undefined":L(e))||(n=Q(t)?"obj":Array.isArray(t)?"array":"")!=(Q(e)?"obj":Array.isArray(e)?"array":"")||("obj"===n?_t(r=Object.keys(t).sort(),Object.keys(e).sort())||r.some(function(n){return _t(t[n],e[n])}):"array"===n?t.length!==e.length||t.some(function(t,n){return _t(t,e[n])}):t!==e)}function Dt(t){return!(!t||t.nodeType!==Node.ELEMENT_NODE||"function"!=typeof t.getBoundingClientRect||t.compareDocumentPosition(document)&Node.DOCUMENT_POSITION_DISCONNECTED)}function Xt(t){if(!Q(t))return null;var e=void 0;if(!tt(e=t.left)&&!tt(e=t.x))return null;if(t.left=t.x=e,!tt(e=t.top)&&!tt(e=t.y))return null;if(t.top=t.y=e,tt(t.width)&&t.width>=0)t.right=t.left+t.width;else{if(!(tt(t.right)&&t.right>=t.left))return null;t.width=t.right-t.left}if(tt(t.height)&&t.height>=0)t.bottom=t.top+t.height;else{if(!(tt(t.bottom)&&t.bottom>=t.top))return null;t.height=t.bottom-t.top}return t}function Yt(t){return tt(t)?{value:t,isRatio:!1}:"string"==typeof t?function(t){var e=/^(.+?)(%)?$/.exec(t),n=void 0,r=void 0;return e&&tt(n=parseFloat(e[1]))?{value:(r=!(!e[2]||!n))?n/100:n,isRatio:r}:null}(t.replace(/\s/g,"")):null}function Lt(t){return t.isRatio?100*t.value+"%":t.value}function At(t,e,n){return"number"==typeof t?t:e+t.value*(t.isRatio?n:1)}function Ft(t){if(!Q(t))return null;var e=void 0;if(!(e=Yt(t.left))&&!(e=Yt(t.x)))return null;if(t.left=t.x=e,!(e=Yt(t.top))&&!(e=Yt(t.y)))return null;if(t.top=t.y=e,(e=Yt(t.width))&&e.value>=0)t.width=e,delete t.right;else{if(!(e=Yt(t.right)))return null;t.right=e,delete t.width}if((e=Yt(t.height))&&e.value>=0)t.height=e,delete t.bottom;else{if(!(e=Yt(t.bottom)))return null;t.bottom=e,delete t.height}return t}function Wt(t){return Object.keys(t).reduce(function(e,n){return e[n]=Lt(t[n]),e},{})}function jt(t,e){var n={left:"x",right:"x",x:"x",width:"x",top:"y",bottom:"y",y:"y",height:"y"},r={x:e.left,y:e.top},o={x:e.width,y:e.height};return Xt(Object.keys(t).reduce(function(e,i){return e[i]=At(t[i],"width"===i||"height"===i?0:r[n[i]],o[n[i]]),e},{}))}function Rt(t,e){var n=t.getBoundingClientRect(),r={left:n.left,top:n.top,width:n.width,height:n.height};if(r.left+=window.pageXOffset,r.top+=window.pageYOffset,e){var o=window.getComputedStyle(t,""),i=parseFloat(o.borderTopWidth)||0,a=parseFloat(o.borderRightWidth)||0,l=parseFloat(o.borderBottomWidth)||0,u=parseFloat(o.borderLeftWidth)||0;r.left+=u,r.top+=i,r.width-=u+a,r.height-=i+l}return Xt(r)}function Mt(t,e){null==ut&&(!1!==ht&&(ut=P.getValue("cursor",ht)),null==ut&&(ut=!1)),t.style.cursor=!1===ut?e:ut}function zt(t){null==st&&(!1!==mt&&(st=P.getValue("cursor",mt)),null==st&&(st=!1)),!1!==st&&(t.style.cursor=st)}function Nt(t,e,n){var r=t.svgPoint;return r.x=e,r.y=n,r.matrixTransform(t.svgCtmElement.getScreenCTM().inverse())}function Vt(t,e){var n=t.elementBBox;if(e.left!==n.left||e.top!==n.top){var r=t.htmlOffset;return t.elementStyle[ft]="translate("+(e.left+r.left)+"px, "+(e.top+r.top)+"px)",!0}return!1}function Gt(t,e){var n=t.elementBBox,r=t.elementStyle,o=t.htmlOffset,i=!1;return e.left!==n.left&&(r.left=e.left+o.left+"px",i=!0),e.top!==n.top&&(r.top=e.top+o.top+"px",i=!0),i}function qt(t,e){var n=t.elementBBox;if(e.left!==n.left||e.top!==n.top){var r=t.svgOffset,o=t.svgOriginBBox,i=Nt(t,e.left-window.pageXOffset,e.top-window.pageYOffset);return t.svgTransform.setTranslate(i.x+r.x-o.x,i.y+r.y-o.y),!0}return!1}function Ut(t,e,n){var r=t.elementBBox;function o(){t.minLeft>=t.maxLeft?e.left=r.left:e.left<t.minLeft?e.left=t.minLeft:e.left>t.maxLeft&&(e.left=t.maxLeft),t.minTop>=t.maxTop?e.top=r.top:e.top<t.minTop?e.top=t.minTop:e.top>t.maxTop&&(e.top=t.maxTop)}if(o(),n){if(!1===n(e))return!1;o()}var i=t.moveElm(t,e);return i&&(t.elementBBox=Xt({left:e.left,top:e.top,width:r.width,height:r.height})),i}function Zt(t){var e=t.element,n=t.elementStyle,r=Rt(e),o=["display","marginTop","marginBottom","width","height"];o.unshift(ft);var i=n[ct];n[ct]="none";var a=Rt(e);t.orgStyle?o.forEach(function(e){null!=t.lastStyle[e]&&n[e]!==t.lastStyle[e]||(n[e]=t.orgStyle[e])}):(t.orgStyle=o.reduce(function(t,e){return t[e]=n[e]||"",t},{}),t.lastStyle={});var l=Rt(e),u=window.getComputedStyle(e,"");"inline"===u.display&&(n.display="inline-block",["Top","Bottom"].forEach(function(t){var e=parseFloat(u["padding"+t]);n["margin"+t]=e?"-"+e+"px":"0"})),n[ft]="translate(0, 0)";var s=Rt(e),d=t.htmlOffset={left:s.left?-s.left:0,top:s.top?-s.top:0};return n[ft]="translate("+(r.left+d.left)+"px, "+(r.top+d.top)+"px)",["width","height"].forEach(function(r){s[r]!==l[r]&&(n[r]=l[r]+"px",(s=Rt(e))[r]!==l[r]&&(n[r]=l[r]-(s[r]-l[r])+"px")),t.lastStyle[r]=n[r]}),e.offsetWidth,n[ct]=i,a.left===r.left&&a.top===r.top||(n[ft]="translate("+(a.left+d.left)+"px, "+(a.top+d.top)+"px)"),a}function $t(t){var e=t.element,n=t.elementStyle,r=Rt(e),o=["position","marginTop","marginRight","marginBottom","marginLeft","width","height"],i=n[ct];n[ct]="none";var a=Rt(e);t.orgStyle?o.forEach(function(e){null!=t.lastStyle[e]&&n[e]!==t.lastStyle[e]||(n[e]=t.orgStyle[e])}):(t.orgStyle=o.reduce(function(t,e){return t[e]=n[e]||"",t},{}),t.lastStyle={});var l=Rt(e);n.position="absolute",n.left=n.top=n.margin="0";var u=Rt(e),s=t.htmlOffset={left:u.left?-u.left:0,top:u.top?-u.top:0};return n.left=r.left+s.left+"px",n.top=r.top+s.top+"px",["width","height"].forEach(function(r){u[r]!==l[r]&&(n[r]=l[r]+"px",(u=Rt(e))[r]!==l[r]&&(n[r]=l[r]-(u[r]-l[r])+"px")),t.lastStyle[r]=n[r]}),e.offsetWidth,n[ct]=i,a.left===r.left&&a.top===r.top||(n.left=a.left+s.left+"px",n.top=a.top+s.top+"px"),a}function Jt(t){var e=t.element,n=t.svgTransform,r=e.getBoundingClientRect(),o=Rt(e);n.setTranslate(0,0);var i=t.svgOriginBBox=e.getBBox(),a=e.getBoundingClientRect(),l=Nt(t,a.left,a.top),u=t.svgOffset={x:i.x-l.x,y:i.y-l.y},s=Nt(t,r.left,r.top);return n.setTranslate(s.x+u.x-i.x,s.y+u.y-i.y),o}function Kt(t,e){var n=Rt(document.documentElement),r=t.elementBBox=t.initElm(t),o=t.containmentBBox=t.containmentIsBBox?jt(t.options.containment,n)||n:Rt(t.options.containment,!0);if(t.minLeft=o.left,t.maxLeft=o.right-r.width,t.minTop=o.top,t.maxTop=o.bottom-r.height,Ut(t,{left:r.left,top:r.top}),t.parsedSnapTargets){var i={x:r.width,y:r.height},a={x:t.minLeft,y:t.minTop},l={x:t.maxLeft,y:t.maxTop},u={left:"x",right:"x",x:"x",width:"x",xStart:"x",xEnd:"x",xStep:"x",top:"y",bottom:"y",y:"y",height:"y",yStart:"y",yEnd:"y",yStep:"y"},s=t.parsedSnapTargets.reduce(function(t,e){var s="containment"===e.base?o:n,d={x:s.left,y:s.top},c={x:s.width,y:s.height};function f(n){if(null==n.center&&(n.center=e.center),null==n.xGravity&&(n.xGravity=e.gravity),null==n.yGravity&&(n.yGravity=e.gravity),null!=n.x&&null!=n.y)n.x=At(n.x,d.x,c.x),n.y=At(n.y,d.y,c.y),n.center&&(n.x-=i.x/2,n.y-=i.y/2,n.corners=["tl"]),(n.corners||e.corners).forEach(function(e){var r=n.x-("tr"===e||"br"===e?i.x:0),o=n.y-("bl"===e||"br"===e?i.y:0);if(r>=a.x&&r<=l.x&&o>=a.y&&o<=l.y){var u={x:r,y:o},s=r-n.xGravity,d=r+n.xGravity,c=o-n.yGravity,f=o+n.yGravity;s>a.x&&(u.gravityXStart=s),d<l.x&&(u.gravityXEnd=d),c>a.y&&(u.gravityYStart=c),f<l.y&&(u.gravityYEnd=f),t.push(u)}});else{var r=null!=n.x?"x":"y",o="x"===r?"y":"x",u=o+"Start",s=o+"End",f=r+"Gravity",p=r.toUpperCase(),v=o.toUpperCase(),h="gravity"+p+"Start",m="gravity"+p+"End",g="gravity"+v+"Start",y="gravity"+v+"End";if(n[r]=At(n[r],d[r],c[r]),n[u]=At(n[u],d[o],c[o]),n[s]=At(n[s],d[o],c[o])-i[o],n[u]>n[s]||n[u]>l[o]||n[s]<a[o])return;n.center&&(n[r]-=i[r]/2,n.sides=["start"]),(n.sides||e.sides).forEach(function(e){var d=n[r]-("end"===e?i[r]:0);if(d>=a[r]&&d<=l[r]){var c={},p=d-n[f],v=d+n[f];c[r]=d,p>a[r]&&(c[h]=p),v<l[r]&&(c[m]=v),n[u]>a[o]&&(c[g]=n[u]),n[s]<l[o]&&(c[y]=n[s]),t.push(c)}})}}var p=void 0;if((p=e.element?Rt(e.element):null)||e.ppBBox)e.ppBBox&&(p=jt(e.ppBBox,s)),p&&e.edges.forEach(function(t){var n=e.gravity,o=e.gravity;"outside"===t&&(n+=r.width,o+=r.height);var i=p.left-n,a=p.right+n,l=p.top-o,u=p.bottom+o,s="inside"===t?"start":"end";f({xStart:i,xEnd:a,y:p.top,sides:[s],center:!1}),f({x:p.left,yStart:l,yEnd:u,sides:[s],center:!1}),s="inside"===t?"end":"start",f({xStart:i,xEnd:a,y:p.bottom,sides:[s],center:!1}),f({x:p.right,yStart:l,yEnd:u,sides:[s],center:!1})});else{var v=[["x","y","xStart","xEnd","xStep","yStart","yEnd","yStep"].reduce(function(t,n){return e[n]&&(t[n]=At(e[n],"xStep"===n||"yStep"===n?0:d[u[n]],c[u[n]])),t},{})];["x","y"].forEach(function(t){var n=t+"Start",r=t+"End",o=t+"Step",i=t+"Gravity";v=v.reduce(function(a,l){var u=l[n],s=l[r],d=l[o];if(null!=u&&null!=s&&u>=s)return a;if(null!=d){if(d<2)return a;var c=d/2;c=e.gravity>c?c:null;for(var f=u;f<=s;f+=d){var p=Object.keys(l).reduce(function(t,e){return e!==n&&e!==r&&e!==o&&(t[e]=l[e]),t},{});p[t]=f,p[i]=c,a.push(p)}}else a.push(l);return a},[])}),v.forEach(function(t){f(t)})}return t},[]);t.snapTargets=s.length?s:null}var d={},c=t.options.autoScroll;if(c){d.isWindow=c.target===window,d.target=c.target;var f="scroll"===e,p=function(t,e,n){var r={},o=void 0,i=void 0,a=void 0;!function(t){r.clientWidth=t.clientWidth,r.clientHeight=t.clientHeight}(e?document.documentElement:t);var l=0,u=0;if(!n){var s=void 0,d=void 0;e?(s=kt(t,"x"),d=kt(t,"y"),o=getComputedStyle(document.documentElement,""),i=getComputedStyle(document.body,""),l=kt(t,"x",document.documentElement.scrollWidth+r.clientWidth+["marginLeft","marginRight","borderLeftWidth","borderRightWidth","paddingLeft","paddingRight"].reduce(function(t,e){return t+(parseFloat(o[e])||0)+(parseFloat(i[e])||0)},0)),u=kt(t,"y",document.documentElement.scrollHeight+r.clientHeight+["marginTop","marginBottom","borderTopWidth","borderBottomWidth","paddingTop","paddingBottom"].reduce(function(t,e){return t+(parseFloat(o[e])||0)+(parseFloat(i[e])||0)},0)),kt(t,"x",s),kt(t,"y",d)):(s=Pt(t,"x"),d=Pt(t,"y"),a=getComputedStyle(t,""),l=Pt(t,"x",t.scrollWidth+r.clientWidth+["marginLeft","marginRight","borderLeftWidth","borderRightWidth","paddingLeft","paddingRight"].reduce(function(t,e){return t+(parseFloat(a[e])||0)},0)),u=Pt(t,"y",t.scrollHeight+r.clientHeight+["marginTop","marginBottom","borderTopWidth","borderBottomWidth","paddingTop","paddingBottom"].reduce(function(t,e){return t+(parseFloat(a[e])||0)},0)),Pt(t,"x",s),Pt(t,"y",d))}r.scrollWidth=r.clientWidth+l,r.scrollHeight=r.clientHeight+u;var c=void 0;return e?r.clientX=r.clientY=0:(c=t.getBoundingClientRect(),a||(a=getComputedStyle(t,"")),r.clientX=c.left+(parseFloat(a.borderLeftWidth)||0),r.clientY=c.top+(parseFloat(a.borderTopWidth)||0)),r}(c.target,d.isWindow,f),v=Xt({left:p.clientX,top:p.clientY,width:p.clientWidth,height:p.clientHeight});f?t.autoScroll&&(d.scrollWidth=t.autoScroll.scrollWidth,d.scrollHeight=t.autoScroll.scrollHeight):(d.scrollWidth=p.scrollWidth,d.scrollHeight=p.scrollHeight),[["X","Width","left","right"],["Y","Height","top","bottom"]].forEach(function(t){var e=t[0],n=t[1],o=t[2],i=t[3],a=(d["scroll"+n]||0)-p["client"+n],l=c["min"+e]||0,u=tt(c["max"+e])?c["max"+e]:a;if(l<u&&l<a){u>a&&(u=a);for(var s=[],f=r[n.toLowerCase()],h=c.sensitivity.length-1;h>=0;h--){var m=c.sensitivity[h],g=c.speed[h];s.push({dir:-1,speed:g,position:v[o]+m}),s.push({dir:1,speed:g,position:v[i]-m-f})}d[e.toLowerCase()]={min:l,max:u,lines:s}}})}t.autoScroll=d.x||d.y?d:null}function Qt(t){wt.stop(),Mt(t.options.handle,t.orgCursor),lt.style.cursor=dt,!1!==t.options.zIndex&&(t.elementStyle.zIndex=t.orgZIndex),pt&&(lt.style[pt]=vt);var e=X(t.element);xt&&e.remove(xt),yt&&e.remove(yt),it=null,rt.cancel(),t.onDragEnd&&t.onDragEnd({left:t.elementBBox.left,top:t.elementBBox.top})}function te(t,e){var n=t.options,r=void 0;if(e.containment){var o=void 0;Dt(e.containment)?e.containment!==n.containment&&(n.containment=e.containment,t.containmentIsBBox=!1,r=!0):(o=Ft(It(e.containment)))&&_t(o,n.containment)&&(n.containment=o,t.containmentIsBBox=!0,r=!0)}function i(t,e){function n(t){return"string"==typeof t?t.replace(/[, ]+/g," ").trim().toLowerCase():null}tt(e.gravity)&&e.gravity>0&&(t.gravity=e.gravity);var r=n(e.corner);if(r){if("all"!==r){var o={},i=r.split(/\s/).reduce(function(t,e){return(e="tl"===(e=e.trim().replace(/^(.).*?-(.).*$/,"$1$2"))||"lt"===e?"tl":"tr"===e||"rt"===e?"tr":"bl"===e||"lb"===e?"bl":"br"===e||"rb"===e?"br":null)&&!o[e]&&(t.push(e),o[e]=!0),t},[]),a=i.length;r=a?4===a?"all":i.join(" "):null}r&&(t.corner=r)}var l=n(e.side);l&&("start"===l||"end"===l||"both"===l?t.side=l:"start end"!==l&&"end start"!==l||(t.side="both")),"boolean"==typeof e.center&&(t.center=e.center);var u=n(e.edge);u&&("inside"===u||"outside"===u||"both"===u?t.edge=u:"inside outside"!==u&&"outside inside"!==u||(t.edge="both"));var s="string"==typeof e.base?e.base.trim().toLowerCase():null;return!s||"containment"!==s&&"document"!==s||(t.base=s),t}if(null!=e.snap){var a=Q(e.snap)&&null!=e.snap.targets?e.snap:{targets:e.snap},l=[],u=i({targets:l},a);u.gravity||(u.gravity=F),u.corner||(u.corner=W),u.side||(u.side=j),"boolean"!=typeof u.center&&(u.center=!1),u.edge||(u.edge=R),u.base||(u.base=M);var s=(Array.isArray(a.targets)?a.targets:[a.targets]).reduce(function(t,e){if(null==e)return t;var n=Dt(e),r=Ft(It(e)),o=n||r?{boundingBox:e}:Q(e)&&null==e.start&&null==e.end&&null==e.step?e:{x:e,y:e},a=[],s={},d=o.boundingBox,c=void 0;if(n||Dt(d))a.push({element:d}),s.boundingBox=d;else if(c=r||Ft(It(d)))a.push({ppBBox:c}),s.boundingBox=Wt(c);else{var f=void 0,p=["x","y"].reduce(function(t,e){var n,r=o[e];if(n=Yt(r))t[e]=n,s[e]=Lt(n);else{var i=void 0,a=void 0,l=void 0;Q(r)&&(i=Yt(r.start),a=Yt(r.end),l=Yt(r.step),i&&a&&i.isRatio===a.isRatio&&i.value>=a.value&&(f=!0)),i=t[e+"Start"]=i||{value:0,isRatio:!1},a=t[e+"End"]=a||{value:1,isRatio:!0},s[e]={start:Lt(i),end:Lt(a)},l&&((l.isRatio?l.value>0:l.value>=2)?(t[e+"Step"]=l,s[e].step=Lt(l)):f=!0)}return t},{});if(f)return t;p.xStart&&!p.xStep&&p.yStart&&!p.yStep?a.push({xStart:p.xStart,xEnd:p.xEnd,y:p.yStart},{xStart:p.xStart,xEnd:p.xEnd,y:p.yEnd},{x:p.xStart,yStart:p.yStart,yEnd:p.yEnd},{x:p.xEnd,yStart:p.yStart,yEnd:p.yEnd}):a.push(p)}if(a.length){l.push(i(s,o));var v=s.corner||u.corner,h=s.side||u.side,m=s.edge||u.edge,g={gravity:s.gravity||u.gravity,base:s.base||u.base,center:"boolean"==typeof s.center?s.center:u.center,corners:"all"===v?z:v.split(" "),sides:"both"===h?N:[h],edges:"both"===m?V:[m]};a.forEach(function(e){["gravity","corners","sides","center","edges","base"].forEach(function(t){e[t]=g[t]}),t.push(e)})}return t},[]);s.length&&(n.snap=u,_t(s,t.parsedSnapTargets)&&(t.parsedSnapTargets=s,r=!0))}else e.hasOwnProperty("snap")&&t.parsedSnapTargets&&(n.snap=t.parsedSnapTargets=t.snapTargets=void 0);if(e.autoScroll){var d=Q(e.autoScroll)?e.autoScroll:{target:!0===e.autoScroll?window:e.autoScroll},c={};c.target=Dt(d.target)?d.target:window,c.speed=[],(Array.isArray(d.speed)?d.speed:[d.speed]).every(function(t,e){return!!(e<=2&&tt(t))&&(c.speed[e]=t,!0)}),c.speed.length||(c.speed=G);var f=Array.isArray(d.sensitivity)?d.sensitivity:[d.sensitivity];c.sensitivity=c.speed.map(function(t,e){return tt(f[e])?f[e]:q[e]}),["X","Y"].forEach(function(t){var e="min"+t,n="max"+t;tt(d[e])&&d[e]>=0&&(c[e]=d[e]),tt(d[n])&&d[n]>=0&&(!c[e]||d[n]>=c[e])&&(c[n]=d[n])}),_t(c,n.autoScroll)&&(n.autoScroll=c,r=!0)}else e.hasOwnProperty("autoScroll")&&(n.autoScroll&&(r=!0),n.autoScroll=void 0);if(r&&Kt(t),Dt(e.handle)&&e.handle!==n.handle){n.handle&&(n.handle.style.cursor=t.orgCursor,pt&&(n.handle.style[pt]=t.orgUserSelect),rt.removeStartHandler(n.handle,t.pointerEventHandlerId));var p=n.handle=e.handle;t.orgCursor=p.style.cursor,Mt(p,t.orgCursor),pt&&(t.orgUserSelect=p.style[pt],p.style[pt]="none"),rt.addStartHandler(p,t.pointerEventHandlerId)}(tt(e.zIndex)||!1===e.zIndex)&&(n.zIndex=e.zIndex,t===it&&(t.elementStyle.zIndex=!1===n.zIndex?t.orgZIndex:n.zIndex));var v={left:t.elementBBox.left,top:t.elementBBox.top},h=void 0;tt(e.left)&&e.left!==v.left&&(v.left=e.left,h=!0),tt(e.top)&&e.top!==v.top&&(v.top=e.top,h=!0),h&&Ut(t,v),["onDrag","onMove","onDragStart","onMoveStart","onDragEnd"].forEach(function(r){"function"==typeof e[r]?(n[r]=e[r],t[r]=n[r].bind(t.ins)):e.hasOwnProperty(r)&&null==e[r]&&(n[r]=t[r]=void 0)})}wt.move=function(t,e,n){St.call(window,Ht),Et(),Ct===t&&(e.x&&Bt.x&&(e.x.lastValue=Bt.x.lastValue),e.y&&Bt.y&&(e.y.lastValue=Bt.y.lastValue)),Ct=t,Bt=e,Ot=n;var r=Date.now();["x","y"].forEach(function(t){var e=Bt[t];e&&(e.lastFrameTime=r)}),Ht=bt.call(window,Tt)},wt.stop=function(){St.call(window,Ht),Et(),Bt={},Ct=null};var ee=function(){function t(e,n){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t);var r={ins:this,options:{zIndex:A},disabled:!1};if(Object.defineProperty(this,"_id",{value:++ot}),r._id=this._id,et[this._id]=r,!Dt(e)||e===lt)throw new Error("This element is not accepted.");if(n){if(!Q(n))throw new Error("Invalid options.")}else n={};var o=!0,i=void 0;if(e instanceof SVGElement&&(i=e.ownerSVGElement)){if(!e.getBBox)throw new Error("This element is not accepted. (SVGLocatable)");if(!e.transform)throw new Error("This element is not accepted. (SVGAnimatedTransformList)");r.svgTransform=e.transform.baseVal.appendItem(i.createSVGTransform()),r.svgPoint=i.createSVGPoint();var a=e.nearestViewportElement;r.svgCtmElement=$?a.appendChild(document.createElementNS(i.namespaceURI,"rect")):a,o=!1,r.initElm=Jt,r.moveElm=qt}else{var l=P.getName("willChange");l&&(o=!1),!n.leftTop&&ft?(l&&(e.style[l]="transform"),r.initElm=Zt,r.moveElm=Vt):(l&&(e.style[l]="left, top"),r.initElm=$t,r.moveElm=Gt)}if(r.element=function(t,e){var n=t.style;n.webkitTapHighlightColor="transparent";var r=P.getName("boxShadow"),o=window.getComputedStyle(t,"")[r];return o&&"none"!==o||(n[r]="0 0 1px transparent"),e&&ft&&(n[ft]="translateZ(0)"),t}(e,o),r.elementStyle=e.style,r.orgZIndex=r.elementStyle.zIndex,gt&&X(e).add(gt),r.pointerEventHandlerId=rt.regStartHandler(function(t){return function(t,e){return!(t.disabled||t.onDragStart&&!1===t.onDragStart(e)||(it&&Qt(it),zt(t.options.handle),lt.style.cursor=st||window.getComputedStyle(t.options.handle,"").cursor,!1!==t.options.zIndex&&(t.elementStyle.zIndex=t.options.zIndex),pt&&(lt.style[pt]="none"),yt&&X(t.element).add(yt),it=t,at=!1,nt.left=t.elementBBox.left-(e.clientX+window.pageXOffset),nt.top=t.elementBBox.top-(e.clientY+window.pageYOffset),0))}(r,t)}),!n.containment){var u;n.containment=(u=e.parentNode)&&Dt(u)?u:lt}n.handle||(n.handle=e),te(r,n)}return Y(t,[{key:"remove",value:function(){var t=et[this._id];this.disabled=!0,rt.unregStartHandler(rt.removeStartHandler(t.options.handle,t.pointerEventHandlerId)),delete et[this._id]}},{key:"setOptions",value:function(t){return Q(t)&&te(et[this._id],t),this}},{key:"position",value:function(){return Kt(et[this._id]),this}},{key:"disabled",get:function(){return et[this._id].disabled},set:function(t){var e=et[this._id];(t=!!t)!==e.disabled&&(e.disabled=t,e.disabled?(e===it&&Qt(e),e.options.handle.style.cursor=e.orgCursor,pt&&(e.options.handle.style[pt]=e.orgUserSelect),gt&&X(e.element).remove(gt)):(Mt(e.options.handle,e.orgCursor),pt&&(e.options.handle.style[pt]="none"),gt&&X(e.element).add(gt)))}},{key:"element",get:function(){return et[this._id].element}},{key:"rect",get:function(){return It(et[this._id].elementBBox)}},{key:"left",get:function(){return et[this._id].elementBBox.left},set:function(t){te(et[this._id],{left:t})}},{key:"top",get:function(){return et[this._id].elementBBox.top},set:function(t){te(et[this._id],{top:t})}},{key:"containment",get:function(){var t=et[this._id];return t.containmentIsBBox?Wt(t.options.containment):t.options.containment},set:function(t){te(et[this._id],{containment:t})}},{key:"snap",get:function(){return It(et[this._id].options.snap)},set:function(t){te(et[this._id],{snap:t})}},{key:"autoScroll",get:function(){return It(et[this._id].options.autoScroll)},set:function(t){te(et[this._id],{autoScroll:t})}},{key:"handle",get:function(){return et[this._id].options.handle},set:function(t){te(et[this._id],{handle:t})}},{key:"zIndex",get:function(){return et[this._id].options.zIndex},set:function(t){te(et[this._id],{zIndex:t})}},{key:"onDrag",get:function(){return et[this._id].options.onDrag},set:function(t){te(et[this._id],{onDrag:t})}},{key:"onMove",get:function(){return et[this._id].options.onMove},set:function(t){te(et[this._id],{onMove:t})}},{key:"onDragStart",get:function(){return et[this._id].options.onDragStart},set:function(t){te(et[this._id],{onDragStart:t})}},{key:"onMoveStart",get:function(){return et[this._id].options.onMoveStart},set:function(t){te(et[this._id],{onMoveStart:t})}},{key:"onDragEnd",get:function(){return et[this._id].options.onDragEnd},set:function(t){te(et[this._id],{onDragEnd:t})}}],[{key:"draggableCursor",get:function(){return ht},set:function(t){ht!==t&&(ht=t,ut=null,Object.keys(et).forEach(function(t){var e=et[t];e.disabled||e===it&&!1!==st||(Mt(e.options.handle,e.orgCursor),e===it&&(lt.style.cursor=dt,lt.style.cursor=window.getComputedStyle(e.options.handle,"").cursor))}))}},{key:"draggingCursor",get:function(){return mt},set:function(t){mt!==t&&(mt=t,st=null,it&&(zt(it.options.handle),!1===st&&(Mt(it.options.handle,it.orgCursor),lt.style.cursor=dt),lt.style.cursor=st||window.getComputedStyle(it.options.handle,"").cursor))}},{key:"draggableClass",get:function(){return gt},set:function(t){(t=t?t+"":void 0)!==gt&&(Object.keys(et).forEach(function(e){var n=et[e];if(!n.disabled){var r=X(n.element);gt&&r.remove(gt),t&&r.add(t)}}),gt=t)}},{key:"draggingClass",get:function(){return yt},set:function(t){if((t=t?t+"":void 0)!==yt){if(it){var e=X(it.element);yt&&e.remove(yt),t&&e.add(t)}yt=t}}},{key:"movingClass",get:function(){return xt},set:function(t){if((t=t?t+"":void 0)!==xt){if(it&&at){var e=X(it.element);xt&&e.remove(xt),t&&e.add(t)}xt=t}}}]),t}();rt.addMoveHandler(document,function(t){if(it){var e={left:t.clientX+window.pageXOffset+nt.left,top:t.clientY+window.pageYOffset+nt.top};if(Ut(it,e,it.snapTargets?function(t){var e=it.snapTargets.length,n=!1,r=!1,o=void 0;for(o=0;o<e&&(!n||!r);o++){var i=it.snapTargets[o];(null==i.gravityXStart||t.left>=i.gravityXStart)&&(null==i.gravityXEnd||t.left<=i.gravityXEnd)&&(null==i.gravityYStart||t.top>=i.gravityYStart)&&(null==i.gravityYEnd||t.top<=i.gravityYEnd)&&(n||null==i.x||(t.left=i.x,n=!0,o=-1),r||null==i.y||(t.top=i.y,r=!0,o=-1))}return t.snapped=n||r,!it.onDrag||it.onDrag(t)}:it.onDrag)){var n={},r=it.autoScroll;if(r){var o={x:it.elementBBox.left-window.pageXOffset,y:it.elementBBox.top-window.pageYOffset};["x","y"].forEach(function(t){if(r[t]){var e=r[t].min,i=r[t].max;r[t].lines.some(function(r){return(-1===r.dir?o[t]<=r.position:o[t]>=r.position)&&(n[t]={dir:r.dir,speed:r.speed/1e3,min:e,max:i},!0)})}})}n.x||n.y?(wt.move(r.target,n,r.isWindow?kt:Pt),e.autoScroll=!0):wt.stop(),at||(at=!0,xt&&X(it.element).add(xt),it.onMoveStart&&it.onMoveStart(e)),it.onMove&&it.onMove(e)}}});var ne=function(){it&&Qt(it)};rt.addEndHandler(document,ne),rt.addCancelHandler(document,ne);var re=function(){ct=P.getName("transitionProperty"),ft=P.getName("transform"),dt=lt.style.cursor,(pt=P.getName("userSelect"))&&(vt=lt.style[pt]);var t={},e=void 0;function n(t,e){t.initElm&&Kt(t,e)}var r=!1,o=c.add(function(o){r||(r=!0,it&&(n(it,o.type),rt.move(),t[it._id]=!0),clearTimeout(e),e=setTimeout(function(){!function(r){clearTimeout(e),Object.keys(et).forEach(function(e){t[e]||n(et[e],r)}),t={}}(o.type)},200),r=!1)});window.addEventListener("resize",o,!0),window.addEventListener("scroll",o,!0)};(lt=document.body)?re():document.addEventListener("DOMContentLoaded",function(){lt=document.body,re()},!0);e.default=ee}]).default;
/*! LeaderLine v1.0.5 (c) anseki https://anseki.github.io/leader-line/ */
var LeaderLine=function(){"use strict";var te,g,y,S,_,o,t,h,f,p,a,i,l,v="leader-line",M=1,I=2,C=3,L=4,n={top:M,right:I,bottom:C,left:L},A=1,V=2,P=3,N=4,T=5,m={straight:A,arc:V,fluid:P,magnet:N,grid:T},ne="behind",r=v+"-defs",s='<svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="leader-line-defs"><style><![CDATA[.leader-line{position:absolute;overflow:visible!important;pointer-events:none!important;font-size:16px}#leader-line-defs{width:0;height:0;position:absolute;left:0;top:0}.leader-line-line-path{fill:none}.leader-line-mask-bg-rect{fill:#fff}.leader-line-caps-mask-anchor,.leader-line-caps-mask-marker-shape{fill:#000}.leader-line-caps-mask-anchor{stroke:#000}.leader-line-caps-mask-line,.leader-line-plugs-face{stroke:transparent}.leader-line-line-mask-shape{stroke:#fff}.leader-line-line-outline-mask-shape{stroke:#000}.leader-line-plug-mask-shape{fill:#fff;stroke:#000}.leader-line-plug-outline-mask-shape{fill:#000;stroke:#fff}.leader-line-areaAnchor{position:absolute;overflow:visible!important}]]></style><defs><circle id="leader-line-disc" cx="0" cy="0" r="5"/><rect id="leader-line-square" x="-5" y="-5" width="10" height="10"/><polygon id="leader-line-arrow1" points="-8,-8 8,0 -8,8 -5,0"/><polygon id="leader-line-arrow2" points="-4,-8 4,0 -4,8 -7,5 -2,0 -7,-5"/><polygon id="leader-line-arrow3" points="-4,-5 8,0 -4,5"/><g id="leader-line-hand"><path style="fill: #fcfcfc" d="M9.19 11.14h4.75c1.38 0 2.49-1.11 2.49-2.49 0-.51-.15-.98-.41-1.37h1.3c1.38 0 2.49-1.11 2.49-2.49s-1.11-2.53-2.49-2.53h1.02c1.38 0 2.49-1.11 2.49-2.49s-1.11-2.49-2.49-2.49h14.96c1.37 0 2.49-1.11 2.49-2.49s-1.11-2.49-2.49-2.49H16.58C16-9.86 14.28-11.14 9.7-11.14c-4.79 0-6.55 3.42-7.87 4.73H-2.14v13.23h3.68C3.29 9.97 5.47 11.14 9.19 11.14L9.19 11.14Z"/><path style="fill: black" d="M13.95 12c1.85 0 3.35-1.5 3.35-3.35 0-.17-.02-.34-.04-.51h.07c1.85 0 3.35-1.5 3.35-3.35 0-.79-.27-1.51-.72-2.08 1.03-.57 1.74-1.67 1.74-2.93 0-.59-.16-1.15-.43-1.63h12.04c1.85 0 3.35-1.5 3.35-3.35 0-1.85-1.5-3.35-3.35-3.35H17.2C16.26-10.93 13.91-12 9.7-12 5.36-12 3.22-9.4 1.94-7.84c0 0-.29.33-.5.57-.63 0-3.58 0-3.58 0C-2.61-7.27-3-6.88-3-6.41v13.23c0 .47.39.86.86.86 0 0 2.48 0 3.2 0C2.9 10.73 5.29 12 9.19 12L13.95 12ZM9.19 10.28c-3.46 0-5.33-1.05-6.9-3.87-.15-.27-.44-.44-.75-.44 0 0-1.81 0-2.82 0V-5.55c1.06 0 3.11 0 3.11 0 .25 0 .44-.06.61-.25l.83-.95c1.23-1.49 2.91-3.53 6.43-3.53 3.45 0 4.9.74 5.57 1.72h-4.3c-.48 0-.86.38-.86.86s.39.86.86.86h22.34c.9 0 1.63.73 1.63 1.63 0 .9-.73 1.63-1.63 1.63H15.83c-.48 0-.86.38-.86.86 0 .47.39.86.86.86h2.52c.9 0 1.63.73 1.63 1.63s-.73 1.63-1.63 1.63h-3.12c-.48 0-.86.38-.86.86 0 .47.39.86.86.86h2.11c.88 0 1.63.76 1.63 1.67 0 .9-.73 1.63-1.63 1.63h-3.2c-.48 0-.86.39-.86.86 0 .47.39.86.86.86h1.36c.05.16.09.34.09.51 0 .9-.73 1.63-1.63 1.63C13.95 10.28 9.19 10.28 9.19 10.28Z"/></g><g id="leader-line-crosshair"><path d="M0-78.97c-43.54 0-78.97 35.43-78.97 78.97 0 43.54 35.43 78.97 78.97 78.97s78.97-35.43 78.97-78.97C78.97-43.54 43.55-78.97 0-78.97ZM76.51-1.21h-9.91v-9.11h-2.43v9.11h-11.45c-.64-28.12-23.38-50.86-51.5-51.5V-64.17h9.11V-66.6h-9.11v-9.91C42.46-75.86 75.86-42.45 76.51-1.21ZM-1.21-30.76h-9.11v2.43h9.11V-4.2c-1.44.42-2.57 1.54-2.98 2.98H-28.33v-9.11h-2.43v9.11H-50.29C-49.65-28-27.99-49.65-1.21-50.29V-30.76ZM-30.76 1.21v9.11h2.43v-9.11H-4.2c.42 1.44 1.54 2.57 2.98 2.98v24.13h-9.11v2.43h9.11v19.53C-27.99 49.65-49.65 28-50.29 1.21H-30.76ZM1.22 30.75h9.11v-2.43h-9.11V4.2c1.44-.42 2.56-1.54 2.98-2.98h24.13v9.11h2.43v-9.11h19.53C49.65 28 28 49.65 1.22 50.29V30.75ZM30.76-1.21v-9.11h-2.43v9.11H4.2c-.42-1.44-1.54-2.56-2.98-2.98V-28.33h9.11v-2.43h-9.11V-50.29C28-49.65 49.65-28 50.29-1.21H30.76ZM-1.21-76.51v9.91h-9.11v2.43h9.11v11.45c-28.12.64-50.86 23.38-51.5 51.5H-64.17v-9.11H-66.6v9.11h-9.91C-75.86-42.45-42.45-75.86-1.21-76.51ZM-76.51 1.21h9.91v9.11h2.43v-9.11h11.45c.64 28.12 23.38 50.86 51.5 51.5v11.45h-9.11v2.43h9.11v9.91C-42.45 75.86-75.86 42.45-76.51 1.21ZM1.22 76.51v-9.91h9.11v-2.43h-9.11v-11.45c28.12-.64 50.86-23.38 51.5-51.5h11.45v9.11h2.43v-9.11h9.91C75.86 42.45 42.45 75.86 1.22 76.51Z"/><path d="M0 83.58-7.1 96 7.1 96Z"/><path d="M0-83.58 7.1-96-7.1-96"/><path d="M83.58 0 96 7.1 96-7.1Z"/><path d="M-83.58 0-96-7.1-96 7.1Z"/></g></defs></svg>',ae={disc:{elmId:"leader-line-disc",noRotate:!0,bBox:{left:-5,top:-5,width:10,height:10,right:5,bottom:5},widthR:2.5,heightR:2.5,bCircle:5,sideLen:5,backLen:5,overhead:0,outlineBase:1,outlineMax:4},square:{elmId:"leader-line-square",noRotate:!0,bBox:{left:-5,top:-5,width:10,height:10,right:5,bottom:5},widthR:2.5,heightR:2.5,bCircle:5,sideLen:5,backLen:5,overhead:0,outlineBase:1,outlineMax:4},arrow1:{elmId:"leader-line-arrow1",bBox:{left:-8,top:-8,width:16,height:16,right:8,bottom:8},widthR:4,heightR:4,bCircle:8,sideLen:8,backLen:8,overhead:8,outlineBase:2,outlineMax:1.5},arrow2:{elmId:"leader-line-arrow2",bBox:{left:-7,top:-8,width:11,height:16,right:4,bottom:8},widthR:2.75,heightR:4,bCircle:8,sideLen:8,backLen:7,overhead:4,outlineBase:1,outlineMax:1.75},arrow3:{elmId:"leader-line-arrow3",bBox:{left:-4,top:-5,width:12,height:10,right:8,bottom:5},widthR:3,heightR:2.5,bCircle:8,sideLen:5,backLen:4,overhead:8,outlineBase:1,outlineMax:2.5},hand:{elmId:"leader-line-hand",bBox:{left:-3,top:-12,width:40,height:24,right:37,bottom:12},widthR:10,heightR:6,bCircle:37,sideLen:12,backLen:3,overhead:37},crosshair:{elmId:"leader-line-crosshair",noRotate:!0,bBox:{left:-96,top:-96,width:192,height:192,right:96,bottom:96},widthR:48,heightR:48,bCircle:96,sideLen:96,backLen:96,overhead:0}},E={behind:ne,disc:"disc",square:"square",arrow1:"arrow1",arrow2:"arrow2",arrow3:"arrow3",hand:"hand",crosshair:"crosshair"},ie={disc:"disc",square:"square",arrow1:"arrow1",arrow2:"arrow2",arrow3:"arrow3",hand:"hand",crosshair:"crosshair"},W=[M,I,C,L],x="auto",oe={x:"left",y:"top",width:"width",height:"height"},B=80,R=4,F=5,G=120,D=8,z=3.75,j=10,H=30,U=.5522847,Z=.25*Math.PI,u=/^\s*(\-?[\d\.]+)\s*(\%)?\s*$/,b="http://www.w3.org/2000/svg",e="-ms-scroll-limit"in document.documentElement.style&&"-ms-ime-align"in document.documentElement.style&&!window.navigator.msPointerEnabled,le=!e&&!!document.uniqueID,re="MozAppearance"in document.documentElement.style,se=!(e||re||!window.chrome||!window.CSS),ue=!e&&!le&&!re&&!se&&!window.chrome&&"WebkitAppearance"in document.documentElement.style,he=le||e?.2:.1,pe={path:P,lineColor:"coral",lineSize:4,plugSE:[ne,"arrow1"],plugSizeSE:[1,1],lineOutlineEnabled:!1,lineOutlineColor:"indianred",lineOutlineSize:.25,plugOutlineEnabledSE:[!1,!1],plugOutlineSizeSE:[1,1]},k=(a={}.toString,i={}.hasOwnProperty.toString,l=i.call(Object),function(e){var t,n;return e&&"[object Object]"===a.call(e)&&(!(t=Object.getPrototypeOf(e))||(n=t.hasOwnProperty("constructor")&&t.constructor)&&"function"==typeof n&&i.call(n)===l)}),w=Number.isFinite||function(e){return"number"==typeof e&&window.isFinite(e)},c=function(){var e,x={ease:[.25,.1,.25,1],linear:[0,0,1,1],"ease-in":[.42,0,1,1],"ease-out":[0,0,.58,1],"ease-in-out":[.42,0,.58,1]},b=1e3/60/2,t=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||window.msRequestAnimationFrame||function(e){setTimeout(e,b)},n=window.cancelAnimationFrame||window.mozCancelAnimationFrame||window.webkitCancelAnimationFrame||window.msCancelAnimationFrame||function(e){clearTimeout(e)},a=Number.isFinite||function(e){return"number"==typeof e&&window.isFinite(e)},k=[],w=0;function l(){var i=Date.now(),o=!1;e&&(n.call(window,e),e=null),k.forEach(function(e){var t,n,a;if(e.framesStart){if((t=i-e.framesStart)>=e.duration&&e.count&&e.loopsLeft<=1)return a=e.frames[e.lastFrame=e.reverse?0:e.frames.length-1],e.frameCallback(a.value,!0,a.timeRatio,a.outputRatio),void(e.framesStart=null);if(t>e.duration){if(n=Math.floor(t/e.duration),e.count){if(n>=e.loopsLeft)return a=e.frames[e.lastFrame=e.reverse?0:e.frames.length-1],e.frameCallback(a.value,!0,a.timeRatio,a.outputRatio),void(e.framesStart=null);e.loopsLeft-=n}e.framesStart+=e.duration*n,t=i-e.framesStart}e.reverse&&(t=e.duration-t),a=e.frames[e.lastFrame=Math.round(t/b)],!1!==e.frameCallback(a.value,!1,a.timeRatio,a.outputRatio)?o=!0:e.framesStart=null}}),o&&(e=t.call(window,l))}function O(e,t){e.framesStart=Date.now(),null!=t&&(e.framesStart-=e.duration*(e.reverse?1-t:t)),e.loopsLeft=e.count,e.lastFrame=null,l()}return{add:function(n,e,t,a,i,o,l){var r,s,u,h,p,c,d,f,y,S,m,g,_,v=++w;function E(e,t){return{value:n(t),timeRatio:e,outputRatio:t}}if("string"==typeof i&&(i=x[i]),n=n||function(){},t<b)s=[E(0,0),E(1,1)];else{if(u=b/t,s=[E(0,0)],0===i[0]&&0===i[1]&&1===i[2]&&1===i[3])for(p=u;p<=1;p+=u)s.push(E(p,p));else for(c=h=(p=u)/10;c<=1;c+=h)void 0,S=(y=(f=c)*f)*f,_=3*(m=1-f)*y,p<=(d={x:(g=3*(m*m)*f)*i[0]+_*i[2]+S,y:g*i[1]+_*i[3]+S}).x&&(s.push(E(d.x,d.y)),p+=u);s.push(E(1,1))}return r={animId:v,frameCallback:e,duration:t,count:a,frames:s,reverse:!!o},k.push(r),!1!==l&&O(r,l),v},remove:function(n){var a;k.some(function(e,t){return e.animId===n&&(a=t,!(e.framesStart=null))})&&k.splice(a,1)},start:function(t,n,a){k.some(function(e){return e.animId===t&&(e.reverse=!!n,O(e,a),!0)})},stop:function(t,n){var a;return k.some(function(e){return e.animId===t&&(n?null!=e.lastFrame&&(a=e.frames[e.lastFrame].timeRatio):(a=(Date.now()-e.framesStart)/e.duration,e.reverse&&(a=1-a),a<0?a=0:1<a&&(a=1)),!(e.framesStart=null))}),a},validTiming:function(t){return"string"==typeof t?x[t]:Array.isArray(t)&&[0,1,2,3].every(function(e){return a(t[e])&&0<=t[e]&&t[e]<=1})?[t[0],t[1],t[2],t[3]]:null}}}(),d=function(e){e.SVGPathElement.prototype.getPathData&&e.SVGPathElement.prototype.setPathData||function(){var i={Z:"Z",M:"M",L:"L",C:"C",Q:"Q",A:"A",H:"H",V:"V",S:"S",T:"T",z:"Z",m:"m",l:"l",c:"c",q:"q",a:"a",h:"h",v:"v",s:"s",t:"t"},o=function(e){this._string=e,this._currentIndex=0,this._endIndex=this._string.length,this._prevCommand=null,this._skipOptionalSpaces()},l=-1!==e.navigator.userAgent.indexOf("MSIE ");o.prototype={parseSegment:function(){var e=this._string[this._currentIndex],t=i[e]?i[e]:null;if(null===t){if(null===this._prevCommand)return null;if(null===(t=("+"===e||"-"===e||"."===e||"0"<=e&&e<="9")&&"Z"!==this._prevCommand?"M"===this._prevCommand?"L":"m"===this._prevCommand?"l":this._prevCommand:null))return null}else this._currentIndex+=1;var n=null,a=(this._prevCommand=t).toUpperCase();return"H"===a||"V"===a?n=[this._parseNumber()]:"M"===a||"L"===a||"T"===a?n=[this._parseNumber(),this._parseNumber()]:"S"===a||"Q"===a?n=[this._parseNumber(),this._parseNumber(),this._parseNumber(),this._parseNumber()]:"C"===a?n=[this._parseNumber(),this._parseNumber(),this._parseNumber(),this._parseNumber(),this._parseNumber(),this._parseNumber()]:"A"===a?n=[this._parseNumber(),this._parseNumber(),this._parseNumber(),this._parseArcFlag(),this._parseArcFlag(),this._parseNumber(),this._parseNumber()]:"Z"===a&&(this._skipOptionalSpaces(),n=[]),null===n||0<=n.indexOf(null)?null:{type:t,values:n}},hasMoreData:function(){return this._currentIndex<this._endIndex},peekSegmentType:function(){var e=this._string[this._currentIndex];return i[e]?i[e]:null},initialCommandIsMoveTo:function(){if(!this.hasMoreData())return!0;var e=this.peekSegmentType();return"M"===e||"m"===e},_isCurrentSpace:function(){var e=this._string[this._currentIndex];return e<=" "&&(" "===e||"\n"===e||"\t"===e||"\r"===e||"\f"===e)},_skipOptionalSpaces:function(){for(;this._currentIndex<this._endIndex&&this._isCurrentSpace();)this._currentIndex+=1;return this._currentIndex<this._endIndex},_skipOptionalSpacesOrDelimiter:function(){return!(this._currentIndex<this._endIndex&&!this._isCurrentSpace()&&","!==this._string[this._currentIndex])&&(this._skipOptionalSpaces()&&this._currentIndex<this._endIndex&&","===this._string[this._currentIndex]&&(this._currentIndex+=1,this._skipOptionalSpaces()),this._currentIndex<this._endIndex)},_parseNumber:function(){var e=0,t=0,n=1,a=0,i=1,o=1,l=this._currentIndex;if(this._skipOptionalSpaces(),this._currentIndex<this._endIndex&&"+"===this._string[this._currentIndex]?this._currentIndex+=1:this._currentIndex<this._endIndex&&"-"===this._string[this._currentIndex]&&(this._currentIndex+=1,i=-1),this._currentIndex===this._endIndex||(this._string[this._currentIndex]<"0"||"9"<this._string[this._currentIndex])&&"."!==this._string[this._currentIndex])return null;for(var r=this._currentIndex;this._currentIndex<this._endIndex&&"0"<=this._string[this._currentIndex]&&this._string[this._currentIndex]<="9";)this._currentIndex+=1;if(this._currentIndex!==r)for(var s=this._currentIndex-1,u=1;r<=s;)t+=u*(this._string[s]-"0"),s-=1,u*=10;if(this._currentIndex<this._endIndex&&"."===this._string[this._currentIndex]){if(this._currentIndex+=1,this._currentIndex>=this._endIndex||this._string[this._currentIndex]<"0"||"9"<this._string[this._currentIndex])return null;for(;this._currentIndex<this._endIndex&&"0"<=this._string[this._currentIndex]&&this._string[this._currentIndex]<="9";)n*=10,a+=(this._string.charAt(this._currentIndex)-"0")/n,this._currentIndex+=1}if(this._currentIndex!==l&&this._currentIndex+1<this._endIndex&&("e"===this._string[this._currentIndex]||"E"===this._string[this._currentIndex])&&"x"!==this._string[this._currentIndex+1]&&"m"!==this._string[this._currentIndex+1]){if(this._currentIndex+=1,"+"===this._string[this._currentIndex]?this._currentIndex+=1:"-"===this._string[this._currentIndex]&&(this._currentIndex+=1,o=-1),this._currentIndex>=this._endIndex||this._string[this._currentIndex]<"0"||"9"<this._string[this._currentIndex])return null;for(;this._currentIndex<this._endIndex&&"0"<=this._string[this._currentIndex]&&this._string[this._currentIndex]<="9";)e*=10,e+=this._string[this._currentIndex]-"0",this._currentIndex+=1}var h=t+a;return h*=i,e&&(h*=Math.pow(10,o*e)),l===this._currentIndex?null:(this._skipOptionalSpacesOrDelimiter(),h)},_parseArcFlag:function(){if(this._currentIndex>=this._endIndex)return null;var e=null,t=this._string[this._currentIndex];if(this._currentIndex+=1,"0"===t)e=0;else{if("1"!==t)return null;e=1}return this._skipOptionalSpacesOrDelimiter(),e}};var a=function(e){if(!e||0===e.length)return[];var t=new o(e),n=[];if(t.initialCommandIsMoveTo())for(;t.hasMoreData();){var a=t.parseSegment();if(null===a)break;n.push(a)}return n},n=e.SVGPathElement.prototype.setAttribute,r=e.SVGPathElement.prototype.removeAttribute,d=e.Symbol?e.Symbol():"__cachedPathData",f=e.Symbol?e.Symbol():"__cachedNormalizedPathData",U=function(e,t,n,a,i,o,l,r,s,u){var h,p,c,d,f,y=function(e,t,n){return{x:e*Math.cos(n)-t*Math.sin(n),y:e*Math.sin(n)+t*Math.cos(n)}},S=(h=l,Math.PI*h/180),m=[];if(u)p=u[0],c=u[1],d=u[2],f=u[3];else{var g=y(e,t,-S);e=g.x,t=g.y;var _=y(n,a,-S),v=(e-(n=_.x))/2,E=(t-(a=_.y))/2,x=v*v/(i*i)+E*E/(o*o);1<x&&(i*=x=Math.sqrt(x),o*=x);var b=i*i,k=o*o,w=b*k-b*E*E-k*v*v,O=b*E*E+k*v*v,M=(r===s?-1:1)*Math.sqrt(Math.abs(w/O));d=M*i*E/o+(e+n)/2,f=M*-o*v/i+(t+a)/2,p=Math.asin(parseFloat(((t-f)/o).toFixed(9))),c=Math.asin(parseFloat(((a-f)/o).toFixed(9))),e<d&&(p=Math.PI-p),n<d&&(c=Math.PI-c),p<0&&(p=2*Math.PI+p),c<0&&(c=2*Math.PI+c),s&&c<p&&(p-=2*Math.PI),!s&&p<c&&(c-=2*Math.PI)}var I=c-p;if(Math.abs(I)>120*Math.PI/180){var C=c,L=n,A=a;c=s&&p<c?p+120*Math.PI/180*1:p+120*Math.PI/180*-1,n=d+i*Math.cos(c),a=f+o*Math.sin(c),m=U(n,a,L,A,i,o,l,0,s,[c,C,d,f])}I=c-p;var V=Math.cos(p),P=Math.sin(p),N=Math.cos(c),T=Math.sin(c),W=Math.tan(I/4),B=4/3*i*W,R=4/3*o*W,F=[e,t],G=[e+B*P,t-R*V],D=[n+B*T,a-R*N],z=[n,a];if(G[0]=2*F[0]-G[0],G[1]=2*F[1]-G[1],u)return[G,D,z].concat(m);m=[G,D,z].concat(m).join().split(",");var j=[],H=[];return m.forEach(function(e,t){t%2?H.push(y(m[t-1],m[t],S).y):H.push(y(m[t],m[t+1],S).x),6===H.length&&(j.push(H),H=[])}),j},y=function(e){return e.map(function(e){return{type:e.type,values:Array.prototype.slice.call(e.values)}})},S=function(e){var S=[],m=null,g=null,_=null,v=null,E=null,x=null,b=null;return e.forEach(function(e){if("M"===e.type){var t=e.values[0],n=e.values[1];S.push({type:"M",values:[t,n]}),v=x=t,E=b=n}else if("C"===e.type){var a=e.values[0],i=e.values[1],o=e.values[2],l=e.values[3];t=e.values[4],n=e.values[5];S.push({type:"C",values:[a,i,o,l,t,n]}),g=o,_=l,v=t,E=n}else if("L"===e.type){t=e.values[0],n=e.values[1];S.push({type:"L",values:[t,n]}),v=t,E=n}else if("H"===e.type){t=e.values[0];S.push({type:"L",values:[t,E]}),v=t}else if("V"===e.type){n=e.values[0];S.push({type:"L",values:[v,n]}),E=n}else if("S"===e.type){o=e.values[0],l=e.values[1],t=e.values[2],n=e.values[3];"C"===m||"S"===m?(r=v+(v-g),s=E+(E-_)):(r=v,s=E),S.push({type:"C",values:[r,s,o,l,t,n]}),g=o,_=l,v=t,E=n}else if("T"===e.type){t=e.values[0],n=e.values[1];"Q"===m||"T"===m?(a=v+(v-g),i=E+(E-_)):(a=v,i=E);var r=v+2*(a-v)/3,s=E+2*(i-E)/3,u=t+2*(a-t)/3,h=n+2*(i-n)/3;S.push({type:"C",values:[r,s,u,h,t,n]}),g=a,_=i,v=t,E=n}else if("Q"===e.type){a=e.values[0],i=e.values[1],t=e.values[2],n=e.values[3],r=v+2*(a-v)/3,s=E+2*(i-E)/3,u=t+2*(a-t)/3,h=n+2*(i-n)/3;S.push({type:"C",values:[r,s,u,h,t,n]}),g=a,_=i,v=t,E=n}else if("A"===e.type){var p=e.values[0],c=e.values[1],d=e.values[2],f=e.values[3],y=e.values[4];t=e.values[5],n=e.values[6];if(0===p||0===c)S.push({type:"C",values:[v,E,t,n,t,n]}),v=t,E=n;else if(v!==t||E!==n)U(v,E,t,n,p,c,d,f,y).forEach(function(e){S.push({type:"C",values:e}),v=t,E=n})}else"Z"===e.type&&(S.push(e),v=x,E=b);m=e.type}),S};e.SVGPathElement.prototype.setAttribute=function(e,t){"d"===e&&(this[d]=null,this[f]=null),n.call(this,e,t)},e.SVGPathElement.prototype.removeAttribute=function(e,t){"d"===e&&(this[d]=null,this[f]=null),r.call(this,e)},e.SVGPathElement.prototype.getPathData=function(e){if(e&&e.normalize){if(this[f])return y(this[f]);this[d]?n=y(this[d]):(n=a(this.getAttribute("d")||""),this[d]=y(n));var t=S((s=[],c=p=h=u=null,n.forEach(function(e){var t=e.type;if("M"===t){var n=e.values[0],a=e.values[1];s.push({type:"M",values:[n,a]}),u=p=n,h=c=a}else if("m"===t)n=u+e.values[0],a=h+e.values[1],s.push({type:"M",values:[n,a]}),u=p=n,h=c=a;else if("L"===t)n=e.values[0],a=e.values[1],s.push({type:"L",values:[n,a]}),u=n,h=a;else if("l"===t)n=u+e.values[0],a=h+e.values[1],s.push({type:"L",values:[n,a]}),u=n,h=a;else if("C"===t){var i=e.values[0],o=e.values[1],l=e.values[2],r=e.values[3];n=e.values[4],a=e.values[5],s.push({type:"C",values:[i,o,l,r,n,a]}),u=n,h=a}else"c"===t?(i=u+e.values[0],o=h+e.values[1],l=u+e.values[2],r=h+e.values[3],n=u+e.values[4],a=h+e.values[5],s.push({type:"C",values:[i,o,l,r,n,a]}),u=n,h=a):"Q"===t?(i=e.values[0],o=e.values[1],n=e.values[2],a=e.values[3],s.push({type:"Q",values:[i,o,n,a]}),u=n,h=a):"q"===t?(i=u+e.values[0],o=h+e.values[1],n=u+e.values[2],a=h+e.values[3],s.push({type:"Q",values:[i,o,n,a]}),u=n,h=a):"A"===t?(n=e.values[5],a=e.values[6],s.push({type:"A",values:[e.values[0],e.values[1],e.values[2],e.values[3],e.values[4],n,a]}),u=n,h=a):"a"===t?(n=u+e.values[5],a=h+e.values[6],s.push({type:"A",values:[e.values[0],e.values[1],e.values[2],e.values[3],e.values[4],n,a]}),u=n,h=a):"H"===t?(n=e.values[0],s.push({type:"H",values:[n]}),u=n):"h"===t?(n=u+e.values[0],s.push({type:"H",values:[n]}),u=n):"V"===t?(a=e.values[0],s.push({type:"V",values:[a]}),h=a):"v"===t?(a=h+e.values[0],s.push({type:"V",values:[a]}),h=a):"S"===t?(l=e.values[0],r=e.values[1],n=e.values[2],a=e.values[3],s.push({type:"S",values:[l,r,n,a]}),u=n,h=a):"s"===t?(l=u+e.values[0],r=h+e.values[1],n=u+e.values[2],a=h+e.values[3],s.push({type:"S",values:[l,r,n,a]}),u=n,h=a):"T"===t?(n=e.values[0],a=e.values[1],s.push({type:"T",values:[n,a]}),u=n,h=a):"t"===t?(n=u+e.values[0],a=h+e.values[1],s.push({type:"T",values:[n,a]}),u=n,h=a):"Z"!==t&&"z"!==t||(s.push({type:"Z",values:[]}),u=p,h=c)}),s));return this[f]=y(t),t}if(this[d])return y(this[d]);var s,u,h,p,c,n=a(this.getAttribute("d")||"");return this[d]=y(n),n},e.SVGPathElement.prototype.setPathData=function(e){if(0===e.length)l?this.setAttribute("d",""):this.removeAttribute("d");else{for(var t="",n=0,a=e.length;n<a;n+=1){var i=e[n];0<n&&(t+=" "),t+=i.type,i.values&&0<i.values.length&&(t+=" "+i.values.join(" "))}this.setAttribute("d",t)}},e.SVGRectElement.prototype.getPathData=function(e){var t=this.x.baseVal.value,n=this.y.baseVal.value,a=this.width.baseVal.value,i=this.height.baseVal.value,o=this.hasAttribute("rx")?this.rx.baseVal.value:this.ry.baseVal.value,l=this.hasAttribute("ry")?this.ry.baseVal.value:this.rx.baseVal.value;a/2<o&&(o=a/2),i/2<l&&(l=i/2);var r=[{type:"M",values:[t+o,n]},{type:"H",values:[t+a-o]},{type:"A",values:[o,l,0,0,1,t+a,n+l]},{type:"V",values:[n+i-l]},{type:"A",values:[o,l,0,0,1,t+a-o,n+i]},{type:"H",values:[t+o]},{type:"A",values:[o,l,0,0,1,t,n+i-l]},{type:"V",values:[n+l]},{type:"A",values:[o,l,0,0,1,t+o,n]},{type:"Z",values:[]}];return r=r.filter(function(e){return"A"!==e.type||0!==e.values[0]&&0!==e.values[1]}),e&&!0===e.normalize&&(r=S(r)),r},e.SVGCircleElement.prototype.getPathData=function(e){var t=this.cx.baseVal.value,n=this.cy.baseVal.value,a=this.r.baseVal.value,i=[{type:"M",values:[t+a,n]},{type:"A",values:[a,a,0,0,1,t,n+a]},{type:"A",values:[a,a,0,0,1,t-a,n]},{type:"A",values:[a,a,0,0,1,t,n-a]},{type:"A",values:[a,a,0,0,1,t+a,n]},{type:"Z",values:[]}];return e&&!0===e.normalize&&(i=S(i)),i},e.SVGEllipseElement.prototype.getPathData=function(e){var t=this.cx.baseVal.value,n=this.cy.baseVal.value,a=this.rx.baseVal.value,i=this.ry.baseVal.value,o=[{type:"M",values:[t+a,n]},{type:"A",values:[a,i,0,0,1,t,n+i]},{type:"A",values:[a,i,0,0,1,t-a,n]},{type:"A",values:[a,i,0,0,1,t,n-i]},{type:"A",values:[a,i,0,0,1,t+a,n]},{type:"Z",values:[]}];return e&&!0===e.normalize&&(o=S(o)),o},e.SVGLineElement.prototype.getPathData=function(){return[{type:"M",values:[this.x1.baseVal.value,this.y1.baseVal.value]},{type:"L",values:[this.x2.baseVal.value,this.y2.baseVal.value]}]},e.SVGPolylineElement.prototype.getPathData=function(){for(var e=[],t=0;t<this.points.numberOfItems;t+=1){var n=this.points.getItem(t);e.push({type:0===t?"M":"L",values:[n.x,n.y]})}return e},e.SVGPolygonElement.prototype.getPathData=function(){for(var e=[],t=0;t<this.points.numberOfItems;t+=1){var n=this.points.getItem(t);e.push({type:0===t?"M":"L",values:[n.x,n.y]})}return e.push({type:"Z",values:[]}),e}}()},O=function(n){var a={};function i(e){if(a[e])return a[e].exports;var t=a[e]={i:e,l:!1,exports:{}};return n[e].call(t.exports,t,t.exports,i),t.l=!0,t.exports}return i.m=n,i.c=a,i.d=function(e,t,n){i.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:n})},i.r=function(e){Object.defineProperty(e,"__esModule",{value:!0})},i.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return i.d(t,"a",t),t},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.p="",i(i.s=0)}([function(e,t,n){n.r(t);var a=500,i=[],o=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||window.msRequestAnimationFrame||function(e){return setTimeout(e,1e3/60)},l=window.cancelAnimationFrame||window.mozCancelAnimationFrame||window.webkitCancelAnimationFrame||window.msCancelAnimationFrame||function(e){return clearTimeout(e)},r=void 0,s=Date.now();function u(){var t=void 0,e=void 0;r&&(l.call(window,r),r=null),i.forEach(function(e){e.event&&(e.listener(e.event),e.event=null,t=!0)}),t?(s=Date.now(),e=!0):Date.now()-s<a&&(e=!0),e&&(r=o.call(window,u))}function h(n){var a=-1;return i.some(function(e,t){return e.listener===n&&(a=t,!0)}),a}var p={add:function(e){var t=void 0;return-1===h(e)?(i.push(t={listener:e}),function(e){t.event=e,r||u()}):null},remove:function(e){var t;-1<(t=h(e))&&(i.splice(t,1),!i.length&&r&&(l.call(window,r),r=null))}};t.default=p}]).default,Y={line_altColor:{iniValue:!1},line_color:{},line_colorTra:{iniValue:!1},line_strokeWidth:{},plug_enabled:{iniValue:!1},plug_enabledSE:{hasSE:!0,iniValue:!1},plug_plugSE:{hasSE:!0,iniValue:ne},plug_colorSE:{hasSE:!0},plug_colorTraSE:{hasSE:!0,iniValue:!1},plug_markerWidthSE:{hasSE:!0},plug_markerHeightSE:{hasSE:!0},lineOutline_enabled:{iniValue:!1},lineOutline_color:{},lineOutline_colorTra:{iniValue:!1},lineOutline_strokeWidth:{},lineOutline_inStrokeWidth:{},plugOutline_enabledSE:{hasSE:!0,iniValue:!1},plugOutline_plugSE:{hasSE:!0,iniValue:ne},plugOutline_colorSE:{hasSE:!0},plugOutline_colorTraSE:{hasSE:!0,iniValue:!1},plugOutline_strokeWidthSE:{hasSE:!0},plugOutline_inStrokeWidthSE:{hasSE:!0},position_socketXYSE:{hasSE:!0,hasProps:!0},position_plugOverheadSE:{hasSE:!0},position_path:{},position_lineStrokeWidth:{},position_socketGravitySE:{hasSE:!0},path_pathData:{},path_edge:{hasProps:!0},viewBox_bBox:{hasProps:!0},viewBox_plugBCircleSE:{hasSE:!0},lineMask_enabled:{iniValue:!1},lineMask_outlineMode:{iniValue:!1},lineMask_x:{},lineMask_y:{},lineOutlineMask_x:{},lineOutlineMask_y:{},maskBGRect_x:{},maskBGRect_y:{},capsMaskAnchor_enabledSE:{hasSE:!0,iniValue:!1},capsMaskAnchor_pathDataSE:{hasSE:!0},capsMaskAnchor_strokeWidthSE:{hasSE:!0},capsMaskMarker_enabled:{iniValue:!1},capsMaskMarker_enabledSE:{hasSE:!0,iniValue:!1},capsMaskMarker_plugSE:{hasSE:!0,iniValue:ne},capsMaskMarker_markerWidthSE:{hasSE:!0},capsMaskMarker_markerHeightSE:{hasSE:!0},caps_enabled:{iniValue:!1},attach_plugSideLenSE:{hasSE:!0},attach_plugBackLenSE:{hasSE:!0}},X={show_on:{},show_effect:{},show_animOptions:{},show_animId:{},show_inAnim:{}},q="fade",Q=[],K={},J=0,$={},ee=0;function ce(t,n){var e,a;return typeof t!=typeof n||(e=k(t)?"obj":Array.isArray(t)?"array":"")!=(k(n)?"obj":Array.isArray(n)?"array":"")||("obj"===e?ce(a=Object.keys(t).sort(),Object.keys(n).sort())||a.some(function(e){return ce(t[e],n[e])}):"array"===e?t.length!==n.length||t.some(function(e,t){return ce(e,n[t])}):t!==n)}function de(n){return n?k(n)?Object.keys(n).reduce(function(e,t){return e[t]=de(n[t]),e},{}):Array.isArray(n)?n.map(de):n:n}function fe(e){var t,n,a,i=1,o=e=(e+"").trim();function l(e){var t=1,n=u.exec(e);return n&&(t=parseFloat(n[1]),n[2]?t=0<=t&&t<=100?t/100:1:(t<0||1<t)&&(t=1)),t}return(t=/^(rgba|hsla|hwb|gray|device\-cmyk)\s*\(([\s\S]+)\)$/i.exec(e))?(n=t[1].toLowerCase(),a=t[2].trim().split(/\s*,\s*/),"rgba"===n&&4===a.length?(i=l(a[3]),o="rgb("+a.slice(0,3).join(", ")+")"):"hsla"===n&&4===a.length?(i=l(a[3]),o="hsl("+a.slice(0,3).join(", ")+")"):"hwb"===n&&4===a.length?(i=l(a[3]),o="hwb("+a.slice(0,3).join(", ")+")"):"gray"===n&&2===a.length?(i=l(a[1]),o="gray("+a[0]+")"):"device-cmyk"===n&&5<=a.length&&(i=l(a[4]),o="device-cmyk("+a.slice(0,4).join(", ")+")")):(t=/^\#(?:([\da-f]{6})([\da-f]{2})|([\da-f]{3})([\da-f]))$/i.exec(e))?t[1]?(i=parseInt(t[2],16)/255,o="#"+t[1]):(i=parseInt(t[4]+t[4],16)/255,o="#"+t[3]):"transparent"===e.toLocaleLowerCase()&&(i=0),[i,o]}function ye(e){return!(!e||e.nodeType!==Node.ELEMENT_NODE||"function"!=typeof e.getBoundingClientRect)}function Se(e,t){var n,a,i,o,l={};if(!(i=e.ownerDocument))return console.error("Cannot get document that contains the element."),null;if(e.compareDocumentPosition(i)&Node.DOCUMENT_POSITION_DISCONNECTED)return console.error("A disconnected element was passed."),null;for(a in n=e.getBoundingClientRect())l[a]=n[a];if(!t){if(!(o=i.defaultView))return console.error("Cannot get window that contains the element."),null;l.left+=o.pageXOffset,l.right+=o.pageXOffset,l.top+=o.pageYOffset,l.bottom+=o.pageYOffset}return l}function me(e,t){var n,a,i=[],o=e;for(t=t||window;;){if(!(n=o.ownerDocument))return console.error("Cannot get document that contains the element."),null;if(!(a=n.defaultView))return console.error("Cannot get window that contains the element."),null;if(a===t)break;if(!(o=a.frameElement))return console.error("`baseWindow` was not found."),null;i.unshift(o)}return i}function ge(e,t){var n,a,o=0,l=0;return(a=me(e,t=t||window))?a.length?(a.forEach(function(e,t){var n,a,i=Se(e,0<t);o+=i.left,l+=i.top,a=(n=e).ownerDocument.defaultView.getComputedStyle(n,""),i={left:n.clientLeft+parseFloat(a.paddingLeft),top:n.clientTop+parseFloat(a.paddingTop)},o+=i.left,l+=i.top}),(n=Se(e,!0)).left+=o,n.right+=o,n.top+=l,n.bottom+=l,n):Se(e):null}function _e(e,t){var n=e.x-t.x,a=e.y-t.y;return Math.sqrt(n*n+a*a)}function ve(e,t,n){var a=t.x-e.x,i=t.y-e.y;return{x:e.x+a*n,y:e.y+i*n,angle:Math.atan2(i,a)/(Math.PI/180)}}function Ee(e,t,n){var a=Math.atan2(e.y-t.y,t.x-e.x);return{x:t.x+Math.cos(a)*n,y:t.y+Math.sin(a)*n*-1}}function xe(e,t,n,a,i){var o=i*i,l=o*i,r=1-i,s=r*r,u=s*r,h=u*e.x+3*s*i*t.x+3*r*o*n.x+l*a.x,p=u*e.y+3*s*i*t.y+3*r*o*n.y+l*a.y,c=e.x+2*i*(t.x-e.x)+o*(n.x-2*t.x+e.x),d=e.y+2*i*(t.y-e.y)+o*(n.y-2*t.y+e.y),f=t.x+2*i*(n.x-t.x)+o*(a.x-2*n.x+t.x),y=t.y+2*i*(n.y-t.y)+o*(a.y-2*n.y+t.y),S=r*e.x+i*t.x,m=r*e.y+i*t.y,g=r*n.x+i*a.x,_=r*n.y+i*a.y,v=90-180*Math.atan2(c-f,d-y)/Math.PI;return{x:h,y:p,fromP2:{x:c,y:d},toP1:{x:f,y:y},fromP1:{x:S,y:m},toP2:{x:g,y:_},angle:v+=180<v?-180:180}}function be(n,a,i,o,e){function l(e,t,n,a,i){return e*(e*(-3*t+9*n-9*a+3*i)+6*t-12*n+6*a)-3*t+3*n}var r,s,u,h,p,c=[.2491,.2491,.2335,.2335,.2032,.2032,.1601,.1601,.1069,.1069,.0472,.0472],d=0;return r=(e=null==e||1<e?1:e<0?0:e)/2,[-.1252,.1252,-.3678,.3678,-.5873,.5873,-.7699,.7699,-.9041,.9041,-.9816,.9816].forEach(function(e,t){u=l(s=r*e+r,n.x,a.x,i.x,o.x),h=l(s,n.y,a.y,i.y,o.y),p=u*u+h*h,d+=c[t]*Math.sqrt(p)}),r*d}function ke(e,t,n,a,i){for(var o,l=.5,r=1-l;o=be(e,t,n,a,r),!(Math.abs(o-i)<=.01);)r+=(o<i?1:-1)*(l/=2);return r}function we(e,n){var a;return e.forEach(function(e){var t=n?e.map(function(e){var t={x:e.x,y:e.y};return n(t),t}):e;a||(a=[{type:"M",values:[t[0].x,t[0].y]}]),a.push(t.length?2===t.length?{type:"L",values:[t[1].x,t[1].y]}:{type:"C",values:[t[1].x,t[1].y,t[2].x,t[2].y,t[3].x,t[3].y]}:{type:"Z",values:[]})}),a}function Oe(e){var n=[],a=0;return e.forEach(function(e){var t=(2===e.length?_e:be).apply(null,e);n.push(t),a+=t}),{segsLen:n,lenAll:a}}function Me(e,a){return null==e||null==a||e.length!==a.length||e.some(function(e,t){var n=a[t];return e.type!==n.type||e.values.some(function(e,t){return e!==n.values[t]})})}function Ie(e,t,n){e.events[t]?e.events[t].indexOf(n)<0&&e.events[t].push(n):e.events[t]=[n]}function Ce(e,t,n){var a;e.events[t]&&-1<(a=e.events[t].indexOf(n))&&e.events[t].splice(a,1)}function Le(e){t&&clearTimeout(t),Q.push(e),t=setTimeout(function(){Q.forEach(function(e){e()}),Q=[]},0)}function Ae(e,t){e.reflowTargets.indexOf(t)<0&&e.reflowTargets.push(t)}function Ve(e){e.reflowTargets.forEach(function(e){var n;n=e,setTimeout(function(){var e=n.parentNode,t=n.nextSibling;e.insertBefore(e.removeChild(n),t)},0)}),e.reflowTargets=[]}function Pe(e,t,n,a,i,o,l){var r,s,u;"auto-start-reverse"===n?("boolean"!=typeof h&&(t.setAttribute("orient","auto-start-reverse"),h=t.orientType.baseVal===SVGMarkerElement.SVG_MARKER_ORIENT_UNKNOWN),h?t.setAttribute("orient",n):((r=i.createSVGTransform()).setRotate(180,0,0),o.transform.baseVal.appendItem(r),t.setAttribute("orient","auto"),u=!0)):(t.setAttribute("orient",n),!1===h&&o.transform.baseVal.clear()),s=t.viewBox.baseVal,u?(s.x=-a.right,s.y=-a.bottom):(s.x=a.left,s.y=a.top),s.width=a.width,s.height=a.height,le&&Ae(e,l)}function Ne(e,t){return{prop:e?"markerEnd":"markerStart",orient:t?t.noRotate?"0":e?"auto":"auto-start-reverse":null}}function Te(n,a){Object.keys(a).forEach(function(e){var t=a[e];n[e]=null!=t.iniValue?t.hasSE?[t.iniValue,t.iniValue]:t.iniValue:t.hasSE?t.hasProps?[{},{}]:[]:t.hasProps?{}:null})}function We(t,e,n,a,i){return a!==e[n]&&(e[n]=a,i&&i.forEach(function(e){e(t,a,n)}),!0)}function Be(e){function t(e,t){return e+parseFloat(t)}var n=e.document,a=e.getComputedStyle(n.documentElement,""),i=e.getComputedStyle(n.body,""),o={x:0,y:0};return"static"!==i.position?(o.x-=[a.marginLeft,a.borderLeftWidth,a.paddingLeft,i.marginLeft,i.borderLeftWidth].reduce(t,0),o.y-=[a.marginTop,a.borderTopWidth,a.paddingTop,i.marginTop,i.borderTopWidth].reduce(t,0)):"static"!==a.position&&(o.x-=[a.marginLeft,a.borderLeftWidth].reduce(t,0),o.y-=[a.marginTop,a.borderTopWidth].reduce(t,0)),o}function Re(e){var t,n=e.document;n.getElementById(r)||(t=(new e.DOMParser).parseFromString(s,"image/svg+xml"),n.body.appendChild(t.documentElement),d(e))}function Fe(u){var _,f,v,e,n,a,i,y,s,h,p,t,o,l,r,c,d,S,m,g=u.options,E=u.curStats,x=u.aplStats,b=E.position_socketXYSE,k=!1;function w(e,t){var n=t===M?{x:e.left+e.width/2,y:e.top}:t===I?{x:e.right,y:e.top+e.height/2}:t===C?{x:e.left+e.width/2,y:e.bottom}:{x:e.left,y:e.top+e.height/2};return n.socketId=t,n}function O(e){return{x:e.x,y:e.y}}if(E.position_path=g.path,E.position_lineStrokeWidth=E.line_strokeWidth,E.position_socketGravitySE=_=de(g.socketGravitySE),f=[0,1].map(function(e){var t,n,a,i=g.anchorSE[e],o=u.optionIsAttach.anchorSE[e],l=!1!==o?$[i._id]:null,r=!1!==o&&l.conf.getStrokeWidth?l.conf.getStrokeWidth(l,u):0,s=!1!==o&&l.conf.getBBoxNest?l.conf.getBBoxNest(l,u,r):ge(i,u.baseWindow);return E.capsMaskAnchor_pathDataSE[e]=!1!==o&&l.conf.getPathData?l.conf.getPathData(l,u,r):(n=null!=(t=s).right?t.right:t.left+t.width,a=null!=t.bottom?t.bottom:t.top+t.height,[{type:"M",values:[t.left,t.top]},{type:"L",values:[n,t.top]},{type:"L",values:[n,a]},{type:"L",values:[t.left,a]},{type:"Z",values:[]}]),E.capsMaskAnchor_strokeWidthSE[e]=r,s}),i=-1,g.socketSE[0]&&g.socketSE[1]?(b[0]=w(f[0],g.socketSE[0]),b[1]=w(f[1],g.socketSE[1])):(g.socketSE[0]||g.socketSE[1]?(g.socketSE[0]?(n=0,a=1):(n=1,a=0),b[n]=w(f[n],g.socketSE[n]),(e=W.map(function(e){return w(f[a],e)})).forEach(function(e){var t=_e(e,b[n]);(t<i||-1===i)&&(b[a]=e,i=t)})):(e=W.map(function(e){return w(f[1],e)}),W.map(function(e){return w(f[0],e)}).forEach(function(n){e.forEach(function(e){var t=_e(n,e);(t<i||-1===i)&&(b[0]=n,b[1]=e,i=t)})})),[0,1].forEach(function(e){var t,n;g.socketSE[e]||(f[e].width||f[e].height?f[e].width||b[e].socketId!==L&&b[e].socketId!==I?f[e].height||b[e].socketId!==M&&b[e].socketId!==C||(b[e].socketId=0<=b[e?0:1].y-f[e].top?C:M):b[e].socketId=0<=b[e?0:1].x-f[e].left?I:L:(t=b[e?0:1].x-f[e].left,n=b[e?0:1].y-f[e].top,b[e].socketId=Math.abs(t)>=Math.abs(n)?0<=t?I:L:0<=n?C:M))})),E.position_path!==x.position_path||E.position_lineStrokeWidth!==x.position_lineStrokeWidth||[0,1].some(function(e){return E.position_plugOverheadSE[e]!==x.position_plugOverheadSE[e]||(i=b[e],o=x.position_socketXYSE[e],i.x!==o.x||i.y!==o.y||i.socketId!==o.socketId)||(t=_[e],n=x.position_socketGravitySE[e],(a=null==t?"auto":Array.isArray(t)?"array":"number")!==(null==n?"auto":Array.isArray(n)?"array":"number")||("array"===a?t[0]!==n[0]||t[1]!==n[1]:t!==n));var t,n,a,i,o})){switch(u.pathList.baseVal=v=[],u.pathList.animVal=null,E.position_path){case A:v.push([O(b[0]),O(b[1])]);break;case V:t="number"==typeof _[0]&&0<_[0]||"number"==typeof _[1]&&0<_[1],o=Z*(t?-1:1),l=Math.atan2(b[1].y-b[0].y,b[1].x-b[0].x),r=-l+o,c=Math.PI-l-o,d=_e(b[0],b[1])/Math.sqrt(2)*U,S={x:b[0].x+Math.cos(r)*d,y:b[0].y+Math.sin(r)*d*-1},m={x:b[1].x+Math.cos(c)*d,y:b[1].y+Math.sin(c)*d*-1},v.push([O(b[0]),S,m,O(b[1])]);break;case P:case N:s=[_[0],E.position_path===N?0:_[1]],h=[],p=[],b.forEach(function(e,t){var n,a,i,o,l,r=s[t];Array.isArray(r)?n={x:r[0],y:r[1]}:"number"==typeof r?n=e.socketId===M?{x:0,y:-r}:e.socketId===I?{x:r,y:0}:e.socketId===C?{x:0,y:r}:{x:-r,y:0}:(a=b[t?0:1],o=0<(i=E.position_plugOverheadSE[t])?G+(D<i?(i-D)*z:0):B+(E.position_lineStrokeWidth>R?(E.position_lineStrokeWidth-R)*F:0),e.socketId===M?((l=(e.y-a.y)/2)<o&&(l=o),n={x:0,y:-l}):e.socketId===I?((l=(a.x-e.x)/2)<o&&(l=o),n={x:l,y:0}):e.socketId===C?((l=(a.y-e.y)/2)<o&&(l=o),n={x:0,y:l}):((l=(e.x-a.x)/2)<o&&(l=o),n={x:-l,y:0})),h[t]=e.x+n.x,p[t]=e.y+n.y}),v.push([O(b[0]),{x:h[0],y:p[0]},{x:h[1],y:p[1]},O(b[1])]);break;case T:!function(){var a,o=1,l=2,r=3,s=4,u=[[],[]],h=[];function p(e){return e===o?r:e===l?s:e===r?o:l}function c(e){return e===l||e===s?"x":"y"}function d(e,t,n){var a={x:e.x,y:e.y};if(n){if(n===p(e.dirId))throw new Error("Invalid dirId: "+n);a.dirId=n}else a.dirId=e.dirId;return a.dirId===o?a.y-=t:a.dirId===l?a.x+=t:a.dirId===r?a.y+=t:a.x-=t,a}function f(e,t){return t.dirId===o?e.y<=t.y:t.dirId===l?e.x>=t.x:t.dirId===r?e.y>=t.y:e.x<=t.x}function y(e,t){return t.dirId===o||t.dirId===r?e.x===t.x:e.y===t.y}function S(e){return e[0]?{contain:0,notContain:1}:{contain:1,notContain:0}}function m(e,t,n){return Math.abs(t[n]-e[n])}function g(e,t,n){return"x"===n?e.x<t.x?l:s:e.y<t.y?r:o}function e(){var e,t,a,i,n=[f(h[1],h[0]),f(h[0],h[1])],o=[c(h[0].dirId),c(h[1].dirId)];if(o[0]===o[1]){if(n[0]&&n[1])return y(h[1],h[0])||(h[0][o[0]]===h[1][o[1]]?(u[0].push(h[0]),u[1].push(h[1])):(e=h[0][o[0]]+(h[1][o[1]]-h[0][o[0]])/2,u[0].push(d(h[0],Math.abs(e-h[0][o[0]]))),u[1].push(d(h[1],Math.abs(e-h[1][o[1]]))))),!1;n[0]!==n[1]?(t=S(n),(a=m(h[t.notContain],h[t.contain],o[t.notContain]))<H&&(h[t.notContain]=d(h[t.notContain],H-a)),u[t.notContain].push(h[t.notContain]),h[t.notContain]=d(h[t.notContain],H,y(h[t.contain],h[t.notContain])?"x"===o[t.notContain]?r:l:g(h[t.notContain],h[t.contain],"x"===o[t.notContain]?"y":"x"))):(a=m(h[0],h[1],"x"===o[0]?"y":"x"),u.forEach(function(e,t){var n=0===t?1:0;e.push(h[t]),h[t]=d(h[t],H,2*H<=a?g(h[t],h[n],"x"===o[t]?"y":"x"):"x"===o[t]?r:l)}))}else{if(n[0]&&n[1])return y(h[1],h[0])?u[1].push(h[1]):y(h[0],h[1])?u[0].push(h[0]):u[0].push("x"===o[0]?{x:h[1].x,y:h[0].y}:{x:h[0].x,y:h[1].y}),!1;n[0]!==n[1]?(t=S(n),u[t.notContain].push(h[t.notContain]),h[t.notContain]=d(h[t.notContain],H,m(h[t.notContain],h[t.contain],o[t.contain])>=H?g(h[t.notContain],h[t.contain],o[t.contain]):h[t.contain].dirId)):(i=[{x:h[0].x,y:h[0].y},{x:h[1].x,y:h[1].y}],u.forEach(function(e,t){var n=0===t?1:0,a=m(i[t],i[n],o[t]);a<H&&(h[t]=d(h[t],H-a)),e.push(h[t]),h[t]=d(h[t],H,g(h[t],h[n],o[n]))}))}return!0}for(b.forEach(function(e,t){var n,a=O(e),i=_[t];n=Array.isArray(i)?i[0]<0?[s,-i[0]]:0<i[0]?[l,i[0]]:i[1]<0?[o,-i[1]]:0<i[1]?[r,i[1]]:[e.socketId,0]:"number"!=typeof i?[e.socketId,H]:0<=i?[e.socketId,i]:[p(e.socketId),-i],a.dirId=n[0],i=n[1],u[t].push(a),h[t]=d(a,i)});e(););u[1].reverse(),u[0].concat(u[1]).forEach(function(e,t){var n={x:e.x,y:e.y};0<t&&v.push([a,n]),a=n})}()}y=[],E.position_plugOverheadSE.forEach(function(e,t){var n,a,i,o,l,r,s,u,h,p,c,d=!t;0<e?2===(n=v[a=d?0:v.length-1]).length?(y[a]=y[a]||_e.apply(null,n),y[a]>j&&(y[a]-e<j&&(e=y[a]-j),i=ve(n[0],n[1],(d?e:y[a]-e)/y[a]),v[a]=d?[i,n[1]]:[n[0],i],y[a]-=e)):(y[a]=y[a]||be.apply(null,n),y[a]>j&&(y[a]-e<j&&(e=y[a]-j),i=xe(n[0],n[1],n[2],n[3],ke(n[0],n[1],n[2],n[3],d?e:y[a]-e)),d?(o=n[0],l=i.toP1):(o=n[3],l=i.fromP2),r=Math.atan2(o.y-i.y,i.x-o.x),s=_e(i,l),i.x=o.x+Math.cos(r)*e,i.y=o.y+Math.sin(r)*e*-1,l.x=i.x+Math.cos(r)*s,l.y=i.y+Math.sin(r)*s*-1,v[a]=d?[i,i.toP1,i.toP2,n[3]]:[n[0],i.fromP1,i.fromP2,i],y[a]=null)):e<0&&(n=v[a=d?0:v.length-1],u=b[t].socketId,h=u===L||u===I?"x":"y",e<(c=-f[t]["x"===h?"width":"height"])&&(e=c),p=e*(u===L||u===M?-1:1),2===n.length?n[d?0:n.length-1][h]+=p:(d?[0,1]:[n.length-2,n.length-1]).forEach(function(e){n[e][h]+=p}),y[a]=null)}),x.position_socketXYSE=de(b),x.position_plugOverheadSE=de(E.position_plugOverheadSE),x.position_path=E.position_path,x.position_lineStrokeWidth=E.position_lineStrokeWidth,x.position_socketGravitySE=de(_),k=!0,u.events.apl_position&&u.events.apl_position.forEach(function(e){e(u,v)})}return k}function Ge(t,n){n!==t.isShown&&(!!n!=!!t.isShown&&(t.svg.style.visibility=n?"":"hidden"),t.isShown=n,t.events&&t.events.svgShow&&t.events.svgShow.forEach(function(e){e(t,n)}))}function De(e,t){var n,a,i,o,l,h,p,c,d,f,r,s,u,y,S,m,g,_,v,E,x,b,k,w,O,M,I,C,L,A,V,P,N,T,W,B,R,F,G,D,z,j,H,U,Z,Y,X,q,Q,K,J,$,ee={};t.line&&(ee.line=(a=(n=e).options,i=n.curStats,o=n.events,l=!1,l=We(n,i,"line_color",a.lineColor,o.cur_line_color)||l,l=We(n,i,"line_colorTra",fe(i.line_color)[0]<1)||l,l=We(n,i,"line_strokeWidth",a.lineSize,o.cur_line_strokeWidth)||l)),(t.plug||ee.line)&&(ee.plug=(p=(h=e).options,c=h.curStats,d=h.events,f=!1,[0,1].forEach(function(e){var t,n,a,i,o,l,r,s,u=p.plugSE[e];f=We(h,c.plug_enabledSE,e,u!==ne)||f,f=We(h,c.plug_plugSE,e,u)||f,f=We(h,c.plug_colorSE,e,s=p.plugColorSE[e]||c.line_color,d.cur_plug_colorSE)||f,f=We(h,c.plug_colorTraSE,e,fe(s)[0]<1)||f,u!==ne&&(i=n=(t=ae[ie[u]]).widthR*p.plugSizeSE[e],o=a=t.heightR*p.plugSizeSE[e],ue&&(i*=c.line_strokeWidth,o*=c.line_strokeWidth),f=We(h,c.plug_markerWidthSE,e,i)||f,f=We(h,c.plug_markerHeightSE,e,o)||f,c.capsMaskMarker_markerWidthSE[e]=n,c.capsMaskMarker_markerHeightSE[e]=a),c.plugOutline_plugSE[e]=c.capsMaskMarker_plugSE[e]=u,c.plug_enabledSE[e]?(s=c.line_strokeWidth/pe.lineSize*p.plugSizeSE[e],c.position_plugOverheadSE[e]=t.overhead*s,c.viewBox_plugBCircleSE[e]=t.bCircle*s,l=t.sideLen*s,r=t.backLen*s):(c.position_plugOverheadSE[e]=-c.line_strokeWidth/2,c.viewBox_plugBCircleSE[e]=l=r=0),We(h,c.attach_plugSideLenSE,e,l,d.cur_attach_plugSideLenSE),We(h,c.attach_plugBackLenSE,e,r,d.cur_attach_plugBackLenSE),c.capsMaskAnchor_enabledSE[e]=!c.plug_enabledSE[e]}),f=We(h,c,"plug_enabled",c.plug_enabledSE[0]||c.plug_enabledSE[1])||f)),(t.lineOutline||ee.line)&&(ee.lineOutline=(u=(r=e).options,y=r.curStats,S=!1,S=We(r,y,"lineOutline_enabled",u.lineOutlineEnabled)||S,S=We(r,y,"lineOutline_color",u.lineOutlineColor)||S,S=We(r,y,"lineOutline_colorTra",fe(y.lineOutline_color)[0]<1)||S,s=y.line_strokeWidth*u.lineOutlineSize,S=We(r,y,"lineOutline_strokeWidth",y.line_strokeWidth-2*s)||S,S=We(r,y,"lineOutline_inStrokeWidth",y.lineOutline_colorTra?y.lineOutline_strokeWidth+2*he:y.line_strokeWidth-s)||S)),(t.plugOutline||ee.line||ee.plug||ee.lineOutline)&&(ee.plugOutline=(g=(m=e).options,_=m.curStats,v=!1,[0,1].forEach(function(e){var t,n=_.plugOutline_plugSE[e],a=n!==ne?ae[ie[n]]:null;v=We(m,_.plugOutline_enabledSE,e,g.plugOutlineEnabledSE[e]&&_.plug_enabled&&_.plug_enabledSE[e]&&!!a&&!!a.outlineBase)||v,v=We(m,_.plugOutline_colorSE,e,t=g.plugOutlineColorSE[e]||_.lineOutline_color)||v,v=We(m,_.plugOutline_colorTraSE,e,fe(t)[0]<1)||v,a&&a.outlineBase&&((t=g.plugOutlineSizeSE[e])>a.outlineMax&&(t=a.outlineMax),t*=2*a.outlineBase,v=We(m,_.plugOutline_strokeWidthSE,e,t)||v,v=We(m,_.plugOutline_inStrokeWidthSE,e,_.plugOutline_colorTraSE[e]?t-he/(_.line_strokeWidth/pe.lineSize)/g.plugSizeSE[e]*2:t/2)||v)}),v)),(t.faces||ee.line||ee.plug||ee.lineOutline||ee.plugOutline)&&(ee.faces=(b=(E=e).curStats,k=E.aplStats,w=E.events,O=!1,!b.line_altColor&&We(E,k,"line_color",x=b.line_color,w.apl_line_color)&&(E.lineFace.style.stroke=x,O=!0),We(E,k,"line_strokeWidth",x=b.line_strokeWidth,w.apl_line_strokeWidth)&&(E.lineShape.style.strokeWidth=x+"px",O=!0,(re||le)&&(Ae(E,E.lineShape),le&&(Ae(E,E.lineFace),Ae(E,E.lineMaskCaps)))),We(E,k,"lineOutline_enabled",x=b.lineOutline_enabled,w.apl_lineOutline_enabled)&&(E.lineOutlineFace.style.display=x?"inline":"none",O=!0),b.lineOutline_enabled&&(We(E,k,"lineOutline_color",x=b.lineOutline_color,w.apl_lineOutline_color)&&(E.lineOutlineFace.style.stroke=x,O=!0),We(E,k,"lineOutline_strokeWidth",x=b.lineOutline_strokeWidth,w.apl_lineOutline_strokeWidth)&&(E.lineOutlineMaskShape.style.strokeWidth=x+"px",O=!0,le&&(Ae(E,E.lineOutlineMaskCaps),Ae(E,E.lineOutlineFace))),We(E,k,"lineOutline_inStrokeWidth",x=b.lineOutline_inStrokeWidth,w.apl_lineOutline_inStrokeWidth)&&(E.lineMaskShape.style.strokeWidth=x+"px",O=!0,le&&(Ae(E,E.lineOutlineMaskCaps),Ae(E,E.lineOutlineFace)))),We(E,k,"plug_enabled",x=b.plug_enabled,w.apl_plug_enabled)&&(E.plugsFace.style.display=x?"inline":"none",O=!0),b.plug_enabled&&[0,1].forEach(function(n){var e=b.plug_plugSE[n],t=e!==ne?ae[ie[e]]:null,a=Ne(n,t);We(E,k.plug_enabledSE,n,x=b.plug_enabledSE[n],w.apl_plug_enabledSE)&&(E.plugsFace.style[a.prop]=x?"url(#"+E.plugMarkerIdSE[n]+")":"none",O=!0),b.plug_enabledSE[n]&&(We(E,k.plug_plugSE,n,e,w.apl_plug_plugSE)&&(E.plugFaceSE[n].href.baseVal="#"+t.elmId,Pe(E,E.plugMarkerSE[n],a.orient,t.bBox,E.svg,E.plugMarkerShapeSE[n],E.plugsFace),O=!0,re&&Ae(E,E.plugsFace)),We(E,k.plug_colorSE,n,x=b.plug_colorSE[n],w.apl_plug_colorSE)&&(E.plugFaceSE[n].style.fill=x,O=!0,(se||ue||le)&&!b.line_colorTra&&Ae(E,le?E.lineMaskCaps:E.capsMaskLine)),["markerWidth","markerHeight"].forEach(function(e){var t="plug_"+e+"SE";We(E,k[t],n,x=b[t][n],w["apl_"+t])&&(E.plugMarkerSE[n][e].baseVal.value=x,O=!0)}),We(E,k.plugOutline_enabledSE,n,x=b.plugOutline_enabledSE[n],w.apl_plugOutline_enabledSE)&&(x?(E.plugFaceSE[n].style.mask="url(#"+E.plugMaskIdSE[n]+")",E.plugOutlineFaceSE[n].style.display="inline"):(E.plugFaceSE[n].style.mask="none",E.plugOutlineFaceSE[n].style.display="none"),O=!0),b.plugOutline_enabledSE[n]&&(We(E,k.plugOutline_plugSE,n,e,w.apl_plugOutline_plugSE)&&(E.plugOutlineFaceSE[n].href.baseVal=E.plugMaskShapeSE[n].href.baseVal=E.plugOutlineMaskShapeSE[n].href.baseVal="#"+t.elmId,[E.plugMaskSE[n],E.plugOutlineMaskSE[n]].forEach(function(e){e.x.baseVal.value=t.bBox.left,e.y.baseVal.value=t.bBox.top,e.width.baseVal.value=t.bBox.width,e.height.baseVal.value=t.bBox.height}),O=!0),We(E,k.plugOutline_colorSE,n,x=b.plugOutline_colorSE[n],w.apl_plugOutline_colorSE)&&(E.plugOutlineFaceSE[n].style.fill=x,O=!0,le&&(Ae(E,E.lineMaskCaps),Ae(E,E.lineOutlineMaskCaps))),We(E,k.plugOutline_strokeWidthSE,n,x=b.plugOutline_strokeWidthSE[n],w.apl_plugOutline_strokeWidthSE)&&(E.plugOutlineMaskShapeSE[n].style.strokeWidth=x+"px",O=!0),We(E,k.plugOutline_inStrokeWidthSE,n,x=b.plugOutline_inStrokeWidthSE[n],w.apl_plugOutline_inStrokeWidthSE)&&(E.plugMaskShapeSE[n].style.strokeWidth=x+"px",O=!0)))}),O)),(t.position||ee.line||ee.plug)&&(ee.position=Fe(e)),(t.path||ee.position)&&(ee.path=(C=(M=e).curStats,L=M.aplStats,A=M.pathList.animVal||M.pathList.baseVal,V=C.path_edge,P=!1,A&&(V.x1=V.x2=A[0][0].x,V.y1=V.y2=A[0][0].y,C.path_pathData=I=we(A,function(e){e.x<V.x1&&(V.x1=e.x),e.y<V.y1&&(V.y1=e.y),e.x>V.x2&&(V.x2=e.x),e.y>V.y2&&(V.y2=e.y)}),Me(I,L.path_pathData)&&(M.linePath.setPathData(I),L.path_pathData=I,P=!0,le?(Ae(M,M.plugsFace),Ae(M,M.lineMaskCaps)):re&&Ae(M,M.linePath),M.events.apl_path&&M.events.apl_path.forEach(function(e){e(M,I)}))),P)),ee.viewBox=(B=(N=e).curStats,R=N.aplStats,F=B.path_edge,G=B.viewBox_bBox,D=R.viewBox_bBox,z=N.svg.viewBox.baseVal,j=N.svg.style,H=!1,T=Math.max(B.line_strokeWidth/2,B.viewBox_plugBCircleSE[0]||0,B.viewBox_plugBCircleSE[1]||0),W={x1:F.x1-T,y1:F.y1-T,x2:F.x2+T,y2:F.y2+T},N.events.new_edge4viewBox&&N.events.new_edge4viewBox.forEach(function(e){e(N,W)}),G.x=B.lineMask_x=B.lineOutlineMask_x=B.maskBGRect_x=W.x1,G.y=B.lineMask_y=B.lineOutlineMask_y=B.maskBGRect_y=W.y1,G.width=W.x2-W.x1,G.height=W.y2-W.y1,["x","y","width","height"].forEach(function(e){var t;(t=G[e])!==D[e]&&(z[e]=D[e]=t,j[oe[e]]=t+("x"===e||"y"===e?N.bodyOffset[e]:0)+"px",H=!0)}),H),ee.mask=(Y=(U=e).curStats,X=U.aplStats,q=!1,Y.plug_enabled?[0,1].forEach(function(e){Y.capsMaskMarker_enabledSE[e]=Y.plug_enabledSE[e]&&Y.plug_colorTraSE[e]||Y.plugOutline_enabledSE[e]&&Y.plugOutline_colorTraSE[e]}):Y.capsMaskMarker_enabledSE[0]=Y.capsMaskMarker_enabledSE[1]=!1,Y.capsMaskMarker_enabled=Y.capsMaskMarker_enabledSE[0]||Y.capsMaskMarker_enabledSE[1],Y.lineMask_outlineMode=Y.lineOutline_enabled,Y.caps_enabled=Y.capsMaskMarker_enabled||Y.capsMaskAnchor_enabledSE[0]||Y.capsMaskAnchor_enabledSE[1],Y.lineMask_enabled=Y.caps_enabled||Y.lineMask_outlineMode,(Y.lineMask_enabled&&!Y.lineMask_outlineMode||Y.lineOutline_enabled)&&["x","y"].forEach(function(e){var t="maskBGRect_"+e;We(U,X,t,Z=Y[t])&&(U.maskBGRect[e].baseVal.value=Z,q=!0)}),We(U,X,"lineMask_enabled",Z=Y.lineMask_enabled)&&(U.lineFace.style.mask=Z?"url(#"+U.lineMaskId+")":"none",q=!0,ue&&Ae(U,U.lineMask)),Y.lineMask_enabled&&(We(U,X,"lineMask_outlineMode",Z=Y.lineMask_outlineMode)&&(Z?(U.lineMaskBG.style.display="none",U.lineMaskShape.style.display="inline"):(U.lineMaskBG.style.display="inline",U.lineMaskShape.style.display="none"),q=!0),["x","y"].forEach(function(e){var t="lineMask_"+e;We(U,X,t,Z=Y[t])&&(U.lineMask[e].baseVal.value=Z,q=!0)}),We(U,X,"caps_enabled",Z=Y.caps_enabled)&&(U.lineMaskCaps.style.display=U.lineOutlineMaskCaps.style.display=Z?"inline":"none",q=!0,ue&&Ae(U,U.capsMaskLine)),Y.caps_enabled&&([0,1].forEach(function(e){var t;We(U,X.capsMaskAnchor_enabledSE,e,Z=Y.capsMaskAnchor_enabledSE[e])&&(U.capsMaskAnchorSE[e].style.display=Z?"inline":"none",q=!0,ue&&Ae(U,U.lineMask)),Y.capsMaskAnchor_enabledSE[e]&&(Me(t=Y.capsMaskAnchor_pathDataSE[e],X.capsMaskAnchor_pathDataSE[e])&&(U.capsMaskAnchorSE[e].setPathData(t),X.capsMaskAnchor_pathDataSE[e]=t,q=!0),We(U,X.capsMaskAnchor_strokeWidthSE,e,Z=Y.capsMaskAnchor_strokeWidthSE[e])&&(U.capsMaskAnchorSE[e].style.strokeWidth=Z+"px",q=!0))}),We(U,X,"capsMaskMarker_enabled",Z=Y.capsMaskMarker_enabled)&&(U.capsMaskLine.style.display=Z?"inline":"none",q=!0),Y.capsMaskMarker_enabled&&[0,1].forEach(function(n){var e=Y.capsMaskMarker_plugSE[n],t=e!==ne?ae[ie[e]]:null,a=Ne(n,t);We(U,X.capsMaskMarker_enabledSE,n,Z=Y.capsMaskMarker_enabledSE[n])&&(U.capsMaskLine.style[a.prop]=Z?"url(#"+U.lineMaskMarkerIdSE[n]+")":"none",q=!0),Y.capsMaskMarker_enabledSE[n]&&(We(U,X.capsMaskMarker_plugSE,n,e)&&(U.capsMaskMarkerShapeSE[n].href.baseVal="#"+t.elmId,Pe(U,U.capsMaskMarkerSE[n],a.orient,t.bBox,U.svg,U.capsMaskMarkerShapeSE[n],U.capsMaskLine),q=!0,re&&(Ae(U,U.capsMaskLine),Ae(U,U.lineFace))),["markerWidth","markerHeight"].forEach(function(e){var t="capsMaskMarker_"+e+"SE";We(U,X[t],n,Z=Y[t][n])&&(U.capsMaskMarkerSE[n][e].baseVal.value=Z,q=!0)}))}))),Y.lineOutline_enabled&&["x","y"].forEach(function(e){var t="lineOutlineMask_"+e;We(U,X,t,Z=Y[t])&&(U.lineOutlineMask[e].baseVal.value=Z,q=!0)}),q),t.effect&&(J=(Q=e).curStats,$=Q.aplStats,Object.keys(te).forEach(function(e){var t=te[e],n=e+"_enabled",a=e+"_options",i=J[a];We(Q,$,n,K=J[n])?(K&&($[a]=de(i)),t[K?"init":"remove"](Q)):K&&ce(i,$[a])&&(t.remove(Q),$[n]=!0,$[a]=de(i),t.init(Q))})),(se||ue)&&ee.line&&!ee.path&&Ae(e,e.lineShape),se&&ee.plug&&!ee.line&&Ae(e,e.plugsFace),Ve(e)}function ze(e,t){return{duration:w(e.duration)&&0<e.duration?e.duration:t.duration,timing:c.validTiming(e.timing)?e.timing:de(t.timing)}}function je(e,t,n,a){var i,o=e.curStats,l=e.aplStats,r={};function s(){["show_on","show_effect","show_animOptions"].forEach(function(e){l[e]=o[e]})}o.show_on=t,n&&g[n]&&(o.show_effect=n,o.show_animOptions=ze(k(a)?a:{},g[n].defaultAnimOptions)),r.show_on=o.show_on!==l.show_on,r.show_effect=o.show_effect!==l.show_effect,r.show_animOptions=ce(o.show_animOptions,l.show_animOptions),r.show_effect||r.show_animOptions?o.show_inAnim?(i=r.show_effect?g[l.show_effect].stop(e,!0,!0):g[l.show_effect].stop(e),s(),g[l.show_effect].init(e,i)):r.show_on&&(l.show_effect&&r.show_effect&&g[l.show_effect].stop(e,!0,!0),s(),g[l.show_effect].init(e)):r.show_on&&(s(),g[l.show_effect].start(e))}function He(e,t,n){var a={props:e,optionName:n};return!(!(e.attachments.indexOf(t)<0)||t.conf.bind&&!t.conf.bind(t,a))&&(e.attachments.push(t),t.boundTargets.push(a),!0)}function Ue(n,a,e){var i=n.attachments.indexOf(a);-1<i&&n.attachments.splice(i,1),a.boundTargets.some(function(e,t){return e.props===n&&(a.conf.unbind&&a.conf.unbind(a,e),i=t,!0)})&&(a.boundTargets.splice(i,1),e||Le(function(){a.boundTargets.length||o(a)}))}function Ze(s,u){var e,i,h=s.options,p={};function f(e,t,n,a,i){var o={};return n?null!=a?(o.container=e[n],o.key=a):(o.container=e,o.key=n):(o.container=e,o.key=t),o.default=i,o.acceptsAuto=null==o.default,o}function c(e,t,n,a,i,o,l){var r,s,u,h=f(e,n,i,o,l);return null!=t[n]&&(s=(t[n]+"").toLowerCase())&&(h.acceptsAuto&&s===x||(u=a[s]))&&u!==h.container[h.key]&&(h.container[h.key]=u,r=!0),null!=h.container[h.key]||h.acceptsAuto||(h.container[h.key]=h.default,r=!0),r}function d(e,t,n,a,i,o,l,r,s){var u,h,p,c,d=f(e,n,i,o,l);if(!a){if(null==d.default)throw new Error("Invalid `type`: "+n);a=typeof d.default}return null!=t[n]&&(d.acceptsAuto&&(t[n]+"").toLowerCase()===x||(p=h=t[n],("number"===(c=a)?w(p):typeof p===c)&&(h=s&&"string"===a&&h?h.trim():h,1)&&(!r||r(h))))&&h!==d.container[d.key]&&(d.container[d.key]=h,u=!0),null!=d.container[d.key]||d.acceptsAuto||(d.container[d.key]=d.default,u=!0),u}if(u=u||{},["start","end"].forEach(function(e,t){var n=u[e],a=!1;if(n&&(ye(n)||(a=_(n,"anchor")))&&n!==h.anchorSE[t]){if(!1!==s.optionIsAttach.anchorSE[t]&&Ue(s,$[h.anchorSE[t]._id]),a&&!He(s,$[n._id],e))throw new Error("Can't bind attachment");h.anchorSE[t]=n,s.optionIsAttach.anchorSE[t]=a,i=p.position=!0}}),!h.anchorSE[0]||!h.anchorSE[1]||h.anchorSE[0]===h.anchorSE[1])throw new Error("`start` and `end` are required.");i&&(e=function(e,t){var n,a,i;if(!(n=me(e))||!(a=me(t)))throw new Error("Cannot get frames.");return n.length&&a.length&&(n.reverse(),a.reverse(),n.some(function(t){return a.some(function(e){return e===t&&(i=e.contentWindow,!0)})})),i||window}(!1!==s.optionIsAttach.anchorSE[0]?$[h.anchorSE[0]._id].element:h.anchorSE[0],!1!==s.optionIsAttach.anchorSE[1]?$[h.anchorSE[1]._id].element:h.anchorSE[1]))!==s.baseWindow&&(!function(a,e){var t,n,i,o,l,r,s,u,h,p,c=a.aplStats,d=e.document,f=v+"-"+a._id;function y(e){var t=n.appendChild(d.createElementNS(b,"mask"));return t.id=e,t.maskUnits.baseVal=SVGUnitTypes.SVG_UNIT_TYPE_USERSPACEONUSE,[t.x,t.y,t.width,t.height].forEach(function(e){e.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX,0)}),t}function S(e){var t=n.appendChild(d.createElementNS(b,"marker"));return t.id=e,t.markerUnits.baseVal=SVGMarkerElement.SVG_MARKERUNITS_STROKEWIDTH,t.viewBox.baseVal||t.setAttribute("viewBox","0 0 0 0"),t}function m(e){return[e.width,e.height].forEach(function(e){e.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE,100)}),e}a.pathList={},Te(c,Y),Object.keys(te).forEach(function(e){var t=e+"_enabled";c[t]&&(te[e].remove(a),c[t]=!1)}),a.baseWindow&&a.svg&&a.baseWindow.document.body.removeChild(a.svg),Re(a.baseWindow=e),a.bodyOffset=Be(e),a.svg=t=d.createElementNS(b,"svg"),t.className.baseVal=v,t.viewBox.baseVal||t.setAttribute("viewBox","0 0 0 0"),a.defs=n=t.appendChild(d.createElementNS(b,"defs")),a.linePath=o=n.appendChild(d.createElementNS(b,"path")),o.id=l=f+"-line-path",o.className.baseVal=v+"-line-path",ue&&(o.style.fill="none"),a.lineShape=o=n.appendChild(d.createElementNS(b,"use")),o.id=r=f+"-line-shape",o.href.baseVal="#"+l,(i=n.appendChild(d.createElementNS(b,"g"))).id=s=f+"-caps",a.capsMaskAnchorSE=[0,1].map(function(){var e=i.appendChild(d.createElementNS(b,"path"));return e.className.baseVal=v+"-caps-mask-anchor",e}),a.lineMaskMarkerIdSE=[f+"-caps-mask-marker-0",f+"-caps-mask-marker-1"],a.capsMaskMarkerSE=[0,1].map(function(e){return S(a.lineMaskMarkerIdSE[e])}),a.capsMaskMarkerShapeSE=[0,1].map(function(e){var t=a.capsMaskMarkerSE[e].appendChild(d.createElementNS(b,"use"));return t.className.baseVal=v+"-caps-mask-marker-shape",t}),a.capsMaskLine=o=i.appendChild(d.createElementNS(b,"use")),o.className.baseVal=v+"-caps-mask-line",o.href.baseVal="#"+r,a.maskBGRect=o=m(n.appendChild(d.createElementNS(b,"rect"))),o.id=u=f+"-mask-bg-rect",o.className.baseVal=v+"-mask-bg-rect",ue&&(o.style.fill="white"),a.lineMask=m(y(a.lineMaskId=f+"-line-mask")),a.lineMaskBG=o=a.lineMask.appendChild(d.createElementNS(b,"use")),o.href.baseVal="#"+u,a.lineMaskShape=o=a.lineMask.appendChild(d.createElementNS(b,"use")),o.className.baseVal=v+"-line-mask-shape",o.href.baseVal="#"+l,o.style.display="none",a.lineMaskCaps=o=a.lineMask.appendChild(d.createElementNS(b,"use")),o.href.baseVal="#"+s,a.lineOutlineMask=m(y(h=f+"-line-outline-mask")),(o=a.lineOutlineMask.appendChild(d.createElementNS(b,"use"))).href.baseVal="#"+u,a.lineOutlineMaskShape=o=a.lineOutlineMask.appendChild(d.createElementNS(b,"use")),o.className.baseVal=v+"-line-outline-mask-shape",o.href.baseVal="#"+l,a.lineOutlineMaskCaps=o=a.lineOutlineMask.appendChild(d.createElementNS(b,"use")),o.href.baseVal="#"+s,a.face=t.appendChild(d.createElementNS(b,"g")),a.lineFace=o=a.face.appendChild(d.createElementNS(b,"use")),o.href.baseVal="#"+r,a.lineOutlineFace=o=a.face.appendChild(d.createElementNS(b,"use")),o.href.baseVal="#"+r,o.style.mask="url(#"+h+")",o.style.display="none",a.plugMaskIdSE=[f+"-plug-mask-0",f+"-plug-mask-1"],a.plugMaskSE=[0,1].map(function(e){return y(a.plugMaskIdSE[e])}),a.plugMaskShapeSE=[0,1].map(function(e){var t=a.plugMaskSE[e].appendChild(d.createElementNS(b,"use"));return t.className.baseVal=v+"-plug-mask-shape",t}),p=[],a.plugOutlineMaskSE=[0,1].map(function(e){return y(p[e]=f+"-plug-outline-mask-"+e)}),a.plugOutlineMaskShapeSE=[0,1].map(function(e){var t=a.plugOutlineMaskSE[e].appendChild(d.createElementNS(b,"use"));return t.className.baseVal=v+"-plug-outline-mask-shape",t}),a.plugMarkerIdSE=[f+"-plug-marker-0",f+"-plug-marker-1"],a.plugMarkerSE=[0,1].map(function(e){var t=S(a.plugMarkerIdSE[e]);return ue&&(t.markerUnits.baseVal=SVGMarkerElement.SVG_MARKERUNITS_USERSPACEONUSE),t}),a.plugMarkerShapeSE=[0,1].map(function(e){return a.plugMarkerSE[e].appendChild(d.createElementNS(b,"g"))}),a.plugFaceSE=[0,1].map(function(e){return a.plugMarkerShapeSE[e].appendChild(d.createElementNS(b,"use"))}),a.plugOutlineFaceSE=[0,1].map(function(e){var t=a.plugMarkerShapeSE[e].appendChild(d.createElementNS(b,"use"));return t.style.mask="url(#"+p[e]+")",t.style.display="none",t}),a.plugsFace=o=a.face.appendChild(d.createElementNS(b,"use")),o.className.baseVal=v+"-plugs-face",o.href.baseVal="#"+r,o.style.display="none",a.curStats.show_inAnim?(a.isShown=1,g[c.show_effect].stop(a,!0)):a.isShown||(t.style.visibility="hidden"),d.body.appendChild(t),[0,1,2].forEach(function(e){var t,n=a.options.labelSEM[e];n&&_(n,"label")&&(t=$[n._id]).conf.initSvg&&t.conf.initSvg(t,a)})}(s,e),p.line=p.plug=p.lineOutline=p.plugOutline=p.faces=p.effect=!0),p.position=c(h,u,"path",m,null,null,pe.path)||p.position,p.position=c(h,u,"startSocket",n,"socketSE",0)||p.position,p.position=c(h,u,"endSocket",n,"socketSE",1)||p.position,[u.startSocketGravity,u.endSocketGravity].forEach(function(e,t){var n,a,i=!1;null!=e&&(Array.isArray(e)?w(e[0])&&w(e[1])&&(i=[e[0],e[1]],Array.isArray(h.socketGravitySE[t])&&(n=i,a=h.socketGravitySE[t],n.length===a.length&&n.every(function(e,t){return e===a[t]}))&&(i=!1)):((e+"").toLowerCase()===x?i=null:w(e)&&0<=e&&(i=e),i===h.socketGravitySE[t]&&(i=!1)),!1!==i&&(h.socketGravitySE[t]=i,p.position=!0))}),p.line=d(h,u,"color",null,"lineColor",null,pe.lineColor,null,!0)||p.line,p.line=d(h,u,"size",null,"lineSize",null,pe.lineSize,function(e){return 0<e})||p.line,["startPlug","endPlug"].forEach(function(e,t){p.plug=c(h,u,e,E,"plugSE",t,pe.plugSE[t])||p.plug,p.plug=d(h,u,e+"Color","string","plugColorSE",t,null,null,!0)||p.plug,p.plug=d(h,u,e+"Size",null,"plugSizeSE",t,pe.plugSizeSE[t],function(e){return 0<e})||p.plug}),p.lineOutline=d(h,u,"outline",null,"lineOutlineEnabled",null,pe.lineOutlineEnabled)||p.lineOutline,p.lineOutline=d(h,u,"outlineColor",null,"lineOutlineColor",null,pe.lineOutlineColor,null,!0)||p.lineOutline,p.lineOutline=d(h,u,"outlineSize",null,"lineOutlineSize",null,pe.lineOutlineSize,function(e){return 0<e&&e<=.48})||p.lineOutline,["startPlugOutline","endPlugOutline"].forEach(function(e,t){p.plugOutline=d(h,u,e,null,"plugOutlineEnabledSE",t,pe.plugOutlineEnabledSE[t])||p.plugOutline,p.plugOutline=d(h,u,e+"Color","string","plugOutlineColorSE",t,null,null,!0)||p.plugOutline,p.plugOutline=d(h,u,e+"Size",null,"plugOutlineSizeSE",t,pe.plugOutlineSizeSE[t],function(e){return 1<=e})||p.plugOutline}),["startLabel","endLabel","middleLabel"].forEach(function(e,t){var n,a,i,o=u[e],l=h.labelSEM[t]&&!s.optionIsAttach.labelSEM[t]?$[h.labelSEM[t]._id].text:h.labelSEM[t],r=!1;if((n="string"==typeof o)&&(o=o.trim()),(n||o&&(r=_(o,"label")))&&o!==l){if(h.labelSEM[t]&&(Ue(s,$[h.labelSEM[t]._id]),h.labelSEM[t]=""),o){if(r?(a=$[(i=o)._id]).boundTargets.slice().forEach(function(e){a.conf.removeOption(a,e)}):i=new S(y.captionLabel,[o]),!He(s,$[i._id],e))throw new Error("Can't bind attachment");h.labelSEM[t]=i}s.optionIsAttach.labelSEM[t]=r}}),Object.keys(te).forEach(function(a){var e,t,o=te[a],n=a+"_enabled",i=a+"_options";function l(a){var i={};return o.optionsConf.forEach(function(e){var t=e[0],n=e[3];null==e[4]||i[n]||(i[n]=[]),("function"==typeof t?t:"id"===t?c:d).apply(null,[i,a].concat(e.slice(1)))}),i}function r(e){var t,n=a+"_animOptions";return e.hasOwnProperty("animation")?k(e.animation)?t=s.curStats[n]=ze(e.animation,o.defaultAnimOptions):(t=!!e.animation,s.curStats[n]=t?ze({},o.defaultAnimOptions):null):(t=!!o.defaultEnabled,s.curStats[n]=t?ze({},o.defaultAnimOptions):null),t}u.hasOwnProperty(a)&&(e=u[a],k(e)?(s.curStats[n]=!0,t=s.curStats[i]=l(e),o.anim&&(s.curStats[i].animation=r(e))):(t=s.curStats[n]=!!e)&&(s.curStats[i]=l({}),o.anim&&(s.curStats[i].animation=r({}))),ce(t,h[a])&&(h[a]=t,p.effect=!0))}),De(s,p)}function Ye(e,t,n){var a={options:{anchorSE:[],socketSE:[],socketGravitySE:[],plugSE:[],plugColorSE:[],plugSizeSE:[],plugOutlineEnabledSE:[],plugOutlineColorSE:[],plugOutlineSizeSE:[],labelSEM:["","",""]},optionIsAttach:{anchorSE:[!1,!1],labelSEM:[!1,!1,!1]},curStats:{},aplStats:{},attachments:[],events:{},reflowTargets:[]};Te(a.curStats,Y),Te(a.aplStats,Y),Object.keys(te).forEach(function(e){var t=te[e].stats;Te(a.curStats,t),Te(a.aplStats,t),a.options[e]=!1}),Te(a.curStats,X),Te(a.aplStats,X),a.curStats.show_effect=q,a.curStats.show_animOptions=de(g[q].defaultAnimOptions),Object.defineProperty(this,"_id",{value:++J}),a._id=this._id,K[this._id]=a,1===arguments.length&&(n=e,e=null),n=n||{},(e||t)&&(n=de(n),e&&(n.start=e),t&&(n.end=t)),a.isShown=a.aplStats.show_on=!n.hide,this.setOptions(n)}return te={dash:{stats:{dash_len:{},dash_gap:{},dash_maxOffset:{}},anim:!0,defaultAnimOptions:{duration:1e3,timing:"linear"},optionsConf:[["type","len","number",null,null,null,function(e){return 0<e}],["type","gap","number",null,null,null,function(e){return 0<e}]],init:function(e){Ie(e,"apl_line_strokeWidth",te.dash.update),e.lineFace.style.strokeDashoffset=0,te.dash.update(e)},remove:function(e){var t=e.curStats;Ce(e,"apl_line_strokeWidth",te.dash.update),t.dash_animId&&(c.remove(t.dash_animId),t.dash_animId=null),e.lineFace.style.strokeDasharray="none",e.lineFace.style.strokeDashoffset=0,Te(e.aplStats,te.dash.stats)},update:function(t){var e,n=t.curStats,a=t.aplStats,i=a.dash_options,o=!1;n.dash_len=i.len||2*a.line_strokeWidth,n.dash_gap=i.gap||a.line_strokeWidth,n.dash_maxOffset=n.dash_len+n.dash_gap,o=We(t,a,"dash_len",n.dash_len)||o,(o=We(t,a,"dash_gap",n.dash_gap)||o)&&(t.lineFace.style.strokeDasharray=a.dash_len+","+a.dash_gap),n.dash_animOptions?(o=We(t,a,"dash_maxOffset",n.dash_maxOffset),a.dash_animOptions&&(o||ce(n.dash_animOptions,a.dash_animOptions))&&(n.dash_animId&&(e=c.stop(n.dash_animId),c.remove(n.dash_animId)),a.dash_animOptions=null),a.dash_animOptions||(n.dash_animId=c.add(function(e){return(1-e)*a.dash_maxOffset+"px"},function(e){t.lineFace.style.strokeDashoffset=e},n.dash_animOptions.duration,0,n.dash_animOptions.timing,!1,e),a.dash_animOptions=de(n.dash_animOptions))):a.dash_animOptions&&(n.dash_animId&&(c.remove(n.dash_animId),n.dash_animId=null),t.lineFace.style.strokeDashoffset=0,a.dash_animOptions=null)}},gradient:{stats:{gradient_colorSE:{hasSE:!0},gradient_pointSE:{hasSE:!0,hasProps:!0}},optionsConf:[["type","startColor","string","colorSE",0,null,null,!0],["type","endColor","string","colorSE",1,null,null,!0]],init:function(e){var t,a=e.baseWindow.document,n=e.defs,i=v+"-"+e._id+"-gradient";e.efc_gradient_gradient=t=n.appendChild(a.createElementNS(b,"linearGradient")),t.id=i,t.gradientUnits.baseVal=SVGUnitTypes.SVG_UNIT_TYPE_USERSPACEONUSE,[t.x1,t.y1,t.x2,t.y2].forEach(function(e){e.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX,0)}),e.efc_gradient_stopSE=[0,1].map(function(t){var n=e.efc_gradient_gradient.appendChild(a.createElementNS(b,"stop"));try{n.offset.baseVal=t}catch(e){if(e.code!==DOMException.NO_MODIFICATION_ALLOWED_ERR)throw e;n.setAttribute("offset",t)}return n}),Ie(e,"cur_plug_colorSE",te.gradient.update),Ie(e,"apl_path",te.gradient.update),e.curStats.line_altColor=!0,e.lineFace.style.stroke="url(#"+i+")",te.gradient.update(e)},remove:function(e){e.efc_gradient_gradient&&(e.defs.removeChild(e.efc_gradient_gradient),e.efc_gradient_gradient=e.efc_gradient_stopSE=null),Ce(e,"cur_plug_colorSE",te.gradient.update),Ce(e,"apl_path",te.gradient.update),e.curStats.line_altColor=!1,e.lineFace.style.stroke=e.curStats.line_color,Te(e.aplStats,te.gradient.stats)},update:function(a){var e,t,i=a.curStats,o=a.aplStats,n=o.gradient_options,l=a.pathList.animVal||a.pathList.baseVal;[0,1].forEach(function(e){i.gradient_colorSE[e]=n.colorSE[e]||i.plug_colorSE[e]}),t=l[0][0],i.gradient_pointSE[0]={x:t.x,y:t.y},t=(e=l[l.length-1])[e.length-1],i.gradient_pointSE[1]={x:t.x,y:t.y},[0,1].forEach(function(t){var n;We(a,o.gradient_colorSE,t,n=i.gradient_colorSE[t])&&(ue?(n=fe(n),a.efc_gradient_stopSE[t].style.stopColor=n[1],a.efc_gradient_stopSE[t].style.stopOpacity=n[0]):a.efc_gradient_stopSE[t].style.stopColor=n),["x","y"].forEach(function(e){(n=i.gradient_pointSE[t][e])!==o.gradient_pointSE[t][e]&&(a.efc_gradient_gradient[e+(t+1)].baseVal.value=o.gradient_pointSE[t][e]=n)})})}},dropShadow:{stats:{dropShadow_dx:{},dropShadow_dy:{},dropShadow_blur:{},dropShadow_color:{},dropShadow_opacity:{},dropShadow_x:{},dropShadow_y:{}},optionsConf:[["type","dx",null,null,null,2],["type","dy",null,null,null,4],["type","blur",null,null,null,3,function(e){return 0<=e}],["type","color",null,null,null,"#000",null,!0],["type","opacity",null,null,null,.8,function(e){return 0<=e&&e<=1}]],init:function(t){var e,n,a,i,o,l=t.baseWindow.document,r=t.defs,s=v+"-"+t._id+"-dropShadow",u=(e=l,n=s,o={},"boolean"!=typeof p&&(p=!!window.SVGFEDropShadowElement&&!ue),o.elmsAppend=[o.elmFilter=a=e.createElementNS(b,"filter")],a.filterUnits.baseVal=SVGUnitTypes.SVG_UNIT_TYPE_USERSPACEONUSE,a.x.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX,0),a.y.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX,0),a.width.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE,100),a.height.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE,100),a.id=n,p?(o.elmOffset=o.elmBlur=i=a.appendChild(e.createElementNS(b,"feDropShadow")),o.styleFlood=i.style):(o.elmBlur=a.appendChild(e.createElementNS(b,"feGaussianBlur")),o.elmOffset=i=a.appendChild(e.createElementNS(b,"feOffset")),i.result.baseVal="offsetblur",i=a.appendChild(e.createElementNS(b,"feFlood")),o.styleFlood=i.style,(i=a.appendChild(e.createElementNS(b,"feComposite"))).in2.baseVal="offsetblur",i.operator.baseVal=SVGFECompositeElement.SVG_FECOMPOSITE_OPERATOR_IN,(i=a.appendChild(e.createElementNS(b,"feMerge"))).appendChild(e.createElementNS(b,"feMergeNode")),i.appendChild(e.createElementNS(b,"feMergeNode")).in1.baseVal="SourceGraphic"),o);["elmFilter","elmOffset","elmBlur","styleFlood","elmsAppend"].forEach(function(e){t["efc_dropShadow_"+e]=u[e]}),u.elmsAppend.forEach(function(e){r.appendChild(e)}),t.face.setAttribute("filter","url(#"+s+")"),Ie(t,"new_edge4viewBox",te.dropShadow.adjustEdge),te.dropShadow.update(t)},remove:function(e){var t=e.defs;e.efc_dropShadow_elmsAppend&&(e.efc_dropShadow_elmsAppend.forEach(function(e){t.removeChild(e)}),e.efc_dropShadow_elmFilter=e.efc_dropShadow_elmOffset=e.efc_dropShadow_elmBlur=e.efc_dropShadow_styleFlood=e.efc_dropShadow_elmsAppend=null),Ce(e,"new_edge4viewBox",te.dropShadow.adjustEdge),De(e,{}),e.face.removeAttribute("filter"),Te(e.aplStats,te.dropShadow.stats)},update:function(e){var t,n,a=e.curStats,i=e.aplStats,o=i.dropShadow_options;a.dropShadow_dx=t=o.dx,We(e,i,"dropShadow_dx",t)&&(e.efc_dropShadow_elmOffset.dx.baseVal=t,n=!0),a.dropShadow_dy=t=o.dy,We(e,i,"dropShadow_dy",t)&&(e.efc_dropShadow_elmOffset.dy.baseVal=t,n=!0),a.dropShadow_blur=t=o.blur,We(e,i,"dropShadow_blur",t)&&(e.efc_dropShadow_elmBlur.setStdDeviation(t,t),n=!0),n&&De(e,{}),a.dropShadow_color=t=o.color,We(e,i,"dropShadow_color",t)&&(e.efc_dropShadow_styleFlood.floodColor=t),a.dropShadow_opacity=t=o.opacity,We(e,i,"dropShadow_opacity",t)&&(e.efc_dropShadow_styleFlood.floodOpacity=t)},adjustEdge:function(a,i){var e,t,o=a.curStats,l=a.aplStats;null!=o.dropShadow_dx&&(e=3*o.dropShadow_blur,(t={x1:i.x1-e+o.dropShadow_dx,y1:i.y1-e+o.dropShadow_dy,x2:i.x2+e+o.dropShadow_dx,y2:i.y2+e+o.dropShadow_dy}).x1<i.x1&&(i.x1=t.x1),t.y1<i.y1&&(i.y1=t.y1),t.x2>i.x2&&(i.x2=t.x2),t.y2>i.y2&&(i.y2=t.y2),["x","y"].forEach(function(e){var t,n="dropShadow_"+e;o[n]=t=i[e+"1"],We(a,l,n,t)&&(a.efc_dropShadow_elmFilter[e].baseVal.value=t)}))}}},Object.keys(te).forEach(function(e){var t=te[e],n=t.stats;n[e+"_enabled"]={iniValue:!1},n[e+"_options"]={hasProps:!0},t.anim&&(n[e+"_animOptions"]={},n[e+"_animId"]={})}),g={none:{defaultAnimOptions:{},init:function(e,t){var n=e.curStats;n.show_animId&&(c.remove(n.show_animId),n.show_animId=null),g.none.start(e,t)},start:function(e,t){g.none.stop(e,!0)},stop:function(e,t,n){var a=e.curStats;return n=null!=n?n:e.aplStats.show_on,a.show_inAnim=!1,t&&Ge(e,n),n?1:0}},fade:{defaultAnimOptions:{duration:300,timing:"linear"},init:function(n,e){var t=n.curStats,a=n.aplStats;t.show_animId&&c.remove(t.show_animId),t.show_animId=c.add(function(e){return e},function(e,t){t?g.fade.stop(n,!0):(n.svg.style.opacity=e+"",le&&(Ae(n,n.svg),Ve(n)))},a.show_animOptions.duration,1,a.show_animOptions.timing,null,!1),g.fade.start(n,e)},start:function(e,t){var n,a=e.curStats;a.show_inAnim&&(n=c.stop(a.show_animId)),Ge(e,1),a.show_inAnim=!0,c.start(a.show_animId,!e.aplStats.show_on,null!=t?t:n)},stop:function(e,t,n){var a,i=e.curStats;return n=null!=n?n:e.aplStats.show_on,a=i.show_inAnim?c.stop(i.show_animId):n?1:0,i.show_inAnim=!1,t&&(e.svg.style.opacity=n?"":"0",Ge(e,n)),a}},draw:{defaultAnimOptions:{duration:500,timing:[.58,0,.42,1]},init:function(n,e){var t=n.curStats,a=n.aplStats,l=n.pathList.baseVal,i=Oe(l),r=i.segsLen,s=i.lenAll;t.show_animId&&c.remove(t.show_animId),t.show_animId=c.add(function(e){var t,n,a,i,o=-1;if(0===e)n=[[l[0][0],l[0][0]]];else if(1===e)n=l;else{for(t=s*e,n=[];t>=r[++o];)n.push(l[o]),t-=r[o];t&&(2===(a=l[o]).length?n.push([a[0],ve(a[0],a[1],t/r[o])]):(i=xe(a[0],a[1],a[2],a[3],ke(a[0],a[1],a[2],a[3],t)),n.push([a[0],i.fromP1,i.fromP2,i])))}return n},function(e,t){t?g.draw.stop(n,!0):(n.pathList.animVal=e,De(n,{path:!0}))},a.show_animOptions.duration,1,a.show_animOptions.timing,null,!1),g.draw.start(n,e)},start:function(e,t){var n,a=e.curStats;a.show_inAnim&&(n=c.stop(a.show_animId)),Ge(e,1),a.show_inAnim=!0,Ie(e,"apl_position",g.draw.update),c.start(a.show_animId,!e.aplStats.show_on,null!=t?t:n)},stop:function(e,t,n){var a,i=e.curStats;return n=null!=n?n:e.aplStats.show_on,a=i.show_inAnim?c.stop(i.show_animId):n?1:0,i.show_inAnim=!1,t&&(e.pathList.animVal=n?null:[[e.pathList.baseVal[0][0],e.pathList.baseVal[0][0]]],De(e,{path:!0}),Ge(e,n)),a},update:function(e){Ce(e,"apl_position",g.draw.update),e.curStats.show_inAnim?g.draw.init(e,g.draw.stop(e)):e.aplStats.show_animOptions={}}}},function(){function r(n){return function(e){var t={};t[n]=e,this.setOptions(t)}}[["start","anchorSE",0],["end","anchorSE",1],["color","lineColor"],["size","lineSize"],["startSocketGravity","socketGravitySE",0],["endSocketGravity","socketGravitySE",1],["startPlugColor","plugColorSE",0],["endPlugColor","plugColorSE",1],["startPlugSize","plugSizeSE",0],["endPlugSize","plugSizeSE",1],["outline","lineOutlineEnabled"],["outlineColor","lineOutlineColor"],["outlineSize","lineOutlineSize"],["startPlugOutline","plugOutlineEnabledSE",0],["endPlugOutline","plugOutlineEnabledSE",1],["startPlugOutlineColor","plugOutlineColorSE",0],["endPlugOutlineColor","plugOutlineColorSE",1],["startPlugOutlineSize","plugOutlineSizeSE",0],["endPlugOutlineSize","plugOutlineSizeSE",1]].forEach(function(e){var t=e[0],n=e[1],a=e[2];Object.defineProperty(Ye.prototype,t,{get:function(){var e=null!=a?K[this._id].options[n][a]:n?K[this._id].options[n]:K[this._id].options[t];return null==e?x:de(e)},set:r(t),enumerable:!0})}),[["path",m],["startSocket",n,"socketSE",0],["endSocket",n,"socketSE",1],["startPlug",E,"plugSE",0],["endPlug",E,"plugSE",1]].forEach(function(e){var a=e[0],i=e[1],o=e[2],l=e[3];Object.defineProperty(Ye.prototype,a,{get:function(){var t,n=null!=l?K[this._id].options[o][l]:o?K[this._id].options[o]:K[this._id].options[a];return n?Object.keys(i).some(function(e){return i[e]===n&&(t=e,!0)})?t:new Error("It's broken"):x},set:r(a),enumerable:!0})}),Object.keys(te).forEach(function(n){var a=te[n];Object.defineProperty(Ye.prototype,n,{get:function(){var u,e,t=K[this._id].options[n];return k(t)?(u=t,e=a.optionsConf.reduce(function(e,t){var n,a=t[0],i=t[1],o=t[2],l=t[3],r=t[4],s=null!=r?u[l][r]:l?u[l]:u[i];return e[i]="id"===a?s?Object.keys(o).some(function(e){return o[e]===s&&(n=e,!0)})?n:new Error("It's broken"):x:null==s?x:de(s),e},{}),a.anim&&(e.animation=de(u.animation)),e):t},set:r(n),enumerable:!0})}),["startLabel","endLabel","middleLabel"].forEach(function(e,n){Object.defineProperty(Ye.prototype,e,{get:function(){var e=K[this._id],t=e.options;return t.labelSEM[n]&&!e.optionIsAttach.labelSEM[n]?$[t.labelSEM[n]._id].text:t.labelSEM[n]||""},set:r(e),enumerable:!0})})}(),Ye.prototype.setOptions=function(e){return Ze(K[this._id],e),this},Ye.prototype.position=function(){return De(K[this._id],{position:!0}),this},Ye.prototype.remove=function(){var t=K[this._id],n=t.curStats;Object.keys(te).forEach(function(e){var t=e+"_animId";n[t]&&c.remove(n[t])}),n.show_animId&&c.remove(n.show_animId),t.attachments.slice().forEach(function(e){Ue(t,e)}),t.baseWindow&&t.svg&&t.baseWindow.document.body.removeChild(t.svg),delete K[this._id]},Ye.prototype.show=function(e,t){return je(K[this._id],!0,e,t),this},Ye.prototype.hide=function(e,t){return je(K[this._id],!1,e,t),this},o=function(t){t&&$[t._id]&&(t.boundTargets.slice().forEach(function(e){Ue(e.props,t,!0)}),t.conf.remove&&t.conf.remove(t),delete $[t._id])},S=function(){function e(e,t){var n,a={conf:e,curStats:{},aplStats:{},boundTargets:[]},i={};e.argOptions.every(function(e){return!(!t.length||("string"==typeof e.type?typeof t[0]!==e.type:"function"!=typeof e.type||!e.type(t[0])))&&(i[e.optionName]=t.shift(),!0)}),n=t.length&&k(t[0])?de(t[0]):{},Object.keys(i).forEach(function(e){n[e]=i[e]}),e.stats&&(Te(a.curStats,e.stats),Te(a.aplStats,e.stats)),Object.defineProperty(this,"_id",{value:++ee}),Object.defineProperty(this,"isRemoved",{get:function(){return!$[this._id]}}),a._id=this._id,e.init&&!e.init(a,n)||($[this._id]=a)}return e.prototype.remove=function(){var t=this,n=$[t._id];n&&(n.boundTargets.slice().forEach(function(e){n.conf.removeOption(n,e)}),Le(function(){var e=$[t._id];e&&(console.error("LeaderLineAttachment was not removed by removeOption"),o(e))}))},e}(),window.LeaderLineAttachment=S,_=function(e,t){return e instanceof S&&(!(e.isRemoved||t&&$[e._id].conf.type!==t)||null)},y={pointAnchor:{type:"anchor",argOptions:[{optionName:"element",type:ye}],init:function(e,t){return e.element=y.pointAnchor.checkElement(t.element),e.x=y.pointAnchor.parsePercent(t.x,!0)||[.5,!0],e.y=y.pointAnchor.parsePercent(t.y,!0)||[.5,!0],!0},removeOption:function(e,t){var n=t.props,a={},i=e.element,o=n.options.anchorSE["start"===t.optionName?1:0];i===o&&(i=o===document.body?new S(y.pointAnchor,[i]):document.body),a[t.optionName]=i,Ze(n,a)},getBBoxNest:function(e,t){var n=ge(e.element,t.baseWindow),a=n.width,i=n.height;return n.width=n.height=0,n.left=n.right=n.left+e.x[0]*(e.x[1]?a:1),n.top=n.bottom=n.top+e.y[0]*(e.y[1]?i:1),n},parsePercent:function(e,t){var n,a,i=!1;return w(e)?a=e:"string"==typeof e&&(n=u.exec(e))&&n[2]&&(i=0!==(a=parseFloat(n[1])/100)),null!=a&&(t||0<=a)?[a,i]:null},checkElement:function(e){if(null==e)e=document.body;else if(!ye(e))throw new Error("`element` must be Element");return e}},areaAnchor:{type:"anchor",argOptions:[{optionName:"element",type:ye},{optionName:"shape",type:"string"}],stats:{color:{},strokeWidth:{},elementWidth:{},elementHeight:{},elementLeft:{},elementTop:{},pathListRel:{},bBoxRel:{},pathData:{},viewBoxBBox:{hasProps:!0},dashLen:{},dashGap:{}},init:function(i,e){var t,n,a,o=[];return i.element=y.pointAnchor.checkElement(e.element),"string"==typeof e.color&&(i.color=e.color.trim()),"string"==typeof e.fillColor&&(i.fill=e.fillColor.trim()),w(e.size)&&0<=e.size&&(i.size=e.size),e.dash&&(i.dash=!0,w(e.dash.len)&&0<e.dash.len&&(i.dashLen=e.dash.len),w(e.dash.gap)&&0<e.dash.gap&&(i.dashGap=e.dash.gap)),"circle"===e.shape?i.shape=e.shape:"polygon"===e.shape&&Array.isArray(e.points)&&3<=e.points.length&&e.points.every(function(e){var t={};return!(!(t.x=y.pointAnchor.parsePercent(e[0],!0))||!(t.y=y.pointAnchor.parsePercent(e[1],!0)))&&(o.push(t),(t.x[1]||t.y[1])&&(i.hasRatio=!0),!0)})?(i.shape=e.shape,i.points=o):(i.shape="rect",i.radius=w(e.radius)&&0<=e.radius?e.radius:0),"rect"!==i.shape&&"circle"!==i.shape||(i.x=y.pointAnchor.parsePercent(e.x,!0)||[-.05,!0],i.y=y.pointAnchor.parsePercent(e.y,!0)||[-.05,!0],i.width=y.pointAnchor.parsePercent(e.width)||[1.1,!0],i.height=y.pointAnchor.parsePercent(e.height)||[1.1,!0],(i.x[1]||i.y[1]||i.width[1]||i.height[1])&&(i.hasRatio=!0)),t=i.element.ownerDocument,i.svg=n=t.createElementNS(b,"svg"),n.className.baseVal=v+"-areaAnchor",n.viewBox.baseVal||n.setAttribute("viewBox","0 0 0 0"),i.path=n.appendChild(t.createElementNS(b,"path")),i.path.style.fill=i.fill||"none",i.isShown=!1,n.style.visibility="hidden",t.body.appendChild(n),Re(a=t.defaultView),i.bodyOffset=Be(a),i.updateColor=function(){var e,t=i.curStats,n=i.aplStats,a=i.boundTargets.length?i.boundTargets[0].props.curStats:null;t.color=e=i.color||(a?a.line_color:pe.lineColor),We(i,n,"color",e)&&(i.path.style.stroke=e)},i.updateShow=function(){Ge(i,i.boundTargets.some(function(e){return!0===e.props.isShown}))},!0},bind:function(e,t){var n=t.props;return e.color||Ie(n,"cur_line_color",e.updateColor),Ie(n,"svgShow",e.updateShow),Le(function(){e.updateColor(),e.updateShow()}),!0},unbind:function(e,t){var n=t.props;e.color||Ce(n,"cur_line_color",e.updateColor),Ce(n,"svgShow",e.updateShow),1<e.boundTargets.length&&Le(function(){e.updateColor(),e.updateShow(),y.areaAnchor.update(e)&&e.boundTargets.forEach(function(e){De(e.props,{position:!0})})})},removeOption:function(e,t){y.pointAnchor.removeOption(e,t)},remove:function(t){t.boundTargets.length&&(console.error("LeaderLineAttachment was not unbound by remove"),t.boundTargets.forEach(function(e){y.areaAnchor.unbind(t,e)})),t.svg.parentNode.removeChild(t.svg)},getStrokeWidth:function(e,t){return y.areaAnchor.update(e)&&1<e.boundTargets.length&&Le(function(){e.boundTargets.forEach(function(e){e.props!==t&&De(e.props,{position:!0})})}),e.curStats.strokeWidth},getPathData:function(e,t){var n=ge(e.element,t.baseWindow);return we(e.curStats.pathListRel,function(e){e.x+=n.left,e.y+=n.top})},getBBoxNest:function(e,t){var n=ge(e.element,t.baseWindow),a=e.curStats.bBoxRel;return{left:a.left+n.left,top:a.top+n.top,right:a.right+n.left,bottom:a.bottom+n.top,width:a.width,height:a.height}},update:function(t){var a,n,i,o,e,l,r,s,u,h,p,c,d,f,y,S,m,g,_,v,E,x,b,k,w,O,M,I,C,L,A,V,P=t.curStats,N=t.aplStats,T=t.boundTargets.length?t.boundTargets[0].props.curStats:null,W={};if(W.strokeWidth=We(t,P,"strokeWidth",null!=t.size?t.size:T?T.line_strokeWidth:pe.lineSize),a=Se(t.element),W.elementWidth=We(t,P,"elementWidth",a.width),W.elementHeight=We(t,P,"elementHeight",a.height),W.elementLeft=We(t,P,"elementLeft",a.left),W.elementTop=We(t,P,"elementTop",a.top),W.strokeWidth||t.hasRatio&&(W.elementWidth||W.elementHeight)){switch(t.shape){case"rect":(v={left:t.x[0]*(t.x[1]?a.width:1),top:t.y[0]*(t.y[1]?a.height:1),width:t.width[0]*(t.width[1]?a.width:1),height:t.height[0]*(t.height[1]?a.height:1)}).right=v.left+v.width,v.bottom=v.top+v.height,k=P.strokeWidth/2,x=(b=Math.min(v.width,v.height))?b/2*Math.SQRT2+k:0,(E=t.radius?t.radius<=x?t.radius:x:0)?(O=E-(w=(E-k)/Math.SQRT2),I=E*U,M=[{x:v.left-O,y:v.top+w},{x:v.left+w,y:v.top-O},{x:v.right-w,y:v.top-O},{x:v.right+O,y:v.top+w},{x:v.right+O,y:v.bottom-w},{x:v.right-w,y:v.bottom+O},{x:v.left+w,y:v.bottom+O},{x:v.left-O,y:v.bottom-w}],P.pathListRel=[[M[0],{x:M[0].x,y:M[0].y-I},{x:M[1].x-I,y:M[1].y},M[1]]],M[1].x!==M[2].x&&P.pathListRel.push([M[1],M[2]]),P.pathListRel.push([M[2],{x:M[2].x+I,y:M[2].y},{x:M[3].x,y:M[3].y-I},M[3]]),M[3].y!==M[4].y&&P.pathListRel.push([M[3],M[4]]),P.pathListRel.push([M[4],{x:M[4].x,y:M[4].y+I},{x:M[5].x+I,y:M[5].y},M[5]]),M[5].x!==M[6].x&&P.pathListRel.push([M[5],M[6]]),P.pathListRel.push([M[6],{x:M[6].x-I,y:M[6].y},{x:M[7].x,y:M[7].y+I},M[7]]),M[7].y!==M[0].y&&P.pathListRel.push([M[7],M[0]]),P.pathListRel.push([]),O=E-w+P.strokeWidth/2,M=[{x:v.left-O,y:v.top-O},{x:v.right+O,y:v.bottom+O}]):(O=P.strokeWidth/2,M=[{x:v.left-O,y:v.top-O},{x:v.right+O,y:v.bottom+O}],P.pathListRel=[[M[0],{x:M[1].x,y:M[0].y}],[{x:M[1].x,y:M[0].y},M[1]],[M[1],{x:M[0].x,y:M[1].y}],[]],M=[{x:v.left-P.strokeWidth,y:v.top-P.strokeWidth},{x:v.right+P.strokeWidth,y:v.bottom+P.strokeWidth}]),P.bBoxRel={left:M[0].x,top:M[0].y,right:M[1].x,bottom:M[1].y,width:M[1].x-M[0].x,height:M[1].y-M[0].y};break;case"circle":(r={left:t.x[0]*(t.x[1]?a.width:1),top:t.y[0]*(t.y[1]?a.height:1),width:t.width[0]*(t.width[1]?a.width:1),height:t.height[0]*(t.height[1]?a.height:1)}).width||r.height||(r.width=r.height=10),r.width||(r.width=r.height),r.height||(r.height=r.width),r.right=r.left+r.width,r.bottom=r.top+r.height,s=r.left+r.width/2,u=r.top+r.height/2,f=P.strokeWidth/2,y=r.width/2,S=r.height/2,h=y*Math.SQRT2+f,p=S*Math.SQRT2+f,c=h*U,d=p*U,_=[{x:s-h,y:u},{x:s,y:u-p},{x:s+h,y:u},{x:s,y:u+p}],P.pathListRel=[[_[0],{x:_[0].x,y:_[0].y-d},{x:_[1].x-c,y:_[1].y},_[1]],[_[1],{x:_[1].x+c,y:_[1].y},{x:_[2].x,y:_[2].y-d},_[2]],[_[2],{x:_[2].x,y:_[2].y+d},{x:_[3].x+c,y:_[3].y},_[3]],[_[3],{x:_[3].x-c,y:_[3].y},{x:_[0].x,y:_[0].y+d},_[0]],[]],m=h-y+P.strokeWidth/2,g=p-S+P.strokeWidth/2,_=[{x:r.left-m,y:r.top-g},{x:r.right+m,y:r.bottom+g}],P.bBoxRel={left:_[0].x,top:_[0].y,right:_[1].x,bottom:_[1].y,width:_[1].x-_[0].x,height:_[1].y-_[0].y};break;case"polygon":t.points.forEach(function(e){var t=e.x[0]*(e.x[1]?a.width:1),n=e.y[0]*(e.y[1]?a.height:1);i?(t<i.left&&(i.left=t),t>i.right&&(i.right=t),n<i.top&&(i.top=n),n>i.bottom&&(i.bottom=n)):i={left:t,right:t,top:n,bottom:n},o?P.pathListRel.push([o,{x:t,y:n}]):P.pathListRel=[],o={x:t,y:n}}),P.pathListRel.push([]),e=P.strokeWidth/2,l=[{x:i.left-e,y:i.top-e},{x:i.right+e,y:i.bottom+e}],P.bBoxRel={left:l[0].x,top:l[0].y,right:l[1].x,bottom:l[1].y,width:l[1].x-l[0].x,height:l[1].y-l[0].y}}W.pathListRel=W.bBoxRel=!0}return(W.pathListRel||W.elementLeft||W.elementTop)&&(P.pathData=we(P.pathListRel,function(e){e.x+=a.left,e.y+=a.top})),We(t,N,"strokeWidth",n=P.strokeWidth)&&(t.path.style.strokeWidth=n+"px"),Me(n=P.pathData,N.pathData)&&(t.path.setPathData(n),N.pathData=n,W.pathData=!0),t.dash&&(!W.pathData&&(!W.strokeWidth||t.dashLen&&t.dashGap)||(P.dashLen=t.dashLen||2*P.strokeWidth,P.dashGap=t.dashGap||P.strokeWidth),W.dash=We(t,N,"dashLen",P.dashLen)||W.dash,W.dash=We(t,N,"dashGap",P.dashGap)||W.dash,W.dash&&(t.path.style.strokeDasharray=N.dashLen+","+N.dashGap)),C=P.viewBoxBBox,L=N.viewBoxBBox,A=t.svg.viewBox.baseVal,V=t.svg.style,C.x=P.bBoxRel.left+a.left,C.y=P.bBoxRel.top+a.top,C.width=P.bBoxRel.width,C.height=P.bBoxRel.height,["x","y","width","height"].forEach(function(e){(n=C[e])!==L[e]&&(A[e]=L[e]=n,V[oe[e]]=n+("x"===e||"y"===e?t.bodyOffset[e]:0)+"px")}),W.strokeWidth||W.pathListRel||W.bBoxRel}},mouseHoverAnchor:{type:"anchor",argOptions:[{optionName:"element",type:ye},{optionName:"showEffectName",type:"string"}],style:{backgroundImage:"url('data:image/svg+xml;charset=utf-8;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0Ij48cG9seWdvbiBwb2ludHM9IjI0LDAgMCw4IDgsMTEgMCwxOSA1LDI0IDEzLDE2IDE2LDI0IiBmaWxsPSJjb3JhbCIvPjwvc3ZnPg==')",backgroundSize:"",backgroundRepeat:"no-repeat",backgroundColor:"#f8f881",cursor:"default"},hoverStyle:{backgroundImage:"none",backgroundColor:"#fadf8f"},padding:{top:1,right:15,bottom:1,left:2},minHeight:15,backgroundPosition:{right:2,top:2},backgroundSize:{width:12,height:12},dirKeys:[["top","Top"],["right","Right"],["bottom","Bottom"],["left","Left"]],init:function(a,i){var o,t,e,n,l,r,s,u,h,p,c,d=y.mouseHoverAnchor,f={};if(a.element=y.pointAnchor.checkElement(i.element),u=a.element,!((p=u.ownerDocument)&&(h=p.defaultView)&&h.HTMLElement&&u instanceof h.HTMLElement))throw new Error("`element` must be HTML element");return d.style.backgroundSize=d.backgroundSize.width+"px "+d.backgroundSize.height+"px",["style","hoverStyle"].forEach(function(e){var n=d[e];a[e]=Object.keys(n).reduce(function(e,t){return e[t]=n[t],e},{})}),"inline"===(o=a.element.ownerDocument.defaultView.getComputedStyle(a.element,"")).display?a.style.display="inline-block":"none"===o.display&&(a.style.display="block"),y.mouseHoverAnchor.dirKeys.forEach(function(e){var t=e[0],n="padding"+e[1];parseFloat(o[n])<d.padding[t]&&(a.style[n]=d.padding[t]+"px")}),a.style.display&&(n=a.element.style.display,a.element.style.display=a.style.display),y.mouseHoverAnchor.dirKeys.forEach(function(e){var t="padding"+e[1];a.style[t]&&(f[t]=a.element.style[t],a.element.style[t]=a.style[t])}),(e=a.element.getBoundingClientRect()).height<d.minHeight&&(le?(c=d.minHeight,"content-box"===o.boxSizing?c-=parseFloat(o.borderTopWidth)+parseFloat(o.borderBottomWidth)+parseFloat(o.paddingTop)+parseFloat(o.paddingBottom):"padding-box"===o.boxSizing&&(c-=parseFloat(o.borderTopWidth)+parseFloat(o.borderBottomWidth)),a.style.height=c+"px"):a.style.height=parseFloat(o.height)+(d.minHeight-e.height)+"px"),a.style.backgroundPosition=ue?e.width-d.backgroundSize.width-d.backgroundPosition.right+"px "+d.backgroundPosition.top+"px":"right "+d.backgroundPosition.right+"px top "+d.backgroundPosition.top+"px",a.style.display&&(a.element.style.display=n),y.mouseHoverAnchor.dirKeys.forEach(function(e){var t="padding"+e[1];a.style[t]&&(a.element.style[t]=f[t])}),["style","hoverStyle"].forEach(function(e){var t=a[e],n=i[e];k(n)&&Object.keys(n).forEach(function(e){"string"==typeof n[e]||w(n[e])?t[e]=n[e]:null==n[e]&&delete t[e]})}),"function"==typeof i.onSwitch&&(s=i.onSwitch),i.showEffectName&&g[i.showEffectName]&&(a.showEffectName=l=i.showEffectName),r=i.animOptions,a.elmStyle=t=a.element.style,a.mouseenter=function(e){a.hoverStyleSave=d.getStyles(t,Object.keys(a.hoverStyle)),d.setStyles(t,a.hoverStyle),a.boundTargets.forEach(function(e){je(e.props,!0,l,r)}),s&&s(e)},a.mouseleave=function(e){d.setStyles(t,a.hoverStyleSave),a.boundTargets.forEach(function(e){je(e.props,!1,l,r)}),s&&s(e)},!0},bind:function(e,t){var n,a,i,o,l;return t.props.svg?y.mouseHoverAnchor.llShow(t.props,!1,e.showEffectName):Le(function(){y.mouseHoverAnchor.llShow(t.props,!1,e.showEffectName)}),e.enabled||(e.styleSave=y.mouseHoverAnchor.getStyles(e.elmStyle,Object.keys(e.style)),y.mouseHoverAnchor.setStyles(e.elmStyle,e.style),e.removeEventListener=(n=e.element,a=e.mouseenter,i=e.mouseleave,"onmouseenter"in n&&"onmouseleave"in n?(n.addEventListener("mouseenter",a,!1),n.addEventListener("mouseleave",i,!1),function(){n.removeEventListener("mouseenter",a,!1),n.removeEventListener("mouseleave",i,!1)}):(console.warn("mouseenter and mouseleave events polyfill is enabled."),o=function(e){e.relatedTarget&&(e.relatedTarget===this||this.compareDocumentPosition(e.relatedTarget)&Node.DOCUMENT_POSITION_CONTAINED_BY)||a.apply(this,arguments)},n.addEventListener("mouseover",o),l=function(e){e.relatedTarget&&(e.relatedTarget===this||this.compareDocumentPosition(e.relatedTarget)&Node.DOCUMENT_POSITION_CONTAINED_BY)||i.apply(this,arguments)},n.addEventListener("mouseout",l),function(){n.removeEventListener("mouseover",o,!1),n.removeEventListener("mouseout",l,!1)})),e.enabled=!0),!0},unbind:function(e,t){e.enabled&&e.boundTargets.length<=1&&(e.removeEventListener(),y.mouseHoverAnchor.setStyles(e.elmStyle,e.styleSave),e.enabled=!1),y.mouseHoverAnchor.llShow(t.props,!0,e.showEffectName)},removeOption:function(e,t){y.pointAnchor.removeOption(e,t)},remove:function(t){t.boundTargets.length&&(console.error("LeaderLineAttachment was not unbound by remove"),t.boundTargets.forEach(function(e){y.mouseHoverAnchor.unbind(t,e)}))},getBBoxNest:function(e,t){return ge(e.element,t.baseWindow)},llShow:function(e,t,n){g[n||e.curStats.show_effect].stop(e,!0,t),e.aplStats.show_on=t},getStyles:function(n,e){return e.reduce(function(e,t){return e[t]=n[t],e},{})},setStyles:function(t,n){Object.keys(n).forEach(function(e){t[e]=n[e]})}},captionLabel:{type:"label",argOptions:[{optionName:"text",type:"string"}],stats:{color:{},x:{},y:{}},textStyleProps:["fontFamily","fontStyle","fontVariant","fontWeight","fontStretch","fontSize","fontSizeAdjust","kerning","letterSpacing","wordSpacing","textDecoration"],init:function(u,t){return"string"==typeof t.text&&(u.text=t.text.trim()),!!u.text&&("string"==typeof t.color&&(u.color=t.color.trim()),u.outlineColor="string"==typeof t.outlineColor?t.outlineColor.trim():"#fff",Array.isArray(t.offset)&&w(t.offset[0])&&w(t.offset[1])&&(u.offset={x:t.offset[0],y:t.offset[1]}),w(t.lineOffset)&&(u.lineOffset=t.lineOffset),y.captionLabel.textStyleProps.forEach(function(e){null!=t[e]&&(u[e]=t[e])}),u.updateColor=function(e){y.captionLabel.updateColor(u,e)},u.updateSocketXY=function(e){var t,n,a,i,o=u.curStats,l=u.aplStats,r=e.curStats,s=r.position_socketXYSE[u.socketIndex];null!=s.x&&(u.offset?(o.x=s.x+u.offset.x,o.y=s.y+u.offset.y):(t=u.height/2,n=Math.max(r.attach_plugSideLenSE[u.socketIndex]||0,r.line_strokeWidth/2),a=r.position_socketXYSE[u.socketIndex?0:1],s.socketId===L||s.socketId===I?(o.x=s.socketId===L?s.x-t-u.width:s.x+t,o.y=a.y<s.y?s.y+n+t:s.y-n-t-u.height):(o.x=a.x<s.x?s.x+n+t:s.x-n-t-u.width,o.y=s.socketId===M?s.y-t-u.height:s.y+t)),We(u,l,"x",i=o.x)&&(u.elmPosition.x.baseVal.getItem(0).value=i),We(u,l,"y",i=o.y)&&(u.elmPosition.y.baseVal.getItem(0).value=i+u.height))},u.updatePath=function(e){var t,n,a=u.curStats,i=u.aplStats,o=e.pathList.animVal||e.pathList.baseVal;o&&(t=y.captionLabel.getMidPoint(o,u.lineOffset),a.x=t.x-u.width/2,a.y=t.y-u.height/2,We(u,i,"x",n=a.x)&&(u.elmPosition.x.baseVal.getItem(0).value=n),We(u,i,"y",n=a.y)&&(u.elmPosition.y.baseVal.getItem(0).value=n+u.height))},u.updateShow=function(e){y.captionLabel.updateShow(u,e)},ue&&(u.adjustEdge=function(e,t){var n=u.curStats;null!=n.x&&y.captionLabel.adjustEdge(t,{x:n.x,y:n.y,width:u.width,height:u.height},u.strokeWidth/2)}),!0)},updateColor:function(e,t){var n,a=e.curStats,i=e.aplStats,o=t.curStats;a.color=n=e.color||o.line_color,We(e,i,"color",n)&&(e.styleFill.fill=n)},updateShow:function(e,t){var n=!0===t.isShown;n!==e.isShown&&(e.styleShow.visibility=n?"":"hidden",e.isShown=n)},adjustEdge:function(e,t,n){var a={x1:t.x-n,y1:t.y-n,x2:t.x+t.width+n,y2:t.y+t.height+n};a.x1<e.x1&&(e.x1=a.x1),a.y1<e.y1&&(e.y1=a.y1),a.x2>e.x2&&(e.x2=a.x2),a.y2>e.y2&&(e.y2=a.y2)},newText:function(e,t,n,a,i){var o,l,r,s,u,h;return(o=t.createElementNS(b,"text")).textContent=e,[o.x,o.y].forEach(function(e){var t=n.createSVGLength();t.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX,0),e.baseVal.initialize(t)}),"boolean"!=typeof f&&(f="paintOrder"in o.style),i&&!f?(r=t.createElementNS(b,"defs"),o.id=a,r.appendChild(o),(u=(l=t.createElementNS(b,"g")).appendChild(t.createElementNS(b,"use"))).href.baseVal="#"+a,(s=l.appendChild(t.createElementNS(b,"use"))).href.baseVal="#"+a,(h=u.style).strokeLinejoin="round",{elmPosition:o,styleText:o.style,styleFill:s.style,styleStroke:h,styleShow:l.style,elmsAppend:[r,l]}):(h=o.style,i&&(h.strokeLinejoin="round",h.paintOrder="stroke"),{elmPosition:o,styleText:h,styleFill:h,styleStroke:i?h:null,styleShow:h,elmsAppend:[o]})},getMidPoint:function(e,t){var n,a,i,o=Oe(e),l=o.segsLen,r=o.lenAll,s=-1;if((n=r/2+(t||0))<=0)return 2===(a=e[0]).length?ve(a[0],a[1],0):xe(a[0],a[1],a[2],a[3],0);if(r<=n)return 2===(a=e[e.length-1]).length?ve(a[0],a[1],1):xe(a[0],a[1],a[2],a[3],1);for(i=[];n>l[++s];)i.push(e[s]),n-=l[s];return 2===(a=e[s]).length?ve(a[0],a[1],n/l[s]):xe(a[0],a[1],a[2],a[3],ke(a[0],a[1],a[2],a[3],n))},initSvg:function(t,n){var e,a,i=y.captionLabel.newText(t.text,n.baseWindow.document,n.svg,v+"-captionLabel-"+t._id,t.outlineColor);["elmPosition","styleFill","styleShow","elmsAppend"].forEach(function(e){t[e]=i[e]}),t.isShown=!1,t.styleShow.visibility="hidden",y.captionLabel.textStyleProps.forEach(function(e){null!=t[e]&&(i.styleText[e]=t[e])}),i.elmsAppend.forEach(function(e){n.svg.appendChild(e)}),e=i.elmPosition.getBBox(),t.width=e.width,t.height=e.height,t.outlineColor&&(a=10<(a=e.height/9)?10:a<2?2:a,i.styleStroke.strokeWidth=a+"px",i.styleStroke.stroke=t.outlineColor),t.strokeWidth=a||0,Te(t.aplStats,y.captionLabel.stats),t.updateColor(n),t.refSocketXY?t.updateSocketXY(n):t.updatePath(n),ue&&De(n,{}),t.updateShow(n)},bind:function(e,t){var n=t.props;return e.color||Ie(n,"cur_line_color",e.updateColor),(e.refSocketXY="startLabel"===t.optionName||"endLabel"===t.optionName)?(e.socketIndex="startLabel"===t.optionName?0:1,Ie(n,"apl_position",e.updateSocketXY),e.offset||(Ie(n,"cur_attach_plugSideLenSE",e.updateSocketXY),Ie(n,"cur_line_strokeWidth",e.updateSocketXY))):Ie(n,"apl_path",e.updatePath),Ie(n,"svgShow",e.updateShow),ue&&Ie(n,"new_edge4viewBox",e.adjustEdge),y.captionLabel.initSvg(e,n),!0},unbind:function(e,t){var n=t.props;e.elmsAppend&&(e.elmsAppend.forEach(function(e){n.svg.removeChild(e)}),e.elmPosition=e.styleFill=e.styleShow=e.elmsAppend=null),Te(e.curStats,y.captionLabel.stats),Te(e.aplStats,y.captionLabel.stats),e.color||Ce(n,"cur_line_color",e.updateColor),e.refSocketXY?(Ce(n,"apl_position",e.updateSocketXY),e.offset||(Ce(n,"cur_attach_plugSideLenSE",e.updateSocketXY),Ce(n,"cur_line_strokeWidth",e.updateSocketXY))):Ce(n,"apl_path",e.updatePath),Ce(n,"svgShow",e.updateShow),ue&&(Ce(n,"new_edge4viewBox",e.adjustEdge),De(n,{}))},removeOption:function(e,t){var n=t.props,a={};a[t.optionName]="",Ze(n,a)},remove:function(t){t.boundTargets.length&&(console.error("LeaderLineAttachment was not unbound by remove"),t.boundTargets.forEach(function(e){y.captionLabel.unbind(t,e)}))}},pathLabel:{type:"label",argOptions:[{optionName:"text",type:"string"}],stats:{color:{},startOffset:{},pathData:{}},init:function(s,t){return"string"==typeof t.text&&(s.text=t.text.trim()),!!s.text&&("string"==typeof t.color&&(s.color=t.color.trim()),s.outlineColor="string"==typeof t.outlineColor?t.outlineColor.trim():"#fff",w(t.lineOffset)&&(s.lineOffset=t.lineOffset),y.captionLabel.textStyleProps.forEach(function(e){null!=t[e]&&(s[e]=t[e])}),s.updateColor=function(e){y.captionLabel.updateColor(s,e)},s.updatePath=function(e){var t,n=s.curStats,a=s.aplStats,i=e.curStats,o=e.pathList.animVal||e.pathList.baseVal;o&&(n.pathData=t=y.pathLabel.getOffsetPathData(o,i.line_strokeWidth/2+s.strokeWidth/2+s.height/4,1.25*s.height),Me(t,a.pathData)&&(s.elmPath.setPathData(t),a.pathData=t,s.bBox=s.elmPosition.getBBox(),s.updateStartOffset(e)))},s.updateStartOffset=function(e){var t,n,a,i,o=s.curStats,l=s.aplStats,r=e.curStats;o.pathData&&((2!==s.semIndex||s.lineOffset)&&(t=o.pathData.reduce(function(e,t){var n,a=t.values;switch(t.type){case"M":i={x:a[0],y:a[1]};break;case"L":n={x:a[0],y:a[1]},i&&(e+=_e(i,n)),i=n;break;case"C":n={x:a[4],y:a[5]},i&&(e+=be(i,{x:a[0],y:a[1]},{x:a[2],y:a[3]},n)),i=n}return e},0),a=0===s.semIndex?0:1===s.semIndex?t:t/2,2!==s.semIndex&&(n=Math.max(r.attach_plugBackLenSE[s.semIndex]||0,r.line_strokeWidth/2)+s.strokeWidth/2+s.height/4,a=(a+=0===s.semIndex?n:-n)<0?0:t<a?t:a),s.lineOffset&&(a=(a+=s.lineOffset)<0?0:t<a?t:a),o.startOffset=a,We(s,l,"startOffset",a)&&(s.elmOffset.startOffset.baseVal.value=a)))},s.updateShow=function(e){y.captionLabel.updateShow(s,e)},ue&&(s.adjustEdge=function(e,t){s.bBox&&y.captionLabel.adjustEdge(t,s.bBox,s.strokeWidth/2)}),!0)},getOffsetPathData:function(e,x,n){var b,a,i=3,k=[];function w(e,t){return Math.abs(e.x-t.x)<i&&Math.abs(e.y-t.y)<i}return e.forEach(function(e){var t,n,a,i,o,l,r,s,u,h,p,c,d,f,y,S,m,g,_,v,E;2===e.length?(g=e[0],_=e[1],v=x,E=Math.atan2(g.y-_.y,_.x-g.x)+.5*Math.PI,t=[{x:g.x+Math.cos(E)*v,y:g.y+Math.sin(E)*v*-1},{x:_.x+Math.cos(E)*v,y:_.y+Math.sin(E)*v*-1}],b?(a=b.points,0<=(i=Math.atan2(a[1].y-a[0].y,a[0].x-a[1].x)-Math.atan2(e[0].y-e[1].y,e[1].x-e[0].x))&&i<=Math.PI?n={type:"line",points:t,inside:!0}:(l=Ee(a[0],a[1],x),o=Ee(t[1],t[0],x),s=a[0],h=o,p=t[1],c=(u=l).x-s.x,d=u.y-s.y,f=p.x-h.x,y=p.y-h.y,S=(-d*(s.x-h.x)+c*(s.y-h.y))/(-f*d+c*y),m=(f*(s.y-h.y)-y*(s.x-h.x))/(-f*d+c*y),(r=0<=S&&S<=1&&0<=m&&m<=1?{x:s.x+m*c,y:s.y+m*d}:null)?n={type:"line",points:[a[1]=r,t[1]]}:(a[1]=w(o,l)?o:l,n={type:"line",points:[o,t[1]]}),b.len=_e(a[0],a[1]))):n={type:"line",points:t},n.len=_e(n.points[0],n.points[1]),k.push(b=n)):(k.push({type:"cubic",points:function(e,t,n,a,i,o){for(var l,r,s=be(e,t,n,a)/o,u=1/(o<i?s*(i/o):s),h=[],p=0;r=(90-(l=xe(e,t,n,a,p)).angle)*(Math.PI/180),h.push({x:l.x+Math.cos(r)*i,y:l.y+Math.sin(r)*i*-1}),!(1<=p);)1<(p+=u)&&(p=1);return h}(e[0],e[1],e[2],e[3],x,16)}),b=null)}),b=null,k.forEach(function(e){var t;"line"===e.type?(e.inside&&(b.len>x?((t=b.points)[1]=Ee(t[0],t[1],-x),b.len=_e(t[0],t[1])):(b.points=null,b.len=0),e.len>x+n?((t=e.points)[0]=Ee(t[1],t[0],-(x+n)),e.len=_e(t[0],t[1])):(e.points=null,e.len=0)),b=e):b=null}),k.reduce(function(t,e){var n=e.points;return n&&(a&&w(n[0],a)||t.push({type:"M",values:[n[0].x,n[0].y]}),"line"===e.type?t.push({type:"L",values:[n[1].x,n[1].y]}):(n.shift(),n.forEach(function(e){t.push({type:"L",values:[e.x,e.y]})})),a=n[n.length-1]),t},[])},newText:function(e,t,n,a){var i,o,l,r,s,u,h,p,c,d;return(r=(l=t.createElementNS(b,"defs")).appendChild(t.createElementNS(b,"path"))).id=i=n+"-path",(u=(s=t.createElementNS(b,"text")).appendChild(t.createElementNS(b,"textPath"))).href.baseVal="#"+i,u.startOffset.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX,0),u.textContent=e,"boolean"!=typeof f&&(f="paintOrder"in s.style),a&&!f?(s.id=o=n+"-text",l.appendChild(s),(c=(h=t.createElementNS(b,"g")).appendChild(t.createElementNS(b,"use"))).href.baseVal="#"+o,(p=h.appendChild(t.createElementNS(b,"use"))).href.baseVal="#"+o,(d=c.style).strokeLinejoin="round",{elmPosition:s,elmPath:r,elmOffset:u,styleText:s.style,styleFill:p.style,styleStroke:d,styleShow:h.style,elmsAppend:[l,h]}):(d=s.style,a&&(d.strokeLinejoin="round",d.paintOrder="stroke"),{elmPosition:s,elmPath:r,elmOffset:u,styleText:d,styleFill:d,styleStroke:a?d:null,styleShow:d,elmsAppend:[l,s]})},initSvg:function(t,n){var e,a,i=y.pathLabel.newText(t.text,n.baseWindow.document,v+"-pathLabel-"+t._id,t.outlineColor);["elmPosition","elmPath","elmOffset","styleFill","styleShow","elmsAppend"].forEach(function(e){t[e]=i[e]}),t.isShown=!1,t.styleShow.visibility="hidden",y.captionLabel.textStyleProps.forEach(function(e){null!=t[e]&&(i.styleText[e]=t[e])}),i.elmsAppend.forEach(function(e){n.svg.appendChild(e)}),i.elmPath.setPathData([{type:"M",values:[0,100]},{type:"h",values:[100]}]),e=i.elmPosition.getBBox(),i.styleText.textAnchor=["start","end","middle"][t.semIndex],2!==t.semIndex||t.lineOffset||i.elmOffset.startOffset.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE,50),t.height=e.height,t.outlineColor&&(a=10<(a=e.height/9)?10:a<2?2:a,i.styleStroke.strokeWidth=a+"px",i.styleStroke.stroke=t.outlineColor),t.strokeWidth=a||0,Te(t.aplStats,y.pathLabel.stats),t.updateColor(n),t.updatePath(n),t.updateStartOffset(n),ue&&De(n,{}),t.updateShow(n)},bind:function(e,t){var n=t.props;return e.color||Ie(n,"cur_line_color",e.updateColor),Ie(n,"cur_line_strokeWidth",e.updatePath),Ie(n,"apl_path",e.updatePath),e.semIndex="startLabel"===t.optionName?0:"endLabel"===t.optionName?1:2,(2!==e.semIndex||e.lineOffset)&&Ie(n,"cur_attach_plugBackLenSE",e.updateStartOffset),Ie(n,"svgShow",e.updateShow),ue&&Ie(n,"new_edge4viewBox",e.adjustEdge),y.pathLabel.initSvg(e,n),!0},unbind:function(e,t){var n=t.props;e.elmsAppend&&(e.elmsAppend.forEach(function(e){n.svg.removeChild(e)}),e.elmPosition=e.elmPath=e.elmOffset=e.styleFill=e.styleShow=e.elmsAppend=null),Te(e.curStats,y.pathLabel.stats),Te(e.aplStats,y.pathLabel.stats),e.color||Ce(n,"cur_line_color",e.updateColor),Ce(n,"cur_line_strokeWidth",e.updatePath),Ce(n,"apl_path",e.updatePath),(2!==e.semIndex||e.lineOffset)&&Ce(n,"cur_attach_plugBackLenSE",e.updateStartOffset),Ce(n,"svgShow",e.updateShow),ue&&(Ce(n,"new_edge4viewBox",e.adjustEdge),De(n,{}))},removeOption:function(e,t){var n=t.props,a={};a[t.optionName]="",Ze(n,a)},remove:function(t){t.boundTargets.length&&(console.error("LeaderLineAttachment was not unbound by remove"),t.boundTargets.forEach(function(e){y.pathLabel.unbind(t,e)}))}}},Object.keys(y).forEach(function(e){Ye[e]=function(){return new S(y[e],Array.prototype.slice.call(arguments))}}),Ye.positionByWindowResize=!0,window.addEventListener("resize",O.add(function(){Ye.positionByWindowResize&&Object.keys(K).forEach(function(e){De(K[e],{position:!0})})}),!1),Ye}();
/*! mClassList v1.1.9 (c) anseki https://github.com/anseki/m-class-list */
var mClassList=function(t){var n={};function e(r){if(n[r])return n[r].exports;var i=n[r]={i:r,l:!1,exports:{}};return t[r].call(i.exports,i,i.exports,e),i.l=!0,i.exports}return e.m=t,e.c=n,e.d=function(t,n,r){e.o(t,n)||Object.defineProperty(t,n,{configurable:!1,enumerable:!0,get:r})},e.r=function(t){Object.defineProperty(t,"__esModule",{value:!0})},e.n=function(t){var n=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(n,"a",n),n},e.o=function(t,n){return Object.prototype.hasOwnProperty.call(t,n)},e.p="",e(e.s=0)}([function(t,n,e){"use strict";function r(t){return(t+"").trim()}function i(t,n){n.setAttribute("class",t.join(" "))}function o(t){return!o.ignoreNative&&t.classList||(n=(t.getAttribute("class")||"").trim().split(/\s+/).filter(function(t){return!!t}),e={length:n.length,item:function(t){return n[t]},contains:function(t){return-1!==n.indexOf(r(t))},add:function(){return function(t,n,e){e.filter(function(n){return!(!(n=r(n))||-1!==t.indexOf(n)||(t.push(n),0))}).length&&i(t,n)}(n,t,Array.prototype.slice.call(arguments)),o.methodChain?e:void 0},remove:function(){return function(t,n,e){e.filter(function(n){var e=void 0;return!(!(n=r(n))||-1===(e=t.indexOf(n))||(t.splice(e,1),0))}).length&&i(t,n)}(n,t,Array.prototype.slice.call(arguments)),o.methodChain?e:void 0},toggle:function(e,o){return function(t,n,e,o){var u=t.indexOf(e=r(e));return-1!==u?!!o||(t.splice(u,1),i(t,n),!1):!1!==o&&(t.push(e),i(t,n),!0)}(n,t,e,o)},replace:function(u,c){return function(t,n,e,o){var u=void 0;(e=r(e))&&(o=r(o))&&e!==o&&-1!==(u=t.indexOf(e))&&(t.splice(u,1),-1===t.indexOf(o)&&t.push(o),i(t,n))}(n,t,u,c),o.methodChain?e:void 0}});var n,e}e.r(n),o.methodChain=!0,n.default=o}]).default;