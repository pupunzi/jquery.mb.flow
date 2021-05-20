/**
 *
 * Description:
 *
 **/
import {KeyType} from "./KeyboardListener.js";

class UI {
    constructor() {
        this._placeholders = {
            flowName: "#top-bar #flow-name-placeholder",
            boardListButtonBar: "#boards-list-button-bar",
            boardList: "#boards-list",
            drawingArea: "#draw-area",
            grid: "#grid",
            board: "#board",
            connections: "#connections",
            boardGroupName: ".group-label .name"
        };
    }

    get placeholders() {
        return this._placeholders;
    }

    static dialogue(options = {}) {

        let opt = {
            title: "Dialogue",
            text: null,
            inputId: null,
            inputValue: null,
            okLabel: "Ok",
            cancelLabel: "Cancel",
            action: null,
            className: null
        };
        $.extend(opt, options);

        let time = 100;
        let overlay = $("<div>").addClass("flow-overlay");
        let dialogue = $("<div>").addClass("flow-dialogue");

        if (opt.className != null)
            dialogue.addClass(opt.className);

        let dialogueTitle = $("<h2>").addClass("flow-dialogue-title").html(opt.title);
        let dialogueText = $("<p>").addClass("flow-dialogue-text").html(opt.text);
        let buttonBar = $("<div>").addClass("flow-button-bar");

        dialogue.append(dialogueTitle);

        if (dialogueText != null)
            dialogue.append(dialogueText);

        let dialogueInput = null;
        if (opt.inputId != null) {
            dialogueInput = $("<div>").attr({id: opt.inputId, contentEditable: "true"}).addClass("flow-dialogue-input");
            let source = [];
            if (window.flowApp.flow != null)
                for (const [key, value] of Object.entries(window.flowApp.flow._variables)) {
                    console.log(`${key}: ${value}`);
                    source.push(key);
                }

            /**
             * Autocomplete for variables
             */
            dialogueInput.tagautocomplete({
                tag: '$',
                source: source,
                suffix: ""
            });

            if (opt.inputValue != null)
                dialogueInput.html(opt.inputValue).select();

            dialogue.append(dialogueInput);
        }
        let dialogueOkButton = $("<button>").addClass("flow-dialogue-ok main").html(opt.okLabel);

        if (opt.cancelLabel != null) {
            let dialogueCancelButton = $("<button>").addClass("flow-dialogue-cancel").html(opt.cancelLabel);
            dialogueCancelButton.on("click", () => {
                closeDialogue();
            });
            buttonBar.append(dialogueCancelButton);
        }

        if (typeof opt.action === "function") {
            dialogueOkButton.on("click", () => {
                let v = dialogueInput != null ? dialogueInput.html() : null;
                if (v && v.length === 0)
                    return;
                opt.action(v);
                closeDialogue();
            });
        } else {
            dialogueOkButton.on("click", () => {
                closeDialogue();
            });
        }
        buttonBar.append(dialogueOkButton);

        dialogue.append(buttonBar);
        overlay.append(dialogue);
        overlay.fadeOut(0);
        $("body").after(overlay);
        overlay.fadeIn(time, () => {
            if (opt.inputId != null) {
                dialogueInput.focus();
            }
            $(document).on("keydown.dialogue", (e) => {
                if (e.key === KeyType.enter) {
                    e.preventDefault();
                    let v = dialogueInput != null ? dialogueInput.val() : null;
                    if (v == null || (v && v.length > 0))
                        dialogueOkButton.click();
                } else if (e.key === KeyType.escape) {
                    closeDialogue();
                }
            })
        });

        let closeDialogue = function () {
            $(document).off("keydown.dialogue");
            overlay.fadeOut(time, () => {
                overlay.remove();
            });
        }
    }

    static fillTemplate(templateId, data) {
        if ($("#" + templateId).length === 0)
            return "";
        return $("#" + templateId).get(0).innerHTML.replace(/{{(\w*)}}/g, function (m, key) {
            return data.hasOwnProperty(key) ? data[key] : "";
        });
    }


}


export {UI};
