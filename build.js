// plovr config file
{
    "id": "webarena",
    "paths": "project/js",
    "modules": {
	"base": {
	    "inputs" : ["project/js/base/base.js", "project/js/base/irenderer.js",
                        "project/js/base/map.js", "project/js/base/material.js",
                        "project/js/base/mat3.js", "project/js/base/mat4.js",
                        "project/js/base/vec3.js", "project/js/base/quat4.js",
                        "project/js/base/workers/broker.js"],
	    "deps": []
	},
	"main": {
	    "inputs": ["project/js/main.js", "project/js/renderer/renderer.js",
                       "project/js/renderer/sky.js", "project/js/renderer/materialmanager.js"],
	    "deps": "base"
	},
	"game": {
	    "inputs": "project/js/game/game.js",
	    "deps": "base"
	}
    },
    "module-output-path": "release/js/%s.js",
    "externs": ["tools/externs.js"],
    "mode": "ADVANCED",
    "level": "VERBOSE",
    "debug": false,
    "pretty-print": false,
    "define": {
	"goog.DEBUG": false,
        "flags.GAME_WORKER": true
    },
    "checks": {
    // acceptable values are "ERROR", "WARNING", and "OFF"
	"accessControls": "ERROR",
	"checkTypes": "ERROR",
	"checkRegExp": "WARNING",
	"const": "ERROR",
	"constantProperty": "ERROR",
	"invalidCasts": "WARNING",
	"visibility": "ERROR"	
  }
}
    
