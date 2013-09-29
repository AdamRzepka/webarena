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
goog.provide('network.Snapshot');

/**
 * @constructor
 */
network.ObjectBuffer = function () {
    /**
     * @public
     * @type {number}
     */
    this.id = -1;
    /**
     * @public
     * @type {number}
     */
    this.classId = -1;
    /**
     * @public
     * @type {Array.<*>}
     * Holding object data (only primitive type or other object id)
     */
    this.data = [];
};

/**
 * @constructor
 */
network.Snapshot = function () {
    /**
     * @public
     * @type {number}
     */
    this.timestamp = 0;
    /**
     * @public
     * @type {Array.<network.ObjectBuffer>}
     */
    this.objects = [];
    /**
     * @public
     * @type {Array.<network.ObjectBuffer>}
     */
    this.arrays = [];
};

/**
 * @constructor
 */
network.SnapshotDelta = function () {
    /**
     * @public
     * @type {number}
     */
    this.timestampA = 0;
    /**
     * @public
     * @type {number}
     */
    this.timestampB = 0;
    /**
     * @public
     * @type {Array.<network.ObjectBuffer>}
     */
    this.objects = [];
    /**
     * @public
     * @type {Array.<network.ObjectBuffer>}
     */
    this.arrays = [];
    
    /**
     * @public
     * @type {Array.<network.ObjectBuffer>}
     */
    this.addedObjects = [];
    /**
     * @public
     * @type {Array.<number>}
     */
    this.removedObjects = [];
    /**
     * @public
     * @type {Array.<number>}
     */
    this.removedArrays = [];
};

/**
 * @param {network.Snapshot} snapshot1
 * @param {network.Snapshot} snapshot2
 * @param {network.SnapshotDelta} dalta
 */
network.Snapshot.diff = function (snapshot1, snapshot2, delta) {
    
};

/**
 * @param {network.Snapshot} snapshot1
 * @param {network.SnapshotDelta} dalta
 * @param {network.Snapshot} snapshot2
 */
network.Snapshot.sum = function (snapshot1, delta, snapshot2) {
};
