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
goog.require('network.Serializer');
goog.require('network.public');

function testWriteChanged() {
    var dataView = new DataView(new ArrayBuffer(1024));
    var changed = [true, false, false, true, false, true, true, false, false];
    var serializer = new network.Serializer(network.tests.classInfoManager);
    serializer.dataView_ = dataView;

    serializer.writeChanged_(changed);
    assertEquals("length", 2, serializer.offset_);
    assertEquals("bits", 105, dataView.getUint16(0, true));
}

function testWriteData() {
    var serializer = new network.Serializer(network.tests.classInfoManager);
    var dataView = new DataView(new ArrayBuffer(1024));
    serializer.dataView_ = dataView;
    
    serializer.writeData_(8, network.Type.INT32, 0);
    serializer.writeData_(15, network.Type.UINT16, 0);
    serializer.writeData_(123, network.Type.INT8, 0);
    serializer.writeData_(0.5, network.Type.FLOAT32, 0);
    serializer.writeData_('a', network.Type.CHAR8, 0);
    serializer.writeData_('hello world', network.Type.STRING8, 0);

    assertEquals("Int32", 8, dataView.getInt32(0, true));
    assertEquals("Uint16", 15, dataView.getUint16(4, true));
    assertEquals("Int8", 123, dataView.getInt8(6, true));
    assertEquals("Float", 0.5, dataView.getFloat32(7, true));
    assertEquals("Char", 'a'.charCodeAt(0), dataView.getInt8(11));
    assertEquals("String length", 11, dataView.getUint8(12));
    assertEquals("First letter", 'h'.charCodeAt(0), dataView.getUint8(13));
    assertEquals("Offset", 24, serializer.offset_);
}

function testWriteObject() {
    var objBuff = {
        id: 4,
        classId: 4,
        changed: [true, false, false, true, false, true, false, false],
        data: [-1, 345, 0.5]
    };

    var dataView = new DataView(new ArrayBuffer(1024));
    var serializer = new network.Serializer(network.tests.classInfoManager);
    serializer.dataView_ = dataView;

    serializer.writeObject_(objBuff);

    assertEquals("id", 4, dataView.getUint16(0, true));
    assertEquals("classId", 4, dataView.getUint8(2, true));
    // changed: 00101001 = 41;
    assertEquals("changed", 41, dataView.getUint8(3, true));
    assertEquals("value 0", -1, dataView.getInt8(4, true));
    assertEquals("value 3", 345, dataView.getInt32(5, true));
    assertEquals("value 5", 0.5, dataView.getFloat32(9, true));
    assertEquals("off", 13, serializer.offset_);
}

function testWriteArray() {
    var objBuff = {
        id: 4,
        classId: network.Type.INT32,
        changed: [true, false, false, true, false, true, false, true, true],
        data: [-1, 345, 1, 0, 10]
    };
    
    var dataView = new DataView(new ArrayBuffer(1024));
    var serializer = new network.Serializer(network.tests.classInfoManager);
    serializer.dataView_ = dataView;

    serializer.writeArray_(objBuff);

    assertEquals("id", 4, dataView.getUint16(0, true));
    assertEquals("classId", network.Type.INT32, dataView.getUint8(2, true));
    assertEquals("size", 9, dataView.getUint16(3, true));
    // changed: 00000001 10101001 = 425;
    assertEquals("changed", 425, dataView.getUint16(5, true));
    assertEquals("value 0", -1, dataView.getInt32(7, true));
    assertEquals("value 3", 345, dataView.getInt32(11, true));
    assertEquals("value 5", 1, dataView.getInt32(15, true));
    assertEquals("value 7", 0, dataView.getInt32(19, true));
    assertEquals("value 8", 10, dataView.getInt32(23, true));
    assertEquals("off", 27, serializer.offset_);
}

function testReadChanged() {
    var dataView = new DataView(new ArrayBuffer(1024));
    var modelChanged = [true, false, false, true, false, true, true, false, false];
    var serializer = new network.Serializer(network.tests.classInfoManager);
    serializer.dataView_ = dataView;

    dataView.setUint16(0, 105, true);

    var result = serializer.readChanged_(modelChanged.length);
    
    assertTrue(network.tests.deepCompare(result, modelChanged));
}

