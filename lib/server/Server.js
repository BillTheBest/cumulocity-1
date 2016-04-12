import path from 'path';
import glob from 'glob';
import restify from 'restify';
import bodyParser from 'body-parser';
import normalizeType from 'normalize-type';
import HttpStatus from 'http-status';
import changeCase from 'change-case';
import Errors from '../../errors';
import logger from '../logger';

const log = logger.get(__filename);

export const Method = {
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT'
};

export const ErrorType = {
	SYSTEM: 'system',
	VALIDATION: 'validation',
	API: 'api'
};

export default class Server {

	static Method = Method;
	static ErrorType = ErrorType;

	constructor(config = {}) {
		this.config = config;
		this.handler = restify.createServer(config);

		this.statistics = {
			requestCount: 0
		};

		this.controllers = [];

		this.setup();
	}

	setup() {
		log('performing default setup');

		this.setupCurlSupport();
		this.setupQueryParser();
		this.setupBodyParser();
		this.setupErrorHandler();
		this.setupGlobalRoute();
		this.setupIndexRoute();
		this.setupControllers();

		return this;
	}
	
	setupCurlSupport() {
		log('setting up CURL support');

		this.handler.pre(
			restify.pre.userAgentConnection()
		);
	}

	setupQueryParser() {
		log('setting up query parser');

		this.handler.use(
			restify.queryParser()
		);
	}

	setupBodyParser() {
		log('setting up body parser');

		// use json body parser
		this.handler.use(bodyParser.json({
			limit: '1mb'
		}));
	}

	setupErrorHandler() {
		this.handler.on('after', (req, res, route, error) => {
			log('after', error);

			res.send(
				this.formatError(error)
			);
		});

		this.handler.on('NotFound', (req, res, cb) => {
			log('NotFound');

			res.send(
				HttpStatus.NOT_FOUND,
				this.formatError(
					new Errors.NotFoundError('Requested resource not found')
				)
			);
		});
	}

	setupGlobalRoute() {
		log('setting up global route');

		this.handler.use(
			(...args) => this.handleGlobalRoute(...args)
		);
	}

	setupIndexRoute() {
		log('setting up index route');

		this.registerAction(
			'index',
			Method.GET,
			'/',
			(...args) => this.handleIndexRoute(...args)
		);
	}

	getControllersInDirectory(directory) {
		const controllersPattern = path.join(directory, '**/*Controller.js');
		const controllerFilenames = glob.sync(controllersPattern);

		return controllerFilenames.map((controllerFilename) => {
			const controller = {
				name: this.getControllerNameFromFilename(controllerFilename),
				filename: controllerFilename,
				include: null,
				instance: null
			};
			
			return controller;
		});
	}

	getControllerNameFromFilename(filename) {
		const info = path.parse(filename);
		const directoryTokens = info.dir.split('/');
		const basename = info.base;
		const suffix = 'Controller.js';
		const namePascalCase = basename.substr(0, basename.length - suffix.length);
		const nameParamCase = changeCase.paramCase(namePascalCase);

		log('getControllerNameFromFilename', filename, nameParamCase);

		return nameParamCase;
	}

	setupControllers() {
		this.controllers = this.getControllersInDirectory(this.config.controllersDirectory).map(
			(controller) => this.setupController(controller)
		);
	}

	setupController(controller) {
		log('setup controller "' + controller.name + '"');

		controller.include = require(controller.filename);
		controller.instance = new controller.include.default(); // eslint-disable-line new-cap

		const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(controller.instance));

		methodNames.forEach((methodName) => {
			if (methodName === 'constructor') {
				return;
			}

			this.setupControllerMethod(controller, methodName);
		});

