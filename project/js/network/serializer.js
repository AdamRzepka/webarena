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

goog.require('network.Snapshot');
goog.require('network.ClassInfo');

goog.provide('network.Serializer');

/*
 * Snapshot binary format:
 * |     0      |     1      |      2      |      3      |
 * |                     fromTimestamp                   |
 * |                      toTimestamp                    |
 * |       numAllObjs        |        numAllArrays       |
 * |    numUpadtedObjs       |      numUpdatedArrays     |
 * | numDelObjs | numDelArr  |  // objects description starts here
 * *******************************************************

 *                // single object description
 * |          objId          |   classId   | changedBits |
 * |                   changedBits...                    | // byte length of changedBits = (numObjFields + 7) / 8
 * |                      data...                        | // data length depends on changed fields in object
 * *******************************************************
 *               // single array description
 * |         arrayId         |    type     | arrayLenght |
 * | arrayLenght |     changedBits...                    |
 * |                      data...
 * *******************************************************
 *              // single removed object description
 * |         objId           |
 * *******************************************************
 *              // single removed array description
 * |        arrayId          |
 * *******************************************************
 * // end of snapshot update
 *
 * Message describes difference between [fromTimestamp] and [toTimestamp].
 * [fromTimestamp] may be -1, which means that this snapshot is absolute.
 *
 * It consists of:
 *  - header
 *  - list of objects' updates
 *  - list of arrays' updates
 *  - list of removed objects' ids
 *  - list of removed arrays' ids
 *
 * New objects are just added to list of objects with absolute values in data.
 * If whole object is unchanged it won't appear in message.
 * If object was deleted it will be listed in list of removed objects.
 * Every object description has [changedBits]. If n-th bit in [changedBits] is
 * cleared, it means that the field hasn't changed and it is not carried by message.
 */

network.Serializer = function (classInfoManager) {
    this.classInfoManager = classInfoManager;
    
    this.dataView_ = null;
    this.offset_ = 0;
};

/**
 * @param {network.SnapshotDelta} snapshotDelta
 * @param {DataView} dataView
 * @param {number} offset
 */
network.Serializer.prototype.write = function (snapshotDelta, dataView, offset) {
    var i = 0, j = 0, k = 0;
    var ob;
    var objectsCount = 0;
    var arraysCount = 0;

    this.dataView_ = dataView;
    this.offset_ = offset;

    dataView.setInt32(0, snapshotDelta.timestampA, true);
    dataView.setInt32(4, snapshotDelta.timestampB, true);
    dataView.setUint16(8, snapshotDelta.objects.length, true);
    dataView.setUint16(10, snapshotDelta.arrays.length, true);
    // skip objectsCount and arraysCount for now
    dataView.setUint8(16, snapshotDelta.removedObjects.length, true);
    dataView.setUint8(17, snapshotDelta.removedArrays.length, true);

    this.offset_ += 18;

    for (i = 0; i < snapshotDelta.objects.length; ++i) {
        ob = snapshotDelta.objects[i];
        if (!goog.isDefAndNotNull(ob)) {
            continue;
        }
        ++objectsCount;
        this.writeObject_(ob);
    }

    for (i = 0; i < snapshotDelta.arrays.length; ++i) {
        ob = snapshotDelta.arrays[i];
        if (!goog.isDefAndNotNull(ob)) {
            continue;
        }
        ++arraysCount;
        this.writeArray_(ob);
    }

    dataView.setUint16(12, objectsCount, true);
    dataView.setUint16(14, arraysCount, true);
    
    for (i = 0; i < snapshotDelta.removedObjects.length; ++i) {
        dataView.setUint16(this.offset_, snapshotDelta.removedObjects[i], true);
        this.offset_ += 2;
    }
    
    for (i = 0; i < snapshotDelta.removedArrays.length; ++i) {
        dataView.setUint16(this.offset_, snapshotDelta.removedArrays[i], true);
        this.offset_ += 2;
    }
    return this.offset_;
};

/**
 * @param {network.SnapshotDelta} snapshotDelta
 * @param {DataView} dataView
 * @param {number} offset
 */
