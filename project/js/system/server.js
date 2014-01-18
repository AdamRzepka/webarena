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

goog.require('goog.debug.Logger');
goog.require('goog.asserts');
goog.require('goog.async.DeferredList');
goog.require('goog.async.Deferred');

goog.require('base.Broker');
goog.require('base.events');

goog.require('system.common');
goog.require('system.ISocket');
goog.require('system.RTCSocket');

goog.require('files.ResourceManager');

goog.provide('system.Server');

/**
 * @constructor
 * @param {system.MatchData} matchData
 * @param {string} lobbyUrl
 * @param {files.ResourceManager} rm
 */
system.Server = function (matchData, lobbyUrl, rm) {
    var that = this;
    /**
     * @const
     * @private
     * @type {files.ResourceManager}
     */
    this.rm_ = rm;
    /**
     * @const
     * @private
     * @type {system.WebSocket}
     */
    this.lobbySocket_ = new system.WebSocket(lobbyUrl);
    /**
     * @const
     * @private
     * @type {Array.<system.Server.ClientData>}
     */
    this.clients_ = [];
    /**
     * @private
     * @type {system.MatchData}
     */
    this.matchData_ = null;
    /**
     * @const
     * @private
     * @type {base.IBroker}
     */
    this.broker_ = base.IBroker.createWorker(['game'], ['base.js', 'game.js'], 'game');
    
    this.createMatch_(matchData);
};

/**
 * @public
 * @type {function(string)}
 */
system.Server.prototype.onGameStarted = function (matchId) {};
/**
 * @public
 * @type {function()}
 */
system.Server.prototype.onError = function () {};

/**
 * @constructor
 */
system.Server.ClientData = function () {
    /**
     * @type {system.RTCSocket}
     */
    this.socket = null;
    /**
     * @type {system.PlayerData}
     */
    this.playerData = null;
};

/**
 * @const
 * @private
 * @type {goog.debug.Logger}
 */
system.Server.prototype.logger_ = goog.debug.Logger.getLogger('system.Server');
/**
 * @private
 */
system.Server.prototype.createMatch_ = function (matchData) {
    var that = this;
    this.lobbySocket_.onopen = function () {
        var msg = {
            'type': system.ControlMessage.Type.CREATE_MATCH_REQUEST,
            'matchId': -1,
            'from': system.SERVER_ID,
            'to': system.LOBBY_ID,
            'data': matchData
        };
        that.logger_.log(goog.debug.Logger.Level.INFO,
                         'Lobby socket opened');
        that.lobbySocket_.send(JSON.stringify(msg));
    };
    this.lobbySocket_.onmessage = function (evt) {
        that.onMessage_(JSON.parse(evt.data));
    };
    this.lobbySocket_.onclose = function (evt) {
        that.logger_.log(goog.debug.Logger.Level.WARNING,
                         'Lobby socket closed');
        throw new Error('Lobby socket closed');
    };
};
/**
 * @private
 */
system.Server.prototype.onMessage_ = function (msg) {
    if (msg['type'] === system.ControlMessage.Type.CREATE_MATCH_RESPONSE &&
        this.matchData_ !== null) {
        this.logger_.log(goog.debug.Logger.Level.WARNING,
                         'Got second CREATE_MATCH_RESPONSE. Ignoring.');
        return;
    }
    if (msg['type'] !== system.ControlMessage.Type.CREATE_MATCH_RESPONSE &&
        msg['matchId'] !== this.matchData_.id) {
        this.logger_.log(goog.debug.Logger.Level.WARNING,
                         'Wrong match id: ' + msg.matchId);
        return;
    }
    
    switch (msg.type) {
    case system.ControlMessage.Type.CREATE_MATCH_RESPONSE:
        this.onCreateMatchResponse_(msg['data']);
        break;
    case system.ControlMessage.Type.JOIN_MATCH_REQUEST:
        this.onJoinMatchRequest_(msg['data']);
        break;
    case system.ControlMessage.Type.DISCONNECTED:
        this.onDisconnected_(msg['from']);
        break;
    case system.ControlMessage.Type.RTC_SIGNAL:
        this.onRTCSignal_(msg['from'], msg['data']);
        break;
    default:
        this.logger_.log(goog.debug.Logger.Level.WARNING,
                         'Unsupported message type: ' + msg['type']);
        break;
    }
};
/**
 * @private
 */
system.Server.prototype.onCreateMatchResponse_ = function (matchData) {
    this.matchData_ = matchData;
    this.initGame_(matchData['level'], matchData['toLoad']);
};
/**
 * @private
 */
