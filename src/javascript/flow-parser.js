/**
 *
 * Description:
 *  Flow Parser library
 **/
;
$.flow = $.flow || {};
$.flow.parser = {};
$.flowApp = $.flow.parser;

window.previewDrawer = PreviewDrawer;

//window.Avataaars = window.Avataaars || Avataaars;

// ████ FLOW    ████████████████████████████████████████████████████████████████████████████████████████████████████████
// ███ PARSER ██████████████████████████████████████████████████████████████████████████████████████████████████████████
// ██████    PUPUNZI     ███████████████████████████████████████████████████████████████████████████████████████████████

$.flowApp = {

    source: null,
    boards: [],
    vars: {},

    selectedBoardId: null,
    selectedNodeId: null,

    load: (flow = null, board = null) => {

        if (typeof flow === "object") {
            $.flowApp.source = Object.assign({}, flow);
            $.flowApp.selectedBoardId = board._id;
            for (const [key, variable] of Object.entries($.flowApp.source._variables)) {
                $.flowApp.vars[variable._key] = variable._value;
            }
        }
    },

    play: () => {
        PreviewDrawer.Play();
    },

    // ███████ Board █████████████████████████████████████
    board: {
        getSelected: () => {
            let b = null;
            $.flowApp.source._boards.forEach((board) => {
                if (board._id === $.flowApp.selectedBoardId)
                    b = board;
            });
            return b;
        }
    },

    // ███████ Node █████████████████████████████████████
    node: {
        start: (nodeId = null) => {
            let startNode = null;
            if (nodeId === null) {
                startNode = $.flowApp.node.getByType(Type.start)[0];
                $.flowApp.selectedNodeId = startNode._id;
                startNode._selected = true;
                $.flowApp.node.next();
            } else {

            }
        },

        get: (nodeId) => {
            let board = $.flowApp.board.getSelected();
            let n = null;
            board._nodes.forEach((node) => {
                if (node._id === nodeId)
                    n = node;
            });
            return n;
        },

        getByType: (type) => {
            let nodes = [];
            let board = $.flowApp.board.getSelected();
            board._nodes.forEach((node) => {
                if (node._type === type)
                    nodes.push(node);
            });
            return nodes;
        },

        getNext: (line = 0) => {
        },

        getPrev: () => {
        },

        goTo: (nodeId) => {

        },

        next: (lineId = null) => {

            let node = $.flowApp.node.get($.flowApp.selectedNodeId);
            let connection = $.flowApp.connection.getAvailable(lineId);

            if(!connection._to)
                return false;

            connection._connectionLine.setOptions({color: "red"});

            $.flowApp.selectedNodeId = connection._to;
            let nextNode = $.flowApp.node.get($.flowApp.selectedNodeId);
            nextNode._previousNodeId = node._id;

            if (
                nextNode._type === Type.note ||
                nextNode._type === Type.sequence ||
                nextNode._type === Type.random ||
                nextNode._type === Type.variables ||
                nextNode._type === Type.condition
            )
                $.flowApp.node.next();
        },
    },

    // ███████ Connections █████████████████████████████████████
    connection: {

        getAvailable: (lineId = null) => {

            let node = $.flowApp.node.get($.flowApp.selectedNodeId);
            let availableConnection = null;

            switch (node._type) {

                case Type.start:
                case Type.text:
                case Type.note:
                case Type.variables:
                    availableConnection = node._connections[0];
                    break;

                case Type.choices:
                    availableConnection = $.flowApp.connection.getByLineId(node, lineId);
                    break;

                case Type.condition:
                    node._elements.forEach((element) => {
                        let content = window.flowApp.getContentText(element);
                        let result = Util.parseVariables(content);

                        if (eval(result.toString()))
                            availableConnection = $.flowApp.connection.getByLineId(node, element._id);
                    });

                    if (!availableConnection)
                        availableConnection = $.flowApp.connection.getFail(node);
                    break;

                case Type.random:
                    let rnd = Math.floor(Math.random() * node._connections.length - 1);
                    availableConnection = node._connections[rnd];
                    break;

                case Type.sequence:
                    node._elements.forEach((element) => {
                        if (!element._selected) {
                            availableConnection = $.flowApp.connection.getByLineId(node, element._id);
                            element._selected = true;
                        }
                    });
                    break;

                case Type.jumpToNode:
                    availableConnection = null;
                    break;
            }
            return availableConnection;
        },

        getByLineId(node, nodeElementId) {
            let c = null;
            node._connections.forEach((connection) => {
                if (connection._nodeElementId === nodeElementId)
                    c = connection;
            });
            return c;
        },

        getFail: (node) => {
            let c = null;
            node._connections.forEach((connection) => {
                if (connection._type === 3)
                    c = connection;
            });
            return c;
        }
    },

    // ███████ Actor █████████████████████████████████████
    actor: {
        get: (actorId) => {
            let a = null;
            $.flowApp.source._actors.forEach((actor) => {
                if (actor._id === actorId)
                    a = actor;
            });
            return a;
        }
    }
};
