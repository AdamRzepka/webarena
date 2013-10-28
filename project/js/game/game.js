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

goog.require('flags');
goog.require('base');
goog.require('base.IRendererScene');
goog.require('base.Broker');
goog.require('base.Mat3');
goog.require('files.ResourceManager');
goog.require('files.bsp');
goog.require('files.md3');
goog.require('files.ShaderScriptLoader');
goog.require('game.InputBuffer');
goog.require('game.InputHandler');
goog.require('game.FreeCamera');
goog.require('game.CharacterController');
goog.require('game.globals');
goog.require('game.ModelManager');
goog.require('game.Player');

goog.provide('game');

/**
 * @param {base.IBroker} broker
 */
game.init = function (broker) {
    var scene;
    var inputBuffer = new game.InputBuffer();
    var inputHandler = new game.InputHandler();
    var rm = new files.ResourceManager();
    var mapName = 'aggressor';
    
    broker.registerReceiver('base.IInputHandler', inputHandler);
    
    scene = /**@type{base.IRendererScene}*/broker.createProxy('base.IRendererScene',
                                                              base.IRendererScene);
    
    rm.load([mapName, 'assassin', 'weapons'], function () {
	var map, md3;
	files.ShaderScriptLoader.loadAll(rm.getScripts());
        scene.buildShaders(files.ShaderScriptLoader.shaderScripts,
					     rm.getTextures());
	
	map = files.bsp.load(rm.getMap());
        scene.registerMap(map.models, map.lightmapData);

	map.models.forEach(function (model) {
            scene.registerModelInstance(model.id,
	                                base.Mat4.identity(),
                                        0,
                                        function (id) {
                                            model.id = id;
                                        });
	});
	
        var camera = new game.FreeCamera(inputBuffer, base.Vec3.create([0,0,0]));
        
        var modelManager = new game.ModelManager(scene, rm);
        var player = new game.Player(modelManager, rm, 'assassin', 'default');
        var characterController = new game.CharacterController(map.bsp, inputBuffer, player);
        var spawnPoints = map.getSpawnPoints();
        var spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        
        characterController.respawn(/**@type{base.Vec3}*/spawnPoint['origin'],
            spawnPoint['angle'] * Math.PI / 180 - Math.PI * 0.5);
        scene.updateCamera(characterController.getCameraMatrix());

        function update () {
            var spawnPoint;

            inputHandler.step();
            inputBuffer.step(inputHandler.getState());

            if (inputBuffer.hasActionStarted(game.InputState.Action.RESPAWN)) {
                spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        
                characterController.respawn(/**@type{base.Vec3}*/spawnPoint['origin'],
                    spawnPoint['angle'] * Math.PI / 180 - Math.PI * 0.5);
            }

            if (game.globals.freeCameraControl || game.globals.freeCamera) {
                camera.update();
            } else {
                characterController.update();
            }
            if (game.globals.freeCameraView || game.globals.freeCamera) {
                scene.updateCamera(camera.getCameraMatrix());
            } else {
                scene.updateCamera(characterController.getCameraMatrix());
            }                

            modelManager.syncWithRenderer();
        };
        setInterval(update, game.globals.TIME_STEP_MS);
    });
};

goog.exportSymbol('game.init', game.init);
