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

/**
 * @fileoverview
 * @suppress {duplicate}
 * Definitions of data needed both by lobby server and browser.
 */

if (typeof goog !== 'undefined') {
    goog.provide('system.common');
} else {
    var system = exports; // lobby server side
}

/**
 * @constructor
 * Message sent between browser and lobby server.
 */
system.ControlMessage = function () {
    this['type'] = 0;
    this['matchId'] = 0;
    this['from'] = 0; // my id
    this['to'] = 0;   // currently only for RTC_SIGNAL
    this['data'] = null;
};

/**
 * @enum {string}
 */
system.ControlMessage.Type = {
    CREATE_MATCH_REQUEST: 'CREATE_MATCH_REQUEST',
    CREATE_MATCH_RESPONSE: 'CREATE_MATCH_RESPONSE',
    JOIN_MATCH_REQUEST: 'JOIN_MATCH_REQUEST',
    JOIN_MATCH_RESPONSE: 'JOIN_MATCH_RESPONSE',
    DISCONNECTED: 'DISCONNECTED',
    RTC_SIGNAL: 'RTC_SIGNAL'
};

/**
 * @constructor
 */
system.PlayerData = function () {
    this['name'] = '';
    this['model'] = '';
    this['globalId'] = ''; // Id of player as known by website. Currently not used
    this['gameId'] = -1;   // Id in this particular match. Filled by lobby during JOIN_MATCH request
};


/**
 * @constructor
 */
system.MatchData = function () {
    this['id'] = '';       // Filled by lobby
    this['level'] = '';    // Filled by game server
    this['toLoad'] = [];   // Filled by lobby
};

system.SERVER_ID = -1;
system.LOBBY_ID = -2;
system.INVALID_ID = -3;
system.ANY_ID = -4;
