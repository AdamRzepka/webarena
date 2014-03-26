/**
 * Copyright (C) 2012 Adam Rzepka
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
goog.require('base.Bsp');

goog.provide('base.Map');

/**
 * Class representing a level loaded from bsp. It is created by bsp loader.
 * @constructor
 * @param {Array.<base.Model>} models
 * @param {base.Map.Lightmap} lightmapData
 * @param {base.Bsp} bsp
 * @param {Array.<Object>} entities
 * @param {Array.<Object>} entitiesModels
 */
base.Map = function(models, lightmapData, bsp, entities, entitiesModels) {
    /**
     * @const
     * @type {Array.<base.Model>}
     */
    this.models = models;
    /**
     * @const
     * @type {base.Map.Lightmap}
     */
    this.lightmapData = lightmapData;
    /**
     * @const
     * @type {base.Bsp}
     */
    this.bsp = bsp;
    /**
     * @const
     * @type {Object.<string, Array.<Object>>}
     */
    this.entities = entities;
    /**
     * @const
     * @type
     */
    this.entitiesModels = entitiesModels;
};

/**
 * @constructor
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {Uint8Array} bytes
 */
base.Map.Lightmap = function(x, y, width, height, bytes) {
    /**
     * @const
     * @type {number}
     */
    this.x = x;
    /**
     * @const
     * @type {number}
     */
    this.y = y;
    /**
     * @const
     * @type {number}
     */
    this.width = width;
    /**
     * @const
     * @type {number}
     */
    this.height = height;
    /**
     * @const
     * @type {Uint8Array}
     */
    this.bytes = bytes;
};

/**
 * @constructor
 * @param {Array.<base.Map.Lightmap>} lightmaps
 * @param {number} size
 */
base.Map.LightmapData = function(lightmaps, size) {
    /**
     * @const
     * @type {Array.<base.Map.Lightmap>}
     */
    this.lightmaps = lightmaps;
    /**
     * @const
     * @type {number}
     */
    this.size = size;
};

base.Map.getSpawnPoints = function (map) {
    return map.entities['info_player_deathmatch'] || null;
    // return this.entities.filter(function (ent) {
    //    return ent['classname'] == 'info_player_deathmatch'; 
    // });
};

base.Map.getTeleports = function (map) {
    var i = 0, j = 0;
    var teleports = map.entities['trigger_teleport'];
    var trgs = map.entities['misc_teleporter_dest'];
    if (!teleports) {
        return [];
    }
    var result = [];

    for (i = 0; i < teleports.length; ++i) {
        var modelNum = parseInt(teleports[i]['model'].substr(1));
        var model = map.entitiesModels[modelNum];
        if (!model) {
            continue;
        }

        var trg = null;
        for (j = 0; j < trgs.length; ++j) {
            if (trgs[j]['targetname'] == teleports[i]['target']) {
                trg = trgs[j];
            }
        }
        if (!trg) {
            continue;
        }
        
        result.push({
            // center: pos,
            // radius: model.aabbMax[0] - model.aabbMin[0]
            min: model.aabbMin,
            max: model.aabbMax,
            destOrigin: trg['origin'],
            destAngle: trg['angle']
        });
    }
    return result;
};