		return controller;
	}

	setupControllerMethod(controller, methodName) {
		const descriptor = controller.instance[methodName]();
		const actionPath = this.resolveControllerActionPath(controller, descriptor);
		const routePath = '/' + controller.name + actionPath;
		const method = this.getActionMethodFromName(methodName);

		log('setup controller method ' + method + ' "' + methodName + '" at "' + routePath + '"');

		this.registerAction(
			controller.name + '/' + methodName,
			method,
			routePath,
			(req, res, next) => this.handleControllerRoute(controller, descriptor, req, res, next)
		);
	}

	getActionMethodFromName(methodName) {
		for (const methodKey in Method) {
			if (methodName.toUpperCase().substr(0, methodKey.length) === methodKey.toUpperCase()) {
				return methodKey;
			}
		}

		throw new Error('Determining method type for "' + methodName + '" failed, it should start with get, post etc');
	}

	resolveControllerActionPath(controller, descriptor) {
		if (typeof descriptor.path === 'string') {
			return descriptor.path;
		} else if (typeof descriptor.path === 'function') {
			return descriptor.path();
		}

		return '';
	}

	handleIndexRoute(req, res, next) { // eslint-disable-line no-unused-vars
		res.send('index route response: ' + this.statistics.requestCount);
	}

	handleGlobalRoute(req, res, next) {
		this.updateStatistics(req, res);

		next();
	}

	handleControllerRoute(controller, descriptor, req, res, next) {
		const normalizedParameters = normalizeType(req.params);

		log('got request', normalizedParameters, req.body, descriptor.description);

		try {
			controller.instance.validateParameters(normalizedParameters, descriptor.parameters);
		} catch (e) {
			this.sendErrorResponse(res, e);

			return;
		}

		try {
			const response = descriptor.run.call(controller.instance, normalizedParameters);

			this.sendSuccessResponse(res, response);
		} catch (e) {
			this.sendErrorResponse(res, e);
		}
	}

	sendSuccessResponse(res, data) {
		const statusCode = HttpStatus.OK;

		res.send(HttpStatus.OK, {
			data: data,
			code: statusCode,
			status: HttpStatus[statusCode] || HttpStatus[200],
			error: null
		});
	}

	sendErrorResponse(res, error) {
		const formattedError = this.formatError(error);
		const statusCode = formattedError.status || HttpStatus.INTERNAL_SERVER_ERROR;

		delete formattedError.status;

		res.send(statusCode, {
			data: null,
			error: formattedError,
			code: statusCode,
			status: HttpStatus[statusCode] || HttpStatus[500]
		});
	}

	formatError(error) {
		if (error.isJoi) {
			return this.formatValidationError(error);
		} else if (error.HttpStatus) {
			return this.formatApiError(error);
		}

		return this.formatSystemError(error);
	}

	formatSystemError(error) {
		const info = {
			type: ErrorType.SYSTEM,
			message: error.message,
			status: HttpStatus.INTERNAL_SERVER_ERROR
		};

		if (this.config.debug) {
			info.trace = this.formatErrorTrace(error.stack);
		}

		return info;
	}

	formatValidationError(error) {
		return {
			...this.formatSystemError(error),
			type: ErrorType.VALIDATION,
			validation: this.formatValidationDetails(error.details),
			status: HttpStatus.BAD_REQUEST
		};
	}

	formatApiError(error) {
		return {
			...this.formatSystemError(error),
			type: ErrorType.API,
			status: error.HttpStatus
		};
	}

	formatValidationDetails(details) {
		return details.reduce((map, error) => {
			map[error.path] = error;

			return map;
		}, {});
	}

	formatErrorTrace(trace) {
		return trace
			.split('\n')
			.map((line) => line.trim());
	}

	updateStatistics(/* req, res */) {
		this.statistics.requestCount++;
	}

	use(...args) {
		return this.handler.use(...args);
	}

	start(port) {
		log('starting server on port ' + port);

		// start the server
		this.handler.listen(port, () => {
			log('server started on port ' + port);
		});

		return this;
	}

	registerAction(name, method = Server.Method.GET, handlerPath, callback) {
		log('registering action route "' + name + '" to ' + method + ' ' + handlerPath);

		this.handler[method.toLowerCase()]({
			name: name,
			path: handlerPath
		}, (...args) => {
			return callback(...args);
		});
	}

	// logs the request info to console
	logRequest(req) {
		let message = req.method + ' ' + req.url;

		if (req.body) {
			message += '\n' + JSON.stringify(req.body, null, '  ') + '\n\n';
		}

		log.info(message);
		// log.info({ req: req }, message);
	}

}