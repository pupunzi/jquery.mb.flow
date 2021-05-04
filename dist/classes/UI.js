/**
 *
 * Description:
 *
 **/

class UI {
    constructor() {
        this._placeholders = {
            flowName: "#top-bar #flow-name-placeholder",
            boardListButtonBar: "#boards-list-button-bar",
            boardList: "#boards-list",
            board: "#board",
            drawingArea: "#draw-area",
            connections: "#connections",
            boardGroupName: ".group-label .name"
        };
    }

    get placeholders() {
        return this._placeholders;
    }

    static dialogue(title, text = null, inputName = null, inputPlaceholder = null, inputValue = null, okLabel = "Ok", cancelLabel = "Cancel", action = null, className = null) {
        let time = 100;
        let overlay = $("<div>").addClass("flow-overlay");
        let dialogue = $("<div>").addClass("flow-dialogue");

        if (className != null)
            dialogue.addClass(className);

        let dialogueTitle = $("<h2>").addClass("flow-dialogue-title").html(title);
        let dialogueText = $("<p>").addClass("flow-dialogue-text").html(text);
        let buttonBar = $("<div>").addClass("flow-button-bar");

        dialogue.append(dialogueTitle);

        if (dialogueText != null)
            dialogue.append(dialogueText);

        let dialogueInput = null;
        if (inputName != null) {
            dialogueInput = $("<input>").addClass("flow-dialogue-input").attr({
                name: inputName,
                placeholder: inputPlaceholder
            });

            if (inputValue != null)
                dialogueInput.val(inputValue).select();

            dialogue.append(dialogueInput);
        }
        let dialogueOkButton = $("<button>").addClass("flow-dialogue-ok main").html(okLabel);

        if (cancelLabel != null) {
            let dialogueCancelButton = $("<button>").addClass("flow-dialogue-cancel").html(cancelLabel);
            dialogueCancelButton.on("click", () => {
                closeDialogue();
            });
            buttonBar.append(dialogueCancelButton);
        }

        if (typeof action === "function") {
            dialogueOkButton.on("click", () => {
                let v = dialogueInput != null ? dialogueInput.val() : null;
                if (v && v.length === 0)
                    return;
                action(v);
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
            if (inputName != null) {
                dialogueInput.focus();
            }
            $(document).on("keydown.dialogue", (e) => {
                if (e.key === "Enter") {
                    let v = dialogueInput != null ? dialogueInput.val() : null;
                    if (v == null || (v && v.length > 0))
                        dialogueOkButton.click();
                } else if (e.key === "Escape") {
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
        return $("#" + templateId).get(0).innerHTML.replace(/{{(\w*)}}/g, function (m, key) {
            return data.hasOwnProperty(key) ? data[key] : "";
        });
    }

    static getVariables(content) {
        let variables = [... content.matchAll(/{([^}]+)}}/gi)];
        if(variables)
            variables.forEach( (v) =>{
                console.debug($.flow.flowApp().flow._variables);
                eval("$.flow.flowApp().flow._variables." + v[1]);
            })
    }

}


export {UI};
