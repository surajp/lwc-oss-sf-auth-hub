import { LightningElement, api } from 'lwc';
import config from 'my/config';
export default class Share extends LightningElement {
    userSearchResults = [];
    selectedUser = '';

    @api
    orgId;

    @api
    saveShares() {
        this.template.querySelector('my-sharetable').saveShares();
    }

    async handleUserSearch(event) {
        const searchTerm = event.detail.searchTerm;
        let resp = await fetch(`${config.api_url}/users`, {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({ searchTerm }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        resp = await resp.json();
        const userSearchResults = resp.map((user) => ({ id: user.id, title: user.name, icon: 'user', subtitle: user.email }));
        this.template.querySelector('my-lookup').setSearchResults(userSearchResults);
    }

    _generateRandomId() {
        return 'new-' + Math.floor(Math.random() * 1000);
    }

    handleAddClick(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!this.selectedUser) return;
        const data = {
            name: this.selectedUser.title,
            email: this.selectedUser.subtitle,
            accesslevel: 'Read',
            user_id: this.selectedUser.id,
            id: this._generateRandomId() //we need a random id since the id is used as `key` in the for loop
        };
        this.template.querySelector('my-sharetable').addRow(data);
        this.selectedUser = '';
    }

    handleSelectionChange(event) {
        const selectedIems = event.target.getSelection();
        if (selectedIems && selectedIems.length) {
            this.selectedUser = selectedIems[0];
        }
    }
}
