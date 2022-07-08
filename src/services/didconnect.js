import didJWT from "did-jwt";
import { resolve } from "../util/did.js";
import config from "../config.js";

export default class DIDConnectService {

	constructor() {
	}

	async authenticate( token ) {
		const jwt = didJWT.decodeJWT( token )
		const { sub, iss } = jwt.payload;
		const { alg } = jwt.header;

		if( sub !== iss ) throw new Error( "The iss field must be equal to sub" )
		if( alg !== 'ES256K' && alg !== 'Ed25519' ) throw new Error( 'Unsupported JWS algorithm' );

		const response = await didJWT.verifyJWT( token, {
			resolver: { resolve },
			audience: config.did.id
		} );
		return response.issuer;
	}
}