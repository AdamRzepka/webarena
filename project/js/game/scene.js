/**
 * Copyright (C) 2014 Adam Rzepka
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

goog.require('goog.asserts');

goog.require('base.IRendererScene');
goog.require('network');
goog.require('network.ClassInfo');
goog.require('game.Player');
goog.require('game.CharacterController');
goog.require('game.InputBuffer');
goog.require('game.MachineGun');
goog.require('base.IHud');

goog.provide('game.Scene');

/**
 * @constructor
 * @implements {network.ISynchronizable}
 * @param {base.IRendererScene} renderer
 * @param {base.Map} map
 * @param {game.ModelManager} modelManager
 * @param {number} myPlayerId
 * @param {Object.<string,string>} configs TODO: this is ugly
 * @param {base.IHud} hud
 */
game.Scene = function (renderer, map, modelManager, myPlayerId, configs, hud) {
    this.globalTime_ = 0;
    this.lastTime_ = 0;
    this.configs_ = configs;
    this.modelManager_ = modelManager;
    this.renderer_ = renderer;

    this.map_ = map;
    this.characters_ = [];
    this.myPlayerId_ = myPlayerId;
    this.hud = hud;
};
/**
 * @param {number} id
 * @param {string} model
 */
game.Scene.prototype.addPlayer = function (id, model) {
    goog.asserts.assert(!this.characters_[id]);
    
    var player = new game.Player(this.modelManager_, this.configs_, model);
    var controller = new game.CharacterController(this.map_.bsp, player, id == this.myPlayerId_,
                                                 this.modelManager_, this.hud);

    this.characters_[id] = controller;

    var spawnPoint = this.getSpawnPoint();
    controller.respawn(spawnPoint);
};

game.Scene.prototype.getSpawnPoint = function () {
    var spawnPoints = base.Map.getSpawnPoints(this.map_);
    var spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    return spawnPoint;
};

game.Scene.prototype.updateServer = function (dt, inputs) {
    var i = 0;
    for (i = 0; i < this.characters_.length; ++i) {
        if (this.characters_[i]) {
            this.characters_[i].updateServer(dt, inputs[i], this);
        }
    }
};
game.Scene.prototype.updateClient = function (dt, input) {
    var i = 0;
    for (i = 0; i < this.characters_.length; ++i) {
        if (this.characters_[i]) {
            if (i === this.myPlayerId_ && input && dt > 0) {
                this.characters_[i].updateServer(dt, input, this);
            }
            else {
                this.characters_[i].updateClient(dt);
            }
        }
    }
};

/**
 * @param {network.ISynchronizer} sync
 * @suppress {checkTypes}
 */
game.Scene.prototype.synchronize = function (sync) {
    this.characters_ = sync.synchronize(this.characters_, network.Type.OBJECT,
                                        network.Flags.ARRAY);
    if (this.myPlayerId_ != -1 && this.characters_[this.myPlayerId_]) {
        this.characters_[this.myPlayerId_].owned = true;
    }
};
/**
 * @param {network.ClassInfoManager} classInfoManager
 * @suppress {checkTypes}
 */
game.Scene.prototype.registerClasses = function (classInfoManager) {
    var cim = classInfoManager;
    var that = this;
    cim.registerClass(game.Scene, function () {
        return new game.Scene(that.renderer_, that.map_, that.modelManager_, that.configs_);
    });
    this.__networkClassId__ = game.Scene.prototype.__networkClassId__; // FIXME
    
    cim.registerClass(game.CharacterController, function () {
        var player = new game.Player(that.modelManager_, that.configs_, 'assassin', 'default');
        return new game.CharacterController(that.map_.bsp, player, false,
                                           that.modelManager_, that.hud);
    });
    cim.registerClass(game.MachineGun, function () {
        return new game.MachineGun(that.modelManager_);
    });
    // cim.registerClass(game.Player, function () {
    //     return new game.Player(that.modelManager_, that.configs_, 'assassin', 'default');
    // });
};

/**
 * @return {game.CharacterController} Hit player or null
 */
game.Scene.prototype.rayCastPlayers = function (from, to, character) {
    var i = 0;
    var minPlayerFraction = 1, playerFraction;
    var hitPlayer = null;
    for (i = 0; i < this.characters_.length; ++i) {
        if (this.characters_[i] === character)  // don't shoot yourself
            continue;

        playerFraction = this.characters_[i].getPlayer().rayCastMe(from, to);
        if (minPlayerFraction > playerFraction) {
            minPlayerFraction = playerFraction;
            hitPlayer = this.characters_[i];
        }
    }

    if (!hitPlayer) {
        return null;
    }

    var dif = base.Vec3.subtract(to, from, base.Vec3.create());
    var point = base.Vec3.add(from, base.Vec3.scale(dif, minPlayerFraction), base.Vec3.create());

    var mapTrace = base.Bsp.trace(this.map_.bsp, from, point, 0);
    var mapHit = mapTrace.fraction < 1;

    if (!mapHit) {
        return hitPlayer;
    } else {
        return null;
    }
};

