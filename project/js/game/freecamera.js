/**
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

goog.require('base.Mat4');
goog.require('base.Vec3');
goog.require('game.InputBuffer');
goog.require('network');

goog.provide('game.FreeCamera');

/**
 * @constructor
 * @param {game.InputBuffer} input
 * @param {base.Vec3} startPosition
 */
game.FreeCamera = function(input, startPosition)
{
    var self = this;

    self.input = input;
    self.position = base.Vec3.create(startPosition);
    self.rotation = base.Mat4.identity();
    base.Mat4.rotateX(self.rotation, (Math.PI / 2));
    self.speed = 4.0;
    self.dirty = false;
    
    self.camMtx = base.Mat4.identity();
    base.Mat4.rotateX(self.camMtx, Math.PI / 2.0);
    base.Mat4.translate(self.camMtx, self.position);
};

game.FreeCamera.prototype.synchronize = function (sync) {
    this.position = sync.synchronize(this.position, network.Type.VEC3, 0);
    this.rotation = sync.synchronize(this.rotation, network.Type.MTX4, 0);
    if (sync.getMode() === network.ISynchronizer.Mode.WRITE) {
        self.dirty = true;
    };
};

/**
 * @public
 */
game.FreeCamera.prototype.update = function()
{
    var dirty = self.dirty;
    var dir = base.Vec3.create([0.0, 0.0, 0.0]);

    if (this.input.getAction(base.InputState.Action.UP))
    {
	dir[2] -= this.speed;
	dirty = true;
    }

    if (this.input.getAction(base.InputState.Action.DOWN))
    {
	dir[2] += this.speed;
	dirty = true;
    }

    if (this.input.getAction(base.InputState.Action.LEFT))
    {
	dir[0] -= this.speed;
	dirty = true;
    }

    if (this.input.getAction(base.InputState.Action.RIGHT))
    {
	dir[0] += this.speed;
	dirty = true;
    }
    if (this.input.getAction(base.InputState.Action.FIRE))
    {
	var globalRot = base.Mat4.identity();
	base.Mat4.rotateZ(globalRot, -this.input.getDeltaX() / 50.0);
	this.rotation = base.Mat4.multiply(globalRot, this.rotation);
	var localRot = base.Mat4.identity();
	base.Mat4.rotateX(localRot, -this.input.getDeltaY() / 50.0);
	base.Mat4.multiply(this.rotation, localRot);

	dirty = true;
    }

    if (dirty)
    {
	base.Mat4.set(this.rotation, this.camMtx);
	//      mat4.transpose(this.viewMtx);
	base.Mat4.multiplyVec3(this.rotation, dir);
	base.Vec3.add(this.position, dir);
	//      mat4.translate(this.viewMtx, this.position);

	this.camMtx[12] = this.position[0];
	this.camMtx[13] = this.position[1];
	this.camMtx[14] = this.position[2];

	//      mat4.inverse(this.viewMtx);
	//     mat4.multiply(this.perspectiveMtx, this.viewMtx, this.pVtx);
    }
    self.dirty = false;
};

/**
 * @public
 * @return {base.Mat4}
 */
game.FreeCamera.prototype.getCameraMatrix = function () {
    return this.camMtx;
};
