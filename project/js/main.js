'use strict';

goog.require('renderer');
goog.require('resources');
goog.require('q3bsp');
goog.require('input');
goog.require('camera');

var DEFAULT_MAP = 'oa_rpg3dm2';

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return unescape(pair[1]);
        }
    }
    return null;
}

function initWebGL(canvas) {
  // Initialize the global variable gl to null.
    var gl = null;

    try {
	// Try to grab the standard context. If it fails, fallback to experimental.
	gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    }
    catch(e) {}

    // If we don't have a GL context, give up now
    if (!gl) {
	alert("Unable to initialize WebGL. Your browser may not support it.");
    }
    return gl;
}

(function() {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

var render;

function main() {
    var canvas = document.getElementById('glcanvas');

    var gl = initWebGL(canvas);

    var map = getQueryVariable(map);

    if (map === null)
        map = DEFAULT_MAP;

    var rm = new resources.ResourceManager();
    var input = new InputHandler();
    var camera = new Camera(input, [0, 0, 0]);

    var lastTime = Date.now();
    var timeAcc = 0;

    function update() {
	timeAcc += Date.now() - lastTime;
	while (timeAcc > 15) {
	    timeAcc -= 15;
	    camera.update();
	    input.clearInput();
	}
	lastTime = Date.now();
	render.updateCamera(camera.getCameraMatrix());
	render.render();
	requestAnimationFrame(update);
    }

    rm.load([map], function () {
		// var im = new Image();
		// im.src = rm.textures["textures/skies/dimclouds"];
		// window.document.body.appendChild(im);
		render = new renderer.Renderer(gl, rm);
		q3bsp.load(rm.getMap(), 10);
		render.updateCamera(mat4.identity());
		requestAnimationFrame(update);
	    });
}

