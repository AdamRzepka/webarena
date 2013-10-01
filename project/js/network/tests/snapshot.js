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
goog.require('network.Snapshot');

function deepCompare(a, b) {
    var x;
    var fa;
    var fb;
    var result;
    for( x in a ) {
        if (a.hasOwnProperty(x)) {
            if (b.hasOwnProperty(x)) {
                fa = a[x];
                fb = b[x];
                if (typeof fa === 'object' && typeof fb === 'object'
                    && fa !== null && fb !== null) {
                    if (!deepCompare(fa, fb)) {
                        return false;
                    }                    
                } else {
                    if (fa !== fb) {
                        return false;
                    }
                }
            } else {
                return false;
            }
        }
    }
    for( x in b )
    {
        if (b.hasOwnProperty(x)) {
            if (!a.hasOwnProperty(x)) {
                return false;
            }
        }
    }
    return true;
}

function testDeepCompare() {
    var a = {
        a: 1,
        b: {
            c: 2,
            d: 3
        },
        e: [
            'a',
            'b'
        ]
    };
    var b = {
        a: 1,
        b: {
            c: 2,
            d: 3
        },
        e: [
            'a',
            'b'
        ]
    };
    assertTrue(deepCompare(a, b));
    b.a = 2;
    assertFalse(deepCompare(a, b));
    b.a = 1;
    assertTrue(deepCompare(a, b));
    
    b.b.c = 1;
    assertFalse(deepCompare(a, b));
    b.b.c = 2;
    delete b.b.c;
    assertFalse(deepCompare(a, b));
    b.b.c = 2;
    assertTrue(deepCompare(a, b));
    b.b.e = 5;
    assertFalse(deepCompare(a, b));
    delete b.b.e;
    assertTrue(deepCompare(a, b));
    b.b = null;
    assertFalse(deepCompare(a, b));
    b.b = { c: 2, d: 3};
    assertTrue(deepCompare(a, b));
    
    b.e[0] = 5;
    assertFalse(deepCompare(a, b));
    b.e[0] = 'a';
    assertTrue(deepCompare(a, b));
    b.e.length = 1;
    assertFalse(deepCompare(a, b));
    b.e[1] = 'b';
    assertTrue(deepCompare(a, b));
    b.e[2] = 'dupa';
    assertFalse(deepCompare(a, b));
}

function testDiff() {
    var snapshot1 = {
        timestamp: 0,
        objects: [{
            id: 0,
            classId: 3,
            data: [0]
        }, {
            id: 1,
            classId: 1,
            data: [-1, 's']
        }, {
            id: 2,
            classId: 1,
            data: [3, 'c']
        }, {
            id: 3,
            classId: 0,
            data: [5, 6.5]
        }, {
            id: 4,
            classId: 2,
            data: [1, 10]
        }, {
            id: 5,
            classId: 2,
            data: [2, 11]
        }],
        arrays: [{
            id: 0,
            classId: -1,
            data: [1, 2, 4, 5]
        }, {
            id: 1,
            classId: -1,
            data: [9, 8, 7]
        }, {
            id: 2,
            classId: -1,
            data: [4, 5]
        }]
    };

    var snapshot2 = {
        timestamp: 1,
        objects: [{
            id: 0,
            classId: 3,
            data: [0]
        }, {
            id: 1,
            classId: 1,
            data: [6, 'g']
        }, {
            id: 2,
            classId: 1,
            data: [-1, 'c']
        }, null, {
            id: 4,
            classId: 2,
            data: [1, 15]
        }, {
            id: 5,
            classId: 2,
            data: [2, 11]
        }, {
            id: 6,
            classId: 0,
            data: [5, 5.5]
        }],
        arrays: [{
            id: 0,
            classId: -1,
            data: [1, 2, 4, 5]
        }, {
            id: 1,
            classId: -1,
            data: [5, 8, 7, 4]
        }, {
            id: 2,
            classId: -1,
            data: [4]
        }]
    };

    var modelDelta = {
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
    
    var delta = new network.SnapshotDelta();
    network.Snapshot.diff(snapshot1, snapshot2, delta);
    assertTrue(deepCompare(delta, modelDelta));
}

function testSum () {
    var snapshot1 = {
        timestamp: 0,
        objects: [{
            id: 0,
            classId: 3,
            data: [0]
        }, {
            id: 1,
            classId: 1,
            data: [-1, 's']
        }, {
            id: 2,
            classId: 1,
            data: [3, 'c']
        }, {
            id: 3,
            classId: 0,
            data: [5, 6.5]
        }, {
            id: 4,
            classId: 2,
            data: [1, 10]
        }, {
            id: 5,
            classId: 2,
            data: [2, 11]
        }],
        arrays: [{
            id: 0,
            classId: -1,
            data: [1, 2, 4, 5]
        }, {
            id: 1,
            classId: -1,
            data: [9, 8, 7]
        }, {
            id: 2,
            classId: -1,
            data: [4, 5]
        }]
    };

    var modelSnapshot2 = {
        timestamp: 1,
        objects: [{
            id: 0,
            classId: 3,
            data: [0]
        }, {
            id: 1,
            classId: 1,
            data: [6, 'g']
        }, {
            id: 2,
            classId: 1,
            data: [-1, 'c']
        }, null, {
            id: 4,
            classId: 2,
            data: [1, 15]
        }, {
            id: 5,
            classId: 2,
            data: [2, 11]
        }, {
            id: 6,
            classId: 0,
            data: [5, 5.5]
        }],
        arrays: [{
            id: 0,
            classId: -1,
            data: [1, 2, 4, 5]
        }, {
            id: 1,
            classId: -1,
            data: [5, 8, 7, 4]
        }, {
            id: 2,
            classId: -1,
            data: [4]
        }]
    };

    var delta = {
        timestampA: 0,
        timestampB: 1,
        objects: [
            null, {
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
            }, null, {
                id: 6,
                classId: 0,
                data: [5, 5.5]
            }],
        arrays: [
            null, {
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
    
    var snapshot2 = new network.Snapshot();
    network.Snapshot.sum(snapshot1, delta, snapshot2);
    assertTrue(deepCompare(snapshot2, modelSnapshot2));    
}

