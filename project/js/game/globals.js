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

goog.provide('game.globals');

/**
 * @const
 * @type {number}
 */
game.globals.TIME_STEP = 1/60;
/**
 * @const
 * @type {number}
 */
game.globals.TIME_STEP_MS = game.globals.TIME_STEP * 1000;


/// debug stuff
/**
 * @type {boolean}
 */
game.globals.freeCamera = false;
/**
 * @type {boolean}
 */
game.globals.freeCameraControl = false;
/**
 * @type {boolean}
 */
game.globals.freeCameraView = false;

/**
 * @type {boolean}
 */
game.globals.tppMode = true;
/**
 * @type {function(boolean)|null}
 */
game.globals.onTppModeChange = null;
/**
 * @param {boolean} flag
 */
game.globals.setTppMode = function (flag) {
    game.globals.tppMode = flag;
    if (game.globals.onTppModeChange) {
        game.globals.onTppModeChange(flag);
    }
};


