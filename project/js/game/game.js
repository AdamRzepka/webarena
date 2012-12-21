if (typeof COMPILED == 'undefined') {
  var CLOSURE_BASE_PATH = '../../closure/goog/';
  importScripts(
      CLOSURE_BASE_PATH + 'bootstrap/webworkers.js',
      CLOSURE_BASE_PATH + 'base.js',
      CLOSURE_BASE_PATH + 'deps.js',
      '../../deps.js');
}
// else if (COMPILED) {
//     importScripts('base.js');
// }

goog.require('base');
goog.require('base.Mat3');
goog.require('files.ResourceManager');
goog.require('files.bsp');
goog.require('files.md3');
goog.require('files.ShaderScriptLoader');
goog.require('renderer.Renderer');

goog.provide('game');
//goog.require('game.Camera');

// var postMessage = function(msg) {
//     self.postMessage(msg, null);
// };

game.init = function () {
    var rm = new files.ResourceManager();
    var mapName = 'oa_rpg3dm2';
    var weaponId;
    var weaponMtx = base.Mat4.identity();
    rm.load([mapName, "lightning"], function () {
	var map, md3;
	files.ShaderScriptLoader.loadAll(rm.getScripts());
	postMessage({type: 'shaders', data: [files.ShaderScriptLoader.shaderScripts,
					     rm.getTextures()]});
	
	map = files.bsp.load(rm.getMap());
	postMessage({type: 'map', data: [map.models, map.lightmapData]});

	map.models.forEach(function (model) {
	    postMessage({type: 'instance', data: [base.ModelInstance.getNextId(),
						  model.id,
						  base.Mat4.identity()]});
	});
	
	md3 = files.md3.load(rm.getModel('models/weapons2/lightning/lightning.md3'));
	postMessage({type: 'md3', data: [md3]});
	weaponId = base.ModelInstance.getNextId();
	postMessage({type: 'instance', data: [weaponId,
					      md3.id,
					      weaponMtx]});
//	postMessage({type: 'camera', data: [base.Mat4.identity()]});
    });
};

game.init();