function testReadData() {
    var serializer = new network.Serializer(network.tests.classInfoManager);
    var dataView = new DataView(new ArrayBuffer(1024));
    serializer.dataView_ = dataView;

    dataView.setInt32(0, 8, true);
    dataView.setUint16(4, 15, true);
    dataView.setInt8(6, 123, true);
    dataView.setFloat32(7, 0.5, true);
    dataView.setUint8(11, 'a'.charCodeAt(0));
    dataView.setUint8(12, 2);
    dataView.setUint8(13, 'h'.charCodeAt(0));
    dataView.setUint8(14, 'e'.charCodeAt(0));
    
    assertEquals("Int32", 8, serializer.readData_(network.Type.INT32, 0));
    assertEquals("Uint16", 15, serializer.readData_(network.Type.UINT16, 0));
    assertEquals("Int8", 123, serializer.readData_(network.Type.INT8, 0));
    assertEquals("Float32", 0.5, serializer.readData_(network.Type.FLOAT32, 0));
    assertEquals("Char", 'a', serializer.readData_(network.Type.CHAR8, 0));
    assertEquals("String", 'he', serializer.readData_(network.Type.STRING8, 0));
    assertEquals("Offset", 15, serializer.offset_);
}

function testReadObject() {
    var modelObjBuff = {
        id: 4,
        classId: 4,
        changed: [true, false, false, true, false, true, false, true],
        data: [-1, 345, 0.5, 'aaa']
    };
    var serializer = new network.Serializer(network.tests.classInfoManager);
    var dataView = new DataView(new ArrayBuffer(1024));
    serializer.dataView_ = dataView;
    
    serializer.writeObject_(modelObjBuff);

    serializer.offset_ = 0;

    var obj = serializer.readObject_();
    assertTrue(network.tests.deepCompare(obj, modelObjBuff));
}

function testReadArray() {
    var modelObjBuff = {
        id: 4,
        classId: network.Type.INT32,
        changed: [true, false, false, true, false, true, false, true, true],
        data: [-1, 345, 1, 0, 10]
    };
    
    var dataView = new DataView(new ArrayBuffer(1024));
    var serializer = new network.Serializer(network.tests.classInfoManager);
    serializer.dataView_ = dataView;

    serializer.writeArray_(modelObjBuff);

    serializer.offset_ = 0;

    var arr = serializer.readArray_();
    assertTrue(network.tests.deepCompare(arr, modelObjBuff));

}

function testWriteAndReadSnapshot() {
    var delta = {
        timestampA: 0,
        timestampB: 1,
        objects: [
            null, {
                id: 1,
                classId: 1,
                changed: [true, true],
                data: [6, 'g']
            }, {
                id: 2,
                classId: 1,
                changed: [true, false],
                data: [-1]
            }, null, {
                id: 4,
                classId: 2,
                changed: [false, true],
                data: [15]
            }, null, {
                id: 6,
                classId: 0,
                changed: [true, true],
                data: [5, 5.5]
            }],
        arrays: [
            null, {
                id: 1,
                classId: network.Type.INT32,
                changed: [true, false, false, true],
                data: [5, 4]
            }, {
                id: 2,
                classId: network.Type.INT32,
                changed: [false],
                data: []
            }],
        removedObjects: [3],
        removedArrays: []
    };

    var serializer = new network.Serializer(network.tests.classInfoManager);
    var dataView = new DataView(new ArrayBuffer(1024));
    serializer.dataView_ = dataView;

    var offset = serializer.write(delta, dataView, 0);
    
    var delta2 = new network.SnapshotDelta();
    var offset2 = serializer.read(delta2, dataView, 0);

    var a = [];
    for (var i = 0; i < dataView.byteLength; ++i) {
        a.push(dataView.getUint8(i));
    }
    assertEquals(delta.timestampA, dataView.getInt32(0, true));
    assertEquals(delta.timestampB, dataView.getInt32(4, true));
    assertEquals(delta.objects.length, dataView.getUint16(8, true));
    assertEquals(delta.arrays.length, dataView.getUint16(10, true));
    assertEquals(4, dataView.getUint16(12, true)); // numUpdatedObjects
    assertEquals(2, dataView.getUint16(14, true)); // numUpdatedArrays
    assertEquals(delta.removedObjects.length, dataView.getUint8(16, true));
    assertEquals(delta.removedArrays.length, dataView.getUint8(17, true));

    assertTrue("After reading delta is unchanged", network.tests.deepCompare(delta2, delta));
}

