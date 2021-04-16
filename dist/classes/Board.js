/**
 *
 * Description:
 * Board Model
 **/
import {Util} from "./Util.js";
import {Node} from "./Node.js";

class Board {
	get selectedCards() {
		return this._selectedCards;
	}

	set selectedCards(value) {
		this._selectedCards.push(value);
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

	constructor(){
		this._id = Util.setUID();
		this._nodes = [];
		this._selectedCards = [];
	}

	addNode(type = Type.text){
		this.nodes = new Node(type);
	}

	getNodeById(id){
		this.nodes.forEach((card)=>{
			if (card.id === id)
				return card;
		});
		return null;
	}

	deleteCardById(id){
		let el = this.getNodeById(id);
		if(el != null)
			this.nodes.delete(el);
	}

}


export {Board};
