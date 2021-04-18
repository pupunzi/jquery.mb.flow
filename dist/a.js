/**
 *
 * Description:
 *
 **/
import {FlowApp} from "../Classes/FlowApp.js";
import {UI} from "../Classes/UI.js";

;

(function ($, d) {
    $(function () {
        window.flowApp = new FlowApp();

        let lastFlow = $.mbStorage.get("lastFlow");
        if (lastFlow != null)
            flowApp.load(lastFlow);
        else
            window.addFlow();
    });

    $.flow = {
        addFlow: function () {
            let title = "Add a new flow";
            let text = null;
            let action = function (name) {
                flowApp.addFlow(name);
                $.mbStorage.set("lastFlow", flowApp.flow.id);
            };
            UI.dialogue(title, text, "flowName", "Flow Name", "Add", "Cancel", action);
        },

        updateFlowName: function (name) {
            flowApp.flow._name = name.length === 0 ? flowApp.flow._name : name;
            flowApp.save(flowApp.flow._id);

            flowApp.drawer.updateFlowName();
        }



    };

})(jQuery, document);
