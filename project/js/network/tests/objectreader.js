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

function setUp() {
    network.ClassInfoManager.nextId_ = 0;
    classInfoManager = new network.ClassInfoManager();
    classInfoManager.registerClass(A, function () {
        return new A();
    });
}

function testReading() {
    var reader = new network.ObjectReader(classInfoManager);
    var a = new A();
    var snapshot = reader.readScene(a);
    assertEquals("Returns the same value during reading", 4, a.a);
    assertEquals("Returns the same value during reading", 1.5, a.b);
    assertEquals("Objects in snapshot", 1, snapshot.objects.length);
    assertEquals("Object id", 0, snapshot.objects[0].id);
    assertEquals("Object class", 0, snapshot.objects[0].classId);
    assertEquals("Data count in objectBuffer", 2, snapshot.objects[0].data.length);
    assertEquals("Snapshot data of object", 4, snapshot.objects[0].data[0]);
    assertEquals("Snapshot data of object", 1.5, snapshot.objects[0].data[1]);
}

function tearDown() {
    classInfoManager = null;
    network.ClassInfoManager.nextId_ = 0;
}










