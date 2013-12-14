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
goog.require('system.Client');

goog.require('goog.testing.AsyncTestCase');
goog.require('files.ResourceManager');

var gAsyncTestCase;
var gWasCalled = true;

function setUp() {
}

function testServerAndClient() {
    gWasCalled = false;
    gAsyncTestCase.stepTimeout = 30000;
    gAsyncTestCase.waitForAsync();
    base.Broker.INIT_WORKER_PATH = '../../initworker.js';
    var lobbyURL = 'ws://localhost:8003';
    var rm = new files.ResourceManager();
    var server = new system.Server({level: 'aggressor'}, lobbyURL, rm);
    server.onGameStarted = function (matchId) {
        console.log('server created');
        var canvas = document.getElementById('gl');
        var client = new system.Client(matchId, {
            name: 'player',
            model: 'assassin',
            gameId: system.INVALID_ID
            }, lobbyURL, canvas.getContext('webgl'), canvas, rm);
        client.onGameStarted = function () {
            console.log('client connected');
            gWasCalled = true;
            gAsyncTestCase.continueTesting();
        };
    };
}

function tearDown() {
    assertTrue(gWasCalled);
}

gAsyncTestCase = goog.testing.AsyncTestCase.createAndInstall();
