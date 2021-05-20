/**
 *
 * Description:
 *  Flow Parser library
 **/
;
$.flowApp = $.flow || {};

$.flow.parser = {

	source: null,
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
