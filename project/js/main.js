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
// goog.require('base');
// goog.require('base.Mat4');
goog.require('system.Game');

// if (!flags.GAME_WORKER) {
//     goog.require('game');
// }

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

// function initInput(broker) {
//     var inputBuffer = broker.createProxy('base.IInputHandler', base.IInputHandler);
//     var capturing = false;
//     var locked = false;
//     var tryLock = true;
//     var focused = true;
//     var lastX = 0, lastY = 0;
//     var elem = document.getElementById('glcanvas');
//     elem.requestMouseLock = elem.requestMouseLock ||
//         elem.mozRequestPointerLock ||
//         elem.webkitRequestPointerLock;
    
//     document.addEventListener('keydown', function (ev) {
//         inputBuffer.onKeyDown(ev.keyCode);
//     }, false);

//     document.addEventListener('keyup', function (ev) {
//         inputBuffer.onKeyUp(ev.keyCode);
//     }, false);

//     elem.addEventListener('mousedown', function (ev) {
//         if (!locked) {
//             if (tryLock) {
//                 elem.requestMouseLock();
//                 tryLock = false;
//             } else {
//                 capturing = true;
//             }
//         }
//         inputBuffer.onKeyDown(ev.button);
//     }, false);

//     document.addEventListener('mouseup', function (ev) {
//         capturing = false;
//         inputBuffer.onKeyUp(ev.button);
//     }, false);

//     document.addEventListener('mousemove', function (ev) {
//         var dx = ev.movementX || ev.webkitMovementX || ev.mozMovementX ||
//                 ev.clientX - lastX;
//         var dy = ev.movementY || ev.webkitMovementY || ev.mozMovementY ||
//                 ev.clientY - lastY;

//         lastX = ev.clientX;
//         lastY = ev.clientY;

//         if (capturing || locked) {
//             inputBuffer.onMouseMove(dx, dy);
//         }
//     }, false);

//     function pointerLockChange() {
//         if (document.mozPointerLockElement === elem ||
//             document.webkitPointerLockElement === elem) {
//             locked = true;
//         } else {
//             locked = false;
//             tryLock = true;
//         }
//     }
//     document.addEventListener('pointerlockchange', pointerLockChange, false);
//     document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
//     document.addEventListener('mozpointerlockchange', pointerLockChange, false);

//     function pointerLockError() {
//         // Failed to lock pointer. Run in capture mode
//         locked = false;
//         tryLock = false;
//     }
//     document.addEventListener('pointerlockerror', pointerLockError, false);
//     document.addEventListener('webkitpointerlockerror', pointerLockError, false);
//     document.addEventListener('mozpointerlockerror', pointerLockError, false);
// }

// function initResources(broker, scene, mapArchive, archives, callback) {
//     var i;
//     var rm = new files.ResourceManager();
//     var deferred;
//     var deferreds = [];
//     function onload (archive) {
//         var key;
//         scene.buildShaders(archive.scripts, archive.textures);
//         for ( key in archive.models )
//         {
//             if (archive.models.hasOwnProperty(key)) {
//                 broker.fireEvent('model_loaded', {
//                     url: key,
//                     model: archive.models[key]
//                 });
//                 scene.registerMd3(archive.models[key]);
//             }
//         }
//         for( key in archive.configs )
//         {
//             if (archive.configs.hasOwnProperty(key)) {
//                 broker.fireEvent('config_loaded', {
//                     url: key,
//                     config: archive.configs[key]
//                 });
//             }
//         }
//         if (archive.map) {
//             broker.fireEvent('map_loaded', {
//                 models: archive.map.models,
//                 lightmapData: null,  // game worker doesn't need lightmap
//                 bsp: archive.map.bsp,
//                 entities: archive.map.entities
//             });
//             scene.registerMap(archive.map.models, archive.map.lightmapData);

//         }
//     };

//     deferreds[0] = rm.load(mapArchive).addCallback(onload);

//     for (i = 0; i < archives.length; ++i) {
//         deferred = rm.load(archives[i]);
// //        deferred.awaitDeferred(deferreds[0]);
//         deferred.addCallback(onload);
//         deferreds.push(deferred);
//     }
//     goog.async.DeferredList.gatherResults(deferreds).addCallback(callback);
// };

// window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
//     window.webkitRequestAnimationFrame || window.msRequestAnimationFrame ||
//     window.oRequestAnimationFrame || function (fn) { setTimeout(fn, 16); };

function main() {
    var scene;
    var canvas = document.getElementById('glcanvas');

    var gl = initWebGL(canvas);
    var map = getQueryVariable('map') || DEFAULT_MAP;
    var matchId = getQueryVariable('id');
    // var lastTime = Date.now();
    // var fpsCounter = 0;
    // var fpsTime = 0;
    // var worker;
    // var broker;

    if (flags.DEBUG_WINDOW) {
	var debugWindow = new goog.debug.FancyWindow('main');
	debugWindow.setEnabled(true);
	debugWindow.init();
    }
    
    var mylocation = window.location.origin.replace(/^http:\/\//, '').replace(/:800[0-9]$/, '');
    var config = {
        gl: gl,
        inputElement: canvas,
        lobbyUrl: 'ws://' + mylocation + ':8003',
        playerData: {
            'name': 'player',
            'model': 'assassin',
            'gameId': system.INVALID_ID
        },
        createMatch: matchId === null,
        matchData: {
            'level': 'aggressor'
        },
        onMatchCreated: function (matchId) {
            var port = goog.COMPILED ? 8002 : 8001;
            var link = 'http://' + mylocation + ':' + port + '?id=' + matchId;
            document.getElementById('link').innerHTML =
                'Link to this match: <a href="' + link + '">' + link + '</a>';
        },
        matchId: matchId
    };
    var game = new system.Game(config);

//     function update() {
//         fpsTime += Date.now() - lastTime;
// 	lastTime = Date.now();

// 	++fpsCounter;
// 	if (fpsTime > 1000) {
// 	    fpsTime -= 1000;
// 	    document.getElementById('fps').textContent = fpsCounter;
//             // document.getElementById('time').textContent =
//             //     base.Broker.sumTime / base.Broker.countTime;
//             // base.Broker.sumTime = base.Broker.countTime = 0;
// 	    fpsCounter = 0;
// 	}

// 	scene.render();
// //        setTimeout(update, 200);
// 	requestAnimationFrame(update);
//     }

    // scene = new renderer.Scene(gl);

//     if (flags.GAME_WORKER) {
// //        worker = new Worker('js/initworker.js');
// //        broker = new base.Broker('game', worker);
//         broker = base.Broker.createWorker(['game'], ['base.js', 'game.js'], 'game');
//         broker.executeFunction(function () {
//             game.init();
//         }, []);
//     }
//     else {
//         broker = new base.FakeBroker('game');
//         game.init();
//     }

//     broker.registerReceiver('base.IRendererScene', scene);

//     initResources(broker, scene, map, ['assassin', 'weapons'], function () {
//         broker.fireEvent('game_start');
//     });
    
//     if (!flags.GAME_WORKER) {
//         game.init();
//     }
//     initInput(broker);
//     requestAnimationFrame(update);
}

goog.exportSymbol('main', main);
