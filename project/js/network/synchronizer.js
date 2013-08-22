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
    /**
     * @private
     * @type {Array.<{objectBuffer: ObjectBuffer, index: number}>}
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

network.Synchronizer.prototype.synchronize = function (data) {
    var obj, state;
    if (goog.isArray(data)) {
        throw new Error("not implemented");
    }
    else if (goog.isObject(data)) {
        if (this.mode_ === network.Synchronizer.Mode.WRITE) {
            obj = new network.ObjectBuffer();
            obj.id = data.getId();
            obj.type = data.getType();
            
            this.stack_[++this.top_] = {
                objectBuffer: obj,
                index: 0
            };
            
            data.synchronize(this);
            --this.top_;
            this.snapshot_.objects[data.getId()] = obj;
        } else {
            obj = this.snapshot_.objects[data.getId()];
            goog.asserts.assert(goog.isDefAndNotNull(obj));
            goog.asserts.assert(obj.type === data.getType());
            
            this.stack_[++this.top_] = {
                objectBuffer: obj,
                index: 0
            };
            data.synchronize(this);
            --this.top_;
        }
        return data;
    }
    else {
        if (this.mode_ === network.Synchronizer.Mode.WRITE) {
            state = this.stack_[this.top_];
            obj = state.objectBuffer;
            obj.data[state.index++] = data;
            return data;
        } else {
            state = this.stack_[this.top_];
            obj = state.objectBuffer;
            return obj.data[state.index++];
        }        
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
