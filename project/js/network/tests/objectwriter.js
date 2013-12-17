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
goog.require('network.ObjectWriter');

function testWriting() {
    var snapshot = {
        timestamp: 0,
        objects: [
            {
                id: 0,
                classId: 0,
                data: [10, 2.5]
            }
        ],
        arrays: []
    };

    var writer = new network.ObjectWriter(network.tests.classInfoManager);
    var a = new network.tests.A();
    writer.writeScene(a, snapshot);

    assertEquals("Object id", 0, a.__networkObjectId__);
    assertEquals("Class id", 0, a.__networkClassId__);
    assertEquals("a.a", 10, a.a);
    assertEquals("a.b", 2.5, a.b);
}

function testNestedObjects() {
    var snapshot = {
        timestamp: 0,
        objects: [
            {
                id: 0,
                classId: 1,
                data: [1, 'd']
            }, {
                id: 1,
                classId: 0,
                data: [10, 2.5]
            }
        ],
        arrays: []
    };
    var writer = new network.ObjectWriter(network.tests.classInfoManager);
    var b = new network.tests.B();
    writer.writeScene(b, snapshot);
    var a = b.obj;

    assertEquals("Object id", 0, b.__networkObjectId__);
    assertEquals("Class id", 1, b.__networkClassId__);
    assertEquals("Object id", 1, a.__networkObjectId__);
    assertEquals("Class id", 0, a.__networkClassId__);
    assertEquals("b.c", 'd', b.c);
    assertEquals("a.a", 10, a.a);
    assertEquals("a.b", 2.5, a.b);
}

function testArrayWriting() {
    var snapshot = {
        timestamp: 0,
        objects: [
            {
                id: 0,
                classId: 2,
                data: [0, 8]
            }
        ],
        arrays: [
            {
                id: 0,
                classId: -1,
                data: [3, 4]
            }
        ]
    };
    
    var writer = new network.ObjectWriter(network.tests.classInfoManager);
    var c = new network.tests.C();
    writer.writeScene(c, snapshot);

    assertEquals("Object id", 0, c.__networkObjectId__);
    assertEquals("Class id", 2, c.__networkClassId__);
    assertEquals("c.a.length", 2, c.a.length);
    assertEquals("c.a[0]", 3, c.a[0]);
    assertEquals("c.a[1]", 4, c.a[1]);
    assertEquals("c.b", 8, c.b);

    // changing array length
    snapshot.arrays[0].data = [5,6,7];
    writer.writeScene(c, snapshot);
    assertEquals("c.a.length", 3, c.a.length);
    assertEquals(5, c.a[0]);
    assertEquals(7, c.a[2]);
    
    snapshot.arrays[0].data = [];
    writer.writeScene(c, snapshot);
    assertEquals("c.a.length", 0, c.a.length);
}

function testObjectsInArrayWriting() {
    var snapshot = {
        timestamp: 0,
        objects: [
            {
                id: 0,
                classId: 3,
                data: [0]
            }, {
                id: 1,
                classId: 0,
                data: [7, 7.5]
            }, {
                id: 2,
                classId: 1,
                data: [3, 's']
            }, {
                id: 3,
                classId: 0,
                data: [9, 9.2]
            }, {
                id: 4,
                classId: 2,
                data: [1, 8]
            }    
        ],
        arrays: [
            {
                id: 0,
                classId: -1,
                data: [1, 2, 4]
            }, {
                id: 1,
                classId: -1,
                data: [3, 4]
            }
        ]
    };

    var writer = new network.ObjectWriter(network.tests.classInfoManager);
    var d = new network.tests.D();
    writer.writeScene(d, snapshot);

    assertEquals("Object id", 0, d.__networkObjectId__);
    assertEquals("Class id", 3, d.__networkClassId__);
    assertEquals("Object id", 1, d.a[0].__networkObjectId__);
    assertEquals("Class id", 0, d.a[0].__networkClassId__);
    assertEquals("Object id", 3, d.a[1].obj.__networkObjectId__);
    assertEquals("Class id", 0, d.a[1].obj.__networkClassId__);

    assertEquals("d.a.length", 3, d.a.length);
    assertEquals("d.a[0].a", 7, d.a[0].a);
    assertEquals("d.a[1].c", 's', d.a[1].c);
    assertEquals("d.a[1].obj.b", 9.2, d.a[1].obj.b);
    assertEquals("d.a[2].a.lenght", 2, d.a[2].a.length);
    assertEquals("d.a[2].a[0]", 3, d.a[2].a[0]);
}

function testCreationObjects() {
   var snapshot = {
        timestamp: 0,
        objects: [
            {
                id: 0,
                classId: 3,
                data: [0]
            }, {
                id: 1,
                classId: 1,
                data: [-1, 's']
            }    
        ],
        arrays: [
            {
                id: 0,
                classId: -1,
                data: [-1, 1]
            }
        ]
    };

    var writer = new network.ObjectWriter(network.tests.classInfoManager);
    var d = new network.tests.D();
    writer.writeScene(d, snapshot);

    assertEquals("Object id", 0, d.__networkObjectId__);
    assertEquals("Class id", 3, d.__networkClassId__);

    assertEquals("d.a.length", 2, d.a.length);
    assertNull("d.a[0]", d.a[0]);
    assertEquals("d.a[1].c", 's', d.a[1].c);
    assertNull("d.a[1].obj", d.a[1].obj);

    assertTrue("Checking if destructor callback A was called", network.tests.destroyedA);
    assertTrue("Checking if destructor callback C was called", network.tests.destroyedC);

    snapshot.arrays[0].data = [2, 1, 3];
    snapshot.objects.push({
        id: 2,
        classId: 0,
        data: [6, 0.5]
    });
    snapshot.objects.push({
        id: 3,
        classId: 0,
        data: [5, 0.25]
    });
    snapshot.objects.push({
        id: 4,
        classId: 0,
        data: [4, 0]
    });
    snapshot.objects[1].data[0] = 4;
    writer.writeScene(d, snapshot);
    
    assertEquals("d.a.length", 3, d.a.length);
    assertNotNull(d.a[0]);
    assertNotNull(d.a[2]);
    assertNotNull(d.a[1].obj);
    
    assertEquals(2, d.a[0].__networkObjectId__);
    assertEquals(0, d.a[0].__networkClassId__);
    assertEquals(6, d.a[0].a);

    assertEquals(3, d.a[2].__networkObjectId__);
    assertEquals(0, d.a[2].__networkClassId__);
    assertEquals(5, d.a[2].a);
    
    assertEquals(4, d.a[1].obj.__networkObjectId__);
    assertEquals(0, d.a[1].obj.__networkClassId__);
    assertEquals(4, d.a[1].obj.a);
}
