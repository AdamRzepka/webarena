/*
 * main.js - Setup for Quake 3 WebGL demo
 */

/*
 * Copyright (c) 2011 Brandon Jones
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not
 *    be misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */

// The bits that need to change to load different maps are right here!
// ===========================================

var mapName = 'q3tourney2';

// If you're running from your own copy of Quake 3, you'll want to use these shaders
/*var mapShaders = [
    'scripts/base.shader', 'scripts/base_button.shader', 'scripts/base_floor.shader',
    'scripts/base_light.shader', 'scripts/base_object.shader', 'scripts/base_support.shader',
    'scripts/base_trim.shader', 'scripts/base_wall.shader', 'scripts/common.shader',
    'scripts/ctf.shader', 'scripts/eerie.shader', 'scripts/gfx.shader',
    'scripts/gothic_block.shader', 'scripts/gothic_floor.shader', 'scripts/gothic_light.shader',
    'scripts/gothic_trim.shader', 'scripts/gothic_wall.shader', 'scripts/hell.shader',
    'scripts/liquid.shader', 'scripts/menu.shader', 'scripts/models.shader',
    'scripts/organics.shader', 'scripts/sfx.shader', 'scripts/shrine.shader',
    'scripts/skin.shader', 'scripts/sky.shader', 'scripts/test.shader'
];*/

// For my demo, I compiled only the shaders the map used into a single file for performance reasons
var mapShaders = ['scripts/detailtest.shader', 'scripts/evil8.shader', 'scripts/liquid_water.shader', 'scripts/oanew.shader', 'scripts/oalite.shader', 'scripts/oasky.shader'];

// ===========================================
// Everything below here is common to all maps
var modelViewMat, projectionMat;
var activeShader;
var map, playerMover;
var mobileSite = false;

var zAngle = 3;
var xAngle = 0;
var cameraPosition = [0, 0, 0];

var rm = null;

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

// Take a stab at detecting if this is a mobile device or not
function isMobile() {
    var index = navigator.appVersion.indexOf("Mobile");
    return (index > -1);
}

// Set up basic GL State up front
function initGL(gl, canvas) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.enable(gl.CULL_FACE);
    
    projectionMat = mat4.create();
    mat4.perspective(45.0, canvas.width/canvas.height, 1.0, 4096.0, projectionMat);
    modelViewMat = mat4.create();
    
    initMap(gl);
}

// Load the map
function initMap(gl) {
    var titleEl = document.getElementById("mapTitle");
    titleEl.innerHtml = mapName.toUpperCase();
    
    var tesselation = getQueryVariable("tesselate");
    if(tesselation) {
        tesselation = parseInt(tesselation, 10);
    }

    map = new q3bsp(gl);
    map.onentitiesloaded = initMapEntities;
    map.onbsp = initPlayerMover;
    //map.onsurfaces = initSurfaces;
    rm = new ResourceManager();
    rm.load("aggressor", [], function () {
	map.loadShaders(mapShaders);
	map.load(rm.map, tesselation);	
    });
}

// Process entities loaded from the map
function initMapEntities(entities) {
    respawnPlayer(0);
}

function initPlayerMover(bsp) {
    playerMover = new q3movement(bsp);
    respawnPlayer(0);
    document.getElementById('viewport').style.display = 'block';
}

var lastIndex = 0;
// "Respawns" the player at a specific spawn point. Passing -1 will move the player to the next spawn point.
function respawnPlayer(index) {
    if(map.entities && playerMover) {
        if(index == -1) {
            index = (lastIndex+1)% map.entities.info_player_deathmatch.length;
        }
        lastIndex = index;
    
        var spawnPoint = map.entities.info_player_deathmatch[index];
        playerMover.position = [
            spawnPoint.origin[0],
            spawnPoint.origin[1],
            spawnPoint.origin[2]+30 // Start a little ways above the floor
        ];
        
        playerMover.velocity = [0,0,0];
        
        zAngle = -spawnPoint.angle * (3.1415/180) + (3.1415*0.5); // Negative angle in radians + 90 degrees
	//zAngle = 0; // Negative angle in radians + 90 degrees
        xAngle = 0;
    }
}

var lastMove = 0;

function onFrame(gl, event) {
    if(!map || !playerMover) { return; }
    document.getElementById("fps").innerHTML = event.framesPerSecond;
    
    // Update player movement @ 60hz
    // The while ensures that we update at a fixed rate even if the rendering bogs down
    while(event.elapsed - lastMove >= 16) {
        updateInput(16);
        lastMove += 16;
    }
    
    drawFrame(gl);
}

// Draw a single frame
function drawFrame(gl) {
    // Clear back buffer but not color buffer (we expect the entire scene to be overwritten)
    gl.depthMask(true);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    
    if(!map || !playerMover) { return; }
    
    // Matrix setup
    mat4.identity(modelViewMat);
    mat4.rotateX(modelViewMat, xAngle-Math.PI/2);
    mat4.rotateZ(modelViewMat, zAngle);
    mat4.translate(modelViewMat, [-playerMover.position[0], -playerMover.position[1], -playerMover.position[2]-30]);
    
    // Here's where all the magic happens...
    map.draw(cameraPosition, modelViewMat, projectionMat);
}

