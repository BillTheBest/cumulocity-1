import AbstractController from '../lib/server/AbstractController';
import Errors from '../errors';
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
				id: joi.number().min(1).required(),
				page: joi.number().min(1)
			},
			run(parameters) {
				const id = parameters.id;
				const user = this.users.find((item) => item.id === id);

				if (!user) {
					throw new Errors.NotFoundError('User with id "' + id + '" was not found');
				}

				return user;
			}
		};
	}

	post() {
		return {
			description: 'Adds a new user',
			parameters: {
				name: joi.string().min(3).required()
			},
			path: '/create',
			run(parameters) {
				const user = {
					id: this.users.length,
					name: parameters.name
				};

				this.users.push(user);

				return user;
			}
		};
	}
	
}