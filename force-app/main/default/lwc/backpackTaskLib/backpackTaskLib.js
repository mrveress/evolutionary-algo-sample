/**
 * Created by adampetrovich on 7/8/23.
 */

class Utils {
    /** @type {string[]} */
    static ITEM_NAMES = [
        "Potion", "Dagger", "Shield", "Bow", "Staff", "Amulet", "Arrow", "Helmet", "Ring", "Gauntlet", "Cloak",
        "Scroll", "Key", "Torch", "Quiver", "Rope", "Map", "Compass", "Gem", "Mana", "Rune", "Feathers", "Vial",
        "Trap", "Gloves", "Belt", "Shovel", "Lantern", "Bandage", "Bombs", "Whistle", "Tent", "Grappling", "Carrot",
        "Sack", "Book", "Chalice", "Flute", "Lockpick", "Wine", "Candelabra", "Rations", "Horn", "Mask", "Mirror",
        "Paintbrush", "Boots", "Buckler", "Trophy", "Flasks", "Trap", "Spade", "Telescope", "Dice", "Topaz", "Leather",
        "Quill", "Ink", "Arrowhead", "Harp", "Whetstone", "Feather", "Dice", "Tome", "Parchment", "Magnifying",
        "Hourglass", "Compass", "Coin", "Adrenaline"
    ];

    static getRandomName = () => {
        return this.ITEM_NAMES[Math.floor(Math.random() * this.ITEM_NAMES.length)];
    }

    static getRandomIntFromRange = (from, to) => {
        return Math.ceil((Math.random() * (to - from)) + from);
    }

    static getRandomFloatFromRange = (from, to) => {
        let m = 100;
        let mFrom = from * m;
        let mTo = to * m;
        return Math.ceil((Math.random() * (mTo - mFrom)) + mFrom) / m;
    }

    /**
     * @param {number} n
     * @param {number} size
     * @returns {string}
     * */
    static getBinaryFromNumber(n, size) {
        return n.toString(2).padStart(size, '0');
    }

    /**
     * @param {string} bin
     * @returns {number[]}
     */
    static getItemsIndexesFromBinary(bin) {
        return [...bin.matchAll(/1/g)].map(m => m.index);
    }

    /**
     * @param {BackpackItem[]} items
     * @param {number[]} indexes
     * @returns {BackpackItem[]}
     */
    static getItemsFromIndexes(items, indexes) {
        return items.filter((item, i) => indexes.includes(i));
    }

    /**
     * @param {BackpackItem[]} items
     * @returns {number}
     */
    static getSumPrice(items){
        return items.reduce((total, item) => total + item.price, 0);
    }

    /**
     * @param {BackpackItem[]} items
     * @returns {number}
     */
    static getSumWeight(items){
        return items.reduce((total, item) => total + item.weight, 0);
    }

    /**
     * @param {number} ms
     * @return {string}
     */
    static msToHMS(ms) {
        let result = '';

        let years = Math.floor(ms  / 1000 / 60 / 60 / 24 / 30 / 12);
        result += years ? `${years}y ` : '';

        let months = Math.floor((ms  / 1000 / 60 / 60 / 24 / 30) % 12);
        result += months ? `${months}m ` : '';

        let days = Math.floor((ms  / 1000 / 60 / 60 / 24) % 30);
        result += days ? `${days}d ` : '';

        let hours = Math.floor((ms  / 1000 / 60 / 60 ) % 24);
        result += hours ? `${hours}h ` : '';

        let minutes = Math.floor((ms / 1000 / 60) % 60);
        result += minutes ? `${minutes}m ` : '';

        let seconds = Math.floor((ms / 1000) % 60);
        result += seconds ? `${seconds}s ` : '';

        return result.trim();
    }

    /**
     * @param {string} bin
     * @param {BackpackItem[]} items
     * @param {number} weightLimit
     * @returns {IndividualInfo}
     */
    static getIndividualInfoFromBinary(bin, items, weightLimit) {
        return new IndividualInfo(bin, items, weightLimit);
    }

