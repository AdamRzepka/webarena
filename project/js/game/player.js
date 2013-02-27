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
     * @type {game.Player.Entity}
     */
    this.head = new game.Player.Entity(mm.makeInstance(path + 'head.md3', null, skin));
    /**
     * @private
     * @const
     * @type {game.Player.Entity}
     */
    this.torso = new game.Player.Entity(mm.makeInstance(path + 'upper.md3', null, skin));
    /**
     * @private
     * @const
     * @type {game.Player.Entity}
     */
    this.legs = new game.Player.Entity(mm.makeInstance(path + 'lower.md3', null, skin));
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
     * @const
     * @type {Array.<game.Player.Animation>}
     */
    this.animations = this.loadAnimations(path, rm);

    this.legs.startAnimation(this.animations[game.Player.Animations.LEGS_IDLE], 0);
    this.torso.startAnimation(this.animations[game.Player.Animations.TORSO_STAND], 0);
    
    that.head.model.setVisibility(visible);
    that.torso.model.setVisibility(visible);
    that.legs.model.setVisibility(visible);

    game.globals.onTppModeChange = function (tppOn) {
        that.head.model.setVisibility(tppOn);
        that.torso.model.setVisibility(tppOn);
        that.legs.model.setVisibility(tppOn);
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

game.Player.prototype.startJump = function (back) {
};

game.Player.prototype.setOnGround = function () {
};

game.Player.prototype.setCrouch = function () {
};

game.Player.prototype.setAttacking = function () {
};

/**
 * @public
 * @param {base.Mat4} camMtx
 * @param {base.Vec3} position
 * @param {number} yaw
 * @param {number} pitch
 * @param {base.Vec3} velocity
 * @param {base.Vec3} direction
 */
game.Player.prototype.update = function (camMtx, position, yaw, pitch, velocity, direction) {
    var legsMtx, torsoMtx, headMtx, weaponMtx;

    if (base.Vec3.length(velocity) > 0.01 &&
        this.legs.animation.number != game.Player.Animations.LEGS_RUN) {
        this.legs.startAnimation(this.animations[game.Player.Animations.LEGS_RUN], 0.1);
    } else if (base.Vec3.length(velocity) <= 0.01 &&
               this.legs.animation.number == game.Player.Animations.LEGS_RUN) {
        this.legs.startAnimation(this.animations[game.Player.Animations.LEGS_IDLE], 0.1);
    }
        
    this.legs.update(game.globals.TIME_STEP);
    this.torso.update(game.globals.TIME_STEP);

    legsMtx = this.legs.model.getMatrix();
    base.Mat4.identity(legsMtx);
    base.Mat4.translate(legsMtx, position);
    base.Mat4.rotateZ(legsMtx, yaw + Math.PI * 0.5);
    this.legs.model.setMatrix(legsMtx);

    torsoMtx = this.torso.model.getMatrix();
    base.Mat4.multiply(legsMtx, this.legs.tags[this.torsoTag],
                       torsoMtx);
    this.torso.model.setMatrix(torsoMtx);

    headMtx = this.head.model.getMatrix();
    base.Mat4.multiply(torsoMtx, this.torso.tags[this.headTag],
                       headMtx);
    this.head.model.setMatrix(headMtx);

    weaponMtx = this.weapon.getMatrix();
    if (game.globals.tppMode) {
        base.Mat4.multiply(torsoMtx, this.torso.tags[this.weaponTag],
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

/**
 * @public
 * @param {game.Player.Animation} animation
 * @param {number} lerpTime in seconds
 * @param {number} [delayTime] currently not used
 */
game.Player.Entity.prototype.startAnimation = function (animation, lerpTime, delayTime) {
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

/**
 * @private
 * @param {string} playerPath
 * @param {files.ResourceManager} rm
 * @return {Array.<game.Player.Animation>}
 * Parse file animation.cfg
 */
game.Player.prototype.loadAnimations = function (playerPath, rm) {
    var res;
    var i = 0;
    var file = rm.getConfigFile(playerPath + 'animation.cfg');
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

    // animations[game.Player.Animation.LEGS_BACKCR] = goog.object.clone(
    //     animations[game.Player.Animations.LEGS_WALKCR]);
    // animations[game.Player.Animation.LEGS_BACKCR].reversed = true;
    
    // animations[game.Player.Animation.LEGS_BACKWALK] = goog.object.clone(
    //     animations[game.Player.Animations.LEGS_WALK]);
    // animations[game.Player.Animation.LEGS_BACKWALK].reversed = true;
    
    return animations;
};
