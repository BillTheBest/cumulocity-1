import AbstractController from '../../lib/server/AbstractController';
import joi from 'joi';

export default class UserController extends AbstractController {

	constructor() {
		super();

		this.users = [{
			id: 1,
			name: 'Jack Daniels'
		}, {
			id: 2,
			name: 'Jill Pipers'
		}];
	}
	
	get() {
		return {
			description: 'Fetches information about a selected user',
			path: '/:id',
			parameters: {
				id: joi.number().min(1)
			},
			run(parameters) {
				const id = parameters.id;

				console.log('find', id, this);

				const user = this.users.find((item) => item.id === id);

				if (!user) {
					throw new Error('User with id "' + id + '" was not found');
				}

				return user;
			}
		};
	}

	getUser() {
		return {
			description: 'Fetches list of all users',
			parameters: {
				id: joi.number().min(1)
			},
			run(parameters) {
				return {
					id: 1,
					name: 'Priit',
					parameters
				};
			}
		};
	}
	
}