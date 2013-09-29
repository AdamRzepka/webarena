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
goog.require('network.ObjectReader');

var classInfoManager = null;

/**
 * @implements {network.ISynchronizable}
 */
function A() {
    this.a = 4;
    this.b = 1.5;
}

A.prototype.synchronize = function (synchronizer) {
    this.a = synchronizer.synchronize(this.a, network.Type.INT8);
    this.b = synchronizer.synchronize(this.b, network.Type.FLOAT32);
};

/**
 * @implements {network.ISynchronizable}
 */
function B() {
    this.obj = new A();
    this.c = 'c';
};

B.prototype.synchronize = function (synchronizer) {
    this.obj = synchronizer.synchronize(this.obj, network.Type.OBJECT);
    this.c = synchronizer.synchronize(this.c, network.Type.CHAR);
};

/**
 * @implements {network.ISynchronizable}
 */
function C() {
    this.a = [1,2];
    this.b = 3;
};

C.prototype.synchronize = function (synchronizer) {
    this.a = synchronizer.synchronize(this.a, network.Type.INT32, network.Flags.ARRAY);
    this.b = synchronizer.synchronize(this.b, network.Type.INT32);
};

/**
 * @implements {network.ISynchronizable}
 */
function D() {
    this.a = [new A(), new B(), new C()];
};

D.prototype.synchronize = function (synchronizer) {
    this.a = synchronizer.synchronize(this.a, network.Type.OBJECT, network.Flags.ARRAY);
};

var destroyedA = false;
var destroyedC = false;
function setUp() {
    destroyedA = false;
    destroyedC = false;
    network.ClassInfoManager.nextId_ = 0;
    classInfoManager = new network.ClassInfoManager();
    classInfoManager.registerClass(A, function () {
        return new A();
    }, function () {
        destroyedA = true;
    });
    
    classInfoManager.registerClass(B, function () {
        return new B();
    });

    classInfoManager.registerClass(C, function () {
        return new C();
    }, function () {
        destroyedC = true;
    });
    
    classInfoManager.registerClass(D, function () {
        return new D();
    });
}

function testReading() {
    var reader = new network.ObjectReader(classInfoManager);
    var a = new A();
    var snapshot = reader.readScene(a);
    assertEquals("Returns the same value during reading", 4, a.a);
    assertEquals("Returns the same value during reading", 1.5, a.b);
    assertEquals("Objects in snapshot", 1, snapshot.objects.length);
    assertEquals("Object id", 0, a.__networkObjectId__);
    assertEquals("Object id in snapshot", 0, snapshot.objects[0].id);
    assertEquals("Object class in snapshot", 0, snapshot.objects[0].classId);
    assertEquals("Data count in objectBuffer", 2, snapshot.objects[0].data.length);
    assertEquals("Snapshot data of object", 4, snapshot.objects[0].data[0]);
    assertEquals("Snapshot data of object", 1.5, snapshot.objects[0].data[1]);
}

function testNestedObjectsReading() {
    var reader = new network.ObjectReader(classInfoManager);
    var b = new B();
    var a = b.obj;
    var snapshot = reader.readScene(b);
    assertEquals("Returns the same object during reading", a, b.obj);
    assertEquals("Objects in snapshot", 2, snapshot.objects.length);
    assertEquals("Object b id", 0, b.__networkObjectId__);
    assertEquals("Object a id", 1, b.obj.__networkObjectId__);
    assertEquals("Object b id in snapshot", 0, snapshot.objects[0].id);
    assertEquals("Object a id in snapshot", 1, snapshot.objects[1].id);
    assertEquals("Object a class in snapshot", 1, snapshot.objects[0].classId);
    assertEquals("Object b class in snapshot", 0, snapshot.objects[1].classId);
    assertEquals("Data count in objectBuffer b", 2, snapshot.objects[0].data.length);
    assertEquals("Data count in objectBuffer a", 2, snapshot.objects[1].data.length);
    assertEquals("Snapshot data of object b", 1, snapshot.objects[0].data[0]);
    assertEquals("Snapshot data of object b", 'c', snapshot.objects[0].data[1]);
    assertEquals("Snapshot data of object a", 4, snapshot.objects[1].data[0]);
    assertEquals("Snapshot data of object a", 1.5, snapshot.objects[1].data[1]);
}

function testArrayReading() {
    var reader = new network.ObjectReader(classInfoManager);
    var c = new C();
    var arr = c.a;
    var snapshot = reader.readScene(c);
    assertEquals("Returns the same value during reading", arr, c.a);
    assertEquals("Objects in snapshot", 1, snapshot.objects.length);
    assertEquals("Arrays in snapshot", 1, snapshot.arrays.length);
    assertEquals("Object id", 0, c.__networkObjectId__);
    assertEquals("Object id in snapshot", 0, snapshot.objects[0].id);
    assertEquals("Array id in snapshot", 0, snapshot.arrays[0].id);
    assertEquals("Data count in objectBuffer", 2, snapshot.objects[0].data.length);
    assertEquals("Snapshot data of object", 0, snapshot.objects[0].data[0]);
    assertEquals("Snapshot data of object", 3, snapshot.objects[0].data[1]);
    assertEquals("Snapshot data of array", 1, snapshot.arrays[0].data[0]);
    assertEquals("Snapshot data of array", 2, snapshot.arrays[0].data[1]);
}

function testObjectsInArrayReading() {
    var reader = new network.ObjectReader(classInfoManager);
    var d = new D();
    var arr = d.a;
    var aa = d.a[0];
    var snapshot = reader.readScene(d);
    assertEquals("Returns the same value during reading", arr, d.a);
    assertEquals("Returns the same value during reading", aa, d.a[0]);
    assertEquals("Objects in snapshot", 5, snapshot.objects.length);
    assertEquals("Arrays in snapshot", 2, snapshot.arrays.length);
    assertEquals("Object id", 0, d.__networkObjectId__);
    assertEquals("Object id", 1, d.a[0].__networkObjectId__);
    assertEquals("Object id in snapshot", 0, snapshot.objects[0].id);
    assertEquals("Object id in snapshot", 1, snapshot.objects[1].id);
    assertEquals("Array id in snapshot", 0, snapshot.arrays[0].id);
    assertEquals("Data in array snapshot", 3, snapshot.arrays[0].data.length);
    assertEquals("Data in array snapshot", 2, snapshot.arrays[1].data.length);
    assertEquals("Data count in objectBuffer", 1, snapshot.objects[0].data.length);
    assertEquals("Snapshot data of array", 2, snapshot.arrays[0].data[1]);
    assertEquals("Snapshot data of object", 1.5, snapshot.objects[3].data[1]);
    assertEquals("Snapshot data of object", 1, snapshot.objects[4].data[0]);
}

function tearDown() {
    classInfoManager = null;
    network.ClassInfoManager.nextId_ = 0;
}

