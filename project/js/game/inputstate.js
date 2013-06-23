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

goog.provide('game.InputState');

/**
 * @constructor
 */
game.InputState = function () {
    this.actions = goog.array.repeat(false, game.InputState.Action.SIZE);
    this.cursorX = 0;
    this.cursorY = 0;
};

/**
 * @enum {number}
 */
game.InputState.Action = {
    FIRE: 0,
    WALK: 1,
    JUMP: 2,
    CROUCH: 3,
    UP: 4,
    DOWN: 5,
    LEFT: 6,
    RIGHT: 7,
    CHANGING: 8,
    KILL: 9,
    RESPAWN: 10,
    SIZE: 11
};
