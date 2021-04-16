/**
 *
 * Description:
 * Board Model
 **/
import {Util} from "./Util.js";
import {Node} from "./Node.js";

class Board {

	constructor(name){
		this._id = Util.setUID();
		this._name = name;
		this._nodes = [];
		this._selectedNodes = [];
	}

	get selectedNodes() {
		return this._selectedNodes;
	}

	set selectedNodes(value) {
		this._selectedNodes.push(value);
	}

	get id() {
		return this._id;
	}

	get nodes() {
		return this._nodes;
	}

	set nodes(value) {
		this._nodes.push(value);
	}

	addNode(type = Type.text){
		this.nodes = new Node(type);
	}

	getNodeById(id){
		this.nodes.forEach((node)=>{
			if (node.id === id)
				return node;
		});
		return null;
	}

	deleteNodeById(id){
		let node = this.getNodeById(id);
		if(node != null)
			this.nodes.delete(node);
	}

}


export {Board};
