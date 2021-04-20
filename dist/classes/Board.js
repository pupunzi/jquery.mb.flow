/**
 *
 * Description:
 * Board Model
 **/
import {Util} from "./Util.js";
import {Node} from "./Node.js";

class Board {
        constructor(name, flowId) {
        this._id = Util.setUID();
        this._flowId = flowId;
        this._name = name;
        this._date = new Date().getTime();
        this._nodes = [];
        this._selectedNodes = [];
        this._group = "default";
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

    set selectedNodes(value) {
        this._selectedNodes.unshift(value);
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

    addNode(type = Type.text) {
        let n = new Node(type);
        this._nodes.push(JSON.stringify(n));
    }

    getNodeById(id) {
        let n = null;
        this.nodes.forEach((node) => {
            if (node.id === id)
                n = node;
        });
        return n;
    }

    deleteNodeById(id) {
        let node = this.getNodeById(id);
        if (node != null)
            this.nodes.delete(node);
    }


    drawNodes(){
        let nodes = this._nodes;


    }


}


export {Board};
