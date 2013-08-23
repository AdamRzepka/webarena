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

goog.provide('network.ISynchronizable');
goog.provide('network.Synchronizer');

/**
 * @constructor
 */
network.Synchronizer = function () {
    /**
     * @private
     * @type {boolean}
     */
    this.modeWriting_ = true;
    /**
     * @private
     * @type {network.Snapshot}
     */
    this.snapshot_ = null;
    /**
     * @private
     * @type {Array.<{objectBuffer: network.ObjectBuffer, index: number}>}
     * Stack used to traverse through objects structure
     */
    this.stack_ = [{
                objectBuffer: new network.ObjectBuffer(),
                index: 0
            }]; // start with dummy ObjectBuffer on stack
    /**
     * @private
     * @type {number}
     * Top of the stack
     */
    this.top_ = 0;
};

/**
 * @interface
 * A class must implement this to be synchronized.
 */
network.ISynchronizable = function () {};
/**
 * @return {number}
 */
network.ISynchronizable.prototype.getId = function () {};
/**
 * @return {number}
 */
network.ISynchronizable.prototype.getType = function () {};
/**
 * @param {network.Synchronizer} synchronizer
 */
network.ISynchronizable.prototype.synchronize = function (synchronizer) {};


/**
 * @public
 * @param {*} data
 */
network.Synchronizer.prototype.synchronize = function (data) {
    var state, obj;
    if (goog.isArray(data)) {
        throw new Error("not implemented");
    }
    else if (goog.isObject(data)) {
        return this.synchronizeObject_(data);
    }
    else {
        return this.synchronizePrimitive_(data);
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
    this.modeWriting_ = (mode == network.Synchronizer.Mode.WRITE);
    this.snapshot_ = snapshot || new network.Snapshot();
    this.stack_.legth = 1;
    this.stack_[0].index = 0;
    this.top_ = 0;
};

/**
 * @enum {number}
 */
network.Synchronizer.Mode = {
    WRITE: 0,
    READ: 1
};

/**
 * @private
 * @param {network.ISynchronizable} data
 */
network.Synchronizer.prototype.synchronizeObject_ = function (data) {
    var obj;
    if (this.modeWriting_) {
        obj = new network.ObjectBuffer();
        obj.id = data.getId();
        obj.type = data.getType();
        this.snapshot_.objects[data.getId()] = obj;
    } else {
        obj = this.snapshot_.objects[data.getId()];
        goog.asserts.assert(goog.isDefAndNotNull(obj));
        goog.asserts.assert(obj.type === data.getType());
    }        
    
    this.stack_[++this.top_] = {
        objectBuffer: obj,
        index: 0
    };
    
    data.synchronize(this);
    --this.top_;
    
    return data;    
};

/**
 * @private
 * @param {*} data
 */
network.Synchronizer.prototype.synchronizePrimitive_ = function (data) {
    var state = this.stack_[this.top_];
    var obj = state.objectBuffer;
    if (this.modeWriting_) {
        obj.data[state.index++] = data;
        return data;
    } else {
        return obj.data[state.index++];
    }  
};
