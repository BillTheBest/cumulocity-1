import AbstractController from '../../lib/server/AbstractController';
import joi from 'joi';

export default class UserController extends AbstractController {
	
	get() {
		return {
			description: 'Fetches requested user info',
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