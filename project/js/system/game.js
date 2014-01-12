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

goog.require('system.Client');
goog.require('system.Server');
goog.require('files.ResourceManager');

goog.provide('system.Game');

/**
 * @constructor
 * @param {system.Game.Config} config
 */
system.Game = function (config) {
    /**
     * @private
     * @type {system.Server}
     */
    this.server_ = null;
    /**
     * @private
     * @type {system.Client}
     */
    this.client_ = null;

    /**
     * @private
     * @type {system.Game.Config}
     */
    this.config_ = config;
    /**
     * @private
     * @type {files.ResourceManager}
     */
    this.rm_ = new files.ResourceManager();

    this.init_();
};

/**
 * @constructor
 */
system.Game.Config = function () {
    /**
     * @type {WebGLRenderingContext}
     */
    this.gl = null;
    /**
     * @type {HTMLElement}
     */
    this.inputElement = null;
    /**
     * @type {string}
     */
    this.lobbyUrl = '';
    /**
     * @type {system.PlayerData}
     */
    this.playerData = new system.PlayerData();

    /**
     * @type {boolean}
     */
    this.createMatch = true;
    /**
     * @type {system.MatchData}
     * should be not null, when createMatch = true
     */
    this.matchData = new system.MatchData();
    /**
     * @type {function(string)}
     */
    this.onMatchCreated = function (matchId) {};

    /**
     * @type {string}
     * if createMatch = false, matchId must be valid
     */
    this.matchId = '';
};

/**
 * @private
 */
system.Game.prototype.logger_ = goog.debug.Logger.getLogger('system.Game');

/**
 * @private
 */
system.Game.prototype.init_ = function () {
    var that = this;
    var conf = this.config_;
    if (conf.createMatch) {
        this.server_ = new system.Server(conf.matchData, conf.lobbyUrl, this.rm_);
        this.server_.onGameStarted = function (matchId) {
            that.logger_.log(goog.debug.Logger.Level.INFO,
                             'Server created');
            conf.onMatchCreated(matchId);
            that.client_ = new system.Client(matchId, conf.playerData,
                                             conf.lobbyUrl, conf.gl, conf.inputElement,
                                             that.rm_);
            that.client_.onGameStarted = function () {
                that.logger_.log(goog.debug.Logger.Level.INFO,
                                 'client connected');        
            };
        };
    } else {
        this.client_ = new system.Client(conf.matchId, conf.playerData,
                                         conf.lobbyUrl, conf.gl, conf.inputElement,
                                         this.rm_);
        this.client_.onGameStarted = function () {
            that.logger_.log(goog.debug.Logger.Level.INFO,
                             'client connected');        
        };        
    }
};

