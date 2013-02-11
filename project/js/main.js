/**
 * @license
 * Copyright (C) 2012 Adam Rzepka
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

goog.require('goog.debug.FancyWindow');
goog.require('flags');
goog.require('base');
goog.require('base.Mat4');
goog.require('base.IInputHandler');
goog.require('renderer.Renderer');
goog.require('base.workers.Broker');

if (!flags.GAME_WORKER) {
    goog.require('game');
}

var DEFAULT_MAP = 'oa_rpg3dm2';

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return unescape(pair[1]);
        }
    }
    return null;
}

function initWebGL(canvas) {
    var gl = null;

    try {
	// Try to grab the standard context. If it fails, fallback to experimental.
	gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    }
    catch(e) {}

    // If we don't have a GL context, give up now
    if (!gl) {
	alert("Unable to initialize WebGL. Your browser may not support it.");
    }
    return gl;
}

function initInput(broker) {
    var inputBuffer = broker.createProxy('base.IInputHandler', base.IInputHandler);
    var capturing = false;
    var locked = false;
    var tryLock = true;
    var focused = true;
    var lastX = 0, lastY = 0;
    var elem = document.getElementById('glcanvas');
    elem.requestMouseLock = elem.requestMouseLock ||
        elem.mozRequestPointerLock ||
        elem.webkitRequestPointerLock;
    
    document.addEventListener('keydown', function (ev) {
        inputBuffer.onKeyDown(ev.keyCode);
    }, false);

    document.addEventListener('keyup', function (ev) {
        inputBuffer.onKeyUp(ev.keyCode);
    }, false);

    elem.addEventListener('mousedown', function (ev) {
        if (!locked) {
            if (tryLock) {
                elem.requestMouseLock();
                tryLock = false;
            } else {
                capturing = true;
            }
        }
        inputBuffer.onKeyDown(ev.button);
    }, false);

    document.addEventListener('mouseup', function (ev) {
        capturing = false;
        inputBuffer.onKeyUp(ev.button);
    }, false);

    document.addEventListener('mousemove', function (ev) {
        var dx = ev.movementX || ev.webkitMovementX || ev.mozMovementX ||
                ev.clientX - lastX;
        var dy = ev.movementY || ev.webkitMovementY || ev.mozMovementY ||
                ev.clientY - lastY;

        lastX = ev.clientX;
        lastY = ev.clientY;

        if (capturing || locked) {
            inputBuffer.onMouseMove(dx, dy);
        }
    }, false);

    function pointerLockChange() {
        if (document.mozPointerLockElement === elem ||
            document.webkitPointerLockElement === elem) {
            locked = true;
        } else {
            locked = false;
            tryLock = true;
        }
    }
    document.addEventListener('pointerlockchange', pointerLockChange, false);
    document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
    document.addEventListener('mozpointerlockchange', pointerLockChange, false);

    function pointerLockError() {
        locked = false;
        tryLock = true;
    }
    document.addEventListener('pointerlockerror', pointerLockError, false);
    document.addEventListener('webkitpointerlockerror', pointerLockError, false);
    document.addEventListener('mozpointerlockerror', pointerLockError, false);
}

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame || window.msRequestAnimationFrame ||
    window.oRequestAnimationFrame || function (fn) { setTimeout(fn, 16); };


function main() {
    var render;
    var canvas = document.getElementById('glcanvas');

    var gl = initWebGL(canvas);
    var map = getQueryVariable('map') || DEFAULT_MAP;

    var lastTime = Date.now();
    var fpsCounter = 0;
    var fpsTime = 0;
    var worker;
    var broker;

    if (flags.DEBUG_WINDOW) {
	var debugWindow = new goog.debug.FancyWindow('main');
	debugWindow.setEnabled(true);
	debugWindow.init();
    }

    function update() {
        fpsTime += Date.now() - lastTime;
	lastTime = Date.now();

	++fpsCounter;
	if (fpsTime > 1000) {
	    fpsTime -= 1000;
	    document.getElementById('fps').textContent = fpsCounter;
	    fpsCounter = 0;
	}

	render.render();
	requestAnimationFrame(update);
    }

    render = new renderer.Renderer(gl);

    if (flags.GAME_WORKER) {
        worker = new Worker('js/initworker.js');
        broker = new base.workers.Broker('game', worker);
    }
    else {
        broker = new base.workers.FakeBroker('game');
    }

    broker.registerReceiver('base.IRenderer', render);

    if (!flags.GAME_WORKER) {
        game.init();
    }
    initInput(broker);
    requestAnimationFrame(update);
}

goog.exportSymbol('main', main);
