import { LightningElement, api } from 'lwc';
export default class Richtext extends LightningElement {
    _val;
    _isInitialHtmlSet = false;

    @api
    set value(val) {
        this._val = val;
        this._setHtml();
    }

    get value() {
        return this._val;
    }

    renderedCallback() {
        if (this._isInitialHtmlSet) return;
        this._isInitialHtmlSet = true;
        this._setHtml();
    }

    _setHtml() {
        const element = this.template.querySelector('div.parent');
        if (element) element.innerHTML = this._val || '';
    }
}