    /**
     * @param {BackpackItem[]} items
     * @param {number} weightLimit
     * @returns {IndividualInfo}
     */
    static generateRandomIndividual(items, weightLimit) {
        let bin = "";
        for (let i = 0; i < items.length; i++) {
            bin += Math.random() > 0.5 ? "1" : "0";
        }
        return new IndividualInfo(bin, items, weightLimit);
    }

    /**
     * @param {BackpackItem[]} items
     * @param {number} weightLimit
     * @returns {IndividualInfo}
     */
    static generateRandomIndividualFitnessCheck(items, weightLimit) {
        let individual;
        while (!individual) {
            let generatedIndividual = Utils.generateRandomIndividual(items, weightLimit);
            if (generatedIndividual.fitness > 0) {
                individual = generatedIndividual;
            }
        }
        return individual;
    }

    /**
     * @param {IndividualInfo[]} generation
     * @returns {number}
     */
    static generationFitnessSum(generation) {
        return generation.reduce((sum, currentValue) => sum + currentValue.fitness, 0);
    }

    /**
     * @param {IndividualInfo[]} generation
     * @param {BackpackItem[]} items
     * @param {number} weightLimit
     * @returns {IndividualInfo}
     */
    static selectIndividual(generation, items, weightLimit) {
        let result;
        if (generation && generation.length > 1) {
            let fitnessSum = this.generationFitnessSum(generation);
            while (!result) {
                for (let i = 0; i < generation.length; i++) {
                    if (Math.random() <= (generation[i].fitness / fitnessSum)) {
                        result = generation[i];
                        break;
                    }
                }
            }
        } else {
            //There is a situation when generation is empty, so we need to generate random member
            result = this.generateRandomIndividualFitnessCheck(items, weightLimit);
        }
        return result;
    }

    /**
     * @param {IndividualInfo[] | IndividualInfo} childsOrChild
     * @param {number} mutationsCount
     */
    static mutationRandom(childsOrChild, mutationsCount) {
        if (Array.isArray(childsOrChild)) {
            childsOrChild.forEach(child => {
                this.mutationRandom(child, mutationsCount);
            });
        } else {
            let child = childsOrChild;
            for (let i = 0; i < mutationsCount; i++) {
                this.swapBit(child, this.getRandomIntFromRange(0, child.bin.length - 1))
            }
        }
    }

    /**
     *
     * @param {IndividualInfo} individual
     * @param {number} bitIndex
     */
    static swapBit(individual, bitIndex) {
        let targetBit = parseInt(individual.bin.charAt(bitIndex));
        targetBit = Math.abs(targetBit - 1);
        individual.bin = individual.bin.slice(0, bitIndex) + targetBit.toString() + individual.bin.slice(bitIndex + 1);
    }
}

class IndividualInfo {
    _bin;
    get bin() { return this._bin; }
    set bin(value) { this._bin = value; this.updateItems(); }

    allItems;
    weightLimit;
    indexes;
    items;
    fitness;

    constructor(bin, items, weightLimit) {
        this.allItems = items;
        this.weightLimit = weightLimit;
        this.bin = bin;
    }

    updateItems() {
        this.indexes = Utils.getItemsIndexesFromBinary(this.bin);
        this.items = Utils.getItemsFromIndexes(this.allItems, this.indexes);
        this.fitness = this.sumWeight > this.weightLimit ? 0 : this.sumPrice;
    }

    get sumPrice() {
        return Utils.getSumPrice(this.items);
    }

    get sumWeight() {
        return Utils.getSumWeight(this.items);
    }
}

class BackpackItem {
    constructor(id, name, weight, price) {
        this.id = id;
        this.name = name;
        this.weight = weight;
        this.price = price;
    }
}

export {
    Utils,
    BackpackItem,
    IndividualInfo
}