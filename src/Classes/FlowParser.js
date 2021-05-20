/**
 *
 * Description:
 *
 **/
import {Events, EventType} from "./Events.js";

export class FlowParser {
    constructor(sourceURL = null) {
        this._events = new Events();
        this._sourceURL = sourceURL;
        this._source = null;
        this._dataError = false;
        this._ready = false;

        this._selectedBoard = null;
        this._selectedNode = null;

        this.initEvents();

        this.load()


    }

    initEvents() {

        //Source Loaded
        this._events.on(EventType.sourceLoaded, (e) => {
            this._ready = true;
        });
    }


    load() {
        let that = this;
        if (this._sourceURL) {
            fetch(that._sourceURL).then(response => {
                if (!response.ok) {
                    throw new Error("HTTP error " + response.status);
                }
                //flow._source = response.json();
            }).then(flow => {
                that._source = flow;
                Events.register(EventType.sourceLoaded, flow)
            })
                .catch(function () {
                    that._dataError = true;
                })
        } else {

        }

    }
}
