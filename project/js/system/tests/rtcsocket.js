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
goog.require('goog.testing.AsyncTestCase');
goog.require('system.RTCSocket');

var gAsyncTestCase;
var gWasCalled = true;


function testSocketsLocally() {
    var socketA;
    var socketB;

    gAsyncTestCase.waitForAsync();
    gWasCalled = false;

    socketA = new system.RTCSocket(false, function (msg) {
        socketB.readSignallingMessage(msg);
    });

    socketA.onmessage = function (msg) {
        gAsyncTestCase.continueTesting();
        gWasCalled = true;
        assertEquals('pong', msg);
        console.log('socketA.onmessage: ' + msg);
    };

    socketA.onopen = function() {
        console.log('socketA.onopen');
        socketA.send('ping');
    };


    socketB = new system.RTCSocket(true, function (msg) {
        socketA.readSignallingMessage(msg);
    });

    socketB.onmessage = function (msg) {
        console.log('socketB.onmessage: ' + msg);
        assertEquals('ping', msg);
        socketB.send('pong');
    };

    socketB.onopen = function () {
        console.log('socketB.onopen');
    };
}

function tearDown() {
    assertTrue(gWasCalled);
}

gAsyncTestCase = goog.testing.AsyncTestCase.createAndInstall();
