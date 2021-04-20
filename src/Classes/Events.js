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
			console.debug("event", eventName);
			action(e)
		}, false);
	}
}

export class EventType {
	static addFlow = "addFlow";
	static updateFlowName = "updateFlowName";
	static loadFlow = "loadFlow";
	static removeFlow = "removeFlow";
	static saveFlow = "saveFlow";

	static addBoard = "addBoard";
	static selectBoard = "selectBoard";
	static deleteBoard = "deleteBoard";
	static duplicatedBoard = "duplicatedBoard";
	static updateBoard = "updateBoard";

	static addNode = "addNode";
	static selectNode = "selectNode";
	static deletetNode = "deletetNode";
	static updateNode = "updateNode";

	static addNodeElement = "addNodeElement";
	static selectNodeElement = "selectNodeElement";
	static deletetNodeElement = "deletetNodeElement";
	static updateNodeElement = "updateNodeElement";
}

