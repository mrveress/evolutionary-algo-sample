/**
 * Created by adampetrovich on 8/5/23.
 */

import {api, LightningElement, track} from 'lwc';
import {Utils, BackpackItem, IndividualInfo} from "c/backpackTaskLib";

export default class BackpackTaskEvolutionary extends LightningElement {
    /** @type {BackpackItem[]} */
    @api items;
    /** @type {number} */
    @api backpackWeightLimit;

    /** @type {string} */
    @track status = "Not Started";
    /** @type {Date} */
    @track started;
    /** @type {Date} */
    @track startedIterations;
    /** @type {Date} */
    @track done;
    /** @type {number} */
    @track iterationsCount= 100;
    /** @type {number} */
    @track iterationsCompleted;
    /** @type {object} */
    @track best;

    /** @type {number} */
    individualsInGeneration = 400;
    /** @type {number} */
    stayChance = 80;
    /** @type {IndividualInfo[]} */
    @track generation;

    firstGenerationAlgo = "Random";
    firstGenerationAlgoOptions = [
        {label: "Random (Faster)", value: "Random"},
        {label: "Fitness Check (Slower)", value: "FitnessCheck"}
    ];

    crossingAlgo = "HalfToHalfSimple";
    crossingAlgoOptions = [
        {label: "Half-to-Half (Simple)", value: "HalfToHalfSimple"},
        {label: "Half-to-Half (Random)", value: "HalfToHalfRandom"},
        {label: "Random", value: "Random"}
    ];

    rejectionAlgo = "Cut";
    rejectionAlgoOptions = [
        {label: "Random (Slower)", value: "Random"},
        {label: "Cut Tail (Faster)", value: "Cut"}
    ];

    get startedOutput() {
        return this.started.toLocaleTimeString();
    }

    get startedIterationsOutput() {
        return this.startedIterations ? this.startedIterations.toLocaleTimeString() : null;
    }

    get spentOutput() {
        let endTime = this.isInProgress ? new Date() : this.done;
        return Utils.msToHMS(endTime.getTime() - this.started.getTime());
    }
    get leftOutput() {
        let result;
        if (this.isInProgress && this.iterationsCompleted > 0) {
            result = Utils.msToHMS(
                ((Date.now() - this.startedIterations.getTime()) / this.iterationsCompleted) * (this.iterationsCount - this.iterationsCompleted)
            );
        } else {
            result = "Not In Progress";
        }
        return result;
    }
    get isInProgress() {
        return this.status === "In Progress";
    }

    get currentGenerationSize() {
        return this.generation ? this.generation.length : 0;
    }

    run() {
        //Reducing getter calls
        this.best = undefined;
        this.done = undefined;
        this.generation = undefined;
        this.status = "In Progress";
        this.started = new Date();
        this.startedIterations = undefined;
        //this.iterationsCount = Math.pow(2, this.items.length);
        this.iterationsCompleted = 0;

        this.runNextIteration();
    }
    stop() {
        this.done = new Date();
        this.status = "Aborted";
    }

    handleInputChange(e) {
        this[e.target.dataset.param] = e.target.value;
    }

    runNextIteration() {
        //In LWC, we don't have Workers, so sponsor of this setTimeout - Salesforce Locker Service devs.
        setTimeout(() => {
            //Iteration stuff
            if (!this.generation) {
                this.createFirstGeneration();
            } else if (this.generation.length >= this.individualsInGeneration) {
                if (!this.iterationsCompleted) {
                    this.startedIterations = new Date();
                }
                this.fitnessEvaluations();
                this.rejection();

                this.selection();

                if (
                    !this.best
                    || this.best.fitness < this.generation[0].fitness
                ) {
                    this.best = this.generation[0];
                }

                this.increaseIteration();
                //console.log(JSON.parse(JSON.stringify(this.generation)));
                if (this.iterationsCompleted >= this.iterationsCount && this.status === "In Progress") {
                    this.setDone();
                } else if (this.iterationsCompleted < this.iterationsCount && this.status === "In Progress") {
                    this.runNextIteration();
                }
            }
        }, 1);
    }

    createFirstGeneration() {
        this.generation = [];
        this.generateNextRandomIndividualIfNeeded();
    }

