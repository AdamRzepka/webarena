goog.provide('base.IRenderer');

/**
 * @interface
 */
base.IRenderer = function () {
};

base.IRenderer._CROSS_WORKER_ = true;

base.IRenderer.prototype.buildShaders = function (shaderScripts, texturesUrls) {};
base.IRenderer.prototype.buildShaders._CROSS_WORKER_ = true;

base.IRenderer.prototype.registerMap = function (models, lightmapData) {};
base.IRenderer.prototype.registerMap._CROSS_WORKER_ = true;

base.IRenderer.prototype.registerMd3 = function (model) {};
base.IRenderer.prototype.registerMd3._CROSS_WORKER_ = true;

base.IRenderer.prototype.registerModelInstance = function (id, modelBaseId, matrix, skinName) {};
base.IRenderer.prototype.registerModelInstance._CROSS_WORKER_ = true;
