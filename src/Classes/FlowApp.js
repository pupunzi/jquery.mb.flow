/**
 *
 * Description:
 *
 **/
import {Flow} from "./Flow.js";
import {UI} from "./UI.js";
import {Events,EventType} from "./Events.js";
import {Drawer} from "./Drawer.js";

class FlowApp {

    constructor() {
        this._date = new Date().getTime();
        this._ui = new UI();
        this._events = new Events();
        this._flowsIds = $.mbStorage.get("flows") || [];
        this._flow = null;
        this._drawer = new Drawer(this);

        //Add Flow
        this.events.on(EventType.addFlow, (e) => {
            this.drawer.updateFlowName();
            this.drawer.drawBoardList();
        });

        //Remove Flow
        this.events.on(EventType.removeFlow, (e) => {
            let flow = this.flows[0];
            if(flow != null) {
                this.load(flow.id);
                $.mbStorage.set("lastFlow", flow.id);
            } else
                this.addFlow();
        });

        //Update Flow name
        this.events.on(EventType.updateFlowName, (e) => {
            this.drawer.drawBoardList();
            this.save(this.flow.id);
        });

        //Load Flow
        this.events.on(EventType.loadFlow, (e) => {
            this.flow.selectedBoardGroup = "all";
            this.drawer.updateFlowName();
            this.drawer.drawBoardList();
        });

        //Add Group
        this.events.on(EventType.addGroup, (e) => {
            this.flow.selectedBoardGroup = e.detail.groupName;
            this.save(this.flow.id);
            this.drawer.drawBoardList();
        });

        //Edit Group Name
        this.events.on(EventType.updateGroupName, (e) => {
            this.flow.selectedBoardGroup = e.detail.newName;
            this.save(this.flow.id);
            this.drawer.drawBoardList();
        });

        //Add Board
        this.events.on(EventType.addBoard, (e) => {
            this.save(this.flow.id);
            this.drawer.drawBoardList();
        });

        //Delete Board
        this.events.on(EventType.deleteBoard, (e) => {
            this.save(this.flow.id);
            this.drawer.drawBoardList();
            if(this.flow.boards.length > 0) {
	            let board = this.flow.boards[0];
	            this.flow.selectBoard(board._id);
            }
        });

        //Duplicated Board
        this.events.on(EventType.duplicatedBoard, (e) => {
            this.save(this.flow.id);
            this.drawer.drawBoardList();
        });

        //Select Board
        this.events.on(EventType.selectBoard, (e) => {
	        this.drawer.drawBoardList();
	        this.flow.selectedBoard.drawNodes();
        });

    }

    get flow() {
        return this._flow;
    }

    set flow(value) {
        this._flow = value;
    }

    get drawer() {
        return this._drawer;
    }

    get events() {
        return this._events;
    }

    get ui() {
        return this._ui;
    }

    get flows() {
        return this._flowsIds;
    }

    addFlow(name = "New Flow") {
        this.flow = new Flow(name);
        this._flowsIds.unshift({id: this.flow.id, name: this.flow.name});
        $.mbStorage.set("lastFlow", this.flow.id);
        let board = this.flow.addBoard("My Board");
        this.flow.selectBoard(board._id);
        this.save(this.flow.id);
        Events.register(EventType.addFlow, this.flow);
        return this.flow;
    }

    removeFlow(flowId) {
        this._flowsIds.forEach((f)=>{
            if(f.id === flowId) {
                this._flowsIds.delete(f);
                $.mbStorage.remove("flow_" + flowId);
            }
        });
        this.save(null);
        Events.register(EventType.removeFlow, this.flow);
    }

    save(id) {
        $.mbStorage.set("flows", this._flowsIds);
        if (id != null)
            $.mbStorage.set("flow_" + id, this.flow);
        Events.register(EventType.saveFlow, this.flow);
    }

    load(id) {
        let flow = $.mbStorage.get("flow_" + id);
        this.flow = new Flow(flow.name);
        for (const property in flow) {
            this.flow[property] = flow[property];
        }
        this.drawer.updateFlowName();

        Events.register(EventType.loadFlow, this.flow);
        return this.flow;
    }
}

export {FlowApp};
