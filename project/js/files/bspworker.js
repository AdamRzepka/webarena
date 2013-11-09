// bootstrap webworker with gamecode in debug mode
if (typeof COMPILED == 'undefined') {
  var CLOSURE_BASE_PATH = '../../closure/closure/goog/';
  importScripts(
      CLOSURE_BASE_PATH + 'bootstrap/webworkers.js',
      CLOSURE_BASE_PATH + 'base.js',
      CLOSURE_BASE_PATH + 'deps.js',
      '../../deps.js');
}

goog.require('base');
goog.require('files.bsp');

self.onmessage = function (evt) {
    var data = evt.data;
    var map = files.bsp.load(data.buffer);
    var transferables = [];
    var lightmaps = map.lightmapData.lightmaps;
    var models;
    var meshes;
    var vertexBufs;
    
    var i = 0;
    var j = 0;
    var k = 0;
    
    for (i = 0; i < lightmaps.length; ++i) {
        transferables.push(lightmaps[i].bytes.buffer);
    }

    // models = map.models;
    // for (i = 0; i < models.length; ++i) {
    //     meshes = map.models[i].meshes;
    //     for (j = 0; j < meshes.length; ++j) {
    //         transferables.push(meshes[j].geometry.indices.buffer);
    //         vertexBufs = meshes[j].geometry.vertices;
    //         for (k = 0; k < vertexBufs.length; ++k) {
    //             transferables.push(vertexBufs[k].buffer); 
    //         }
    //     }
    // }
    
    self.postMessage(map, transferables);
};
