/**
 *
 * Description:
 * Flow Model
 **/
import {Util} from "./Util.js";
import {Board} from "./Board.js";
import {Events, EventType} from "./Events.js";

class Flow {

    constructor(name) {
        this._date = new Date().getTime();
        this._id = Util.setUID();
        this._name = name;
        this._boards = [];
        this._selectedBoard = null;
    }

    get selectedBoard() {
        return this._selectedBoard;
    }

    set selectedBoard(value) {
        this._selectedBoard = value;
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

    updateName(name){
        this._name = name.length === 0 ? this._name : name;
        Events.register(EventType.updateFlowName, this);
    }

    getBoardById(id) {
        let b = null;
        this._boards.forEach((board) => {
            if (id === board._id){
                b = board;
            }
        });

        return b;
    }

    addBoard(name) {
        let board = new Board(name, this.id);
        this.boards.unshift(board);
        this.selectBoard(board);
        Events.register(EventType.addBoard, board);

    }

    selectBoard(board) {
        this.selectedBoard = new Board();
        for (const property in board) {
            this.selectedBoard[property] = board[property];
        }
        Events.register(EventType.selectBoard, this.selectedBoard);

    }

    deleteBoard(boardId) {
        let board = this.getBoardById(boardId);
        if (board != null){
            this.boards.delete(board);
            Events.register(EventType.deleteBoard, {});
        }
    }
}

export {Flow};
