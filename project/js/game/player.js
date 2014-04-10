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
goog.require('network');
goog.require('base.math');
//goog.require('files.ResourceManager');

goog.provide('game.Player');

/**
 * @constructor
 * @implements {network.ISynchronizable}
 * @param {game.ModelManager} mm
 * @param {string} name
 * @param {string} [skin]
 */
game.Player = function (mm, configs, name, skin) {
    var path = game.Player.PLAYERS_PATH + name + '/';
    var that = this;
//    var visible = game.globals.tppMode;
    var visible = true;
    
    skin = skin || 'default';
    /**
     * @private
     * @type {game.Player.Entity}
     */
    this.head = new game.Player.Entity(mm.makeInstance(path + 'head.md3', null, skin));
    /**
     * @private
     * @type {game.Player.Entity}
     */
    this.torso = new game.Player.Entity(mm.makeInstance(path + 'upper.md3', null, skin));
    /**
     * @private
     * @type {game.Player.Entity}
     */
    this.legs = new game.Player.Entity(mm.makeInstance(path + 'lower.md3', null, skin));
    /**
     * @private
     * @const
     * @type {number}
     */
    this.headTag = this.torso.model.baseModel.tags.indexOf(game.Player.Tags.HEAD);
    /**
     * @private
     * @const
     * @type {number}
     */
    this.torsoTag = this.legs.model.baseModel.tags.indexOf(game.Player.Tags.TORSO);
    /**
     * @private
     * @const
     * @type {number}
     */
    this.weaponTag = this.torso.model.baseModel.tags.indexOf(game.Player.Tags.WEAPON);
    /**
     * @private
     * @type {base.Mat4}
     */
    this.weaponMtx = base.Mat4.identity();
    /**
     * @private
     * @const
     * @type {Array.<game.Player.Animation>}
     */
    this.animations = this.loadAnimations(path, configs);
    /**
     * @private
     * @type {game.Player.LegsStates}
     */
    this.legsState = game.Player.LegsStates.IDLE;
    /**
     * @private
     * @type {game.Player.TorsoStates}
     */
    this.torsoState = game.Player.TorsoStates.IDLE;
    /**
     * @private
     * @type {number}
     */
    this.lastYaw = 0;
    /**
     * @private
     * @type {number}
     */
    this.targetLegsAngle = 0;
    /**
     * @private
     * @type {number}
     */
    this.legsAngle = 0;
    /**
     * @private
     * @type {boolean}
     */
    this.tppMode = true;

    this.debugLines = [];

    this.legs.startAnimation(this.animations[game.Player.Animations.LEGS_IDLE], 0);
    this.torso.startAnimation(this.animations[game.Player.Animations.TORSO_STAND], 0);
    
    that.head.model.setVisibility(visible);
    that.torso.model.setVisibility(visible);
    that.legs.model.setVisibility(visible);

    // game.globals.onTppModeChange = function (tppOn) {
    //     that.head.model.setVisibility(tppOn);
    //     that.torso.model.setVisibility(tppOn);
    //     that.legs.model.setVisibility(tppOn);
    // };
    this.initDebugLines(mm.renderer);
    this.renderer = mm.renderer;
};

game.Player.prototype.initDebugLines = function (renderer) {
    var i = 0;
    var that = this;
    for (i = 0; i < 12; ++i) {
        renderer.registerLine(base.Vec3.create(),base.Vec3.create(),
                              base.Vec3.create([1,0,0]),base.Vec3.create([1,0,0]),
                              function (id) {
                                  that.debugLines.push(id);
                              });
    }
};

/**
 * @public
 * @param {network.ISynchronizer} sync
 * @suppress {checkTypes}
 */
