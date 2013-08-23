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
 * @param {number} id
 */
network.ISynchronizable.prototype.setId = function (id) {};
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
    else if (typeof data === 'object') {
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
 * @public
 * @param {number} typeId
 * @param {function(number)} constructorFun
 */
network.Synchronizer.registerClass = function (typeId, constructorFun) {
    goog.asserts.assert(!goog.isDefAndNotNull(network.Synchronizer.constructors_[typeId]));
    network.Synchronizer.constructors_[typeId] = constructorFun;
};

/**
 * @private
 * @type {Array.<function(number)>}
 */
network.Synchronizer.constructors_ = [];

/**
 * @private
 * @param {number} typeId
 * @param {number} id
 * @return {Object}
 */
network.Synchronizer.createObject_ = function (typeId, id) {
    var constructor = network.Synchronizer.constructors_[typeId];
    goog.asserts.assert(goog.isDefAndNotNull(constructor));
    var obj = constructor();
    obj.setId(id);
    return obj;
};


/**
 * @private
 * @param {network.ISynchronizable} data
 */
network.Synchronizer.prototype.synchronizeObject_ = function (data) {
    var childObj;
    var state = this.stack_[this.top_];
    var parentObj = state.objectBuffer;
    var id;

    if (this.modeWriting_) {
        parentObj.data[state.index++] = data.getId();
        
        childObj = new network.ObjectBuffer();
        childObj.id = data.getId();
        childObj.type = data.getType();
        
        this.snapshot_.objects[data.getId()] = childObj;
    } else {
        id = parentObj.data[state.index++];
        childObj = this.snapshot_.objects[id];
        if (goog.isDefAndNotNull(data)) {
            goog.asserts.assert(data.getId() === id);
        }
        else {
            data = network.Synchronizer.createObject_(childObj.type, id);
        }
        goog.asserts.assert(goog.isDefAndNotNull(childObj));
        goog.asserts.assert(childObj.type === data.getType());
    }        
    
    this.stack_[++this.top_] = {
        objectBuffer: childObj,
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
