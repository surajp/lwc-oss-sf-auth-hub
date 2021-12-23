import { LightningElement, api } from 'lwc';
export default class Tablecell extends LightningElement {
    _row;
    _originalRow;
    _isDirty = false;

    @api
    set row(val) {
        this._row = val;
        this._originalRow = val;
    }

    get row() {
        return this._row;
    }

    @api
    field;

    @api
    isDirty() {
        return this._isDirty;
    }

    _setIsDirty(currentData) {
        if (currentData === this._originalData) this._isDirty = false;
        else this._isDirty = true;
    }

    handleComboboxChange(event) {
        event.stopPropagation();
        if (event.detail !== this.data) {
            this._row = JSON.parse(JSON.stringify(this._row));
            this._row[this.field.name] = event.detail;
        }
        this._setIsDirty(event.detail);
    }

    @api
    get data() {
        return this._row[this.field.name] || '';
    }

    get _originalData() {
        return this._originalRow[this.field.name] || '';
    }

    get href() {
        return this._row[this.field.href || ''] || '#';
    }

    get type() {
        return this.field.type || 'text';
    }

    get options() {
        return this.field.options || [];
    }

    get isPicklist() {
        return this.type === 'picklist';
    }
}
