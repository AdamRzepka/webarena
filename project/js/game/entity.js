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

goog.require('base.Vec3');

goog.provide('game.Entity');

/**
 * @constructor
 * @param {game.Entity.Type} type
 * @param {game.Entity.State} state
 */
game.Entity = function (type, state) {
    /**
     * @public
     * @type {game.Entity.Type}
     */
    this.type = type;
    /**
     * @public
     * @type {game.Entity.State}
     */
    this.state = state;
};

/**
 * @enum {number}
 */
game.Entity.Type = {
    PLAYER: 0,
    WEAPON: 1,
    PROJECTILE: 2,
    ITEM: 3,
    SIZE: 4
};

game.Entity.prototype.update = function (dt) {
};

/**
 * @constructor
 */
game.Entity.State = function () {
    this.id = -1;
    this.position = base.Vec3.createVal(0, 0, 0);
};

game.Entity.State.prototype.synchronize = function (buffer) {
    this.id = buffer.synchronize(this.id, 0);
};

