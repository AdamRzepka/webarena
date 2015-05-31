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
goog.require('base.InputState');

goog.provide('game.InputBuffer');

/**
 * @constructor
 */
game.InputBuffer = function () {
    /**
     * @private
     * @type {base.InputState}
     */
    this.prevState_ = new base.InputState();
    /**
     * @private
     * @type {base.InputState}
     */
    this.state_ = new base.InputState();
};

/**
 * @public
 * Call this at the beginning of each game step.
 */
game.InputBuffer.prototype.step = function (newState) {
    // var i = 0;
    // this.prevState_.cursorX = this.state_.cursorX;
    // this.prevState_.cursorY = this.state_.cursorY;
    // for (i = 0; i < this.state_.actions.length; ++i) {
    //     this.prevState_.actions[i] = this.state_.actions[i];
    // }
    this.prevState_ = this.state_;
    this.state_ = newState;
};

/**
 * @public
 * @param {base.InputState.Action} action
 * @return {boolean}
 */
game.InputBuffer.prototype.getAction = function (action) {
    return this.state_.actions[action];
};

/**
 * @public
 * @param {base.InputState.Action} action
 * @return {boolean}
 */
game.InputBuffer.prototype.hasActionStarted = function (action) {
    return (this.state_.actions[action] && !this.prevState_.actions[action]);
};

/**
 * @public
 * @return {number}
 */
game.InputBuffer.prototype.getX = function () {
    return this.state_.cursorX;
};

/**
 * @public
 * @return {number}
 */
game.InputBuffer.prototype.getY = function () {
    return this.state_.cursorY;
};

/**
 * @public
 * @return {number}
 */
game.InputBuffer.prototype.getDeltaX = function () {
    return this.state_.cursorX - this.prevState_.cursorX;
};

/**
 * @public
 * @return {number}
 */
game.InputBuffer.prototype.getDeltaY = function () {
    return this.state_.cursorY - this.prevState_.cursorY;
};

/**
 * @public
 * @return {base.InputState}
 */
game.InputBuffer.prototype.getState = function () {
    return this.state_;
};

