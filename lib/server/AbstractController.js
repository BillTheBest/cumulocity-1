import joi from 'joi';

export default class AbstractController {

	get() {
		throw new Error('Operation not supported');
	}
	
	validateParameters(parameters, schema) {
		joi.validate(parameters, schema, (error, value) => {
			if (error) {
				throw error;
			}
		});
	}
	
}