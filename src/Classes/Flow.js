/**
 *
 * Description:
 * Flow Model
 **/
import {Util} from "./Util.js";
import {Board} from "./Board.js";
import {Events, EventType} from "./Events.js";
import {Actor} from "./Actor.js";
import {Locale} from "./Locale.js";
import {Avatar} from "./Actor.js";
import {AvatarDrawer} from "./AvatarDrawer.js";

export class Flow {
	constructor(name) {
		this._id = Util.setUID();
		this._date = new Date().getTime();
		this._name = name;

		this._mainLocale = new Locale("EN", "English");
		this._locale = this._mainLocale._code;
		this._availableLocale = [this._mainLocale];

		this._boards = [];
		this._selectedBoardId = null;
		this._flowGroups = [];
		this._selectedBoardGroup = null;

		this._variables = {};

		this._actors = [new Actor("New Actor")];
		this._defaultActor = this.getDefaultActor();
		this._nullActor = new Actor("<span style='color:red'>No Actor!!!</span>", {eyes: null, clothing: null, hair: null, hairColor: null});
	}

	get variables() {
		return this._variables;
	}
	get actors() {
		
		return this._actors;
	}
	get date() {
		return this._date;
	}
	get selectedBoardGroup() {
		return this._selectedBoardGroup;
	}
	set selectedBoardGroup(value) {
		this._selectedBoardGroup = value;
	}
	get fowGroups() {
		return this._flowGroups;
	}
	get selectedBoardId() {
		return this._selectedBoardId;
	}
	set selectedBoardId(value) {
		this._selectedBoardId = value;
	}
	get boards() {
		return this._boards;
	}
	get name() {
		return this._name;
	}
	set name(value) {
		this._name = value;
	}
	get id() {
		return this._id;
	}

	// ███████ Flow ███████████████████████████████████████████

	updateName(name) {
		this._name = name.length === 0 ? this._name : name;
		Events.register(EventType.updateFlowName, this);
	}

	// ███████ Board ███████████████████████████████████████████
	getBoardById(id) {
		let b = null;
		let idx = 0;
		this._boards.forEach((board) => {
			let tempBoard = new Board();
			for (const property in board) {
				tempBoard[property] = board[property];
			}
			this._boards[idx] = tempBoard;
			if (id === this._boards[idx]._id) {
				b = this._boards[idx];
			}
			idx++;
		});
		return b;
	}
	addBoard(name, groupName = "Main Group") {
		let board = new Board(name, groupName, this.id);
		this.selectedBoardGroup = groupName;
		this.boards.unshift(board);
		this.selectBoard(board._id);
		Events.register(EventType.addBoard, board);
		return board;
	}
	duplicateBoard(boardId) {
		let board = this.getBoardById(boardId);
		let copy = Object.assign({}, board);
		copy._id = Util.setUID();
		copy._name = board._name + " (copy)";
		this.boards.unshift(copy);
		this.selectBoard(copy._id);
		Events.register(EventType.duplicatedBoard, board);
	}
	deleteBoard(boardId) {
		let board = this.getBoardById(boardId);
		if (board != null) {
			for (let i = 0; i < this.boards.length; i++) {
				if (this.boards[i]._id === board._id) {
					this.boards.splice(i, 1);
					i--;
				}
			}
			Events.register(EventType.deleteBoard, {});
		} else {
			alert("No Board found")
		}
	}

	//███████ Groups ███████████████████████████████████████████

	addGroup(groupName) {
		this.addBoard("New Board", groupName);
		this._flowGroups.push(groupName);
		this.selectedBoardGroup = groupName;
		Events.register(EventType.addGroup, {groupName: groupName});
	}
	updateGroupName(oldName, newName) {
		this.boards.forEach((board) => {
			if (board._group === oldName) {
				board._group = newName;
			}
		});
		Events.register(EventType.updateGroupName, {newName: newName});
	}
	moveBoardToGroup(boardId, groupName) {
		let board = this.getBoardById(boardId);
		console.debug("Board", board._name)
		board._group = groupName;
	}
	selectBoard(boardId) {

		if(this.selectedBoardId === boardId)
			return;

		this.selectedBoardId = boardId;
		Events.register(EventType.selectBoard, this.selectedBoardId);
	}
	getBoardsByGroup() {
		let list = [];
		this.boards.forEach((board) => {
			//console.debug(board._group);
			if (list.indexOf(board._group) < 0)
				list.push(board._group);
		});
		return list;
	}

	// ███████ Locale ███████████████████████████████████████████

	addLocale(locale, description) {
		this._availableLocale.push(new Locale(locale, description))
	}
	deleteLocale(code) {
		this._availableLocale.forEach((locale) => {
			if (locale._code === code)
				this._availableLocale.delete(locale);
		})
	}

	// ███████ Actor ███████████████████████████████████████████

	getActorById(actorId) {
		let a = null;
		this._actors.forEach((actor) => {
			if (actor._id === actorId)
				a = actor;
		});
		return a;
	}
	getDefaultActor() {
		console.debug(this._actors);
		return this._actors[0]
	}
	addActor() {
		let actor = new Actor(null, new Avatar(AvatarDrawer.randomOptions()), Util.randomColor());
		this._actors.unshift(actor);
		window.flowApp.save(this._id);
		return actor._id;
	}
	deleteActor(actorId) {

		let actor = this.getActorById(actorId);
		let flow = this;
		flow.boards.forEach((board) => {
			board._nodes.forEach((node) => {
				if (node._actorId === actorId) {
					console.debug("flow._nullActor", flow._nullActor);
					node._actorId = flow._nullActor._id
				}
			})
		});
		flow._actors.delete(actor);
		window.flowApp.save(this._id);
	}
}


