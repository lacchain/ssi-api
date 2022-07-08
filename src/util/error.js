export default class APIError extends Error {
	constructor( message, code, http = 500 ) {
		super( message );
		this.code = code;
		this.http = http;
		Error.captureStackTrace( this, APIError )
	}
}