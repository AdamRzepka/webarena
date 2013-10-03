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

goog.provide('network.serialize');

/*
 * Snapshot binary format:
 * |     0      |     1      |      2      |      3      |
 * |                     fromTimestamp                   |
 * |                      toTimestamp                    |
 * |        numObjs          |          numArrays        |
 * | numDelObjs | numDelArr  |  // objects description starts here
 * *******************************************************

 *                // single object description
 * |          objId          |   classId   | changedBits |
 * |                   changedBits...                    | // byte length of changedBits = (numObjFields + 7) / 8
 * |                      data...                        | // data length depends on changed fields in object
 * *******************************************************
 *               // single array description
 * |         arrayId         |       arrayLenght         |
 * |                   changedBits...                    |
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


/**
 * @param {network.SnapshotDelta} snapshotDelta
 * @return {Uint8Array}
 */
network.serialize.write = function (snapshotDelta, classInfoManager) {
    var i = 0, j = 0, k = 0;
    var offset = 0;
    var ob, ci;
    var dataToWrite = [];
    var buffer = new ArrayBuffer(network.serialize.BUFFER_SIZE);
    var dataView = new DataView(buffer);

    for (i = 0; i < snapshotDelta.objects.length; ++i) {
        ob = snapshotDelta.objects[i];
        if (!goog.isDefAndNotNull(ob)) {
            continue;
        }
        ci = classInfoManager.getClassInfo(ob.classId);        
    }
};

/**
 * @param {Uint8Array} message
 * @return {network.SnapshotDelta}
 */
network.serialize.read = function (message, classInfoManager) {
    
};

network.serialize.BUFFER_SIZE = 4096;

network.serialize.writeObject_ = function (obj, classInfo, dataView, offset) {
    var chLen = 0, changed = 0;
    var j = 0, k = 0;
    var dataOffset = 0;
    var dataToWrite = [];

    dataView.setUint16(offset, obj.id, true);
    dataView.setUint8(offset+2, obj.classId, true);
    offset += 3;

    chLen = Math.ceil(classInfo.fieldsCount / 8);
    dataOffset = offset + chLen;
    for (j = 0; j < chLen; ++j) {
        changed = 0;
        for (k = 8 * j; k < 8 * (j + 1) && k < classInfo.fieldsCount; ++k) {
            if (obj.data[k] !== 0) {
                changed |= 1 << (k % 8); // set k-th bit, which means value changed
                dataOffset = network.serialize.writeData_(obj.data[k], classInfo.types[k],
                                                           classInfo.flags[k], dataView,
                                                           dataOffset);
            }
        }
        dataView.setUint8(offset + j, changed);
    }
    return dataOffset; // offset of the next object
};

network.serialize.writeArray_ = function (arr, dataView, offset) {
    var chLen = 0, changed = 0;
    var j = 0, k = 0;
    var dataOffset = 0;
    var dataToWrite = [];
    var len = arr.data.length;

    dataView.setUint16(offset, arr.id, true);
    dataView.setUint16(offset+2, len, true);
    offset += 4;

    chLen = (len + 7) / 8;
    dataOffset = offset + chLen;
    for (j = 0; j < chLen; ++j) {
        changed = 0;
        for (k = 8 * j; k < 8 * (j + 1) && k < len; ++k) {
            if (arr.data[k] !== 0) {
                changed |= 1 << (k % 8); // set k-th bit, which means value changed
                dataOffset = network.serialize.writeData_(arr.data[k], arr.classId,
                                                           0, dataView,
                                                           dataOffset);
            }
        }
        dataView.setUint8(offset + j, changed);
    }
    return dataOffset; // offset of the next object
};

network.serialize.writeData_ = function (data, type, flags, dataView, dataOffset) {
    var i = 0;

    if (flags & network.Flags.ARRAY) {
        dataView.setUint16(dataOffset, data, true); // just array id
        return dataOffset + 2;
    }
    
    switch (type) {
    case network.Type.INT8:
        dataView.setInt8(dataOffset, data);
        return dataOffset + 1;
        break;
    case network.Type.INT16:
        dataView.setInt16(dataOffset, data, true);
        return dataOffset + 2;
        break;
    case network.Type.INT32:
        dataView.setInt32(dataOffset, data, true);
        return dataOffset + 4;
        break;
    case network.Type.UINT8:
        dataView.setUint8(dataOffset, data);
        return dataOffset + 1;
        break;
    case network.Type.UINT16:
    case network.Type.OBJECT:
        dataView.setUint16(dataOffset, data, true);
        return dataOffset + 2;
        break;
    case network.Type.UINT32:
        dataView.setUint32(dataOffset, data, true);
        return dataOffset + 4;
        break;
    case network.Type.FLOAT32:
        dataView.setFloat32(dataOffset, data, true);
        return dataOffset + 4;
        break;
    case network.Type.VEC3:
        dataView.setFloat32(dataOffset, data[0], true);
        dataView.setFloat32(dataOffset, data[1], true);
        dataView.setFloat32(dataOffset, data[2], true);
        return dataOffset + 12;
        break;
    case network.Type.MTX4:
        for (i = 0; i < 16; ++i) {
            dataView.setFloat32(dataOffset, data[i], true);
        }
        return dataOffset + 48;
        break;
    case network.Type.CHAR:
        dataView.setInt8(dataOffset, data.charCodeAt(0));
        return dataOffset + 1;
        break;
    default: // not supported
        goog.asserts.fail();
        return dataOffset;
    }
};
