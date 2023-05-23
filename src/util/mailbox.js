import moment from "moment";
import axios from "axios";
import jwt from "did-jwt";
import { encrypt } from "./didcomm.js";
import config from "../config.js";
import { resolve } from "./did.js";
const { createJWT, ES256KSigner } = jwt;

export async function sendVC( sender, recipientDID, message ) {
	const userDID = `did:lac:${config.network.name}:${sender.address}`;
	const endpoint = await resolve( config.mailbox.did ).then( did => did.service[0].serviceEndpoint );
	const token = await createJWT(
		{ sub: userDID, aud: config.mailbox.did, exp: moment().add( 1, 'days' ).valueOf() },
		{ issuer: userDID, signer: ES256KSigner( sender.privateKey ) },
		{ alg: 'ES256K' }
	);

	const encryptedToBob = await encrypt( message, sender.encryptionKey, recipientDID, false );

	const envelope = {
		"type": "https://didcomm.org/routing/2.0/forward",
		"to": [config.mailbox.did],
		"expires_time": 1516385931,
		"body": {
			"next": recipientDID,
			"payloads~attach": [
				encryptedToBob
			]
		}
	}
	process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
	const encryptedToMailbox = await encrypt( envelope, sender.encryptionKey, config.mailbox.did, false );
	return await axios.post( endpoint + '/vc', encryptedToMailbox, {
		maxContentLength: Infinity,
		maxBodyLength: Infinity, headers: { token } } );
}