    generateNextRandomIndividualIfNeeded() {
        setTimeout(() => {
            if (this.generation.length < this.individualsInGeneration && this.status === "In Progress") {
                this.generation.push(this[`generateIndividual${this.firstGenerationAlgo}`]());
                //console.log(this.generation.length + " from " + this.individualsInGeneration + " generated");
                this.generateNextRandomIndividualIfNeeded();
            } else {
                this.runNextIteration();
            }
        }, 1);
    }

    generateIndividualRandom() {
        return Utils.generateRandomIndividual(this.items, this.backpackWeightLimit);
    }

    generateIndividualFitnessCheck() {
        return Utils.generateRandomIndividualFitnessCheck(this.items, this.backpackWeightLimit);
    }

    fitnessEvaluations() {
        //Firsts in generations should be better, so it's reversed sort
        this.generation.sort((a, b) => b.fitness - a.fitness);
    }

    rejection() {
        this[`rejection${this.rejectionAlgo}`]();
    }

    rejectionRandom() {
        //Slower, but without stagnating
        let stayChance = this.stayChance / 100;
        this.generation = this.generation.filter(i => i.fitness > 0 && Math.random() < stayChance);
    }

    rejectionCut() {
        //Faster, but with high risk of stagnating
        this.generation = this.generation.filter(i => i.fitness > 0);
        if (this.generation.length / this.individualsInGeneration > this.stayChance / 100) {
             let generationKeepCount = Math.floor((this.stayChance / 100) * this.individualsInGeneration);
             this.generation.slice(0, generationKeepCount);
        }
    }

    selection() {
        while (this.generation.length < this.individualsInGeneration) {
            let selection = [
                Utils.selectIndividual(this.generation, this.items, this.backpackWeightLimit),
                Utils.selectIndividual(this.generation, this.items, this.backpackWeightLimit)
            ];
            let childs = this[`crossing${this.crossingAlgo}`](selection[0], selection[1]);
            Utils.mutationRandom(childs, Math.ceil(this.items.length / 4));
            childs.forEach(child => {
                if (this.generation.length < this.individualsInGeneration) {
                    this.generation.push(child);
                }
            });
        }
    }

    crossingHalfToHalfSimple(a, b) {
        let halfIndex = Math.ceil(a.bin.length / 2);
        return [
            new IndividualInfo(a.bin.slice(0, halfIndex) + b.bin.slice(halfIndex), a.allItems, a.weightLimit),
            new IndividualInfo(b.bin.slice(0, halfIndex) + a.bin.slice(halfIndex), a.allItems, a.weightLimit),
        ];
    }

    crossingHalfToHalfRandom(a, b) {
        let halfIndex = Math.ceil(a.bin.length / 2);
        let firstIndex = Utils.getRandomIntFromRange(0, halfIndex);
        let secondIndex = firstIndex + halfIndex;
        return [
            new IndividualInfo(a.bin.slice(0, firstIndex) + b.bin.slice(firstIndex, secondIndex) + a.bin.slice(secondIndex), a.allItems, a.weightLimit),
            new IndividualInfo(b.bin.slice(0, firstIndex) + a.bin.slice(firstIndex, secondIndex) + b.bin.slice(secondIndex), a.allItems, a.weightLimit)
        ]
    }

    crossingRandom(a, b) {
        let toggling = false;
        let firstIndex = 0;
        let bins = ["", ""];
        while (bins[0].length < a.bin.length) {
            let secondIndex = Utils.getRandomIntFromRange(firstIndex, a.bin.length - 1);
            let order = toggling ? [0,1] : [1,0];
            toggling = !toggling;
            bins[order[0]] += a.bin.slice(firstIndex, secondIndex);
            bins[order[1]] += b.bin.slice(firstIndex, secondIndex);
            firstIndex = secondIndex;
        }
        return [
            new IndividualInfo(bins[0], a.allItems, a.weightLimit),
            new IndividualInfo(bins[1], a.allItems, a.weightLimit)
        ]
    }

    increaseIteration() {
        this.iterationsCompleted = !this.iterationsCompleted ? 1 : this.iterationsCompleted + 1;
    }

    setDone() {
        this.done = new Date();
        this.status = "Done";
    }
}