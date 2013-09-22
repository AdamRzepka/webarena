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
goog.require('network.ISynchronizer');

goog.provide('network.ISynchronizable');
goog.provide('network.Synchronizer');

/*
 * Simple, yet quite powerful serialization API.
 * Assumptions:
 * - serialized class must implement ISynchronizable interface,
 * - type and object ids must be unique and should be continuous
 *   and kept as low as possible (they serve as an array indices),
 * - arrays mustn't be shared between objects and must hold
 *   values of single type,
 * - for now shared objects are not recognized (but this can be fixed easly).
 */

/**
 * @constructor
 * @implements {network.ISynchronizer}
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
 * @public
 * @param {*} data
 */
network.Synchronizer.prototype.synchronize = function (data) {
    var state, obj;
    if (goog.isArray(data)) {
        return this.synchronizeArray_((/**@type{Array.<*>}*/data));
    }
    else if (typeof data === 'object') {
        return this.synchronizeObject_((/**@type{network.ISynchronizable}*/data));
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
 * @param {function(): network.ISynchronizable} constructorFun
 */
network.Synchronizer.registerConstructor = function (typeId, constructorFun) {
    goog.asserts.assert(!goog.isDefAndNotNull(network.Synchronizer.constructors_[typeId]));
    network.Synchronizer.constructors_[typeId] = constructorFun;
};

/**
 * @public
 * @param {number} typeId
 * @param {function(network.ISynchronizable)} destructorFun
 */
network.Synchronizer.registerDestructor = function (typeId, destructorFun) {
    goog.asserts.assert(!goog.isDefAndNotNull(network.Synchronizer.destructors_[typeId]));
    network.Synchronizer.destructors_[typeId] = destructorFun;
};


/**
 * @private
 * @type {Array.<function(): network.ISynchronizable>}
 */
network.Synchronizer.constructors_ = [];

/**
 * @private
 * @type {Array.<function(network.ISynchronizable)>}
 */
network.Synchronizer.destructors_ = [];

/**
 * @private
 * @param {number} typeId
 * @param {number} id
 * @return {network.ISynchronizable}
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
 * @param {number} typeId
 * @param {network.ISynchronizable} obj
 */
network.Synchronizer.destroyObject_ = function (typeId, obj) {
    var destructor = network.Synchronizer.destructors_[typeId];
    if (goog.isDefAndNotNull(destructor)) {
        destructor(obj);
    }
};


/**
 * @private
 * @param {Array.<*>} array
 */
network.Synchronizer.prototype.synchronizeArray_ = function (array) {
    var id, i, size, obj;
    var childBuffer;
    var state = this.stack_[this.top_];
    var parentBuffer = state.objectBuffer;

    if (this.modeWriting_) {
        parentBuffer.data[state.index++] = this.snapshot_.arrays.length;
        childBuffer = new network.ObjectBuffer();
        childBuffer.size = array.length;
        this.snapshot_.arrays.push(childBuffer);

        this.stack_[++this.top_] = {
            objectBuffer: childBuffer,
            index: 0
        };
        
        for (i = 0; i < array.length; ++i) {
            this.synchronize(array[i]);
        }
        --this.top_;
    } else {
        id = parentBuffer.data[state.index++];
        childBuffer = this.snapshot_.arrays[id];
        goog.asserts.assert(goog.isDefAndNotNull(childBuffer));

        this.stack_[++this.top_] = {
            objectBuffer: childBuffer,
            index: 0
        };
        size = childBuffer.data.length;
        for (i = 0; i < size; ++i) {
            array[i] = this.synchronize(array[i]);
        }
        for (i = size; i < array.length; ++i) {
            obj = array[i];
            if (typeof obj === 'object')
                network.Synchronizer.destroyObject_(
                    obj.getType(),
                    (/**@type{network.ISynchronizable}*/obj));
        }
        array.length = size;
        --this.top_;
    }        
    
    return array;    
};

/**
 * @private
 * @param {network.ISynchronizable} obj
 */
network.Synchronizer.prototype.synchronizeObject_ = function (obj) {
    var childBuffer;
    var state = this.stack_[this.top_];
    var parentBuffer = state.objectBuffer;
    var id;

    if (this.modeWriting_) {
        if (!goog.isDefAndNotNull(obj)) {
            parentBuffer.data[state.index++] = -1;
            return obj;
        } 
        parentBuffer.data[state.index++] = obj.getId();
        
        childBuffer = new network.ObjectBuffer();
        childBuffer.id = obj.getId();
        childBuffer.type = obj.getType();
        
        this.snapshot_.objects[obj.getId()] = childBuffer;
    } else {
        id = /**@type{number}*/parentBuffer.data[state.index++];
        childBuffer = this.snapshot_.objects[id];
        if (!goog.isDefAndNotNull(childBuffer)) {
            network.Synchronizer.destroyObject_(obj.getType(), obj);
            return null;
        }
        if (goog.isDefAndNotNull(obj)) {
            goog.asserts.assert(obj.getId() === id);
        }
        else {
            obj = network.Synchronizer.createObject_(childBuffer.type, id);
        }
    }        
    goog.asserts.assert(childBuffer.type === obj.getType());
    
    this.stack_[++this.top_] = {
        objectBuffer: childBuffer,
        index: 0
    };
    
    obj.synchronize(this);
    --this.top_;
    
    return obj;    
};

/**
 * @private
 * @param {*} data
 */
network.Synchronizer.prototype.synchronizePrimitive_ = function (data) {
    var state = this.stack_[this.top_];
    var buffer = state.objectBuffer;
    if (this.modeWriting_) {
        buffer.data[state.index++] = data;
        return data;
    } else {
        return buffer.data[state.index++];
    }  
};
