/**
 *
 * Description:
 * Board Model
 **/
import {Util} from "./Util.js";
import {Node} from "./Node.js";
import {Events, EventType} from "./Events.js";

class Board {
    constructor(name, groupName, flowId) {
        this._id = Util.setUID();
        this._flowId = flowId;
        this._name = name;
        this._date = new Date().getTime();
        this._x = 0;
        this._y = 0;
        this._nodes = [];
        this._selectedNodes = [];
        this._group = groupName == "all" ? "Main Group" : groupName;
        this._connections = [];
    }

    get connections() {
        return this._connections;
    }

    get group() {
        return this._group;
    }

    set group(value) {
        this._group = value;
    }

    get flowId() {
        return this._flowId;
    }

    set flowId(value) {
        this._flowId = value;
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    get selectedNodes() {
        return this._selectedNodes;
    }

    get id() {
        return this._id;
    }

    get nodes() {
        return this._nodes;
    }

    set nodes(value) {
        this._nodes.unshift(value);
    }

    addNode(type = Type.text, position = null) {
        let n = new Node(this.id, type);
        n._actorId = window.flowApp.flow.getDefaultActor()._id;

        if (position != null) {
            let startX = $(window.flowApp.ui.placeholders.board).offset().left;
            let startY = $(window.flowApp.ui.placeholders.board).offset().top;
            n._x = position._x - startX;
            n._y = position._y - startY;
        }

        this._nodes.push(n);

        // console.debug(n._actorId);
        // console.debug(this._nodes);

        Events.register(EventType.addNode, n);
        return n;
    }

    getNodeById(id) {
        let n = null;
        this.nodes.forEach((node) => {
            if (node._id === id) {
                n = node;
            }
        });
        return n;
    }

    deleteNodeById(id) {
        let node = this.getNodeById(id);
        if (node != null)
            this.nodes.delete(node);

        Events.register(EventType.deleteNode, null);
    }

    getConnectionsByNodeId(nodeId) {
        let connections = [];
        this.connections.forEach((connection) => {
            if (connection._from === nodeId || connection._to === nodeId)
                connections.push(connection);
        });
        return connections;
    }

}

export {Board};
