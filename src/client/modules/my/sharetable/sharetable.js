import { LightningElement, api } from 'lwc';
import config from 'my/config';
export default class Sharetable extends LightningElement {
    @api
    orgId;

    errorMessage;

    data = [];

    keyField = 'email';

    isMenuVisible = false;
    isDeleteVisible = true;

    @api
    addRow(data) {
        if (this._isUserAlreadyAdded(data)) return;
        this.data = [...this.data, data];
        this.errorMessage = '';
    }

    @api
    async saveShares() {
        const rows = { shares: this.getRows() };
        let resp = await fetch(`${config.api_url}/shares/${this.orgId}`, {
            method: 'POST',
            body: JSON.stringify(rows),
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (this._checkResponseValidity(resp)) {
            resp = await resp.json();
            this._fetchExistingShares();
        }
    }

    @api
    getRows() {
        return [...this.template.querySelectorAll('tr.tablerow')].map((row) => {
            const id = row.dataset.id;
            const currData = this.data.filter((r) => r.id == id)[0];
            const toReturn = [...row.querySelectorAll('my-tablecell')].reduce((obj, cell) => {
                obj[cell.dataset.fieldname] = cell.data;
                if (cell.isDirty()) obj.isDirty = true;
                return obj;
            }, currData);
            return toReturn;
        });
    }

    get menuClass() {
        return this.isMenuVisible ? '' : 'slds-hide';
    }

    toggleMenu(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const index = parseInt(event.target.dataset.index, 10);
        this.data = this.data.map((row, i) => {
            if (index === i) {
                row.showActions = !row.showActions;
            } else {
                row.showActions = false;
            }
            return row;
        });
    }

    async handleDelete(event) {
        this.errorMessage = '';
        const index = event.target.closest('li').dataset.index;
        const shareId = this.data[index].id;
        const resp = await this._deleteShare(shareId);
        if (!resp) this.errorMessage = 'Delete Failed';
        this.data[index].showActions = false;
        if (resp) this._fetchExistingShares();
    }

    async _deleteShare(shareId) {
        try {
            const resp = await fetch(`${config.api_url}/shares/${shareId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            return resp.status === 200;
        } catch (err) {
            console.error('> could not delete share with id', shareId, err);
            return false;
        }
    }

    shareOptions = [
        { value: 'Owner', label: 'Owner' },
        { value: 'Read', label: 'Read' },
        { value: 'Manage', label: 'Manage' }
    ];

    fields = [
        { name: 'name', label: 'Name', linkify: true, href: 'url' },
        { name: 'email', label: 'Email' },
        { name: 'accesslevel', label: 'Access Level', type: 'picklist', options: this.shareOptions }
    ];

    _isUserAlreadyAdded(user) {
        return this.data.filter((row) => user[this.keyField] === row[this.keyField]).length > 0;
    }

    connectedCallback() {
        if (this.orgId) this._fetchExistingShares();
    }

    _checkResponseValidity(resp) {
        if (resp.status === 200) return true;
        this.errorMessage = `Failed. Error: ${resp.statusText}`;
        return false;
    }

    async _fetchExistingShares() {
        this.errorMessage = '';
        let resp = await fetch(`${config.api_url}/shares/${this.orgId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (this._checkResponseValidity(resp)) {
            resp = await resp.json();
            console.log('existing shares ' + JSON.stringify(resp));
            this.data = resp;
            if (this.data.length === 0) {
                this.errorMessage = 'No shares found';
            }
        }
    }
}
