import {UI} from "./UI.js";
import {Type} from "./Node.js";
import {FlowApp} from "./FlowApp.js";

export class PreviewDrawer {
    static _window = null;

    static OpenWindow(flow, board) {

        FlowApp._previewIsActive = true;
        PreviewDrawer._window = UI.fillTemplate("preview-box", {title: flow._name});

        $("body").addClass("preview-mode").append(PreviewDrawer._window);
        PreviewDrawer._window = $("#preview-window");
        $.flowParser.load(flow, board);
    }

    static CloseWindow() {
        FlowApp._previewIsActive = false;
        PreviewDrawer._window.remove();
        $("body").removeClass("preview-mode");
        window.flowApp.drawer.drawBoard();
    }

    static Play(nodeId = null) {
        PreviewDrawer._window.find(".cover").fadeOut(300);
        $.flowParser.node.start(nodeId);
        console.debug($.flowParser.node.get($.flowParser.selectedNodeId));
        PreviewDrawer.drawNode();
    }

    static next(lineId = null) {
        $.flowParser.node.next(lineId);

        PreviewDrawer.drawNode();
    }

    static drawNode(nodeId = null) {
        nodeId = nodeId || $.flowParser.selectedNodeId;
        let node = $.flowParser.node.get(nodeId);
        let $node = $("#node_" + nodeId);
        PreviewDrawer.drawActor();
        PreviewDrawer.drawContent();

        $(".node").removeClass("selected");
        $node.addClass("selected");
        $.flow.addToSelectedNodes(node._id, false);

        window.flowApp.drawer.focusOnSelectedNode()
    }

    static drawActor(nodeId = null) {
        nodeId = nodeId || $.flowParser.selectedNodeId;
        let node = $.flowParser.node.get(nodeId);
        let actor = $.flowParser.actor.get(node._actorId);
        let avatar = window.Avataaars.create(actor._avatar._options);
        PreviewDrawer._window.find(".avatar").html(avatar);
    }

    static drawContent(nodeId = null) {
        nodeId = nodeId || $.flowParser.selectedNodeId;
        let node = $.flowParser.node.get(nodeId);
        let content = $("<div>").addClass("content-wrapper");
        PreviewDrawer._window.find(".content").empty();

        switch (node._type) {
            case Type.text:
                let nodeText = $.flowParser.node.getParsedText();
                let text = $("<div>").html(nodeText);
                content.append(text);
                let nextButton = $("<button>").addClass("preview-next main").html("Next");
                nextButton.on("click", () => {
                    PreviewDrawer.next();
                });
                content.append(nextButton);
                break;

            case Type.choices:
                node._elements.forEach((element) => {
                    let choiceText = $.flowParser.node.getParsedText(element);
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
