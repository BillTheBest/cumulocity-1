import express from 'express';
import bodyParser from 'body-parser';
import serveStatic from 'serve-static';
import cors from 'cors';
import Promise from 'bluebird';
import logger from '../log';

const log = logger.get('Server');

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

	performDefaultSetup() {
		// allow cors from all requests
		this.app.use(cors());

		// use json body parser
		this.app.use(bodyParser.json({
			limit: '1mb'
		}));

		// serve static files from apps
		this.app.use(serveStatic('apps', {
			index: 'index.html'
		}));

		this.app.get('/', (req, res) => {
			res.send('wazaaa');
		});

		return this;
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

		log.verbose(message);
	}

}