system.Server.prototype.onJoinMatchRequest_ = function (playerData) {
    var id = playerData['gameId'];
    var that = this;
    goog.asserts.assert(id >= 0 && !goog.isDefAndNotNull(this.clients_[id]));
    this.logger_.log(goog.debug.Logger.Level.INFO,
                     'New join request: ' + JSON.stringify(playerData));    
    this.clients_[id] = /**@type{system.Server.ClientData}*/{
        socket: this.createClientSocket_(playerData),
        playerData: playerData
    };
    this.loadResources_([playerData['model']]).addCallback(function () {
        that.logger_.log(goog.debug.Logger.Level.INFO,
                         'Loaded model for player ' + playerData['gameId']);
    });;
};
/**
 * @private
 */
system.Server.prototype.onDisconnected_ = function (clientId) {
    this.logger_.log(goog.debug.Logger.Level.INFO,
                     'Client disconnected from lobby: ' + clientId);    
    
};
/**
 * @private
 */
system.Server.prototype.onRTCSignal_ = function (clientId, msg) {
    if (goog.isDefAndNotNull(this.clients_[clientId])) {
        this.clients_[clientId].socket.readSignallingMessage(msg);
    } else {
        this.logger_.log(goog.debug.Logger.Level.WARNING,
                         'Wrong clientId in onRTCSignal_: ' + clientId);
    }
};
/**
 * @private
 */
system.Server.prototype.createClientSocket_ = function (playerData) {
    var that = this;
    var clientId = playerData['gameId'];
    var socket;
    
    function  signallingCallback(msg) {
        var cmsg = {
            'type': system.ControlMessage.Type.RTC_SIGNAL,
            'matchId': that.matchData_['id'],
            'from': system.SERVER_ID,
            'to': clientId,
            'data': msg
        };
        that.lobbySocket_.send(JSON.stringify(cmsg));
    }
    
    socket = new system.RTCSocket(signallingCallback);
    
    socket.onopen = function () {
        that.logger_.log(goog.debug.Logger.Level.INFO,
                         'RTCSocket opened to client ' + clientId);
        that.broker_.fireEvent(base.EventType.PLAYER_CONNECTED, playerData);
    };
    socket.onmessage = function (evt) {
        that.broker_.fireEvent(base.EventType.INPUT_UPDATE, {
            playerId: clientId,
            inputState: evt.data
        });
    };
    socket.onclose = function () {
        that.logger_.log(goog.debug.Logger.Level.INFO,
                         'RTCSocket closed to client ' + clientId);
        that.broker_.fireEvent(base.EventType.PLAYER_DISCONNECTED, clientId);
    };

    return socket;
};
/**
 * @private
 */
system.Server.prototype.initGame_ = function (level, archives) {
    var that = this;

    // archives.push('assassin');
    
    this.broker_.registerEventListener(base.EventType.STATE_UPDATE, function (type, data) {
        var clientId = data.playerId;
        goog.asserts.assert(goog.isDefAndNotNull(that.clients_[clientId]));
        that.clients_[clientId].socket.send(data.data);
    });

    this.broker_.executeFunction(function (broker) {
        game.init((/**@type{base.IBroker}*/broker), true, -1);
    }, []);

    this.loadResources_(archives).addCallback(function() {
        that.broker_.fireEvent(base.EventType.GAME_START, null);
        that.onGameStarted(that.matchData_.id);
    });
};
/**
 * @private
 */
system.Server.prototype.loadResources_ = function (archives) {
    var i = 0;
    var rm = this.rm_;
    var broker = this.broker_;
    var deferred;
    var deferreds = [];
    function onload (archive) {
        var key;
        for ( key in archive.models ) {
            if (archive.models.hasOwnProperty(key)) {
                broker.fireEvent(base.EventType.MODEL_LOADED, {
                    url: key,
                    model: archive.models[key]
                });
            }
        }
        for( key in archive.configs ) {
            if (archive.configs.hasOwnProperty(key)) {
                broker.fireEvent(base.EventType.CONFIG_LOADED, {
                    url: key,
                    config: archive.configs[key]
                });
            }
        }
        if (archive.map) {
            broker.fireEvent(base.EventType.MAP_LOADED, {
                models: archive.map.models,
                lightmapData: null,  // game worker doesn't need lightmap
                bsp: archive.map.bsp,
                entities: archive.map.entities
            });
        }
    };

    for (i = 0; i < archives.length; ++i) {
        deferred = rm.load(archives[i]);
        deferred.addCallback(onload);
        deferreds.push(deferred);
    }
    return goog.async.DeferredList.gatherResults(deferreds);
};

