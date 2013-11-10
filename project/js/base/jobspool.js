/**
 * copyright (C) 2012 Adam Rzepka
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

goog.require('goog.structs.Queue');
goog.require('base.Broker');

goog.provide('base.JobsPool');

/**
 * @constructor
 * @param {number} workersCount
 * @param {Array.<string>} debugDeps
 * @param {Array.<string>} compiledDeps
 * @param {string} name
 */
base.JobsPool = function (workersCount, debugDeps, compiledDeps, name) {
    var i = 0;
    /**
     * @private
     * @type {number}
     */
    this.workersCount_ = workersCount;
    /**
     * @private
     * @type {Array.<base.Broker>}
     */
    this.workers_ = [];
    /**
     * @private
     * @type {Array.<base.JobsPool.Job>}
     */
    this.pendingJobs_ = [];
    /**
     * @private
     * @type {goog.structs.Queue}
     */
    this.jobsQueue_ = new goog.structs.Queue();

    for (i = 0; i < workersCount; ++i) {
        this.workers_.push(base.Broker.createWorker(debugDeps, compiledDeps, name));
        this.pendingJobs_.push(null);
    }

};

/**
 * @public
 * @param {*} fun function to execute
 * @param {Array.<*>} args arguments to pass to fun
 * @param {?Array.<*>} [transferables]
 * @param {function(*)} [callback] callback fired in current worker with results of execution
 */
base.JobsPool.prototype.execute = function (fun, args, transferables, callback) {
    var i = 0;

    var job = new base.JobsPool.Job(fun, args, transferables, callback);
    
    for (i = 0; i < this.workersCount_; ++i) {
        if (this.pendingJobs_[i] === null) {
            this.runJob_(job, i);
            return;
        }
    }

    this.jobsQueue_.enqueue(job);
};

/**
 * @private
 * @constructor
 */
base.JobsPool.Job = function (fun, args, transferables, callback) {
    this.fun = fun;
    this.args = args;
    this.transferables = transferables;
    this.callback = callback;
};
/**
 * @private
 */
base.JobsPool.prototype.runJob_ = function (job, workerId) {
    var that = this;
    this.pendingJobs_[workerId] = job;
    this.workers_[workerId].executeFunction(job.fun, job.args, job.transferables,
                                            function (result) {
                                                that.onCallback_(result, workerId);
                                            });
};
/**
 * @private
 */
base.JobsPool.prototype.onCallback_ = function (result, workerId) {
    var job = this.pendingJobs_[workerId];
    if (job.callback) {
        job.callback(result);
    }
    
    this.pendingJobs_[workerId] = null;

    if (!this.jobsQueue_.isEmpty()) {
        this.runJob_(this.jobsQueue_.dequeue(), workerId);
    }
};
