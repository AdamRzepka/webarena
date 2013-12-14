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

goog.provide('base.InputState');

/**
 * @constructor
 */
base.InputState = function () {
    this.cursorX = 0;
    this.cursorY = 0;
    this.actions = goog.array.repeat(false, base.InputState.Action.SIZE);
};

/**
 * @enum {number}
 */
base.InputState.Action = {
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

base.InputState.serialize = function (state, dataView, offset) {
    var dv = dataView;
    var i = 0;
    var actions = 0;
    // packing actions into bit table
    for (i = 0; i < base.InputState.Action.SIZE; ++i) {
        actions |= (state.actions[i] << i); // branchless :P
    }
    
    dataView.setInt32(offset, state.cursorX, true);
    dataView.setInt32(offset + 4, state.cursorY, true);
    dataView.setUint16(offset + 8, actions, true);
    return offset + 10;
};

base.InputState.deserialize = function (state, dataView, offset) {
    var dv = dataView;
    var i = 0;
    var actions = 0;
    state.cursorX = dataView.getInt32(offset, true);
    state.cursorY = dataView.getInt32(offset + 4, true);
    actions = dataView.getUint16(offset + 8, true);

    for (i = 0; i < base.InputState.Action.SIZE; ++i) {
        state.actions[i] = (actions & (1 << i));
    }

    return offset + 10;
};

