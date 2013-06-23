/**
 * Copyright (C) 2013 Adam Rzepka
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

goog.require('goog.array');
goog.require('base.IInputHandler');
goog.require('game.InputState');

goog.provide('game.InputHandler');

/**
 * @constructor
 * @implements {base.IInputHandler}
 */
game.InputHandler = function () {
    /**
     * @private
     * @type {game.InputState}
     */
    this.currentState_ = new game.InputState();
    /**
     * @private
     * @type {game.InputState}
     */
    this.nextState_ = new game.InputState();
};

/**
 * @public
 * @param {number} key
 * Called by DOM event handler
 */
game.InputHandler.prototype.onKeyUp = function (key) {
    var action = game.InputHandler.MAP[key];
    this.nextState_.actions[action] = false;
};

base.makeUnremovable(game.InputHandler.prototype.onKeyUp);

/**
 * @public
 * @param {number} key
 * Called by DOM event handler
 */
game.InputHandler.prototype.onKeyDown = function (key) {
    var action = game.InputHandler.MAP[key];
    this.nextState_.actions[action] = true;
};

base.makeUnremovable(game.InputHandler.prototype.onKeyDown);

/**
 * @public
 * @param {number} dx
 * @param {number} dy
 * Called by DOM event handler
 */
game.InputHandler.prototype.onMouseMove = function (dx, dy) {
    this.nextState_.cursorX += dx;
    this.nextState_.cursorY += dy;
};
base.makeUnremovable(game.InputHandler.prototype.onMouseMove);

/**
 * @public
 * Call it at the beginning of game update
 */
game.InputHandler.prototype.step = function () {
    var i = 0, count = this.currentState_.actions.length;
    
    this.currentState_ = this.nextState_;
    this.nextState_ = new game.InputState();
    this.nextState_.cursorX = this.currentState_.cursorX;
    this.nextState_.cursorY = this.currentState_.cursorY;

    for (i = 0; i < count; ++i) {
        this.nextState_.actions[i] = this.currentState_.actions[i];
    }
};

/**
 * @public
 * @return {game.InputState}
 */
game.InputHandler.prototype.getState = function () {
    return this.currentState_;
};

game.InputHandler.MAX_KEY = 256;

game.InputHandler.MAP = goog.array.repeat(game.InputState.Action.SIZE,
                                         game.InputHandler.MAX_KEY);
game.InputHandler.MAP[0] = game.InputState.Action.FIRE; //LMB
game.InputHandler.MAP[16] = game.InputState.Action.WALK; //SHIFT
game.InputHandler.MAP[32] = game.InputState.Action.JUMP; //SPACE
game.InputHandler.MAP[67] = game.InputState.Action.CROUCH; //C
game.InputHandler.MAP[87] = game.InputState.Action.UP; //W
game.InputHandler.MAP[83] = game.InputState.Action.DOWN; //S
game.InputHandler.MAP[65] = game.InputState.Action.LEFT; //A
game.InputHandler.MAP[68] = game.InputState.Action.RIGHT; //D
game.InputHandler.MAP[49] = game.InputState.Action.CHANGING; //1
game.InputHandler.MAP[50] = game.InputState.Action.KILL; //2
game.InputHandler.MAP[51] = game.InputState.Action.RESPAWN; //3

