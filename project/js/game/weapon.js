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

goog.require('base');
goog.require('network');
goog.provide('game.Weapon');
goog.provide('game.MachineGun');

/**
 * @interface
 */
game.Weapon = function() {};

/**
 * @param {number} dt
 * @param {base.Mat4} mtx
 */
game.Weapon.prototype.update = function (dt, mtx) {};

game.Weapon.prototype.shoot = function () {};

/**
 * @constructor
 * @implements {game.Weapon}
 * @param {game.ModelManager} mm
 */
game.MachineGun = function (mm) {
    /**
     * @private
     * @type {base.ModelInstance}
     */
    this.weapon = mm.makeInstance('models/weapons2/machinegun/machinegun.md3');
    /**
     * @private
     * @type {base.ModelInstance}
     */
    this.flash = mm.makeInstance('models/weapons2/machinegun/machinegun_flash.md3');
    /**
     * @private
     * @type {base.ModelInstance}
     */
    this.barrel = mm.makeInstance('models/weapons2/machinegun/machinegun_barrel.md3');
     
    this.rollingSpeed = 0;
    this.angle = 2 * Math.PI;

    this.flash.setVisibility(false);
    this.lastShootInterval = game.MachineGun.SHOOT_INTERVAL * 2;
};

game.MachineGun.SHOOT_INTERVAL = 100;

game.MachineGun.prototype.update = function (dt, mtx) {
    this.weapon.setMatrix(mtx);

    if (this.rollingSpeed > 0) {
        this.rollingSpeed -= 0.01;
        if (this.rollingSpeed < 0) {
            this.rollingSpeed = 0;
        }
        this.angle -= this.rollingSpeed;
        if (this.angle < 0) {
            this.angle += 2 * Math.PI;
        }
    }

    this.lastShootInterval += dt;
    if (this.lastShootInterval > 100) {
        this.flash.setVisibility(false);
    }
    
    var barrelMtx = this.barrel.getMatrix();
    base.Mat4.rotateX(this.weapon.baseModel.framesData[0].tags[0], this.angle, barrelMtx);
    base.Mat4.multiply(mtx, barrelMtx, barrelMtx);
    this.barrel.setMatrix(barrelMtx);
    
    var flashMtx = this.flash.getMatrix();
    base.Mat4.multiply(mtx, this.weapon.baseModel.framesData[0].tags[1], flashMtx);
    this.flash.setMatrix(flashMtx);
};

game.MachineGun.prototype.shoot = function () {
    this.rollingSpeed = 0.3;
    this.flash.setVisibility(true);
    this.lastShootInterval = 0;
};

/**
 * @public
 * @param {network.ISynchronizer} sync
 * @suppress {checkTypes}
 */
game.MachineGun.prototype.synchronize = function (sync) {
    this.rollingSpeed = sync.synchronize(this.rollingSpeed, network.Type.FLOAT32, 0);
    this.lastShootInterval = sync.synchronize(this.lastShootInterval, network.Type.INT32, 0);
    if (sync.getMode() == network.ISynchronizer.Mode.WRITE) {
        var flashing = sync.synchronize(this.flash.getVisibility(), network.Type.BOOL, 0);
        if (flashing !== this.flash.getVisibility()) {
            this.flash.setVisibility(flashing);
        }
    }
    else {
        sync.synchronize(this.flash.getVisibility(), network.Type.BOOL, 0);
    }
};

