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

goog.require('base.IInputHandler');
goog.provide('game.InputBuffer');

/**
 * @constructor
 * @implements {base.IInputHandler}
 */
game.InputBuffer = function () {
    /**
     * @private
     * @type {Array.<boolean>}
     */
    this.actionState_ = [];
    /**
     * @private
     * @type {Array.<boolean>}
     */
    this.prevActionState_ = [];

    // cursor position is buffered
    /**
     * @private
     * @type {{dx: number, dy: number}}
     */
    this.cursor_ = {dx: 0, dy: 0};
    /**
     * @private
     * @type {{dx: number, dy: number}}
     */
    this.nextCursor_ = {dx: 0, dy: 0};
};

/**
 * @enum
 */
game.InputBuffer.Action = {
    FIRE: 0, // LMB
    WALK: 16, // shift
    JUMP: 32, // space
    CROUCH: 67, // C
    UP: 87, // W
    DOWN: 83, // S
    LEFT: 65, // A
    RIGHT: 68 // D
};

/**
 * @public
 * Call this at the beginning of each game step.
 */
game.InputBuffer.prototype.step = function () {
    this.cursor_.dx = this.nextCursor_.dx;
    this.cursor_.dy = this.nextCursor_.dy;
    this.nextCursor_.dx = this.nextCursor_.dy = 0;
};
/**
 * @public
 * @param {game.InputBuffer.Action} action
 * @return {boolean}
 */
game.InputBuffer.prototype.getAction = function (action) {
    return this.actionState_[action];
};
/**
 * @public
 * @param {game.InputBuffer.Action} action
 * @return {boolean}
 */
game.InputBuffer.prototype.hasActionStarted = function (action) {
    return (this.actionState_[action] && !this.prevActionState_[action]);
};
/**
 * @public
 * @return {{dx: number, dy: number}}
 */
game.InputBuffer.prototype.getCursor = function () {
    return this.cursor_;
};

/**
 * @public
 * @param {number} key
 * Called by DOM event handler
 */
game.InputBuffer.prototype.onKeyUp = function (key) {
    this.prevActionState_[key] = this.actionState_[key];
    this.actionState_[key] = false;
};

base.makeUnremovable(game.InputBuffer.prototype.onKeyUp);

/**
 * @public
 * @param {number} key
 * Called by DOM event handler
 */
game.InputBuffer.prototype.onKeyDown = function (key) {
    this.prevActionState_[key] = this.actionState_[key];
    this.actionState_[key] = true;
};

base.makeUnremovable(game.InputBuffer.prototype.onKeyDown);

/**
 * @public
 * @param {number} dx
 * @param {number} dy
 * Called by DOM event handler
 */
game.InputBuffer.prototype.onMouseMove = function (dx, dy) {
    this.nextCursor_.dx += dx;
    this.nextCursor_.dy += dy;
};
base.makeUnremovable(game.InputBuffer.prototype.onMouseMove);
