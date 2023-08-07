/**
 * Created by adampetrovich on 7/8/23.
 */

import {api, LightningElement, track} from 'lwc';
import {Utils, BackpackItem} from "c/backpackTaskLib";

export default class BackpackTaskBrutforce extends LightningElement {
    /** @type {BackpackItem[]} */
    @api items;
    /** @type {number} */
    @api backpackWeightLimit;

    /** @type {string} */
    status = "Not Started";
    /** @type {Date} */
    @track started;
    /** @type {Date} */
    @track done;
    /** @type {number} */
    checksCount;
    /** @type {number} */
    checked;
    /** @type {object} */
    @track best;

    get startedOutput() {
        return this.started.toLocaleTimeString();
    }
    get spentOutput() {
        let endTime = this.isInProgress ? new Date() : this.done;
        return Utils.msToHMS(endTime.getTime() - this.started.getTime());
    }
    get leftOutput() {
        let result;
        if (this.isInProgress && this.checked > 0) {
            result = Utils.msToHMS(
                ((Date.now() - this.started.getTime()) / this.checked) * (this.checksCount - this.checked)
            );
        } else {
            result = "Not In Progress";
        }
        return result;
    }
    get isInProgress() {
        return this.status === "In Progress";
    }

    run() {
        //Reducing getter calls
        this.best = undefined;
        this.done = undefined;
        this.status = "In Progress";
        this.started = new Date();
        this.checksCount = Math.pow(2, this.items.length);
        this.checked = 0;

        this.runNextChunk();
    }
    stop() {
        this.done = new Date();
        this.status = "Aborted";
    }

    runNextChunk() {
        //In LWC, we don't have Workers, so sponsor of this setTimeout - Salesforce Locker Service devs.
        setTimeout(() => {
            let itemsLeft = 1024;
            let totalNeededChecks = this.checksCount;
            do {
                this.calculateIteration();
                itemsLeft--;
            } while (itemsLeft > 0 && this.checked < totalNeededChecks && this.status !== "Aborted")

            if (this.checked >= totalNeededChecks && this.status === "In Progress") {
                this.done = new Date();
                this.status = "Done";
            } else if (this.checked < totalNeededChecks && this.status === "In Progress") {
                this.runNextChunk();
            }
        }, 1);
    }

    calculateIteration() {
        let bin = Utils.getBinaryFromNumber(this.checked, this.items.length);
        let individualInfo = Utils.getIndividualInfoFromBinary(bin, this.items, this.backpackWeightLimit);

        if (
            !this.best
            || individualInfo.fitness > this.best.fitness
        ) {
            this.best = individualInfo;
        }

        this.checked++;
    }
}