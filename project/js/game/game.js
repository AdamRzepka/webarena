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
goog.require('base.events');
goog.require('base.IRendererScene');
goog.require('base.Broker');
goog.require('base.Mat3');
goog.require('base.Map');
//goog.require('files.ResourceManager');
//goog.require('files.bsp');
//goog.require('files.md3');
//goog.require('files.ShaderScriptLoader');
goog.require('game.InputBuffer');
goog.require('game.FreeCamera');
goog.require('game.CharacterController');
goog.require('game.globals');
goog.require('game.ModelManager');
goog.require('game.Player');
goog.require('game.DummyRendererScene');
goog.require('game.Scene');
goog.require('network');
goog.require('network.Client');
goog.require('network.Server');

goog.provide('game');

/**
 * @param {base.IBroker} broker
 * @param {boolean} isServer
 * @param {number} clientId client only
 */
game.init = function (broker, isServer, clientId) {
    var scene;
    var modelManager;
    var map;
    var configs = {};
    var inputBuffer = [];

    //var rm = new files.ResourceManager();
    //var mapName = 'aggressor';

    // var broker = base.IBroker.parentInstance;

    if (isServer) {
        scene = new game.DummyRendererScene();
    } else {
        scene = /**@type{base.IRendererScene}*/broker.createProxy('base.IRendererScene',
                                                                  base.IRendererScene);
    }
    modelManager = new game.ModelManager(scene);
    
    broker.registerEventListener(base.EventType.MODEL_LOADED, function (evt, data) {
        modelManager.registerModel(data.url, data.model);
    });

    broker.registerEventListener(base.EventType.MAP_LOADED, function (evt, data) {
        var i = 0;
        map = data;
        for (i = 0; i < map.models.length; ++i) {
            scene.registerModelInstance(map.models[i].id, base.Mat4.identity(), 0,
                                        function (id) {});
        }
    });

    broker.registerEventListener(base.EventType.CONFIG_LOADED, function (evt, data) {
        configs[data.url] = data.config;
    });


    broker.registerEventListener(base.EventType.GAME_START, function (evt, data) {
	
        var camera = new game.FreeCamera(inputBuffer[1], base.Vec3.create([0,0,0]));
        
        // var player = new game.Player(modelManager, configs, 'assassin', 'default');
        // var characterController = new game.CharacterController(map.bsp, player, inputBuffer[0]);
        var gameScene = new game.Scene(scene, (/**@type {base.Map}*/map), modelManager, configs);

        var inputState = [];
        var client, server;
        // /**
        //  * @suppress {checkTypes}
        //  */
        // function registerClasses(classInfoManager) {
        //     var cim = classInfoManager;
        //     cim.registerClass(game.CharacterController, function () {
        //         return new game.CharacterController(map.bsp, inputBuffer[0], player);
        //     });
        //     cim.registerClass(game.Player, function () {
        //         return new game.Player(modelManager, configs, 'assassin', 'default');
        //     });
        //     cim.registerClass(game.FreeCamera, function () {
        //         return new game.FreeCamera(inputBuffer[1], base.Vec3.create([0,0,0]));
        //     });

        // };

        if (!isServer) {
            client = new network.Client(broker, gameScene);
            gameScene.registerClasses(client.getClassInfoManager());
//            registerClasses(client.getClassInfoManager());
        } else {
            server = new network.Server(broker, gameScene);
            gameScene.registerClasses(server.getClassInfoManager());
//            registerClasses(server.getClassInfoManager());
            
            broker.registerEventListener(base.EventType.INPUT_UPDATE, function (evt, data) {
                var tmp = readClientUpdate(data.inputState);
                server.onClientInput(data.playerId, tmp.timestamp);
                inputState[data.playerId] = tmp.state;
            });
            broker.registerEventListener(base.EventType.PLAYER_CONNECTED, function (evt, data) {
                var id = data['gameId'];
                server.addClient(id);
                inputState[id] = new base.InputState();
                inputBuffer[id] = new game.InputBuffer();
                gameScene.addPlayer(id, 'assassin', inputBuffer[id]);
            });
        }
        
//        scene.updateCamera(characterController.getCameraMatrix());

        function update () {
            var i=0;
            var spawnPoint;

            for (i = 0; i < inputBuffer.length; ++i) {
                inputBuffer[i].step(inputState[i]);                
            }

            // if (inputBuffer.hasActionStarted(base.InputState.Action.RESPAWN)) {
            //     spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        
            //     characterController.respawn(/**@type{base.Vec3}*/spawnPoint['origin'],
            //         spawnPoint['angle'] * Math.PI / 180 - Math.PI * 0.5);
            // }

            // if (game.globals.freeCameraControl || game.globals.freeCamera) {
            //     camera.update();
            // } else {
            //     characterController.update();
            // }
            gameScene.update();
            // if (game.globals.freeCameraView || game.globals.freeCamera) {
            //     scene.updateCamera(camera.getCameraMatrix());
            // } else {
            //     scene.updateCamera(characterController.getCameraMatrix());
            // }
            if (!isServer && gameScene.characters_[clientId]) {
                gameScene.characters_[clientId].getPlayer().setFppMode();
                scene.updateCamera(gameScene.characters_[clientId].getCameraMatrix());
            }

            if (isServer) {
                server.update(1/60);
            };

            modelManager.syncWithRenderer();
        };
        setInterval(update, game.globals.TIME_STEP_MS);
    });
};

goog.exportSymbol('game.init', game.init);

function readClientUpdate(buffer) {
    var dv = new DataView(buffer);
    var state = new base.InputState();
    var timestamp = dv.getUint32(0, true);
    base.InputState.deserialize(state, dv, 4);
    return {
        timestamp: timestamp,
        state: state
    };
}

