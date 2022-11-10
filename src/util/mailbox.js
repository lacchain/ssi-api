import moment from "moment";
import axios from "axios";
import jwt from "did-jwt";
import { encrypt } from "./didcomm.js";

const MAILBOX_DID = "did:lac:main:0x5c3968542ca976bec977270d3fe980dd4742865e";

const { createJWT, ES256KSigner } = jwt;

export async function sendVC( sender, recipientDID, message ) {
	const userDID = `did:lac:main:${sender.address}`;
	const token = await createJWT(
		{ sub: userDID, aud: MAILBOX_DID, exp: moment().add( 1, 'days' ).valueOf() },
		{ issuer: userDID, signer: ES256KSigner( sender.privateKey ) },
		{ alg: 'ES256K' }
	);

	const encryptedToBob = await encrypt( message, sender.encryptionKey, recipientDID, false );

	const envelope = {
		"type": "https://didcomm.org/routing/2.0/forward",
		"to": [MAILBOX_DID],
		"expires_time": 1516385931,
		"body": {
			"next": recipientDID,
			"payloads~attach": [
				encryptedToBob
			]
		}
	}
	const encryptedToMailbox = await encrypt( envelope, sender.encryptionKey, MAILBOX_DID, false );
	return await axios.post( 'https://mailbox.lacchain.net/vc', encryptedToMailbox, {
		maxContentLength: Infinity,
		maxBodyLength: Infinity, headers: { token } } );
}