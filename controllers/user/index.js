import AbstractController from '../../lib/server/AbstractController';

export default class UserController extends AbstractController {
	
	get() {
		return {
			id: 1,
			name: 'Priit'
		};
	}
	
}