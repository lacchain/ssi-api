import ethers from "ethers";
import { CLAIMS_VERIFIER, CREDENTIAL_REGISTRY, signer } from "../util/contracts.js";

const ISSUER_ROLE = "0x114e74f6ea3bd819998f78687bfcb11b140da08e9b7d222fa9c1f1ba1f2aa122";

export default class RegistryService {

  async deployCredentialRegistry() {
    const CredentialRegistry = new ethers.ContractFactory( CREDENTIAL_REGISTRY.abi, CREDENTIAL_REGISTRY.bytecode, signer );
    const registry = await CredentialRegistry.deploy({ gasPrice: 0 } );
    const receipt = await registry.deployTransaction.wait();

    return {
      address: receipt.contractAddress,
      hash: receipt.transactionHash
    };
  }

  async deployClaimsVerifier( registry ){
    const ClaimsVerifier = new ethers.ContractFactory( CLAIMS_VERIFIER.abi, CLAIMS_VERIFIER.bytecode, signer );
    const claimsVerifier = await ClaimsVerifier.deploy( registry, { gasPrice: 0 } );
    const receipt = await claimsVerifier.deployTransaction.wait();

    const credentialRegistry = new ethers.Contract( registry, CREDENTIAL_REGISTRY.abi, signer );
    await credentialRegistry.grantRole( ISSUER_ROLE, receipt.contractAddress );

    return {
      address: receipt.contractAddress,
      hash: receipt.transactionHash
    };
  }

  async addIssuer( verifier, issuer ){
    const claimsVerifier = new ethers.Contract( verifier, CLAIMS_VERIFIER.abi, signer );
    const tx = await claimsVerifier.grantRole( ISSUER_ROLE, issuer );

    return { hash: tx.hash };
  }


  async getRole( verifier, issuer ){
    const claimsVerifier = new ethers.Contract( verifier, CLAIMS_VERIFIER.abi, signer );
    const ISSUER_ROLE = await claimsVerifier.ISSUER_ROLE();
    return await claimsVerifier.getRoleMember( ISSUER_ROLE, 1 );
  }

}