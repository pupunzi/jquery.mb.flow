/**
 *
 * Description:
 *
 **/

export class Events {

    static register(eventName, obj) {
        const event = new CustomEvent(eventName, { detail: obj });
        document.dispatchEvent(event);
    }

    on (eventName, action){
        document.addEventListener(eventName, (e)=>{action(e)}, false);
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
}

