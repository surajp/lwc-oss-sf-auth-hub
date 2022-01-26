import { LightningElement, api } from 'lwc';
import config from 'my/config';
export default class History extends LightningElement {
    @api
    set orgId(val) {
        console.log('>>>val ', val);
        this._orgId = val;
        this.errorMessage = '';
        this._getOrgHistory();
    }

    get orgId() {
        return this._orgId;
    }

    _orgId;
    data = [];

    errorMessage;

    fields = [
        { label: 'Name', name: 'name' },
        { label: 'Email', name: 'email' },
        { label: 'Time Of Login', name: 'created' }
    ];

    async _getOrgHistory() {
        try {
            let resp = await fetch(`${config.api_url}/history/${this._orgId}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (resp.status !== 200) {
                this.errorMessage = 'Failed to fetch history';
                return;
            }
            resp = await resp.json();
            this.data = resp;
        } catch (err) {
            console.error('error in fetch history', err);
            this.errorMessage = err.message;
        }
    }
}
