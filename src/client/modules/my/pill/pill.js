import { LightningElement, api } from 'lwc';
export default class Pill extends LightningElement {
    @api
    iconName;

    @api
    title = 'Pill';

    @api
    name;

    get iconUrl() {
        return `/SLDS/icons/utility-sprite/svg/symbols.svg#${this.iconName}`;
    }

    handleRemove() {
        this.dispatchEvent(new CustomEvent('remove'));
    }
}
