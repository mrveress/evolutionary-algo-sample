/**
 * Created by adampetrovich on 7/8/23.
 */

import {LightningElement, track} from 'lwc';
import {Utils, BackpackItem} from "c/backpackTaskLib";

export default class BackpackTask extends LightningElement {
    /** @type {boolean} */
    showControls= true;
    /** @type {number} */
    backpackWeightLimit = 15;

    /** @type {number} */
    itemsCount = 20;

    /** @type {number} */
    minItemWeight = 2;
    /** @type {number} */
    maxItemWeight = 8;

    /** @type {number} */
    minItemPrice = 80;
    /** @type {number} */
    maxItemPrice = 1000;

    /** @type {BackpackItem[]}*/
    @track items;

    //--------------------------------------------------------CONTROLS

    toggleControls() {
        this.showControls = !this.showControls;
    }

    handleInputChange(event) {
        this[event.target.dataset.attr] = event.target.value;
    }

    generateItems() {
        try {
            this.items = [];
            let namesCount = {};
            for (let i = 0; i < this.itemsCount; i++) {

                let name = Utils.getRandomName();
                if (namesCount[name]) {
                    name += " " + (++namesCount[name]);
                } else {
                    namesCount[name] = 1;
                }

                this.items.push(
                    new BackpackItem(
                        i + 1,
                        name,
                        Utils.getRandomFloatFromRange(this.minItemWeight, this.maxItemWeight),
                        Utils.getRandomFloatFromRange(this.minItemPrice, this.maxItemPrice),
                    )
                );
            }
        } catch (e) {
            console.error(e);
        }
    }
}