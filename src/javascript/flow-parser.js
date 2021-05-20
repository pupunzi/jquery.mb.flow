/**
 *
 * Description:
 *  Flow Parser library
 **/
import {FlowParser} from "../Classes/FlowParser";

;
$.flowApp = $.flow || {};

$.flow.parser = {
	source: new FlowParser("url/to/json"),
	boards: [],

	selectedBoardId: null,
	selectedNodeId : null,

	node: {
		get    : (nodeId) => {
		},
		getNext: () => {
		},

		getPrev: () => {
		},

		goTo:(nodeId)=>{

		},

		goToNext: ()=>{

		},

		goToPrev: ()=>{

		},

		getType: (nodeId = null) => {

		},

		evalVariables: (string) => {

		},

		getActor: (nodeId = null) => {

		}
	},

	start: () => {}
	
};
