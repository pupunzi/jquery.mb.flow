/**
 *
 * Description:
 *  Flow Parser library
 **/
import {FlowParser} from "./Classes/FlowParser.js";

;

$.flowApp = $.flow || {};

// ████ FLOW    ████████████████████████████████████████████████████████████████████████████████████████████████████████
// ███ PARSER ██████████████████████████████████████████████████████████████████████████████████████████████████████████
// ██████    PUPUNZI     ███████████████████████████████████████████████████████████████████████████████████████████████

$.flow.parser = {
	source: null,
	boards: [],

	selectedBoardId: null,
	selectedNodeId : null,

	load: (sourceURL = null)=>{
		$.flow.source = new FlowParser(sourceURL);
	},

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
