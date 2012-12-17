goog.require('InputHandler');
goog.require('base.Mat4');
goog.require('base.Vec3');

goog.provide('game.Camera');

/**
 * @constructor
 */
game.Camera = function(input, startPosition)
{
    var self = this;

    self.input = input;
    self.position = base.Vec3.create(startPosition);
    self.rotation = base.Mat4.identity();
    base.Mat4.rotateX(self.rotation, (Math.PI / 2));
    self.speed = 4.0;

    self.camMtx = base.Mat4.identity();
    base.Mat4.rotateX(self.camMtx, Math.PI / 2.0);
    base.Mat4.translate(self.camMtx, self.position);

};

game.Camera.prototype.update = function()
{
    var dirty = false;
    var dir = base.Vec3.create([0.0, 0.0, 0.0]);

    if (this.input.keyPressed("W"))
    {
	dir[2] -= this.speed;
	dirty = true;
    }

    if (this.input.keyPressed("S"))
    {
	dir[2] += this.speed;
	dirty = true;
    }

    if (this.input.keyPressed("A"))
    {
	dir[0] -= this.speed;
	dirty = true;
    }

    if (this.input.keyPressed("D"))
    {
	dir[0] += this.speed;
	dirty = true;
    }
    if (this.input.mouseDown)
    {
	var globalRot = base.Mat4.identity();
	base.Mat4.rotateZ(globalRot, -this.input.mouseDeltaXY.x / 50.0);
	this.rotation = base.Mat4.multiply(globalRot, this.rotation);
	var localRot = base.Mat4.identity();
	base.Mat4.rotateX(localRot, -this.input.mouseDeltaXY.y / 50.0);
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
};

game.Camera.prototype.getCameraMatrix = function () {
    return this.camMtx;
};
