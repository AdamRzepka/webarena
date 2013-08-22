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

goog.require('goog.asserts');
goog.require('network.Snapshot');

goog.provide('network.Synchronizer');

/**
 * @constructor
 */
network.Synchronizer = function () {
    /**
     * @private
     * @type {network.Synchronizer.Mode}
     */
    this.mode_ = network.Synchronizer.Mode.WRITE;
    /**
     * @private
     * @type {network.Snapshot}
     */
    this.snapshot_ = null;
    this.data_ = null;
};

network.Synchronizer.prototype.synchronize = function (data) {
    if (this.mode_ === network.Synchronizer.Mode.WRITE) {
        this.data_ = data;
        return data;
    } else {
        return this.data_;
    }
};

/**
 * @public
 * @param {network.Synchronizer.Mode} mode
 * @param {network.Snapshot} [snapshot]
 */
network.Synchronizer.prototype.reset = function (mode, snapshot) {
    goog.asserts.assert((mode == network.Synchronizer.Mode.WRITE 
                        && !goog.isDefAndNotNull(snapshot))
                        || (mode == network.Synchronizer.Mode.READ
                        && goog.isDefAndNotNull(snapshot)));
    this.mode_ = mode;
    this.snapshot_ = snapshot || new network.Snapshot();
};

/**
 * @enum {number}
 */
network.Synchronizer.Mode = {
    WRITE: 0,
    READ: 1
};
