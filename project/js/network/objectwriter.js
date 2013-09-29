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
goog.require('network.public');
goog.require('network.Snapshot');
goog.require('network.ClassInfo');
goog.require('network.ClassInfoManager');

goog.provide('network.ObjectWriter');

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
network.ObjectWriter = function (classInfoManager) {
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
    /**
     * @private
     * @type {network.ClassInfoManager}
     */
    this.classInfoManager_ = classInfoManager;

};

/**
 * @public
 * @param {*} data
 * @param {network.Type} type
 * @param {number} flags
 */
network.ObjectWriter.prototype.synchronize = function (data, type, flags) {
    var state = this.stack_[this.top_];
    var objBuffer = state.objectBuffer;
    var ci = this.classInfoManager_.getClassInfo(objBuffer.classId);

    flags = flags || 0;

    goog.asserts.assert(type === ci.types[state.index]);
    goog.asserts.assert(flags === ci.flags[state.index]);
    
    return this.write_(data, type, flags);
};

/**
 * @public
 * @param {network.ISynchronizable} scene
 * @param {network.Snapshot} snapshot
 */
network.ObjectWriter.prototype.writeScene = function (scene, snapshot) {
    this.snapshot_ = snapshot;
    this.stack_.legth = 1;
    this.stack_[0].index = 0;
    this.stack_[0].objectBuffer.data[0] = 0;
    this.top_ = 0;

    this.writeObject_(scene);
};

/**
 * @public
 * @return {network.ISynchronizer.Mode}
 */
network.ObjectWriter.prototype.getMode = function () {
    return network.ISynchronizer.Mode.WRITE;
};

/**
 * @private
 * @param {number} classId
 * @param {number} id
 * @return {network.ISynchronizable}
 */
network.ObjectWriter.prototype.createObject_ = function (classId, id) {
    var ci = this.classInfoManager_.getClassInfo(classId);
    var constructor = ci.factoryFunction;
    
    goog.asserts.assert(goog.isDefAndNotNull(constructor));
    var obj = constructor();
    obj.__networkObjectId__ = id;
    return obj;
};

/**
 * @private
 * @param {number} classId
 * @param {network.ISynchronizable} obj
 */
network.ObjectWriter.prototype.destroyObject_ = function (classId, obj) {
    var ci = this.classInfoManager_.getClassInfo(classId);
    var destructor = ci.destroyCallback;
    goog.asserts.assert(goog.isDefAndNotNull(destructor));
    destructor(obj);
};

/**
 * @private
 * @param {*} data
 * @param {network.Type} type
 * @param {number} flags
 */
network.ObjectWriter.prototype.write_ = function (data, type, flags) {
    if (flags & network.Flags.ARRAY) {
        goog.asserts.assert(goog.isArray(data));
        return this.writeArray_((/**@type{Array.<*>}*/data), type, flags);
    }
    else if (type === network.Type.OBJECT) {
        goog.asserts.assert(typeof data === 'object' || data === undefined);
        return this.writeObject_((/**@type{network.ISynchronizable}*/data));
    }
    else {
        return this.writePrimitive_(data);
    }
};

/**
 * @private
 * @param {Array.<*>} array
 */
network.ObjectWriter.prototype.writeArray_ = function (array, type, flags) {
    var id, i, size, obj;
    var childBuffer;
    var state = this.stack_[this.top_];
    var parentBuffer = state.objectBuffer;

    id = parentBuffer.data[state.index++];
    childBuffer = this.snapshot_.arrays[id];
    goog.asserts.assert(goog.isDefAndNotNull(childBuffer));

    this.stack_[++this.top_] = {
        objectBuffer: childBuffer,
        index: 0
    };
    size = childBuffer.data.length;
    
    flags &= ~network.Flags.ARRAY;
    for (i = 0; i < size; ++i) {
        array[i] = this.write_(array[i], type, flags);
    }
    if (type === network.Type.OBJECT) {
        for (i = size; i < array.length; ++i) {
            obj = array[i];
            if (goog.isDefAndNotNull(obj))
                this.destroyObject_(
                    obj.__networkClassId__,
                    (/**@type{network.ISynchronizable}*/obj));
        }
    }
    array.length = size;
    --this.top_;
    
    return array;    
};

/**
 * @private
 * @param {network.ISynchronizable} obj
 */
network.ObjectWriter.prototype.writeObject_ = function (obj) {
    var childBuffer;
    var state = this.stack_[this.top_];
    var parentBuffer = state.objectBuffer;
    var id;

    id = /**@type{number}*/parentBuffer.data[state.index++];
    if (id === -1) {
        if (obj !== null) {
            this.destroyObject_(obj.__networkClassId__, obj);
        }
        return null;
    }
    childBuffer = this.snapshot_.objects[id];
    if (goog.isDefAndNotNull(obj)) {
        if (!goog.isDef(obj.__networkObjectId__)) {
            obj.__networkObjectId__ = id;
        }
        goog.asserts.assert(obj.__networkObjectId__ === id);
    }
    else {
        obj = this.createObject_(childBuffer.classId, id);
    }

    goog.asserts.assert(childBuffer.classId === obj.__networkClassId__);
    
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
network.ObjectWriter.prototype.writePrimitive_ = function (data) {
    var state = this.stack_[this.top_];
    var buffer = state.objectBuffer;
    return buffer.data[state.index++];
};