var pressed = new Array(128);
var cameraMat = mat4.create();

function moveLookLocked(xDelta, yDelta) {
    zAngle += xDelta*0.0025;
    while (zAngle < 0)
        zAngle += Math.PI*2;
    while (zAngle >= Math.PI*2)
        zAngle -= Math.PI*2;
            
    xAngle += yDelta*0.0025;
    while (xAngle < -Math.PI*0.5)
        xAngle = -Math.PI*0.5;
    while (xAngle > Math.PI*0.5)
        xAngle = Math.PI*0.5;
}

function filterDeadzone(value) {
    return Math.abs(value) > 0.35 ? value : 0;
}

function updateInput(frameTime) {
    if(!playerMover) { return; }
        
    var dir = [0, 0, 0];
    
    // This is our first person movement code. It's not really pretty, but it works
    if(pressed['W'.charCodeAt(0)]) {
        dir[1] += 1;
    }
    if(pressed['S'.charCodeAt(0)]) {
        dir[1] -= 1;
    }
    if(pressed['A'.charCodeAt(0)]) {
        dir[0] -= 1;
    }
    if(pressed['D'.charCodeAt(0)]) {
        dir[0] += 1;
    }
    
    for (var i = 0; i < navigator.gamepads.length; ++i) {
        var pad = navigator.gamepads[i];
        if(pad) {
            dir[0] += filterDeadzone(pad.axes[0]);
            dir[1] -= filterDeadzone(pad.axes[1]);
        
            moveLookLocked(
                filterDeadzone(pad.axes[2]) * 25.0,
                filterDeadzone(pad.axes[3]) * 25.0
            );
            
            for(var j = 0; j < pad.buttons.length; ++j) {
                if(pad.buttons[j]) { playerMover.jump(); }
            }
        }
    }
    
    if(dir[0] !== 0 || dir[1] !== 0 || dir[2] !== 0) {
        mat4.identity(cameraMat);
        mat4.rotateZ(cameraMat, zAngle);
        mat4.inverse(cameraMat);
        
        mat4.multiplyVec3(cameraMat, dir);
    }
    
    // Send desired movement direction to the player mover for collision detection against the map
    playerMover.move(dir, frameTime);
}

// Set up event handling
function initEvents() {
    var movingModel = false;
    var lastX = 0;
    var lastY = 0;
    var lastMoveX = 0;
    var lastMoveY = 0;
    var viewport = document.getElementById("viewport");
    var viewportFrame = document.getElementById("viewport-frame");
    
    document.addEventListener("keydown", function(event) {
        if(event.keyCode == 32 && !pressed[32]) {
            playerMover.jump();
        }
        pressed[event.keyCode] = true;
    }, false);
    
    document.addEventListener("keypress", function(event) {
        if(event.charCode == 'R'.charCodeAt(0) || event.charCode == 'r'.charCodeAt(0)) {
            respawnPlayer(-1);
        }
    }, false);
    
    document.addEventListener("keyup", function(event) {
        pressed[event.keyCode] = false;
    }, false);
    
    function startLook(x, y) {
        movingModel = true;
        
        lastX = x;
        lastY = y;
    }
    
    function endLook() {
        movingModel = false;
    }
    
    function moveLook(x, y) {
        var xDelta = x - lastX;
        var yDelta = y - lastY;
        lastX = x;
        lastY = y;
        
        if (movingModel) {
            moveLookLocked(xDelta, yDelta);
        }
    }
    
    function startMove(x, y) {
        lastMoveX = x;
        lastMoveY = y;
    }
    
    function moveUpdate(x, y, frameTime) {
        var xDelta = x - lastMoveX;
        var yDelta = y - lastMoveY;
        lastMoveX = x;
        lastMoveY = y;

        var dir = [xDelta, yDelta * -1, 0];

        mat4.identity(cameraMat);
        mat4.rotateZ(cameraMat, zAngle);
        mat4.inverse(cameraMat);

        mat4.multiplyVec3(cameraMat, dir);

        // Send desired movement direction to the player mover for collision detection against the map
        playerMover.move(dir, frameTime*2);
    }
    
    viewport.addEventListener("click", function(event) {
        viewport.requestPointerLock();
    }, false);
    
    // Mouse handling code
    // When the mouse is pressed it rotates the players view
    viewport.addEventListener("mousedown", function(event) {
        if(event.which == 1) {
            startLook(event.pageX, event.pageY);
        }
    }, false);
    viewport.addEventListener("mouseup", function(event) {
        endLook();
    }, false);
    viewportFrame.addEventListener("mousemove", function(event) {
        if(document.pointerLockEnabled) {
            moveLookLocked(event.movementX, event.movementY);
        } else {
            moveLook(event.pageX, event.pageY);
        }
    }, false);
    
    // Touch handling code
    viewport.addEventListener('touchstart', function(event) {
        var touches = event.touches;
        switch(touches.length) {
            case 1: // Single finger looks around
                startLook(touches[0].pageX, touches[0].pageY);
                break;
            case 2: // Two fingers moves
                startMove(touches[0].pageX, touches[0].pageY);
                break;
            case 3: // Three finger tap jumps
                playerMover.jump();
                break;
            default:
                return;
        }
        event.stopPropagation();
        event.preventDefault();
    }, false);
    viewport.addEventListener('touchend', function(event) {
        endLook();
        return false;
    }, false);
    viewport.addEventListener('touchmove', function(event) {
        var touches = event.touches;
        switch(touches.length) {
            case 1:
                moveLook(touches[0].pageX, touches[0].pageY);
                break;
            case 2:
                moveUpdate(touches[0].pageX, touches[0].pageY, 16);
                break;
            default:
                return;
        }
        event.stopPropagation();
        event.preventDefault();
    }, false);
}

