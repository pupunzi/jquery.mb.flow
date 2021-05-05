/**
 *
 * Description:
 *
 **/
import {Flow} from "./Flow.js";
import {UI} from "./UI.js";
import {Events, EventType} from "./Events.js";
import {Drawer} from "./Drawer.js";

class FlowApp {

    constructor() {
        this._date = new Date().getTime();
        this._ui = new UI();
        this._events = new Events();
        this._flowsIds = $.mbStorage.get("flows") || [];
        this._flow = null;
        this._drawer = new Drawer(this);

        this.initEvents();

    }

    initEvents(){

        //Add Flow
        this.events.on(EventType.addFlow, (e) => {
            this.drawer.updateFlowName();
            this.drawer.drawBoardList();
        });

        //Remove Flow
        this.events.on(EventType.deleteFlow, (e) => {
            let flow = this.flows[0];
            if (flow != null) {
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
            for (const property in this.flow._variables) {
                this.flow._variables[property] = null;
                console.log(`${property}: ${this.flow._variables[property]}`);
            }

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
            if (this.flow.boards.length > 0) {
                let board = this.flow.boards[0];
                this.flow.selectBoard(board._id);
            }
            this.save(this.flow.id);
            this.drawer.drawBoardList();
        });

        //Duplicated Board
        this.events.on(EventType.duplicatedBoard, (e) => {
            this.save(this.flow.id);
            this.drawer.drawBoardList();
        });

        //Select Board
        this.events.on(EventType.selectBoard, (e) => {
            this.drawer.drawBoardList();
            this.save(this.flow.id);
        });

        //Update Board
        this.events.on(EventType.updateBoard, (e) => {
            this.save(this.flow.id);
        });

        //Add Node
        this.events.on(EventType.addNode, (e) => {
            this.drawer.drawBoard();
            this.save(this.flow.id);
        });

        // Update Node
        this.events.on(EventType.updateNode, (e) => {
            this.save(this.flow.id);
        });

        //Delete Node
        this.events.on(EventType.deleteNode, (e) => {
            this.drawer.drawBoard();
            this.save(this.flow.id);
        });

        //Select Node
        this.events.on(EventType.selectNode, (e) => {
           // this.save(this.flow.id);
            //console.debug("selectNode", e.detail);
        });

        //Add Connection
        this.events.on(EventType.addConnection, (e) => {
            let connection = e.detail;
            let board = this.flow.getBoardById(this.flow._selectedBoardId);
            let node = board.getNodeById(connection._from);

            board._connections.push(connection);
            node._connections.push(connection);

            node._connections.forEach((c) => {
                if (c === connection)
                    return;

                if (c._from === connection._from && c._nodeElementId === connection._nodeElementId) {
                    if (c._connectionLine != null)
                        c._connectionLine.remove();
                    node._connections.delete(c);
                    board._connections.delete(c);
                }
            });

            if (!connection._to) {
                node._connections.delete(connection);
                board._connections.delete(connection);
            }

            let nodeElement = this.ui.placeholders.board;
            if (node._connections.length === 0) {
                $(nodeElement).find("#node_" + connection._from).attr("data-connections-count", 0);
            } else {
                $(nodeElement).find("#node_" + connection._from).attr("data-connections-count", node._connections.length);
                flowApp.drawer.drawConnection(connection);
            }


            this.save(this.flow.id);
        });

        //Delete Connection
        this.events.on(EventType.deleteConnection, (e) => {
            console.debug("deleteConnection", e.detail);
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

    deleteFlow(flowId) {
        this._flowsIds.forEach((f) => {
            if (f.id === flowId) {
                this._flowsIds.delete(f);
                $.mbStorage.remove("flow_" + flowId);
            }
        });
        this.save(null);
        Events.register(EventType.deleteFlow, this.flow);
    }

    save(id) {
        $.mbStorage.set("flows", this._flowsIds);
        if (id != null)
            $.mbStorage.set("flow_" + id, this.flow);

        //console.debug("FLOW", this.flow);
        Events.register(EventType.saveFlow, this.flow);
    }

    load(id) {
        let flow = $.mbStorage.get("flow_" + id);
        this.flow = new Flow(flow.name);
        for (const property in flow) {
            this.flow[property] = flow[property];
        }
        Events.register(EventType.loadFlow, this.flow);
        return this.flow;
    }
}

export {FlowApp};
