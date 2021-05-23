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
            // $.flowApp.source = JSON.parse(JSON.stringify(flow));
            $.flowApp.source = Object.assign({}, flow);
            $.flowApp.selectedBoardId = board._id;
            for (const [key, variable] of Object.entries($.flowApp.source._variables)) {
                $.flowApp.vars[variable._key] = variable._value;
            }
        }
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

            if (!connection || !connection._to)
                return false;

            connection._connectionLine.setOptions({color: "red"});

            $.flowApp.selectedNodeId = connection._to;
            let nextNode = $.flowApp.node.get($.flowApp.selectedNodeId);
            nextNode._previousNodeId = node._id;

            let element = $.flowApp.nodeElement.get(node._id, connection._nodeElementId);

            if (element)
                element._selected = true;

            if (
                nextNode._type === Type.note ||
                nextNode._type === Type.sequence ||
                nextNode._type === Type.random ||
                nextNode._type === Type.variables ||
                nextNode._type === Type.condition
            )
                $.flowApp.node.next();
        },

        getAvailableElement: (nodeId) => {
            nodeId = nodeId || $.flowApp.selectedNodeId;
            let node = $.flowApp.node.get(nodeId);
            let cycleType = node._cycleType;
            let element = null;
            let availableElements = node._elements.filter((element)=>{
                return !element._selected;
            });

            switch (cycleType) {
                case CycleType.list:
                    element = availableElements.length ? availableElements[0] : node._elements[node._elements.length - 1];
                    element._selected = true;
                    break;

                case CycleType.random:
                    availableElements = availableElements.length ? availableElements : node._elements;
                    let rnd = availableElements.length > 1 ? Math.ceil(Math.random() * (availableElements.length - 1)) : 0;
                    element = availableElements[rnd];
                    element._selected = true;
                    break;

                case CycleType.loop:
                    availableElements = availableElements.length ? availableElements : node._elements;
                    element = availableElements[0];
                    break;
            }
            return element;
        },
        getText: ()=>{
            let nodeElement = $.flowApp.node.getAvailableElement();
            let text = window.flowApp.getContent(nodeElement, window.flowApp.flow._locale)._text;
            return text;
        },

        getParsedText: ()=>{
            let text = $("<div class='temp-element'>").css({display:"none"}).html($.flowApp.node.getText());
            //$("body").append(text);

            let variables = text.find("span.variables");
            variables.each(function(){
                console.debug(this);
                let v = $(this).text().trim();
                let result = $.flowApp.parseVariables(v);
                console.debug(v + " -- " + result);
                $(this).remove();
            });



            let variablesToPrint = text.find("span.eval-variable");
            variablesToPrint.each(function(){
                console.debug(this);
                let v = $(this).text().trim();
                console.debug(v + " -- " + $.flowApp.vars[v]);
                let val = $.flowApp.vars[v];
                $(this).replaceWith("<span>" + val + "</span>");
            });
            return text.html();
        }
    },


    // ███████ Node Element █████████████████████████████████████
    nodeElement: {
        get: (nodeId, elementId) => {
            let node = $.flowApp.node.get(nodeId);
            return node._elements.filter((el)=>{
                return el._id === elementId;
            });
        }
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
                    availableConnection = node._connections[0];
                    break;

                case Type.choices:
                    availableConnection = $.flowApp.connection.getByLineId(node, lineId);
                    break;

                case Type.condition:
                    node._elements.forEach((element) => {
                        let content = window.flowApp.getText(element);
                        let result = Util.parseVariables(content);
                        if (eval(result.toString()) && !availableConnection) {
                            availableConnection = $.flowApp.connection.getByLineId(node, element._id);
                        }
                    });

                    if (!availableConnection)
                        availableConnection = $.flowApp.connection.getFail(node);
                    break;

                case Type.variables:
                    node._elements.forEach((element) => {
                        let content = window.flowApp.getText(element);
                        let result = $.flowApp.parseVariables(content);
                        //let newValue = eval(result.toString());
                        console.debug(result);
                    });
                    availableConnection = node._connections[0];
                    break;

                case Type.random:
                    let rnd = Math.ceil(Math.random() * (node._connections.length - 1));
                    console.debug(node._connections.length, rnd)
                    availableConnection = node._connections[rnd];
                    break;

                case Type.sequence:
                    let possibleElement = node._elements.filter(element => !element._selected)[0];
                    if (possibleElement) {
                        possibleElement._selected = true;
                        availableConnection = $.flowApp.connection.getByLineId(node, possibleElement._id);
                    }else {
                        node._elements.forEach((element) => {
                            element._selected = false;
                            availableConnection = $.flowApp.connection.getByLineId(node, node._elements[0]._id);
                        });
                    }
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
    },

    parseVariables: (content) => {
        //find anything inside {}
        let str = $("<div>").html(content).text();
        let regExp = /[^{\{]+(?=})/gi;
        let variableBlocks = str.match(regExp);
        // string = string.replace(regExp,function(m){ return '<b>'+m+'</b>'})
        if (variableBlocks) {
            variableBlocks.forEach((block) => {
                console.debug(block);
                let vs = $.flowApp.findVariables(block);
                if (vs)
                    vs.forEach((v) => {
                        str = str.replace(v, "$.flowApp.vars." + v.replace("$", ""));
                        v = v.replace("$", "");
                        if (!$.flowApp.vars[v]) {
                            $.flowApp.vars[v] = null;
                        }
                        console.debug("parseVariables",str);
                    });
            });
            eval(str);
            return str;
        }
        return null
    },
    findVariables: (string) => {
        //returns all the words starting with $
        let regExp = /\$([\w]+)/gi;
        return string.match(regExp);
    }
};