// Utility function that tests a list of webgl contexts and returns when one can be created
// Hopefully this future-proofs us a bit
function getAvailableContext(canvas, contextList) {
    if (canvas.getContext) {
        for(var i = 0; i < contextList.length; ++i) {
            try {
                var context = canvas.getContext(contextList[i], { antialias:false });
                if(context !== null)
                    return context;
            } catch(ex) { }
        }
    }
    return null;
}

function renderLoop(gl, element) {
    var lastTimestamp = window.animationStartTime;
    var lastFps = window.animationStartTime;
    var framesPerSecond = 0;
    var frameCount = 0;
            
    function onRequestedFrame(timestamp){
        if(!timestamp) {
            timestamp = new Date().getTime();
        }

        // Update FPS if a second or more has passed since last FPS update
        if(timestamp - lastFps >= 1000) {
            framesPerSecond = frameCount;
            frameCount = 0;
            lastFps = timestamp;
        }
        
        window.requestAnimationFrame(onRequestedFrame, element);
        
        onFrame(gl, {
            timestamp: timestamp,
            elapsed: timestamp - window.animationStartTime,
            frameTime: timestamp - lastTimestamp,
            framesPerSecond: framesPerSecond
        });
        ++frameCount;
    }
    window.requestAnimationFrame(onRequestedFrame, element);
}

function makeSiteMobile() {
    mobileSite = true;
    document.body.classList.add("mobile");
    GL_WINDOW_WIDTH = window.innerWidth/2;
    GL_WINDOW_HEIGHT = window.innerHeight/2;
}

var GL_WINDOW_WIDTH = 854;
var GL_WINDOW_HEIGHT = 480;

function main() {
    var mobileQS = getQueryVariable("mobile");
    if(mobileQS === "1" || (mobileQS !== "0" && isMobile())) {
        makeSiteMobile();
    }

    var canvas = document.getElementById("viewport");
    
    // Set the canvas size
    canvas.width = GL_WINDOW_WIDTH;
    canvas.height = GL_WINDOW_HEIGHT;
    
    // Get the GL Context (try 'webgl' first, then fallback)
    var gl = getAvailableContext(canvas, ['webgl', 'experimental-webgl']);
    
    if(!gl) {
        document.getElementById('viewport-frame').style.display = 'none';
        document.getElementById('webgl-error').style.display = 'block';
    } else {
        document.getElementById('viewport-info').style.display = 'block';
        initEvents();
        initGL(gl, canvas);
        renderLoop(gl, canvas);
    }

    var fpsCounter = document.getElementById("fps-counter");
    var showFPS = document.getElementById("showFPS");
    showFPS.addEventListener("change", function() {
        if(showFPS.checked) {
            fpsCounter.style.display = "block";
        } else {
            fpsCounter.style.display = "none";
        }
    });
    
    var playMusic = document.getElementById("playMusic");
    playMusic.addEventListener("change", function() {
        if(map) {
            map.playMusic(playMusic.checked);
        }
    });
    
    // Handle fullscreen transition
    var viewportFrame = document.getElementById("viewport-frame");
    document.addEventListener("fullscreenchange", function() {
        if(document.fullscreenEnabled) {
            canvas.width = screen.width;
            canvas.height = screen.height;
            viewportFrame.requestPointerLock(); // Attempt to lock the mouse automatically on fullscreen
        } else {
            canvas.width = GL_WINDOW_WIDTH;
            canvas.height = GL_WINDOW_HEIGHT;
        }
        gl.viewport(0, 0, canvas.width, canvas.height);
        mat4.perspective(45.0, canvas.width/canvas.height, 1.0, 4096.0, projectionMat);
    }, false);
    
    var button = document.getElementById('fullscreenBtn');
    button.addEventListener('click', function() {
        viewportFrame.requestFullScreen();
    }, false);
}
window.addEventListener("load", main); // Fire this once the page is loaded up
