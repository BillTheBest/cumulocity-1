import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import logger from '../logger';

const log = logger.get(__filename);

export default class Server {

	static Method = {
		GET: 'GET',
		POST: 'POST',
		PUT: 'PUT'
	};

	constructor() {
		// create the server app
		this.app = express();
	}

	setupDefault() {
		log('performing default setup');

		this.setupCors();
		this.setupBodyParser();
		this.setupIndexRoute();

		return this;
	}

	setupCors() {
		log('setting up CORS');

		// allow cors from all requests
		this.app.use(cors());
	}

	setupBodyParser() {
		log('setting up body parser');

		// use json body parser
		this.app.use(bodyParser.json({
			limit: '1mb'
		}));
	}


	setupIndexRoute() {
		log('setting up index route');

		this.get('/', (req, res) => {
			res.send('wazaaa');
		});
	}

	start(port) {
		log('starting server on port ' + port);

		// start the server
		this.app.listen(port, () => {
			log('server started on port ' + port);
		});

		return this;
	}

	register(method = Server.Method.GET, path, callback) {
		log('registering ' + method + ' ' + path);

		this.app[method.toLowerCase()](path, callback);
	}

	get(path, callback) {
		return this.register(Server.Method.GET, path, (req, res, next) => {
			this.logRequest(req);
			
			callback(req, res, next);
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