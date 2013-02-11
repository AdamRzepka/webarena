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
goog.require('base.IRenderer');
goog.require('base.workers.Broker');
goog.require('base.Mat3');
goog.require('files.ResourceManager');
goog.require('files.bsp');
goog.require('files.md3');
goog.require('files.ShaderScriptLoader');
goog.require('game.InputBuffer');
goog.require('game.FreeCamera');
goog.require('game.CharacterController');
goog.require('game.globals');
if (!flags.GAME_WORKER) {
    goog.require('renderer.Renderer');
}

goog.provide('game');

game.init = function () {
    var render;
    var broker;
    var input = new game.InputBuffer();
    if (flags.GAME_WORKER) {
        broker = new base.workers.Broker('main', self);
    } else {
        broker = new base.workers.FakeBroker('main');
    }
    broker.registerReceiver('base.IInputHandler', input);
    render = /**@type{base.IRenderer}*/broker.createProxy('base.IRenderer', base.IRenderer);
    var rm = new files.ResourceManager();
    var mapName = 'oa_rpg3dm2';
    var weaponId;
    var weaponMtx = base.Mat4.identity();
    rm.load([mapName, "lightning"], function () {
	var map, md3;
	files.ShaderScriptLoader.loadAll(rm.getScripts());
        render.buildShaders(files.ShaderScriptLoader.shaderScripts,
					     rm.getTextures());
	
	map = files.bsp.load(rm.getMap());
        render.registerMap(map.models, map.lightmapData);

	map.models.forEach(function (model) {
            render.registerModelInstance(base.ModelInstance.getNextId(),
	                                   model.id,
	                                   base.Mat4.identity());
	});
	
	md3 = files.md3.load(rm.getModel('models/weapons2/lightning/lightning.md3'));
        render.registerMd3(md3);
	weaponId = base.ModelInstance.getNextId();
        render.registerModelInstance(weaponId, md3.id, weaponMtx);

        var camera = new game.FreeCamera(input, base.Vec3.create([0,0,0]));
        var weaponOff = base.Vec3.create([10, -10, -4]);
        var weaponRot = base.Mat4.create([0, 0, -1, 0,
        			          -1, 0, 0, 0,
        			          0, 1, 0, 0,
        			          0, 0, 0, 1]);
        var characterController = new game.CharacterController(map.bsp, input);
        characterController.respawn(base.Vec3.createVal(2.124504804611206,
                                                        247.24835205078125,
                                                        276.1741943359375), 0);
        render.updateCamera(characterController.getCameraMatrix());
        function update () {
            input.step();

            characterController.update();
//            camera.update();
            render.updateCamera(characterController.getCameraMatrix());

            base.Mat4.translate(characterController.getCameraMatrix(), weaponOff, weaponMtx);
	    base.Mat4.multiply(weaponMtx, weaponRot, weaponMtx);
	    render.updateModel(weaponId, weaponMtx, 0);
        };
        setInterval(update, game.globals.TIME_STEP);
    });
};


goog.exportSymbol('game.init', game.init);
