/**
 *
 * Description:
 *
 **/

export class Events {

	static register(eventName, obj) {
		const event = new CustomEvent(eventName, {detail: obj});
		document.dispatchEvent(event);
	}

	on(eventName, action) {
		document.addEventListener(eventName, (e) => {
			// console.debug("event", eventName);
			action(e)
		}, false);
	}
}

export class EventType {

	// Flow
	static addFlow = "addFlow";
	static updateFlowName = "updateFlowName";
	static loadFlow = "loadFlow";
	static deleteFlow = "deleteFlow";
	static saveFlow = "saveFlow";
	static addGroup = "addGroup";
	static updateGroupName = "updateGroupName";

	//Board
	static addBoard = "addBoard";
	static selectBoard = "selectBoard";
	static deleteBoard = "deleteBoard";
	static duplicatedBoard = "duplicatedBoard";
	static updateBoard = "updateBoard";

	//Node
	static addNode = "addNode";
	static selectNode = "selectNode";
	static deleteNode = "deleteNode";
	static updateNode = "updateNode";

	//NodeElement
	static addNodeElement = "addNodeElement";
	static selectNodeElement = "selectNodeElement";
	static deletetNodeElement = "deletetNodeElement";
	static updateNodeElement = "updateNodeElement";

	//Connection
	static addConnection = "addConnection";
	static deleteConnection = "deleteConnection";

}

