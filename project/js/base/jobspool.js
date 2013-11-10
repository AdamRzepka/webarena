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

base.JobsPool = function (workersCount, debugDeps, compiledDeps) {
    var i = 0;
    this.workersCount_ = workersCount;
    this.workers_ = [];
    this.pendingJobs_ = [];
    for (i = 0; i < workersCount; ++i) {
        this.workers_.push(base.Broker.createWorker(debugDeps, compiledDeps));
        this.pendingJobs_.push(null);
    }

    this.jobsQueue_ = new goog.structs.Queue();
};

base.JobsPool.Job = function (fun, args, transferables, callback) {
    this.fun = fun;
    this.args = args;
    this.transferables = transferables;
    this.callback = callback;
};

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

base.JobsPool.prototype.runJob_ = function (job, workerId) {
    var that = this;
    this.pendingJobs_[workerId] = job;
    this.workers_[workerId].executeFunction(job.fun, job.args, job.transferables,
                                            function (result) {
                                                that.onCallback_(result, workerId);
                                            });
};

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
