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

goog.require('base');
goog.require('base.Mat4');
goog.require('base.Vec3');
goog.require('game.ModelManager');
goog.require('files.ResourceManager');

goog.provide('game.Player');

/**
 * @constructor
 * @param {game.ModelManager} mm
 * @param {files.ResourceManager} rm
 * @param {string} name
 * @param {string} [skin]
 */
game.Player = function (mm, rm, name, skin) {
    var path = game.Player.PLAYERS_PATH + name + '/';
    var that = this;
    var visible = game.globals.tppMode;
    
    skin = skin || 'default';
    /**
     * @private
     * @const
     * @type {base.ModelInstance}
     */
    this.head = mm.makeInstance(path + 'head.md3', null, skin);
    /**
     * @private
     * @const
     * @type {base.ModelInstance}
     */
    this.torso = mm.makeInstance(path + 'upper.md3', null, skin);
    /**
     * @private
     * @const
     * @type {base.ModelInstance}
     */
    this.legs = mm.makeInstance(path + 'lower.md3', null, skin);
    /**
     * @private
     * @const
     * @type {base.ModelInstance}
     */
    this.weapon = mm.makeInstance('models/weapons2/lightning/lightning.md3');

    /**
     * @private
     * @const
     * @type {number}
     */
    this.headTag = this.torso.baseModel.tags.indexOf(game.Player.Tags.HEAD);
    /**
     * @private
     * @const
     * @type {number}
     */
    this.torsoTag = this.legs.baseModel.tags.indexOf(game.Player.Tags.TORSO);
    /**
     * @private
     * @const
     * @type {number}
     */
    this.weaponTag = this.torso.baseModel.tags.indexOf(game.Player.Tags.WEAPON);
    
    that.head.setVisibility(visible);
    that.torso.setVisibility(visible);
    that.legs.setVisibility(visible);

    game.globals.onTppModeChange = function (tppOn) {
        that.head.setVisibility(tppOn);
        that.torso.setVisibility(tppOn);
        that.legs.setVisibility(tppOn);
    };
};
/**
 * @enum {string}
 */
game.Player.Tags = {
    HEAD: 'tag_head',
    TORSO: 'tag_torso',
    WEAPON: 'tag_weapon'
};

/**
 * @public
 * @param {base.Mat4} camMtx
 * @param {base.Vec3} position
 * @param {number} yaw
 * @param {number} pith
 */
game.Player.prototype.update = function (camMtx, position, yaw, pith) {
    var legsMtx, torsoMtx, headMtx, weaponMtx;
    legsMtx = this.legs.getMatrix();
    base.Mat4.identity(legsMtx);
    base.Mat4.translate(legsMtx, position);
    base.Mat4.rotateZ(legsMtx, yaw + Math.PI * 0.5);
    this.legs.setMatrix(legsMtx);

    torsoMtx = this.torso.getMatrix();
    base.Mat4.multiply(legsMtx, this.legs.baseModel.framesData[0].tags[this.torsoTag], torsoMtx);
    this.torso.setMatrix(torsoMtx);

    headMtx = this.head.getMatrix();
    base.Mat4.multiply(torsoMtx, this.torso.baseModel.framesData[0].tags[this.headTag], headMtx);
    this.head.setMatrix(headMtx);

    weaponMtx = this.weapon.getMatrix();
    if (game.globals.tppMode) {
        base.Mat4.multiply(torsoMtx, this.torso.baseModel.framesData[0].tags[this.weaponTag],
                           weaponMtx);
    } else {
        base.Mat4.translate(camMtx, game.Player.WEAPON_OFF, weaponMtx);
	base.Mat4.multiply(weaponMtx, game.Player.WEAPON_ROT, weaponMtx);
    }
    this.weapon.setMatrix(weaponMtx);
};

/**
 * @const
 * @private
 * @type {string}
 */
game.Player.PLAYERS_PATH = 'models/players/';
/**
 * @const
 * @private
 * @type {base.Vec3}
 */
game.Player.WEAPON_OFF = base.Vec3.create([10, -10, -4]);
/**
 * @const
 * @private
 * @type {base.Mat4}
 */
game.Player.WEAPON_ROT = base.Mat4.create([0, 0, -1, 0,
        			           -1, 0, 0, 0,
        			           0, 1, 0, 0,
        			           0, 0, 0, 1]);

