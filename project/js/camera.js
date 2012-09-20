goog.require('input');
goog.require('gl-matrix');
goog.provide('camera');

function Camera(input, startPosition)
{
    var self = this;

    self.input = input;
    self.position = vec3.create(startPosition);
    self.rotation = mat4.identity();
    mat4.rotateX(self.rotation, (Math.PI / 2));
    self.speed = 1.0;

    self.camMtx = mat4.identity();
    mat4.rotateX(self.camMtx, Math.PI / 2.0);
    mat4.translate(self.camMtx, self.position);

    // self.perspectiveMtx = mat4.create();
    // mat4.perspective(45, 1.6, 0.5, 2048, self.perspectiveMtx);

    // self.pVtx = mat4.create();
    // mat4.multiply(self.perspectiveMtx, self.viewMtx, self.pVtx);
}

Camera.prototype.update = function()
{
    var dirty = false;
    var dir = vec3.create([0.0, 0.0, 0.0]);

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
	var globalRot = mat4.identity();
	mat4.rotateZ(globalRot, -this.input.mouseDeltaXY.x / 50.0);
	this.rotation = mat4.multiply(globalRot, this.rotation);
	var localRot = mat4.identity();
	mat4.rotateX(localRot, -this.input.mouseDeltaXY.y / 50.0);
	mat4.multiply(this.rotation, localRot);

	dirty = true;
    }

    if (dirty)
    {
	mat4.set(this.rotation, this.camMtx);
	//      mat4.transpose(this.viewMtx);
	mat4.multiplyVec3(this.rotation, dir);
	vec3.add(this.position, dir);
	//      mat4.translate(this.viewMtx, this.position);

	this.camMtx[12] = this.position[0];
	this.camMtx[13] = this.position[1];
	this.camMtx[14] = this.position[2];

	//      mat4.inverse(this.viewMtx);
	//     mat4.multiply(this.perspectiveMtx, this.viewMtx, this.pVtx);
    }
};

Camera.prototype.getCameraMatrix = function () {
    return this.camMtx;
}
