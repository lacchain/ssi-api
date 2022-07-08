import express from 'express';
import swaggerUi from "swagger-ui-express";
import { didconnectService } from "../services/index.js";

export default class Router {

	constructor( logger ) {
		this.logger = logger;
		this.router = express.Router();
		this.init();
	}

	init() {
	}

	swagger( path, document ) {
		this.router.use( path, swaggerUi.serve );
		this.router.get( path, swaggerUi.setup( document ) );
	}

	get( path, policies, callback ) {
		this.router.get( path, this._bindCustomResponses, this._checkAuthorization( policies ), this._getCallback( callback ) );
	}

	put( path, policies, callback ) {
		this.router.put( path, this._bindCustomResponses, this._checkAuthorization( policies ), this._getCallback( callback ) );
	}

	post( path, policies, callback ) {
		this.router.post( path, this._bindCustomResponses, this._checkAuthorization( policies ), this._getCallback( callback ) );
	}

	delete( path, policies, callback ) {
		this.router.delete( path, this._bindCustomResponses, this._checkAuthorization( policies ), this._getCallback( callback ) );
	}

	multer( path, policies, uploader, callback ) {
		this.router.post( path, this._bindCustomResponses, this._checkAuthorization( policies ), uploader, this._getCallback( callback ) );
	}

	getRouter() {
		return this.router;
	}

	_checkAuthorization( permission ) {
		return async( req, res, next ) => {
			if( permission === 'PUBLIC' ) return next();
			if( permission === 'AUTHENTICATED' ) {
				const { token } = req.headers;
				req.did = await didconnectService.authenticate( token );
				return next();
			}
		}
	}

	_getCallback( callback ) {
		return async( ...params ) => {
			try {
				const startTime = new Date().getTime();
				const response = await callback.apply( this, params )
				const endTime = new Date().getTime();
				const latency = endTime - startTime;
				params[1].sendSuccess( response );
				this.logger.debug( `${params[0].method} ${params[0].path}`, {
					response: {
						status: 200,
						executionTime: latency
					},
					request: JSON.stringify( params[0].body )
				} );
			} catch( error ) {
				this.logger.error( `${params[0].method} ${params[0].path}`, {
					response: {
						code: error.code,
						message: error.message
					},
					request: JSON.stringify( params[0].body )
				} );
				params[1].sendError( { code: error.code, message: error.message }, error.http );
			}
		}
	}

	_bindCustomResponses( req, res, next ) {
		res.sendSuccess = ( payload, executionTime ) => {
			res.status( 200 ).json( payload );
		};
		res.sendError = ( error, status = 500 ) => {
			res.status( status ).json( error );
		};
		next();
	}
}