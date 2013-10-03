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

goog.require('goog.testing.jsunit');
goog.require('network.tests.common');
goog.require('network.serialize');
goog.require('network.public');

function testWriteData() {
    var dataView = new DataView(new ArrayBuffer(1024));
    var off = 0;
    off = network.serialize.writeData_(8, network.Type.INT32, 0, dataView, off);
    off = network.serialize.writeData_(15, network.Type.UINT16, 0, dataView, off);
    off = network.serialize.writeData_(123, network.Type.INT8, 0, dataView, off);
    off = network.serialize.writeData_(0.5, network.Type.FLOAT32, 0, dataView, off);
    off = network.serialize.writeData_('a', network.Type.CHAR, 0, dataView, off);

    assertEquals("Int32", 8, dataView.getInt32(0, true));
    assertEquals("Uint16", 15, dataView.getUint16(4, true));
    assertEquals("Int8", 123, dataView.getInt8(6, true));
    assertEquals("Float", 0.5, dataView.getFloat32(7, true));
    assertEquals("Char", 'a'.charCodeAt(0), dataView.getInt8(11, true));
    assertEquals("Offset", 12, off);
}

function testWriteObject() {
    var objBuff = {
        id: 4,
        classId: 6,
        data: [-1, 0, 0, 345, 0, 0.5, 0]
    };
    var classInfo = {
        id: 6,
        fieldsCount: 7,
        types: [
            network.Type.INT8,
            network.Type.OBJECT,
            network.Type.UINT16,
            network.Type.INT32,
            network.Type.INT32,
            network.Type.FLOAT32,
            network.Type.FLOAT32
        ],
        flags: [
            0,
            0,
            0,
            0,
            network.Flags.ARRAY,
            0,
            0
        ],
        factoryFunction: null,
        destroyCallback: null
    };
    var dataView = new DataView(new ArrayBuffer(1024));

    var off = network.serialize.writeObject_(objBuff, classInfo, dataView, 0);

    assertEquals("id", 4, dataView.getUint16(0, true));
    assertEquals("classId", 6, dataView.getUint8(2, true));
    // changed: 00101001 = 41;
    assertEquals("changed", 41, dataView.getUint8(3, true));
    assertEquals("value 0", -1, dataView.getInt8(4, true));
    assertEquals("value 3", 345, dataView.getInt32(5, true));
    assertEquals("value 5", 0.5, dataView.getFloat32(9, true));
    assertEquals("off", 13, off);
}

function testWriteArray() {
    var i = 0;
    var objBuff = {
        id: 4,
        classId: network.Type.INT32,
        data: [-1, 0, 0, 345, 0, 1, 0, 2, 10]
    };
    
    var dataView = new DataView(new ArrayBuffer(1024));

    var off = network.serialize.writeArray_(objBuff, dataView, 0);

    assertEquals("id", 4, dataView.getUint16(0, true));
    assertEquals("size", 9, dataView.getUint16(2, true));
    // changed: 00000001 10101001 = 425;
    assertEquals("changed", 425, dataView.getUint16(4, true));
    assertEquals("value 0", -1, dataView.getInt32(6, true));
    assertEquals("value 3", 345, dataView.getInt32(10, true));
    assertEquals("value 5", 1, dataView.getInt32(14, true));
    assertEquals("value 7", 2, dataView.getInt32(18, true));
    assertEquals("value 8", 10, dataView.getInt32(22, true));
    assertEquals("off", 26, off);
}

function testWriteSnapshot() {
    var delta = {
        timestampA: 0,
        timestampB: 1,
        objects: [{
            id: 0,
            classId: 3,
            data: [0]
        }, {
            id: 1,
            classId: 1,
            data: [7, 'g']
        }, {
            id: 2,
            classId: 1,
            data: [-4, 0]
        }, null, {
            id: 4,
            classId: 2,
            data: [0, 5]
        }, {
            id: 5,
            classId: 2,
            data: [0, 0]
        }, {
            id: 6,
            classId: 0,
            data: [5, 5.5]
        }],
        arrays: [{
            id: 0,
            classId: -1,
            data: [0, 0, 0, 0]
        },{
            id: 1,
            classId: -1,
            data: [-4, 0, 0, 4]
        }, {
            id: 2,
            classId: -1,
            data: [0]
        }],
        removedObjects: [3],
        removedArrays: []
    };

    var buffer = network.serialize.write(delta, network.tests.classInfoManager);
    var dataView = new DataView(buffer);

    
}

