import ethers from "ethers";
import crypto from "crypto";
import ethUtil from "ethereumjs-util";
import moment from "moment";
import config from "../config.js";
import { PKD_CONTRACT, signer, TL_CONTRACT } from "./contracts.js";

export function sha256( data ) {
	const hashFn = crypto.createHash( 'sha256' );
	hashFn.update( data );
	return hashFn.digest( 'hex' );
}

export async function verifyCredential( vc ) {
	const issuerProof = vc.proof.find( p =>
			p.verificationMethod.toLowerCase().startsWith(vc.issuer.toLowerCase()) && p.domain
	);

	const contract = new ethers.Contract( issuerProof.domain, [
		"function verifyCredential(tuple(address issuer,address subject,bytes32 data,uint256 validFrom,uint256 validTo), uint8 v, bytes32 r, bytes32 s) view returns (bool, bool, bool, bool, bool)",
		"function verifySigner(tuple(address issuer,address subject,bytes32 data,uint256 validFrom,uint256 validTo), bytes calldata _signature) view returns (bool)"
	], new ethers.providers.JsonRpcProvider( config.network.rpc ) );


	const hashCredentialHex = `0x${sha256( JSON.stringify( vc.credentialSubject ) )}`;
	const issuerAddress = vc.issuer.split( ':' ).slice( -1 )[0];
	const subjectAddress = vc.credentialSubject.id.split( ':' ).slice( -1 )[0];
	const validFrom = moment( vc.issuanceDate ).valueOf();
	const validTo = moment( vc.expirationDate ).valueOf();

	const signers = [];
	const signersProofs = vc.proof.filter( p => !p.verificationMethod.toLowerCase().startsWith(vc.issuer.toLowerCase()) && p.domain );
	for( const signerProof of signersProofs ) {
		signers.push( {
			signer: signerProof.verificationMethod.substring( 0, signerProof.verificationMethod.indexOf( '#' ) ),
			result: await contract.verifySigner( [issuerAddress, subjectAddress, hashCredentialHex, Math.round( validFrom / 1000 ), Math.round( validTo / 1000 )], signerProof.proofValue )
		} );
	}

	const rsv = ethUtil.fromRpcSig( issuerProof.proofValue );
	const r = `0x${new Buffer( rsv.r ).toString( 'hex' )}`;
	const s = `0x${new Buffer( rsv.s ).toString( 'hex' )}`;
	const result = await contract.verifyCredential( [issuerAddress, subjectAddress, hashCredentialHex, Math.round( validFrom / 1000 ), Math.round( validTo / 1000 )], rsv.v, r, s );

	return {
		credentialExists: result[0],
		isNotRevoked: result[1],
		issuerSignatureValid: result[2],
		additionalSigners: result[3],
		isNotExpired: result[4],
		signers
	};
}


export const getIssuerName = async vc => {
	let tlContract = new ethers.Contract( vc.trustedList, TL_CONTRACT.abi, signer );
	const entity = await tlContract.entities( vc.issuer.replace( 'did:lac:main:', '' ).replace( 'did:lac:openprotest:', '' ) );
	return entity.name;

}
export const getRootOfTrust = async vc => {
	if( !vc.trustedList ) return [];
	let tlContract = new ethers.Contract( vc.trustedList, TL_CONTRACT.abi, signer );

	const entity = await tlContract.entities( vc.issuer.replace( 'did:lac:main:', '' ).replace( 'did:lac:openprotest:', '' ) );
	let parent = await tlContract.parent();

	const rootOfTrust = [{
		address: vc.issuer.replace( 'did:lac:main:', '' ).replace( 'did:lac:openprotest:', '' ),
		name: entity.name
	}, {
		address: vc.trustedList,
		name: await tlContract.name()
	}];

	for( const index of [1, 2, 3, 4, 5, 6] ) {
		const contract = new ethers.Contract( parent, TL_CONTRACT.abi, signer );
		try {
			rootOfTrust.push( {
				address: parent,
				name: await contract.name()
			} );
			parent = await contract.parent();
		} catch( e ) {
			rootOfTrust.push( {
				address: parent,
				name: 'Public Key Directory'
			} );
			break;
		}
	}

	return rootOfTrust.reverse();
}

export const verifyRootOfTrust = async( rootOfTrust, issuer ) => {
	if( rootOfTrust.length <= 0 ) return [];
	const validation = ( new Array( rootOfTrust.length ) ).fill( false );
	const root = new ethers.Contract( rootOfTrust[0].address, PKD_CONTRACT.abi, signer );
	if( ( await root.publicKeys( rootOfTrust[1].address ) ).status <= 0 ) return validation;
	validation[0] = true;
	if( !validation[0] ) return validation;
	let index = 1;
	for( const tl of rootOfTrust.slice( 1 ) ) {
		const tlContract = new ethers.Contract( tl.address, TL_CONTRACT.abi, signer );
		if( index + 1 >= rootOfTrust.length ) {
			validation[index] = ( await tlContract.entities( issuer.replace( 'did:lac:main:', '' ).replace( 'did:lac:openprotest:', '' ) ) ).status === 1;
			return validation;
		}
		if( ( await tlContract.entities( rootOfTrust[index + 1].address ) ).status <= 0 ) return validation;
		validation[index++] = true;
	}

	return validation;
}