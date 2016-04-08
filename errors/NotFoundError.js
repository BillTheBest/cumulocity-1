import AbstractError from '../lib/server/AbstractError';
import HttpStatus from 'http-status';

export default class NotFoundError extends AbstractError {
	HttpStatus = HttpStatus.NOT_FOUND;
}