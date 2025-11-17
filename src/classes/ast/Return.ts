export default class Return extends Error {
    value: any;

    constructor(value: any) {
        super(null);
        this.value = value;
    }
}