import HttpStatus from 'http-status';

export default class AbstractError extends Error {

	HttpStatus = HttpStatus.OK;

	getHttpStatus() {
		return this.HttpStatus;
	}
	
}