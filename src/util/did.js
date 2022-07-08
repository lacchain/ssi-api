import DIDComm from "DIDComm-js";
import sodium from "libsodium-wrappers";
import axios from "axios";

export const generateKeyPair = async() => {
	const didcomm = new DIDComm.DIDComm();
	await didcomm.ready;
	const keyPair = await didcomm.generateKeyPair();
	return {
		publicKey: new Buffer( keyPair.publicKey ).toString( 'hex' ),
		privateKey: new Buffer( keyPair.privateKey ).toString( 'hex' )
	}
}

export async function resolve( did ) {
	return await axios.get( `https://resolver.lacchain.net/${did}` ).then( result => result.data );
}

export async function findVerificationMethod( document, publicKey ) {
	return document.verificationMethod.find( vm =>
      vm.publicKeyHex === publicKey || vm.publicKeyBase58 === publicKey ||
      vm.publicKeyBase64 === publicKey || vm.publicKeyPem === publicKey
  ) || {};
}

export function findKeyAgreement( doc, algorithm ) {
	const key = doc.keyAgreement.find( ka => ka.type === algorithm );
	if( !key ) return null;
	if( key.publicKeyHex ) return sodium.from_hex( key.publicKeyHex );
	if( key.publicKeyBase64 ) return sodium.from_base64( key.publicKeyBase64 );
	return null;
}
