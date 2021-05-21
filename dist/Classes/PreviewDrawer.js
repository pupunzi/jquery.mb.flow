import {UI} from "./UI.js";
import {Node, Type} from "./Node.js";

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

	static drawNode() {
		let node = $.flowApp.node.get($.flowApp.selectedNodeId);
		let $node = $("#node_" + node._id);
		PreviewDrawer.drawActor(node._id);
		$node.addClass("selected");
		$.flow.addToSelectedNodes(node._id, false);

		window.flowApp.drawer.focusOnSelectedNode()
	}

	static drawActor(nodeId) {
		let node = $.flowApp.node.get(nodeId);
		let actor = $.flowApp.actor.get(node._actorId);
		let avatar = window.Avataaars.create(actor._avatar._options);
		PreviewDrawer._window.find(".avatar").html(avatar);
	}

	static drawContent(nodeId) {
		let node = $.flowApp.node.get(nodeId);
		let type = node._type;





		//PreviewDrawer._window.find(".avatar").html(avatar);
	}

}
