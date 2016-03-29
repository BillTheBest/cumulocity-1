import path from 'path';
import bunyan from 'bunyan';
import { logger as config } from '../../config';

/* examples
log('info "%d"', 123, { 'a': 1 });
log({ user: 'server' }, 'info "%d"', 123, { 'a': 1 });
log({ user: { firstName: 'Priit', lastName: 'Kallas' } }, 'user logged in');
log.warn('warning', 123, { 'a': 1 });
log.error('error', 123, { 'a': 1 });
log.error(new Error('Test error'), 'something went wrong...');
*/

// log levels
const levels = [
	'trace',	// Logging from external libraries used by your app or very detailed application logging.
	'debug',	// Anything else, i.e. too verbose to be included in "info" level.
	'info',		// Detail on regular operation.
	'warn',		// A note on something that should probably be looked at by an operator eventually.
	'error',	// Fatal for a particular request, but the service/app continues servicing other requests.
	'fatal'		// The service/app is going to stop or become unusable now.
];

// default logger
const defaultLog = bunyan.createLogger({
	name: 'app',
	...config
});

// default info logger
const log = (...args) => {
	defaultLog.info(...args);
};

// resolves full component filename to a relative component name
function resolveComponentName(filename) {
	const componentFilename = path.resolve(filename);
	const currentFilename = path.resolve(__filename);
	const rootFilename = path.resolve(currentFilename, '../../../');
	const relativeFilename = componentFilename.substr(rootFilename.length + 1);
	const dirname = path.dirname(relativeFilename);
	const extname = path.extname(relativeFilename);
	const basename = path.basename(relativeFilename, extname);
	const dirComponents = dirname.split(path.sep).filter(
		(dirComponent) => dirComponent.length > 0 && dirComponent !== '.'
	);

	return [...dirComponents, basename].join('/');
}

// get a component logger
log.get = (component, parameters = {}) => {
	const componentLog = defaultLog.child({
		component: resolveComponentName(component),
		// streams: defaultLog.streams,
		...parameters
	});

	/*
	const componentLog = bunyan.createLogger({
		name: component,
		...defaultParameters,
		...parameters
	});
	*/

	const defaultFn = (...args) => {
		componentLog.info(...args);
	};

	return Object.assign(
		defaultFn,
		levels.reduce((extenders, level) => {
			extenders[level] = (...args) => {
				componentLog[level](...args);
			};

			return extenders;
		}, {})
	);
};

export default log;