network.Serializer.prototype.read = function (snapshotDelta, dataView, offset) {
    var i = 0, j = 0, k = 0;
    var ob;
    var objectsCount = 0, arraysCount = 0, removedObjectsCount = 0, removedArraysCount = 0;

    this.dataView_ = dataView;
    this.offset_ = offset;

    snapshotDelta.timestampA = dataView.getInt32(0, true);
    snapshotDelta.timestampB = dataView.getInt32(4, true);
    snapshotDelta.objects = goog.array.repeat(null, dataView.getUint16(8, true));
    snapshotDelta.arrays = goog.array.repeat(null, dataView.getUint16(10, true));
    objectsCount = dataView.getUint16(12, true);
    arraysCount = dataView.getUint16(14, true);
    removedObjectsCount = dataView.getUint8(16, true);
    removedArraysCount = dataView.getUint8(17, true);

    this.offset_ += 18;

    for (i = 0; i < objectsCount; ++i) {
        ob = this.readObject_();
        snapshotDelta.objects[ob.id] = ob;
    }

    for (i = 0; i < arraysCount; ++i) {
        ob = this.readArray_();
        snapshotDelta.arrays[ob.id] = ob;
    }
    
    for (i = 0; i < removedObjectsCount; ++i) {
        snapshotDelta.removedObjects.push(dataView.getUint16(this.offset_, true));
        this.offset_ += 2;
    }
    
    for (i = 0; i < removedArraysCount; ++i) {
        snapshotDelta.removedArrays.push(dataView.getUint16(this.offset_, true));
        this.offset_ += 2;
    }
    return this.offset_;    
};

network.Serializer.BUFFER_SIZE = 4096;

network.Serializer.prototype.writeObject_ = function (obj) {
    var j = 0, k = 0;
    var len = obj.changed.length;
    var dataView = this.dataView_;
    var classInfo = this.classInfoManager.getClassInfo(obj.classId);


    dataView.setInt16(this.offset_, obj.id, true);
    dataView.setUint8(this.offset_+2, obj.classId, true);
    this.offset_ += 3;

    this.writeChanged_(obj.changed);
    for (j = 0; j < len; ++j) {
        if (obj.changed[j]) {
            this.writeData_(obj.data[k++], classInfo.types[j],
                            classInfo.flags[j]);
        }
    }
};

network.Serializer.prototype.writeArray_ = function (arr) {
    var chLen = 0, changed = 0;
    var j = 0, k = 0;
    var len = arr.changed.length;
    var dataView = this.dataView_;

    dataView.setInt16(this.offset_, arr.id, true);
    dataView.setUint8(this.offset_+2, arr.classId, true);
    dataView.setUint16(this.offset_+3, len, true);
    this.offset_ += 5;

    this.writeChanged_(arr.changed);
    for (j = 0; j < len; ++j) {
        if (arr.changed[j]) {
            this.writeData_(arr.data[k++], arr.classId, 0);
        }
    }
};

network.Serializer.prototype.writeData_ = function (data, type, flags) {
    var i = 0;
    var dataView = this.dataView_;

    if (flags & network.Flags.ARRAY) {
        dataView.setInt16(this.offset_, data, true); // just array id
        this.offset_ += 2;
        return;
    }
    
    switch (type) {
    case network.Type.INT8:
        dataView.setInt8(this.offset_, data);
        ++this.offset_;
        break;
    case network.Type.INT16:
    case network.Type.OBJECT:
        dataView.setInt16(this.offset_, data, true);
        this.offset_ += 2;
        break;
    case network.Type.INT32:
        dataView.setInt32(this.offset_, data, true);
        this.offset_ += 4;
        break;
    case network.Type.UINT8:
        dataView.setUint8(this.offset_, data);
        ++this.offset_;
        break;
    case network.Type.UINT16:
        dataView.setUint16(this.offset_, data, true);
        this.offset_ += 2;
        break;
    case network.Type.UINT32:
        dataView.setUint32(this.offset_, data, true);
        this.offset_ += 4;
        break;
    case network.Type.FLOAT32:
        dataView.setFloat32(this.offset_, data, true);
        this.offset_ += 4;
        break;
    case network.Type.VEC3:
        dataView.setFloat32(this.offset_, data[0], true);
        dataView.setFloat32(this.offset_ + 4, data[1], true);
        dataView.setFloat32(this.offset_ + 8, data[2], true);
        this.offset_ += 12;
        break;
    case network.Type.MTX4:
        for (i = 0; i < 16; ++i) {
            dataView.setFloat32(this.offset_, data[i], true);
            this.offset_ += 4;
        }
        break;
    case network.Type.CHAR:
        dataView.setInt8(this.offset_, data.charCodeAt(0));
        ++this.offset_;
        break;
    default: // not supported
        goog.asserts.fail();
        break;
    }
};

