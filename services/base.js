const { token: { verify }} = require('../utils');
class BaseService {
	constructor(app, api) {
		this.app = app;
		this.api = api;
	}
	
	// Registers a single route and applies the middleware before the handler
	add(method, url, handler, isProtected = false) {
		this.app[method](url, async (res, req) => {
			let jsonString = '';
			const abortHandler = () => {
				res.aborted = true;
			};
			
			req.params = {}
			
			// if any params loop through and add to req.params
			if (url.includes(':')) {
				const urlParts = url.split('/');
				const reqParts = req.getUrl().split('/');
				urlParts.forEach((part, index) => {
					if (part.startsWith(':')) {
						req.params[part.slice(1)] = reqParts[index];
					}
				});
			}
			
			res.onAborted(abortHandler)
			res.onData(async (chunk, isLast) => {
				jsonString += Buffer.from(chunk).toString();
				if (isLast) {
					try {
						const body = jsonString ? JSON.parse(jsonString) : {};
						const enhancedReq = {
							...req,
							body,
							getHeader: (header) => req.getHeader(header.toLowerCase()),
						};
						
						// if protected, apply the middleware else call the handler directly
						isProtected ? await this.middleware(req = enhancedReq, res, () => handler(req = enhancedReq, res)) : handler(req = enhancedReq, res);
					} catch (err) {
						console.error('Error parsing JSON or handling middleware:', err);
						this.jsonResponse(res, 400, { error: 'Invalid request', success: false });
					}
				}
			});
		});
	}
	
	// Middleware to decode JWT and attach this.app[method](url, (res, req) => {this.app[method](url, (res, req) => {this.app[method](url, (res, req) => {the user to the request object
	async middleware(req, res, next) {
		const token = req.getHeader('cookie')
			?.split('; ')
			?.find(cookie => cookie.startsWith('x-access-token='))
			?.split('=')[1];
		
		if (!token) {
			return this.jsonResponse(res, 401, {
				error: 'Missing or invalid Authorization header',
				success: false
			});
		}
		
		try {
			const { user, error } = await verify(token);
			
			if (error || !user) {
				return this.jsonResponse(res, 401, {
					error: 'Invalid token',
					success: false
				});
			}
			
			req.user = user;
			next();
		} catch (err) {
			console.error('JWT verification failed:', err);
			this.jsonResponse(res, 401, {
				error: 'Invalid token',
				success: false
			});
		}
	}
	
	// Sends a JSON response with the specified status code
	jsonResponse(res, status, data) {
		res.cork(() => {
			// use application/json content type
			res.writeStatus(`${status} ${this.getStatusText(status)}`)
				.writeHeader('Content-Type', 'application/json')
				.end(JSON.stringify(data));
		});
	}
	
	// Converts HTTP status codes to standard status texts
	getStatusText(status) {
		const statuses = {
			200: 'OK',
			201: 'Created',
			202: 'Accepted',
			204: 'No Content',
			206: 'Partial Content',
			207: 'Multi-Status',
			209: 'Content',
			300: 'Multiple Choices',
			301: 'Moved Permanently',
			400: 'Bad Request',
			401: 'Unauthorized',
			404: 'Not Found',
			409: 'Conflict',
			500: 'Internal Server Error',
			501: 'Not Implemented',
			502: 'Bad Gateway',
			503: 'Service Unavailable',
			504: 'Gateway Timeout',
			505: 'HTTP Version Not Supported',
			507: 'Insufficient Storage',
			510: 'Not Extended'
		};
		return statuses[status] || 'Unknown';
	}
}

module.exports = BaseService;