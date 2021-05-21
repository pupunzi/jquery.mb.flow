import {UI} from "./UI.js";
import {CycleType, Type} from "./Node.js";

export class PreviewDrawer {
	static _window = null;

	static OpenWindow(flow, board) {
		PreviewDrawer._window = UI.fillTemplate("preview-box", {title: flow._name});
		$("body").append(PreviewDrawer._window);
		PreviewDrawer._window = $("#preview-window");
		$.flowApp.load(flow, board);
	}

	static Play(nodeId = null) {
		PreviewDrawer._window.find(".cover").fadeOut(300);
		$.flowApp.node.start(nodeId);
		console.debug($.flowApp.node.get($.flowApp.selectedNodeId));
		PreviewDrawer.drawNode();
	}

	static next(lineId = null){
		$.flowApp.node.next(lineId);
		PreviewDrawer.drawNode();
	}

	static drawNode(nodeId = null) {
		nodeId = nodeId || $.flowApp.selectedNodeId;
		let node = $.flowApp.node.get(nodeId);
		let $node = $("#node_" + nodeId);
		PreviewDrawer.drawActor();
		PreviewDrawer.drawContent();

		$node.addClass("selected");
		$.flow.addToSelectedNodes(node._id, false);

		window.flowApp.drawer.focusOnSelectedNode()
	}

	static drawActor(nodeId = null) {
		nodeId = nodeId || $.flowApp.selectedNodeId;
		let node = $.flowApp.node.get(nodeId);
		let actor = $.flowApp.actor.get(node._actorId);
		let avatar = window.Avataaars.create(actor._avatar._options);
		PreviewDrawer._window.find(".avatar").html(avatar);
	}

	static drawContent(nodeId = null) {
		nodeId = nodeId || $.flowApp.selectedNodeId;
		let node = $.flowApp.node.get(nodeId);
		let type = node._type;
		let content = $("<div>").addClass("content-wrapper");
		PreviewDrawer._window.find(".content").empty();

		switch (type) {
			case Type.text:
				let cycleType = node._cycleType;
				let element = null;
				let availableElements = [];

				node._elements.forEach((element)=>{
					if(!element._selected)
						availableElements.push(element);
				});

				switch (cycleType) {
					case CycleType.list:
						element = availableElements.length ? availableElements[0] : node._elements[node._elements.length-1];
						element._selected = true;
						break;

					case CycleType.random:
						availableElements = availableElements.length ? availableElements : node._elements;
						let rnd = availableElements.length > 1 ? Math.floor( Math.random() * (availableElements.length -1) ) : 0;
						console.debug(availableElements, rnd);
						element = availableElements[rnd];
						element._selected = true;
						break;

					case CycleType.loop:
						availableElements = availableElements.length ? availableElements : node._elements;
						element = availableElements[0];
						break;
				}

				let text = $("<div>").html(window.flowApp.getContentText(element));
				content.append(text);
				let nextButton = $("<button>").addClass("preview-next").html("Next");
				nextButton.on("click", ()=>{
					PreviewDrawer.next();
				});
				content.append(nextButton);
				break;

			case Type.choices:
				node._elements.forEach((element)=>{
					let choiceText = window.flowApp.getContentText(element);
					let choiceButton = $("<button>").addClass("choice").html(choiceText);
					choiceButton.on("click", ()=>{
						PreviewDrawer.next(element._id);
					});
					content.append(choiceButton);
				});
				break;
		}

		PreviewDrawer._window.find(".content").html(content);

	}
}
