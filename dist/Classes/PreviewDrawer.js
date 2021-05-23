import {UI} from "./UI.js";
import {Type} from "./Node.js";
import {FlowApp} from "./FlowApp.js";

export class PreviewDrawer {
    static _window = null;

    static OpenWindow(flow, board) {

        FlowApp._previewIsActive = true;
        PreviewDrawer._window = UI.fillTemplate("preview-box", {title: flow._name});
        $("body").append(PreviewDrawer._window);
        PreviewDrawer._window = $("#preview-window");
        $.flowApp.load(flow, board);
    }

    static CloseWindow() {
        FlowApp._previewIsActive = false;
        PreviewDrawer._window.remove();
        window.flowApp.drawer.drawBoard();
    }

    static Play(nodeId = null) {
        PreviewDrawer._window.find(".cover").fadeOut(300);
        $.flowApp.node.start(nodeId);
        console.debug($.flowApp.node.get($.flowApp.selectedNodeId));
        PreviewDrawer.drawNode();
    }

    static next(lineId = null) {
        $.flowApp.node.next(lineId);
        PreviewDrawer.drawNode();
    }

    static drawNode(nodeId = null) {
        nodeId = nodeId || $.flowApp.selectedNodeId;
        let node = $.flowApp.node.get(nodeId);
        let $node = $("#node_" + nodeId);
        PreviewDrawer.drawActor();
        PreviewDrawer.drawContent();

        $(".node").removeClass("selected");
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
        let content = $("<div>").addClass("content-wrapper");
        PreviewDrawer._window.find(".content").empty();

        switch (node._type) {
            case Type.text:
                let nodeText = $.flowApp.node.getParsedText();
                let text = $("<div>").html(nodeText);
                content.append(text);
                let nextButton = $("<button>").addClass("preview-next").html("Next");
                nextButton.on("click", () => {
                    PreviewDrawer.next();
                });
                content.append(nextButton);
                break;

            case Type.choices:
                node._elements.forEach((element) => {
                    let choiceText = window.flowApp.getText(element);
                    let choiceButton = $("<button>").addClass("choice").html(choiceText);
                    choiceButton.on("click", () => {
                        PreviewDrawer.next(element._id);
                    });
                    content.append(choiceButton);
                });
                break;
        }

        PreviewDrawer._window.find(".content").html(content);

    }
}
