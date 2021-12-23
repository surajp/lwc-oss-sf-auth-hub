import { LightningElement, api } from 'lwc';
export default class Icon extends LightningElement {
    @api
    iconName;

    @api
    alternativeText;

    @api
    size = 'small';

    @api
    clickable = false;

    get iconClass() {
        let classes = 'slds-icon slds-icon-text-default slds-icon_' + this.size;
        if (this.clickable) classes += ' pointer';
        return classes;
    }

    get iconUrl() {
        return `/SLDS/icons/utility-sprite/svg/symbols.svg#${this.iconName || 'fallback'}`;
    }

    handleClick(event) {
        event.preventDefault();
        if (this.clickable) this.dispatchEvent(new CustomEvent('click'));
    }
}
