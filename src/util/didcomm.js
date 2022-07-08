import DIDComm from "DIDComm-js";
import sodium from "libsodium-wrappers";
import { findKeyAgreement, resolve } from "./did.js";

const didcomm = new DIDComm.DIDComm();

export const getKeyPairFromHex = keyPairHex => {
  return {
    keyType: 'ed25519',
    publicKey: sodium.from_hex( keyPairHex.publicKey.replace('0x', '') ),
    privateKey: sodium.from_hex( keyPairHex.privateKey.replace('0x', '') )
  };
}

export async function encrypt( message, senderKeyPair, recipientDID, nonRepudiable = false ) {
  await didcomm.ready;
  const recipientDIDDocument = await resolve( recipientDID );
  const recipientPublicKey = findKeyAgreement( recipientDIDDocument, 'X25519KeyAgreementKey2019' );
  const sodiumKeyPair = getKeyPairFromHex( senderKeyPair );
  const result = await didcomm.pack_auth_msg_for_recipients(
      typeof message === 'string' ? message : JSON.stringify( message ),
      [recipientPublicKey], sodiumKeyPair, nonRepudiable
  );
  return JSON.parse( result );
}

export async function decrypt( message, recipientKeyPair ) {
  await didcomm.ready;
  return await didcomm.unpackMessage( message, getKeyPairFromHex( recipientKeyPair ) ).catch( () => ( {} ) );
}