game.Player.prototype.synchronize = function (sync) {
    
    // this.head = sync.synchronize(this.head, network.Type.OBJECT, 0);
    // this.torso = sync.synchronize(this.torso, network.Type.OBJECT, 0);
    // this.legs = sync.synchronize(this.legs, network.Type.OBJECT, 0);

    // this.legsState = sync.synchronize(this.legsState, network.Type.INT8, 0);
    // this.torsoState = sync.synchronize(this.torsoState, network.Type.INT8, 0);

    // this.lastYaw = sync.synchronize(this.lastYaw, network.Type.FLOAT32, 0);
    // this.targetLegsAngle = sync.synchronize(this.targetLegsAngle, network.Type.FLOAT32, 0);
    // this.legsAngle = sync.synchronize(this.legsAngle, network.Type.FLOAT32, 0);
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
game.Player.WEAPON_OFF = base.Vec3.create([8, -10, -4]);
/**
 * @const
 * @private
 * @type {base.Mat4}
 */
game.Player.WEAPON_ROT = base.Mat4.create([0, 0, -1, 0,
        			           -1, 0, 0, 0,
        			           0, 1, 0, 0,
        			           0, 0, 0, 1]);

/**
 * @enum {string}
 */
game.Player.Tags = {
    HEAD: 'tag_head',
    TORSO: 'tag_torso',
    WEAPON: 'tag_weapon'
};

/**
 * @enum {number}
 */
game.Player.TorsoStates = {
    DEATH: -1,
    IDLE: 11,
    ATTACKING: 7,
    ATTACKING2: 8,
    CHANGING: -2
};

/**
 * @enum {number}
 */
game.Player.LegsStates = {
    // legs
    DEATH: -1,
    IDLE: 22,
    RUN: 15,
    WALK: 14,
    CROUCH: 13,
    IDLE_CROUCH: 23,
    IN_AIR: -2,
    JUMP: 18
};

/**
 * @public
 * @return {base.Mat4}
 */
game.Player.prototype.getWeaponMtx = function () {
    return this.weaponMtx;
};

game.Player.prototype.getPosition = function () {
    return base.Mat4.getRow(this.legs.model.getMatrix(), 3, base.Vec3.create());
};

/**
 * @public
 * @return {boolean}
 */
game.Player.prototype.isDead = function () {
    return this.torsoState === game.Player.TorsoStates.DEATH;
};
/**
 * @public
 */
game.Player.prototype.kill = function () {
    var animations = [game.Player.Animations.BOTH_DEATH1, game.Player.Animations.BOTH_DEATH2,
                      game.Player.Animations.BOTH_DEATH3];
    var animation = animations[Math.floor(Math.random() * animations.length)];
    this.torso.startAnimation(this.animations[animation], 0.1);
    this.torsoState = game.Player.TorsoStates.DEATH;
    this.legs.startAnimation(this.animations[animation], 0.1);
    this.legsState = game.Player.LegsStates.DEATH;
};

/**
 * @public
 */
game.Player.prototype.respawn = function () {
    this.legsState = game.Player.LegsStates.IDLE;
    this.torsoState = game.Player.TorsoStates.IDLE;

    this.legs.startAnimation(this.animations[game.Player.Animations.LEGS_IDLE], 0);
    this.torso.startAnimation(this.animations[game.Player.Animations.TORSO_STAND], 0);
};

/**
 * @public
 */
game.Player.prototype.setFppMode = function () {
    this.head.model.setVisibility(false);
    this.torso.model.setVisibility(false);
    this.legs.model.setVisibility(false);
    this.tppMode = false;
};

/**
 * @public
 * @param {game.Player.TorsoStates} torsoState
 * @param {game.Player.LegsStates} legsState
 * @param {base.Vec3} position
 * @param {base.Vec3} direction
 * @param {number} yaw
 * @param {number} pitch
 * @param {base.Mat4} camMtx
 */
game.Player.prototype.update = function (torsoState,
                                         legsState,
                                         position,
                                         direction,
                                         yaw,
                                         pitch,
                                         camMtx) {
    var animation = 0;

    if (torsoState !== this.torsoState && this.torsoState !== game.Player.TorsoStates.DEATH
       && (this.torsoState === game.Player.TorsoStates.IDLE ||
           this.torsoState === game.Player.TorsoStates.ATTACKING ||
           torsoState === game.Player.TorsoStates.DEATH)) {
        if (torsoState > 0) {
            animation = torsoState;
        } else if (torsoState === game.Player.TorsoStates.DEATH) {
            animation = game.Player.Animations.BOTH_DEATH1;
        } else if (torsoState === game.Player.TorsoStates.CHANGING) {
            animation = game.Player.Animations.TORSO_DROP;
        } else {
            goog.asserts.fail('Wrong torso state');
        }
        this.torso.startAnimation(this.animations[animation], 0.1);
        this.torsoState = torsoState;
    }

    if (legsState !== this.legsState && this.legsState !== game.Player.LegsStates.DEATH) {
        switch (legsState) {
        case game.Player.LegsStates.JUMP:
            animation = (direction[1] < 0 ? game.Player.Animations.LEGS_JUMPB :
                         game.Player.Animations.LEGS_JUMP);
            break;
        case game.Player.LegsStates.RUN:
            animation = (direction[1] < 0 ? game.Player.Animations.LEGS_BACK :
                         game.Player.Animations.LEGS_RUN);
            break;
        case game.Player.LegsStates.DEATH:
            animation = game.Player.Animations.BOTH_DEATH1;
            break;
        case game.Player.LegsStates.IN_AIR:
            animation = game.Player.Animations.LEGS_IDLE;
            break;
        default:
            animation = legsState;
            break;
        }

        this.legs.startAnimation(this.animations[animation], 0.1);
        this.legsState = legsState;
    }

    if (this.torso.isAnimationOver()) {
        switch (this.torsoState) {
        case game.Player.TorsoStates.DEATH:
            animation = this.torso.animation.number + 1;// game.Player.Animations.BOTH_DEAD1;
            break;
        case game.Player.TorsoStates.CHANGING:
            if (this.torso.animation.number === game.Player.Animations.TORSO_DROP) {
                animation = game.Player.Animations.TORSO_RAISE;
            } else {
                animation = game.Player.Animations.TORSO_STAND;
                this.torsoState = game.Player.TorsoStates.IDLE;
            }
            break;
        // case game.Player.TorsoStates.ATTACKING:
        //     break;
        default:
            this.torsoState = game.Player.TorsoStates.IDLE;
            animation = game.Player.Animations.TORSO_STAND;
            break;
        }
        this.torso.startAnimation(this.animations[animation], 0);
    }
    
    if (this.legs.isAnimationOver()) {
        switch (this.legsState) {
        case game.Player.LegsStates.JUMP:
            this.legsState = game.Player.LegsStates.IN_AIR;
            animation = game.Player.Animations.LEGS_IDLE;
            break;
        case game.Player.LegsStates.DEATH:
            if (this.legs.animation.number % 2 === 0) {
                animation = this.legs.animation.number + 1;//game.Player.Animations.BOTH_DEAD1;
            } else {
                animation = this.legs.animation.number;
            }
            break;
        default:
            this.legsState = game.Player.LegsStates.IDLE;
            animation = game.Player.Animations.LEGS_IDLE;
            break;
        }
        this.legs.startAnimation(this.animations[animation], 0);
    }

    this.legs.update(game.globals.TIME_STEP);
    this.torso.update(game.globals.TIME_STEP);

    this.updateMatrices(position, direction, yaw, pitch, camMtx);
};

/**
 * @private
 * @param {base.Vec3} position
 * @param {base.Vec3} dir
 * @param {number} yaw
 * @param {number} pitch
 * @param {base.Mat4} camMtx
 */
game.Player.prototype.updateMatrices = function (position, dir, yaw, pitch, camMtx) {
    var legsMtx, torsoMtx, headMtx, weaponMtx;
    var angle = 0;
    
    legsMtx = this.legs.model.getMatrix();
    base.Mat4.identity(legsMtx);
    base.Mat4.translate(legsMtx, position);
    base.Mat4.rotateZ(legsMtx, yaw + Math.PI * 0.5);

    torsoMtx = this.torso.model.getMatrix();
    base.Mat4.multiply(legsMtx, this.legs.tags[this.torsoTag],
                       torsoMtx);
    // make torso move with pitch
    base.Mat4.rotateY(torsoMtx, -base.math.clamp(pitch, 0.5, 2.8) + Math.PI * 0.5);
    this.torso.model.setMatrix(torsoMtx);

    headMtx = this.head.model.getMatrix();
    base.Mat4.multiply(torsoMtx, this.torso.tags[this.headTag],
                       headMtx);
    this.head.model.setMatrix(headMtx);

    weaponMtx = this.weaponMtx;
    if (this.tppMode) {
        base.Mat4.multiply(torsoMtx, this.torso.tags[this.weaponTag],
                           weaponMtx);
    } else {
        base.Mat4.translate(camMtx, game.Player.WEAPON_OFF, weaponMtx);
        base.Mat4.multiply(weaponMtx, game.Player.WEAPON_ROT, weaponMtx);
    }
//    this.weapon.setMatrix(weaponMtx);


    // correct legs angle movement
    if (this.legsState === game.Player.LegsStates.IDLE) {
        if (Math.abs(yaw - this.lastYaw) > 0.5) {
            if (this.legs.animation.number === game.Player.Animations.LEGS_IDLE) {
                this.legs.startAnimation(this.animations[game.Player.Animations.LEGS_TURN], 0);
            }
            this.lastYaw = yaw;
        }
    } else {
        this.lastYaw = yaw;
    }
    
    if (this.legsState >= game.Player.LegsStates.CROUCH &&
        this.legsState <= game.Player.LegsStates.RUN) {
        if (dir[1] === 0) {
            if (dir[0] === -1) {
                angle = Math.PI * 0.5;
            } else if (dir[0] === 1) {
                angle = -Math.PI * 0.5;
            }
        } else if (dir[1] === 1) {
            if (dir[0] === -1) {
                angle = Math.PI * 0.25;
            } else if (dir[0] === 1) {
                angle = -Math.PI * 0.25;
            }
        } else {
            if (dir[0] === -1) {
                angle = -Math.PI * 0.25;
            } else if (dir[0] === 1) {
                angle = Math.PI * 0.25;
            }
            
        }
        this.targetLegsAngle = angle;
        if (this.legsAngle !== this.targetLegsAngle) {
            this.legsAngle += (this.targetLegsAngle - this.legsAngle) * 0.2;
        }
        base.Mat4.rotateZ(legsMtx, this.legsAngle);
    }
    this.legs.model.setMatrix(legsMtx);
};

/**
 * @private
 * @param {string} playerPath
 * @return {Array.<game.Player.Animation>}
 * Parse file animation.cfg
 */
game.Player.prototype.loadAnimations = function (playerPath, configs) {
    var res;
    var i = 0;
    var file = configs[playerPath + 'animation.cfg'];
    var re = /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/gm;
    var animations = [];

    if (!file) {
        return animations;
    }

    while ((res = re.exec(file)) !== null) {
        animations[i] = new game.Player.Animation(i,
                                                  parseInt(res[1], 10),
                                                  parseInt(res[2], 10),
                                                  parseInt(res[3], 10),
                                                  parseInt(res[4], 10));
        ++i;
    }
    goog.asserts.assert(i == game.Player.Animations.TORSO_GETFLAG);

    while (++i <= game.Player.Animations.MAX_ANIMATIONS) {
        animations[i] = null;
    }
    
    animations[game.Player.Animations.LEGS_TURN].loopFrames = 0;
    // animations[game.Player.Animation.LEGS_BACKCR] = goog.object.clone(
    //     animations[game.Player.Animations.LEGS_WALKCR]);
    // animations[game.Player.Animation.LEGS_BACKCR].reversed = true;
    
    // animations[game.Player.Animation.LEGS_BACKWALK] = goog.object.clone(
    //     animations[game.Player.Animations.LEGS_WALK]);
    // animations[game.Player.Animation.LEGS_BACKWALK].reversed = true;
    
    return animations;
};

/**
 * @param {base.Vec3} from
 * @param {base.Vec3} to
 * @return {number} fraction
 */
game.Player.prototype.rayCastMe = function (from, to) {
    var i, j, k;
    var models = [this.torso, this.legs, this.head];
    var model, frameData, mesh;
    var fraction, minFraction = 1, frame, trFraction;
    var rayTrans;
    var minTrans = base.Vec3.create(), maxTrans = base.Vec3.create();
    for (i = 0; i < models.length; ++i) {
        model = models[i].model;
        frame = model.getFrameA();        
        frameData = model.baseModel.framesData[frame];
        

        rayTrans = base.math.transformRay(from, to, model.getMatrix());

        // fraction = base.math.raySphere(frameData.origin, frameData.radius,
        //                                rayTrans.from, rayTrans.to);
        fraction = base.math.rayAABB(frameData.aabbMin, frameData.aabbMax,
                                     rayTrans.from, rayTrans.to);

        // Per triangle test:
        // Currently it is disabled because there were some bugs in this.
        // Besides, Q3 uses only AABB test.
        // if (fraction < 1) {
        //     fraction = 1;
        //     for (j = 0; j < model.baseModel.meshes.length; ++j) {
        //         mesh = model.baseModel.meshes[j];
        //         for (k = mesh.indicesOffset;
        //              k < mesh.indicesOffset + mesh.indicesCount;
        //              k += 3) {
        //             var stride = 32;
        //             var b1 = mesh.geometry.indices[k] * stride;
        //             var b2 = mesh.geometry.indices[k + 1] * stride;
        //             var b3 = mesh.geometry.indices[k + 2] * stride;
        //             var v1 = mesh.geometry.vertices[frame].subarray(
        //                 b1, b1 + 3);
        //             var v2 = mesh.geometry.vertices[frame].subarray(
        //                 b2, b2 + 3);
        //             var v3 = mesh.geometry.vertices[frame].subarray(
        //                 b3, b3 + 3);

        //             trFraction = base.math.rayTriangle(v1, v2, v3, rayTrans.from, rayTrans.to);
        //             if (trFraction < fraction) {
        //                 fraction = trFraction;
        //             }
        //         }
        //     } 
        // }
        if (fraction < minFraction) {
            
            minFraction = fraction;
        }
    }
    return minFraction;
};

game.Player.prototype.remove = function(mm) {
    mm.removeInstance(this.head.model);
    mm.removeInstance(this.torso.model);
    mm.removeInstance(this.legs.model);
};

/**
 * @constructor
 * @private
 * @param {number} number
 * @param {number} startFrame
 * @param {number} length
 * @param {number} fps
 * @param {number} loopFrames
 * @param {boolean} [reversed]
 */
game.Player.Animation = function (number, startFrame, length, loopFrames, fps, reversed) {
    /**
     * @const
     * @type {number}
     */
    this.number = number;
    /**
     * @const
     * @type {number}
     */
    this.startFrame = startFrame;
    /**
     * @const
     * @type {number}
     */
    this.length = length;
    /**
     * @const
     * @type {number}
     */
    this.fps = fps;
    /**
     * @const
     * @type {number}
     */
    this.loopFrames = loopFrames;
    /**
     * @const
     * @type {number}
     */
    this.lerpTime = 10 * game.globals.TIME_STEP;

    /**
     * @type {boolean}
     */
    this.reversed = reversed || false;
};

/**
 * @constructor
 * @private
 * @param {base.ModelInstance} model
 */
game.Player.Entity = function (model) {
    var i;
    /**
     * @const
     * @type {base.ModelInstance}
     */
    this.model = model;
    /**
     * @type {game.Player.Animation}
     */
    this.animation = null;
    /**
     * @type {game.Player.Animation}
     */
    this.oldAnimation = null;
    /**
     * @type {number}
     */
    this.animFrame = 0;
    /**
     * @type {number}
     */
    this.oldAnimFrame = 0;
    /**
     * @type {number}
     */
    this.animLerpTime = 0;
    /**
     * @type {number}
     */
    this.animLerp = 0;
    /**
     * @type {boolean}
     */
    this.lerping = false;
    /**
     * @type {Array.<base.Mat4>}
     */
    this.tags = [];
    
    for (i = 0; i < model.baseModel.tags.length; ++i) {
        this.tags.push(base.Mat4.identity());
    }
};

// /**
//  * @public
//  * @param {network.ISynchronizer} sync
//  * @suppress {checkTypes}
//  */
// game.Player.Entity.prototype.synchronize = function (sync) {
// };

/**
 * @public
 * @param {game.Player.Animation} animation
 * @param {number} lerpTime in seconds
 * @param {number} [delayTime] currently not used
 */
game.Player.Entity.prototype.startAnimation = function (animation, lerpTime, delayTime) {
    goog.asserts.assert(animation);
    delayTime = delayTime || 0;
    if (lerpTime > 0 && this.animation) {
        this.oldAnimation = this.animation;
        this.oldAnimFrame = Math.round(this.animFrame);
        this.lerping = true;
    } else {
        this.oldAnimation = null;
        this.oldAnimFrame = 0;
        this.lerping = false;
    }
    this.animLerp = 0;
    this.animLerpTime = lerpTime;
    this.animation = animation;
    this.animFrame = 0;
};

/**
 * @private
 */
game.Player.Entity.prototype.calcTags = function () {
    var i, frameA, frameB, tagA, tagB, lerp;
    for (i = 0; i < this.tags.length; ++i) {
        if (this.lerping) {
            frameA = this.oldAnimation.startFrame + this.oldAnimFrame;
            frameB = this.animation.startFrame + this.animFrame;
            lerp = this.animLerp;
        } else {
            frameB = this.animation.startFrame + this.animFrame;
            frameA = Math.floor(frameB);
            lerp = frameB - frameA;
            frameB = Math.ceil(frameB);
        }
        if (frameA === frameB) {
            base.Mat4.set(this.model.baseModel.framesData[frameA].tags[i], this.tags[i]);
        } else {
            tagA = this.model.baseModel.framesData[frameA].tags[i];
            tagB = this.model.baseModel.framesData[frameB].tags[i];
            base.Mat4.lerp(tagA, tagB, lerp, this.tags[i]);
        }
    }
};

/**
 * @public
 * @param {number} dt
 */
game.Player.Entity.prototype.update = function (dt) {
    // @todo: make this function network ready (big dt)
    if (this.lerping) {
        this.animLerp += (dt / this.animLerpTime);
        if (this.animLerp >= 1) {
            this.lerping = false;
            this.animLerp = 1;
            this.oldAnimation = null;
            this.oldAnimFrame = 0;
            this.model.setFrame(this.animation.startFrame + this.animFrame);
        } else {
            this.model.setFrameLerp(this.oldAnimation.startFrame + this.oldAnimFrame,
                                    this.animation.startFrame + this.animFrame,
                                    this.animLerp);
        }
    } else {
        this.animFrame += (dt * this.animation.fps);
        if (this.animFrame > this.animation.length - 1) {
            if (this.animation.loopFrames > 0) {
                this.animFrame -= this.animation.loopFrames;
            } else {
                this.animFrame = this.animation.length - 1;
            }
        }
        this.model.setFrame(this.animation.startFrame + this.animFrame);
    }

    this.calcTags();
};

/**
 * @public
 * @return {boolean}
 */
game.Player.Entity.prototype.isAnimationOver = function () {
    return (this.animation.loopFrames === 0 &&
            this.animFrame === this.animation.length - 1);
};

/**
 * @enum {number}
 * from bg_public.h
 */
game.Player.Animations = {
    BOTH_DEATH1: 0,
    BOTH_DEAD1: 1,
    BOTH_DEATH2: 2,
    BOTH_DEAD2: 3,
    BOTH_DEATH3: 4,
    BOTH_DEAD3: 5,

    TORSO_GESTURE: 6,

    TORSO_ATTACK: 7,
    TORSO_ATTACK2: 8,

    TORSO_DROP: 9,
    TORSO_RAISE: 10,

    TORSO_STAND: 11,
    TORSO_STAND2: 12,

    LEGS_WALKCR: 13,
    LEGS_WALK: 14,
    LEGS_RUN: 15,
    LEGS_BACK: 16,
    LEGS_SWIM: 17,

    LEGS_JUMP: 18,
    LEGS_LAND: 19,

    LEGS_JUMPB: 20,
    LEGS_LANDB: 21,

    LEGS_IDLE: 22,
    LEGS_IDLECR: 23,

    LEGS_TURN: 24,

    TORSO_GETFLAG: 25,
    TORSO_GUARDBASE: 26,
    TORSO_PATROL: 27,
    TORSO_FOLLOWME: 28,
    TORSO_AFFIRMATIVE: 29,
    TORSO_NEGATIVE: 30,

    //	BOTH_POSE,		// leilei - crappy ui posing code trying

    MAX_ANIMATIONS: 31,

    LEGS_BACKCR: 32,
    LEGS_BACKWALK: 33,
    FLAG_RUN: 34,
    FLAG_STAND: 35,
    FLAG_STAND2RUN: 36,

    MAX_TOTALANIMATIONS: 37
};
