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

goog.provide('network.ObjectBuffer');

/**
 * @constructor
 */
network.ObjectBuffer = function (mode) {
    /**
     * @private
     * @type {number}
     */
    this.id = -1;
    /**
     * @private
     * @type {number}
     */
    this.type = -1;
    /**
     * @private
     * @type {Array.<*>}
     * Holding object data (only primitive type or other object id)
     */
    this.data = [];
};
