import winston from 'winston';
import moment from 'moment';
import colors from 'colors';

const levels = [
	'verbose',
	'info',
	'warn',
	'error'
];
const consoleColors = [
	'blue',
	'magenta',
	'cyan',
	'white',
	'gray',
	'red',
	'yellow',
	'green'
];
const componentColorMap = {};
let colorIndex = 0;

function getColoredComponent(name) {
	if (typeof componentColorMap[name] === 'undefined') {
		componentColorMap[name] = consoleColors[colorIndex];

		colorIndex = (colorIndex + 1) % consoleColors.length;
	}

	return colors[componentColorMap[name]](name);
}

const logger = new winston.Logger({
	transports: [
		new (winston.transports.Console)({
			name: 'console',
			level: 'verbose',
			colorize: true,
			prettyPrint: true,
			timestamp: () => {
				return moment().format('YYYY-MM-DD HH:mm');
			},
			align: true
		}),
		new (winston.transports.File)({
			name: 'info-file',
			filename: 'info.log.txt',
			level: 'info'
		}),
		new (winston.transports.File)({
			name: 'error-file',
			filename: 'error.log.txt',
			level: 'error'
		})
	]
	/*
	exceptionHandlers: [
		new winston.transports.File({filename: 'exceptions.log.txt'})
	]
	*/
});

const log = (...args) => {
	logger.info(...args);
};

log.get = (group) => {
	const defaultFn = (...args) => {
		logger.info(...[
			'[' + getColoredComponent(group) + ']',
			...args
		]);
	};

	return Object.assign(
		defaultFn,
		levels.reduce((extenders, level) => {
			extenders[level] = (...args) => {
				logger[level](...[
					'[' + getColoredComponent(group) + ']',
					...args
				]);
			};

			return extenders;
		}, {})
	);
};

Object.assign(log, logger);

export default log;