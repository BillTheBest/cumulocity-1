import path from 'path';
import glob from 'glob';
import restify from 'restify';
import bodyParser from 'body-parser';
import cors from 'cors';
import normalizeType from 'normalize-type';
import httpStatus from 'http-status';
import logger from '../logger';

const log = logger.get(__filename);

export const Method = {
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT'
};

export default class Server {

	static Method = Method;

	constructor(config = {}) {
		this.config = config;
		this.handler = restify.createServer(config);

		this.statistics = {
			requestCount: 0
		};

		this.controllers = [];
	}

	setupDefault() {
		log('performing default setup');

		this.setupCurlSupport();
		this.setupCors();
		this.setupQueryParser();
		this.setupBodyParser();
		this.setupGlobalRoute();
		this.setupIndexRoute();
		this.setupAppRoutes();
		this.setupControllers();

		return this;
	}
	
	setupCurlSupport() {
		log('setting up CURL support');

		this.handler.pre(
			restify.pre.userAgentConnection()
		);
	}

	setupCors() {
		log('setting up CORS');

		// allow cors from all requests
		this.handler.use(
			cors()
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

	setupGlobalRoute() {
		log('setting up global route');

		this.handler.use(
			(...args) => this.handleGlobalRoute(...args)
		);
	}

	setupIndexRoute() {
		log('setting up index route');

		this.register(
			'index',
			Method.GET,
			'/',
			(...args) => this.handleIndexRoute(...args)
		);
	}

	setupAppRoutes() {
		log('setting up app routes');

		this.handler.get(/\/apps\/?.*/, restify.serveStatic({
			directory: path.join(__dirname, '../..'),
			default: 'index.html'
		}));
	}

	getControllersInDirectory(directory) {
		const controllersPattern = path.join(directory, '**/*.js');
		const controllerFilenames = glob.sync(controllersPattern);

		return controllerFilenames.map((controllerFilename) => {
			const controller = {
				name: 'user', // TODO
				handler: 'index',
				filename: controllerFilename,
				include: require(controllerFilename),
				instance: null
			};
			
			return controller;
		});
	}

	setupControllers() {
		this.controllers = this.getControllersInDirectory(this.config.controllersDirectory).map(
			(controller) => this.setupController(controller)
		);
	}

	setupController(controller) {
		controller.instance = new controller.include.default(); // eslint-disable-line new-cap
		
		for (const methodName in controller.instance) {
			if (!controller.instance.hasOwnProperty(methodName)) {
				continue;
			}

			log('controller', controller.name, 'method', methodName);
		}
		
		const descriptor = controller.instance.get();
		const actionPath = this.resolveControllerActionPath(controller, descriptor);
		const routePath = '/' + controller.name + actionPath;

		this.register(
			controller.name,
			Method.GET,
			routePath,
			(req, res, next) => this.handleControllerRoute(controller, descriptor, req, res, next)
		);

		log('setup controller', controller, descriptor);

		return controller;
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

		try {
			const response = descriptor.run.call(controller.instance, normalizedParameters);

			this.sendSuccessResponse(res, response);
		} catch (e) {
			log(e, 'Handling controller request failed');

			this.sendErrorResponse(res, e);
		}

		next();
	}

	sendSuccessResponse(res, data) {
		res.send(httpStatus.OK, {
			data: data,
			error: null
		});
	}

	sendErrorResponse(res, error) {
		res.send(httpStatus.INTERNAL_SERVER_ERROR, {
			data: null,
			error: this.formatError(error)
		});
	}

	formatError(error) {
		return {
			message: error.toString(),
			trace: this.formatErrorTrace(error.stack)
		};
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

	register(name, method = Server.Method.GET, handlerPath, callback) {
		log('registering route "' + name + '" to ' + method + ' ' + handlerPath);

		this.handler[method.toLowerCase()]({
			name: name,
			path: handlerPath
		}, callback);
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