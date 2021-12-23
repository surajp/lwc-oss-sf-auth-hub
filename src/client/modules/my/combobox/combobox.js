import { LightningElement, api } from 'lwc';
export default class Combobox extends LightningElement {
    @api
    options;

    @api
    value;

    _isListHidden = true;

    get resolvedValue() {
        return this._selectedValue || this.value;
    }

    get selectedOption() {
        return this.options.find((opt) => opt.value === this.value);
    }

    get isExpanded() {
        return !this._isListHidden + '';
    }

    get comboboxclass() {
        let classes = ['slds-combobox', 'slds-dropdown-trigger', 'slds-dropdown-trigger_click'];
        if (!this._isListHidden) classes.push('slds-is-open');
        return classes.join(' ');
    }

    get buttonclass() {
        let classes = ['slds-input_faux', 'slds-combobox__input', 'btn'];
        if (!this._isListHidden) classes.push('slds-has-focus');
        else classes.push('slds-combobox__input-value');
        return classes.join(' ');
    }

    get listboxclass() {
        let classes = ['slds-dropdown', 'slds-dropdown_length-5', 'slds-dropdown_fluid'];
        if (this._isListHidden) classes.push('slds-hide');
        return classes.join(' ');
    }

    get displayValue() {
        //return this.value + Array(150 - this.value.length).join('&nbsp;');
        return this.selectedOption?.label;
    }

    toggleOptions() {
        this._isListHidden = !this._isListHidden;
    }

    handleSelect(event) {
        event.preventDefault();
        event.stopPropagation();
        const selectedValue = event.currentTarget.dataset.value;
        this.toggleOptions();
        this.dispatchEvent(new CustomEvent('change', { detail: selectedValue }));
    }
}
