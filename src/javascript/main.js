/**
 *
 * Description:
 *
 **/
import {FlowApp} from "../Classes/FlowApp.js";
import {UI} from "../Classes/UI.js";
import {ContextualMenu} from "../Classes/ContextualMenu.js";

;

Array.prototype.delete = function (el) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === el) {
            this.splice(i, 1);
            i--;
        }
    }
};

(function ($, d) {
    $(function () {
        window.flowApp = new FlowApp();
        let lastFlow = $.mbStorage.get("lastFlow");
        if (lastFlow != null)
            flowApp.load(lastFlow);
        else
            $.flow.addFlow();

        $.flow.init();
        window.board_list_element_menu = new ContextualMenu(".board-list-element-menu", $.flow.contextualMenu.boardListelement);
    });

    $.flow = {
        init: function(){
            $("body").on("keydown", "[contenteditable]", (e)=>{
                console.debug(e.target);
                switch (e.keyCode) {
                    case 13:
                        e.preventDefault();
                        $(e.target).blur();
                        break;
                }
            })

        },

        contextualMenu: {
            boardListelement: [
                {
                    name: 'Rename',
                    fn: function (target) {
                        let boardId = $(target).parent().data("board-id");
                        $.flow.editBoardName(boardId);
                    }
                },
                {
                    name: 'Duplicate', fn: function (target) {
                        console.log('Duplicate', target);
                    }
                },
                {},
                {
                    name: 'Delete', fn: function (target) {
                        let boardId = $(target).parent().data("board-id");
                        UI.dialogue("Delete Board", "Are you sure you want to delete<br><b>"+$(target).text()+"</b>?",null,null,null,"Yes","Cancel",()=>{
                            $.flow.deleteBoard(boardId);
                            flowApp.save()
                        });
                    }
                },
            ]
        },

        addFlow: function () {
            let title = "Add a new Flow";
            let text = null;
            let action = function (name) {
                flowApp.addFlow(name);
                $.mbStorage.set("lastFlow", flowApp.flow.id);
                flowApp.save(flowApp.flow.id);
            };
            UI.dialogue(title, text, "flowName", "Flow Name", null, "Add", "Cancel", action);
        },

        openFlow: function () {

        },

        addBoard: function () {
            let title = "Add a new Board";
            let text = null;
            let action = function (name) {
                flowApp.flow.addBoard(name);
            };
            UI.dialogue(title, text, "boardName", "Board Name", null, "Add", "Cancel", action);
        },

        updateFlowName: function (name) {
            flowApp.flow.updateName(name);
        },

        editBoardName: function (boardId) {
            let editEl = $(flowApp.ui.placeholders.boardList).find("#board_" + boardId + " .name");
            editEl.attr({contentEditable: true});
            editEl.focus();
            editEl.one("blur", () => {
                let board = flowApp.flow.getBoardById(boardId);
                board._name = editEl.text();
                flowApp.save(flowApp.flow.id);
                flowApp.drawer.drawBoardList();
            });
        },
        deleteBoard: function(boardId){
            flowApp.flow.deleteBoard(boardId);
            flowApp.drawer.drawBoardList();
            flowApp.save(flowApp.flow.id);
        }

    };

})(jQuery, document);
