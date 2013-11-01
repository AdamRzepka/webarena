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
goog.require('base.Broker');
goog.require('base.FakeBroker');

var gAsyncTestCase;
var gWasCalled = false;

function setUp() {
    gWasCalled = false;
}

function testEvents () {
    gAsyncTestCase.waitForAsync();
    var worker = new Worker('testworker.js');
    var broker = new base.Broker('test', worker);
    var testData = 'testData';
    broker.registerEventListener('testEventPong', function (eventType, data) {
        gAsyncTestCase.continueTesting();
        assertEquals(testData, data);
        gWasCalled = true;
    });

    broker.fireEvent('testEventPing', testData);
};

function testEventsLocal () {
    var worker = new Worker('testworker.js');
    var broker = new base.Broker('test', worker);
    var testData = 'testData';
    var wasCalled = false;
    broker.registerEventListener('testEventPing', function (eventType, data) {
        assertEquals(testData, data);
        wasCalled = true;
    });
    broker.registerEventListener('testEventPong', function (eventType, data) {
        fail(); // this should not be called
    });

    broker.fireEvent('testEventPing', testData, base.IBroker.EventScope.LOCAL);
    assertTrue(wasCalled);
    gWasCalled = true;
};

function testEventsFake () {
    var broker = new base.FakeBroker('test');
    var testData = 'testData';
    var wasCalled = false;
    broker.registerEventListener('testEventPing', function (eventType, data) {
        assertEquals(testData, data);
        wasCalled = true;
    });

    broker.fireEvent('testEventPing', testData);
    assertTrue(wasCalled);
    gWasCalled = true;
};


function tearDown () {
    assertTrue(gWasCalled);
}

gAsyncTestCase = goog.testing.AsyncTestCase.createAndInstall();










