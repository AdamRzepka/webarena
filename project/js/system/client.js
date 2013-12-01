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

goog.require('goog.asserts.assert');
goog.require('goog.debug.Logger');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');
goog.require('base.events');
goog.require('base.Broker');
goog.require('system.ISocket');
goog.require('system.RTCSocket');
goog.require('system.ControlMessage');
goog.require('renderer.Scene');
goog.require('files.ResourceManager');

goog.provide('system.Client');

/**
 * @constructor
 * @param {string} matchId
 * @param {Object} playerInfo
 * @param {string} lobbyUrl
 * @param {WebGLRenderingContext} gl
 * @param {files.ResourceManager} rm
 */
system.Client = function (matchId, playerData, lobbyUrl, gl, rm) {
    var that = this;
    /**
     * @const
     * @private
     * @type {renderer.Scene}
     */
    this.rendererScene_ = new renderer.Scene(gl);
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
     * @type {system.RTCSocket}
     */
    this.serverSocket_ = null;
    this.broker_ = base.Broker.createWorker(['game'], ['base.js', 'game.js'], 'game');
    this.playerData_ = null;
    this.matchData_ = null;
    
    this.joinMatch_(matchId, playerData);
};

/**
 * @private
 */
system.Client.prototype.logger_ = goog.debug.Logger.getLogger('system.Client');

system.Client.prototype.joinMatch_ = function (matchId, playerData) {
    var that = this;
    this.lobbySocket_.onopen = function () {
        var msg = {
            type: system.ControlMessage.Type.JOIN_MATCH_REQUEST,
            matchId: matchId,
            from: system.SERVER_ID,
            to: system.LOBBY_ID,
            data: playerData
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

system.Client.prototype.onMessage_ = function (msg) {
    if (msg.type === system.ControlMessage.Type.JOIN_MATCH_RESPONSE &&
        this.matchData_ !== null) {
        this.logger_.log(goog.debug.Logger.Level.WARNING,
                         'Got second JOIN_MATCH_RESPONSE. Ignoring.');
        return;
    }
    if (msg.type !== system.ControlMessage.Type.JOIN_MATCH_RESPONSE &&
        msg.matchId !== this.matchData_.id) {
        this.logger_.log(goog.debug.Logger.Level.WARNING,
                         'Wrong match id: ' + msg.matchId);
        return;
    }
    if (msg.type !== system.ControlMessage.Type.JOIN_MATCH_RESPONSE &&
        msg.to !== this.playerData_.gameId && msg.to !== system.ANY_ID) {
        this.logger_.log(goog.debug.Logger.Level.WARNING,
                         'Wrong player id: ' + msg.matchId);
        return;
    }
    
    switch (msg.type) {
    case system.ControlMessage.Type.JOIN_MATCH_RESPONSE:
        this.onJoinMatchResponse_(msg.data);
        break;
    case system.ControlMessage.Type.JOIN_MATCH_REQUEST:
        this.onJoinMatchRequest_(msg.data);
        break;
    case system.ControlMessage.Type.DISCONNECTED:
        this.onDisconnected_(msg.from);
        break;
    case system.ControlMessage.Type.RTC_SIGNAL:
        this.onRTCSignal_(msg.data);
        break;
    default:
        this.logger_.log(goog.debug.Logger.Level.WARNING,
                         'Unsupported message type: ' + msg.type);
        break;
    }
};

system.Client.prototype.onJoinMatchResponse_ = function (data) {
    this.playerData_ = data.playerData;
    this.matchData_ = data.matchData;

    this.initGame_(this.matchData_.level, this.matchData_.toLoad);
};

system.Client.prototype.onJoinMatchRequest_ = function (playerData) {
    // TODO
};

system.Client.prototype.onDisconnected_ = function (playerId) {
    // TODO
};

system.Client.prototype.onRTCSignal_ = function (msg) {
    if (this.serverSocket_) {
        this.serverSocket_.readSignallingMessage(msg);
    } else {
        this.logger_.log(goog.debug.Logger.Level.WARNING,
                         'serverSocket not created yet');
    }
};

system.Client.prototype.initGame_ = function (level, archives) {
    this.logger_.log(goog.debug.Logger.Level.INFO,
                         'initializing game');
    var that = this;
    var deferred = this.initRTC_();

    deferred.awaitDeferred(this.loadResources_(archives, this.rendererScene_));

    deferred.addCallback(function() {
        that.logger_.log(goog.debug.Logger.Level.INFO,
                         'game initialized');        
        that.broker_.fireEvent(base.EventType.GAME_START);
        that.onGameStarted();
    });
};

system.Client.prototype.initRTC_ = function () {
    var that = this;
    var deferred = new goog.async.Deferred();
    function signallingCallback(msg) {
        var cmsg = {
            type: system.ControlMessage.Type.RTC_SIGNAL,
            matchId: that.matchData_.id,
            from: that.playerData_.gameId,
            to: system.SERVER_ID,
            data: msg
        };
        that.lobbySocket_.send(JSON.stringify(cmsg));
    }
    this.serverSocket_ = new system.RTCSocket(signallingCallback);
    this.serverSocket_.onopen = function () {
        that.logger_.log(goog.debug.Logger.Level.INFO,
                         'RTCSocket opened');
        deferred.callback();
    };
    this.serverSocket_.onmessage = function (evt) {
        that.broker_.fireEvent(base.EventType.STATE_UPDATE, evt.data);
    };
    this.serverSocket_.onclose = function () {
        that.logger_.log(goog.debug.Logger.Level.INFO,
                         'RTCSocket closed');
        // TODO
    };
    this.serverSocket_.open();
    return deferred;
};

system.Client.prototype.loadResources_ = function (archives, scene) {
    var i = 0;;
    var rm = this.rm_;
    var broker = this.broker_;
    var deferred;
    var deferreds = [];
    function onload (archive) {
        var key;
        scene.buildShaders(archive.scripts, archive.textures);
        for ( key in archive.models ) {
            if (archive.models.hasOwnProperty(key)) {
                broker.fireEvent('model_loaded', {
                    url: key,
                    model: archive.models[key]
                });
                scene.registerMd3(archive.models[key]);
            }
        }
        for( key in archive.configs ) {
            if (archive.configs.hasOwnProperty(key)) {
                broker.fireEvent('config_loaded', {
                    url: key,
                    config: archive.configs[key]
                });
            }
        }
        if (archive.map) {
            broker.fireEvent('map_loaded', {
                models: archive.map.models,
                lightmapData: null,  // game worker doesn't need lightmap
                bsp: archive.map.bsp,
                entities: archive.map.entities
            });
            scene.registerMap(archive.map.models, archive.map.lightmapData);
        }
    };

    for (i = 0; i < archives.length; ++i) {
        deferred = rm.load(archives[i]);
        deferred.addCallback(onload);
        deferreds.push(deferred);
    }
    return goog.async.DeferredList.gatherResults(deferreds);
};