/**
 * @private
 */
network.Serializer.prototype.writeChanged_ = function (changed) {
    var i = 0, j = 0;
    var chLen = Math.ceil(changed.length / 8);
    var out = 0;
    
    for (i = 0; i < chLen; ++i) {
        out = 0;
        for (j = 8 * i; j < 8 * (i + 1) && j < changed.length; ++j) {
            if (changed[j]) {
                out |= 1 << (j % 8);
            }
        }
        this.dataView_.setUint8(this.offset_++, out);
    }
};

/**
 * @private
 */
network.Serializer.prototype.readChanged_ = function (length) {
    var i = 0, j = 0;
    var bits = 0;
    var chLen = Math.ceil(length / 8);
    var result = [];

    for (i = 0; i < chLen; ++i) {
        bits = this.dataView_.getUint8(this.offset_++);
        for (j = i * 8; j < length && j < (i + 1) * 8; ++j) {
            result[j] = ((bits & (1 << (j % 8))) !== 0); // getting j-th bit
        }
    }
    return result;
};

network.Serializer.prototype.readData_ = function (type, flags) {
    var i = 0;
    var dataView = this.dataView_;
    var data;

    if (flags & network.Flags.ARRAY) {
        data = dataView.getInt16(this.offset_, true); // just array id
        this.offset_ += 2;
        return data;
    }
    
    switch (type) {
    case network.Type.INT8:
        data =  dataView.getInt8(this.offset_++);
        break;
    case network.Type.INT16:
    case network.Type.OBJECT:
        data = dataView.getInt16(this.offset_, true);
        this.offset_ += 2;
        break;
    case network.Type.INT32:
        data = dataView.getInt32(this.offset_, true);
        this.offset_ += 4;
        break;
    case network.Type.UINT8:
        data =  dataView.getUint8(this.offset_);
        break;
    case network.Type.UINT16:
        data = dataView.getUint16(this.offset_, true);
        this.offset_ += 2;
        break;
    case network.Type.UINT32:
        data = dataView.getUint32(this.offset_, true);
        this.offset_ += 4;
        break;
    case network.Type.FLOAT32:
        data = dataView.getFloat32(this.offset_, true);
        this.offset_ += 4;
        break;
    case network.Type.VEC3:
        data = new Float32Array(3);
        data[0] = dataView.getFloat32(this.offset_, true);
        data[1] = dataView.getFloat32(this.offset_ + 4, true);
        data[2] = dataView.getFloat32(this.offset_ + 8, true);
        this.offset_ += 12;
        break;
    case network.Type.MTX4:
        data = new Float32Array(16);
        for (i = 0; i < 16; ++i) {
            data[i] = dataView.getFloat32(this.offset_, true);
            this.offset_ += 4;
        }
        break;
    case network.Type.CHAR:
        data = String.fromCharCode(dataView.getInt8(this.offset_++));
        break;
    default: // not supported
        goog.asserts.fail();
        break;
    }
    return data;
};

network.Serializer.prototype.readObject_ = function () {
    var j = 0, k = 0;
    var len = 0;
    var dataView = this.dataView_;
    var objBuf = new network.ObjectBufferDelta();
    var classInfo;
        
    objBuf.id = dataView.getInt16(this.offset_, true);
    objBuf.classId = dataView.getUint8(this.offset_+2, true);
    this.offset_ += 3;

    classInfo = this.classInfoManager.getClassInfo(objBuf.classId);
    len = classInfo.fieldsCount;
    
    objBuf.changed = this.readChanged_(len);
    
    for (j = 0; j < len; ++j) {
        if (objBuf.changed[j]) {
            objBuf.data[k++] = this.readData_(classInfo.types[j],
                                              classInfo.flags[j]);
        }
    }
    
    return objBuf;
};

network.Serializer.prototype.readArray_ = function () {
    var j = 0, k = 0;
    var dataView = this.dataView_;
    var len = 0;
    var objBuf = new network.ObjectBufferDelta();

    objBuf.id = dataView.getInt16(this.offset_, true);
    objBuf.classId = dataView.getUint8(this.offset_+2, true);
    len = dataView.getUint16(this.offset_+3, true);
    this.offset_ += 5;

    objBuf.changed = this.readChanged_(len);
    
    for (j = 0; j < len; ++j) {
        if (objBuf.changed[j]) {
            objBuf.data[k++] = this.readData_(objBuf.classId, 0);
        }
    }
    
    return objBuf;
};
