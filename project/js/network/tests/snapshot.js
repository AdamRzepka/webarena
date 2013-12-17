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
goog.require('network.Snapshot');

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
        objects: [null, {
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
        arrays: [null, {
            id: 1,
            classId: -1,
            changed: [true, false, false, true],
            data: [5, 4]
        }, null],
        removedObjects: [3],
        removedArrays: []
    };
    
    var delta = new network.SnapshotDelta();
    network.Snapshot.diff(snapshot1, snapshot2, delta);
    assertTrue(network.tests.deepCompare(delta, modelDelta));
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
                classId: -1,
                changed: [true, false, false, true],
                data: [5, 4]
            }, {
                id: 2,
                classId: -1,
                changed: [false],
                data: []
            }],
        removedObjects: [3],
        removedArrays: []
    };
    
    var snapshot2 = new network.Snapshot();
    network.Snapshot.sum(snapshot1, delta, snapshot2);
    assertTrue(network.tests.deepCompare(snapshot2, modelSnapshot2));    
}

