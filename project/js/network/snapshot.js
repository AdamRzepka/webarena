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
goog.require('goog.asserts');

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
     * Class id for objects;
     * Type for arrays
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
network.ObjectBufferDelta = function () {
    /**
     * @public
     * @type {number}
     */
    this.id = -1;
    /**
     * @public
     * @type {number}
     * Class id for objects;
     * Type for arrays
     */
    this.classId = -1;
    /**
     * @public
     * @type {Array.<boolean>}
     * Whether field i has changed
     */
    this.changed = [];
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
     * @type {Array.<network.ObjectBufferDelta>}
     */
    this.objects = [];
    /**
     * @public
     * @type {Array.<network.ObjectBufferDelta>}
     */
    this.arrays = [];
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
 * @param {network.SnapshotDelta} delta
 * Generates delta from snapshots
 */
network.Snapshot.diff = function (snapshot1, snapshot2, delta) {
    var i = 0, j = 0, k = 0;
    var a, b, da, db;
    var objBuf;
    
    // objects
    var count = Math.max(snapshot1.objects.length, snapshot2.objects.length);
    delta.timestampA = snapshot1.timestamp;
    delta.timestampB = snapshot2.timestamp;
    for (i = 0; i < count; ++i) {
        a = snapshot1.objects[i];
        b = snapshot2.objects[i];
        if (goog.isDefAndNotNull(a) && goog.isDefAndNotNull(b)) {
            // if objects occurs in both snapshot count difference of all data
            goog.asserts.assert(a.id === b.id);
            goog.asserts.assert(a.classId === b.classId);
            objBuf = new network.ObjectBufferDelta();
            objBuf.id = a.id;
            objBuf.classId = a.classId;
            k = 0;
            for (j = 0; j < b.data.length; ++j) {
                da = a.data[j];
                db = b.data[j];
                goog.asserts.assert(goog.isDefAndNotNull(da));
                if (!network.Snapshot.equals_(db, da)) {
                    objBuf.data[k++] = db;
                    objBuf.changed[j] = true;
                } else {
                    objBuf.changed[j] = false;
                }
            }
            delta.objects[objBuf.id] = (objBuf.data.length > 0 ? objBuf : null);
        } else if (!goog.isDefAndNotNull(a) && goog.isDefAndNotNull(b)) {
            delta.objects[b.id] = network.ObjectBufferDelta.fromObjectBuffer_(b);
        } else if (goog.isDefAndNotNull(a) && !goog.isDefAndNotNull(b) ) {
            delta.removedObjects.push(a.id);
            delta.objects[a.id] = null;
        }
    }

    // arrays
    count = Math.max(snapshot1.arrays.length, snapshot2.arrays.length);
    for (i = 0; i < count; ++i) {
        a = snapshot1.arrays[i];
        b = snapshot2.arrays[i];
        if (goog.isDefAndNotNull(a) && goog.isDefAndNotNull(b)) {
            goog.asserts.assert(a.id === b.id);
            goog.asserts.assert(a.classId === b.classId);
            objBuf = new network.ObjectBufferDelta();
            objBuf.id = a.id;
            objBuf.classId = a.classId;
            k = 0;
            for (j = 0; j < b.data.length; ++j) {
                da = a.data[j];
                db = b.data[j];
                if (!network.Snapshot.equals_(db, da)) {
                    objBuf.data[k++] = db;
                    objBuf.changed[j] = true;
                } else {
                    objBuf.changed[j] = false;
                }
            }
            delta.arrays[objBuf.id] = (objBuf.data.length > 0 ? objBuf : null);
        } else if (!goog.isDefAndNotNull(a) && goog.isDefAndNotNull(b)) {
            delta.arrays[b.id] = network.ObjectBufferDelta.fromObjectBuffer_(b);
        } else if (goog.isDefAndNotNull(a) && !goog.isDefAndNotNull(b) ) {
            delta.removedArrays.push(a.id);
        }
    }
};

/**
 * @param {network.Snapshot} snapshot1
 * @param {network.SnapshotDelta} delta
 * @param {network.Snapshot} snapshot2
 * Progress snapshot1 by delta, creating snapshot2
 */
network.Snapshot.sum = function (snapshot1, delta, snapshot2) {
    var i = 0, j = 0, k = 0;
    var a, b, da, db;
    var objBuf;
    var count = Math.max(snapshot1.objects.length, delta.objects.length);
    goog.asserts.assert(snapshot1.timestamp === delta.timestampA);
    snapshot2.timestamp = delta.timestampB;

    // objects
    for (i = 0; i < count; ++i) {
        a = snapshot1.objects[i];
        b = delta.objects[i];
        if (goog.isDefAndNotNull(a) && goog.isDefAndNotNull(b)) {
            goog.asserts.assert(a.id === b.id);
            goog.asserts.assert(a.classId === b.classId);
            objBuf = new network.ObjectBuffer();
            objBuf.id = a.id;
            objBuf.classId = a.classId;
            k = 0;
            for (j = 0; j < b.changed.length; ++j) {
                da = a.data[j];
                if (b.changed[j]) {
                    objBuf.data[j] = b.data[k++];
                } else {
                    objBuf.data[j] = a.data[j];
                }
            }
            snapshot2.objects[objBuf.id] = objBuf;
        } else if (!goog.isDefAndNotNull(a) && goog.isDefAndNotNull(b)) {
            snapshot2.objects[b.id] = network.ObjectBufferDelta.toObjectBuffer_(b);
        } else if (goog.isDefAndNotNull(a) && !goog.isDefAndNotNull(b) ) {
            if (delta.removedObjects.indexOf(a.id) !== -1) {
                snapshot2.objects[a.id] = null;
            } else {                 // if it wasn't removed, just assume it haven't changed
                snapshot2.objects[a.id] = a; // !!! without clonning, should be working for now
            }
        }
    }
    
    // // new objects
    // count = delta.addedObjects.length;
    // for (i = 0; i < count; ++i) {
    //     snapshot2.objects[delta.addedObjects[i].id] = delta.addedObjects[i];
    // }

    // arrays
    count = Math.max(snapshot1.arrays.length,delta.arrays.length);
    for (i = 0; i < count; ++i) {
        a = snapshot1.arrays[i];
        b = delta.arrays[i];
        if (goog.isDefAndNotNull(a) && goog.isDefAndNotNull(b)) {
            goog.asserts.assert(a.id === b.id);
            goog.asserts.assert(a.classId === b.classId);
            objBuf = new network.ObjectBuffer();
            objBuf.id = a.id;
            objBuf.classId = a.classId;
            k = 0;
            for (j = 0; j < b.changed.length; ++j) {
                if (b.changed[j]) {
                    objBuf.data[j] = b.data[k++];
                } else {
                    objBuf.data[j] = a.data[j];
                }
            }
            snapshot2.arrays[objBuf.id] = objBuf;
        } else if (!goog.isDefAndNotNull(a) && goog.isDefAndNotNull(b)) {
            snapshot2.arrays[b.id] = network.ObjectBufferDelta.toObjectBuffer_(b);
        } else if (goog.isDefAndNotNull(a) && !goog.isDefAndNotNull(b) ) {
            if (delta.removedObjects.indexOf(a.id) !== -1) { // removed or just unchanged?
                snapshot2.arrays[a.id] = null;
            } else {
                snapshot2.arrays[a.id] = a;
            }            
        }
    }
};

/**
 * @private
 * Primitives comparison
 */
network.Snapshot.equals_ = function(a, b) {
    var i = 0;
    var len;

    if (a !== b) {
        return false;
    }
    
    if (a.constructor === Float32Array) {
        if (a.length !== b.length) {
            return false;
        }
        for (i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
    }
    return true;
};

/**
 * @private
 * @param {network.ObjectBuffer} objBuffer
 * @return {network.ObjectBufferDelta}
 */
network.ObjectBufferDelta.fromObjectBuffer_ = function (objBuffer) {
    var delta = new network.ObjectBufferDelta();
    delta.id = objBuffer.id;
    delta.classId = objBuffer.classId;
    delta.data = objBuffer.data; // shallow copy
    delta.changed = goog.array.repeat(true, objBuffer.data.length);
    return delta;
};

/**
 * @private
 * @param {network.ObjectBufferDelta} delta
 * @return {network.ObjectBuffer}
 */
network.ObjectBufferDelta.toObjectBuffer_ = function (delta) {
    var objBuffer = new network.ObjectBuffer();
    objBuffer.id = delta.id;
    objBuffer.classId = delta.classId;
    objBuffer.data = delta.data;
    return objBuffer;
};
