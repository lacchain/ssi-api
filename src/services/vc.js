import moment from "moment";
import ethers from "ethers";
import { getCredentialHash, signCredential } from "@lacchain/vc-contracts-utils";
import VC from "../model/vc.js";
import config from "../config.js";
import { sendVC } from "../util/mailbox.js";
import { CLAIMS_VERIFIER, CREDENTIAL_REGISTRY, signer } from "../util/contracts.js";

export default class VCService {

	async issue( credential, verifier ) {
		const issuerAddress = config.account.address;
		const claimsVerifier = new ethers.Contract( verifier, CLAIMS_VERIFIER.abi, signer );

		const subject = credential.credentialSubject.id.split( ':' ).slice( -1 )[0];

		const credentialHash = getCredentialHash( credential, issuerAddress, verifier );
		const signature = await signCredential( credentialHash, config.account.privateKey );

		const tx = await claimsVerifier.registerCredential( subject, credentialHash,
			Math.round( moment( credential.issuanceDate ).valueOf() / 1000 ),
			Math.round( moment( credential.expirationDate ).valueOf() / 1000 ),
			signature, { from: issuerAddress } );
		console.log( 'Registration Hash: ', tx );

		credential.proof = [{
			type: "EcdsaSecp256k1Signature2019",
			created: moment().toISOString(),
			proofPurpose: "assertionMethod",
			verificationMethod: `did:lac:main:${issuerAddress}#vm-0`,
			domain: verifier,
			proofValue: signature
		}];

		credential.credentialStatus = {
			id: await claimsVerifier.registry(),
			type: 'SmartContract'
		};

		const vc = new VC( {
			verifier,
			registry: credential.credentialStatus.id,
			data: credential
		} );

		const saved = await vc.save();
		await sendVC( config.account, credential.credentialSubject.id, credential );

		return { id: saved._id };
	}

	async revoke( vc ) {
		const issuerAddress = config.account.address;
		const credentialRegistry = new ethers.Contract( vc.registry, CREDENTIAL_REGISTRY.abi, signer );

		const credentialHash = getCredentialHash( vc.data, issuerAddress, vc.verifier );
		const tx = await credentialRegistry.revokeCredential( credentialHash );

		vc.status = 'revoked';
		vc.revokedAt = moment();
		return { hash: tx.hash };
	}

	async getById( id ) {
		return VC.findOne( { _id: id } );
	}

	async list() {
		return VC.find( {} );
	}
}