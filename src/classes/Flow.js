/**
 *
 * Description:
 * Flow Model
 **/
import {Util} from "./Util.js";
import {Board} from "./Board.js";

class Flow {
    get selectedBoard() {
        return this._selectedBoard;
    }

    set selectedBoard(value) {
        this._selectedBoard = value;
    }

    constructor(name) {
        this._id = Util.setUID();
        this._name = name;
        this._boards = [];
        this._selectedBoard = null;
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

    getBoardById(id){
        this.boards.forEach((board)=>{
            if (board.id === id)
                return board;
        });
        return null;
    }

    addBoard(name){
        let board = new Board(name);
        this.boards.push(board);
        this.selectedBoard = board;
    }

    deleteBoard(boardId){
        let board = this.getBoardById(boardId);
        if (board != null)
            this.boards.delete(board);
    }

    save(){
        return JSON.stringify(this);
    }
    
    load (){

    }


}

export {Flow};
