import request from 'request';
import Method from './Method';

export default class Api {

	constructor({
		url
	} = {}) {
		this._config = {
			url
		};
	}
	
	query(method, path, data) {
		return new Promise((resolve) => {
			request({
				url: this._config.url + '/' + path,
				method: method,
				headers: {
					'Content-type': 'application/json'
				},
				json: data
			}, (error, response, body) => {
				if (error !== null) {
					throw error;
				}

				if (response.statusCode !== 200) {
					throw new Error(
						'fetching access token failed (' + response.statusCode + ' - ' + body.message + ')'
					);
				}

				resolve(body);
			});
		});
	}
	
	fetchToken(username, password) {
		return this.query(
			Method.POST,
			'token', {
				username: username,
				password: password
			}
		);
	}

}