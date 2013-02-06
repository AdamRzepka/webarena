'use strict';

goog.provide('base.IInputHandler');

/**
 * @interface
 */
base.IInputHandler = function () {};

/**
 * @public
 * @param {number} key
 */
base.IInputHandler.prototype.onKeyUp = function (key) {};
base.IInputHandler.prototype.onKeyUp._CROSS_WORKER_ = true;
/**
 * @public
 * @param {number} key
 */
base.IInputHandler.prototype.onKeyDown = function (key) {};
base.IInputHandler.prototype.onKeyDown._CROSS_WORKER_ = true;
// /**
//  * @public
//  * @param {number} key
//  */
// base.IInputHandler.prototype.onMouseUp = function (key) {};
// base.IInputHandler.prototype.onMouseUp._CROSS_WORKER_ = true;
// /**
//  * @public
//  * @param {number} key
//  */
// base.IInputHandler.prototype.onMouseDown = function (key) {};
// base.IInputHandler.prototype.onMouseDown._CROSS_WORKER_ = true;
/**
 * @public
 * @param {number} x
 * @param {number} y
 */
base.IInputHandler.prototype.onMouseMove = function (x, y) {};
base.IInputHandler.prototype.onMouseMove._CROSS_WORKER_ = true;
