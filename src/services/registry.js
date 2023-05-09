import ethers from "ethers";
import { CLAIMS_VERIFIER, CREDENTIAL_REGISTRY, CREDENTIAL_REGISTRY_GAS, CLAIMS_VERIFIER_GAS, signer } from "../util/contracts.js";
import config from "../config.js";

const ISSUER_ROLE = "0x114e74f6ea3bd819998f78687bfcb11b140da08e9b7d222fa9c1f1ba1f2aa122";

export default class RegistryService {

  async deployCredentialRegistry() {
    const CredentialRegistry = config.network.nodeAddress ?
      new ethers.ContractFactory( CREDENTIAL_REGISTRY_GAS.abi, CREDENTIAL_REGISTRY_GAS.bytecode, signer ) :
      new ethers.ContractFactory( CREDENTIAL_REGISTRY.abi, CREDENTIAL_REGISTRY.bytecode, signer );
    const registry = await CredentialRegistry.deploy({ gasPrice: 0 } );
    const receipt = await registry.deployTransaction.wait();

    return {
      address: receipt.contractAddress,
      hash: receipt.transactionHash
    };
  }

  async deployClaimsVerifier( registry ){
    const ClaimsVerifier = config.network.nodeAddress ?
      new ethers.ContractFactory( CLAIMS_VERIFIER_GAS.abi, CLAIMS_VERIFIER_GAS.bytecode, signer ) :
      new ethers.ContractFactory( CLAIMS_VERIFIER.abi, CLAIMS_VERIFIER.bytecode, signer );
    const claimsVerifier = await ClaimsVerifier.deploy( registry, { gasPrice: 0 } );
    const receipt = await claimsVerifier.deployTransaction.wait();

    const credentialRegistry = config.network.nodeAddress ?
      new ethers.Contract( registry, CREDENTIAL_REGISTRY_GAS.abi, signer ) :
      new ethers.Contract( registry, CREDENTIAL_REGISTRY.abi, signer );

    await credentialRegistry.grantRole( ISSUER_ROLE, receipt.contractAddress );

    return {
      address: receipt.contractAddress,
      hash: receipt.transactionHash
    };
  }

  async addIssuer( verifier, issuer ){
    const claimsVerifier = config.network.nodeAddress ?
      new ethers.Contract( verifier, CLAIMS_VERIFIER_GAS.abi, signer ) :
      new ethers.Contract( verifier, CLAIMS_VERIFIER.abi, signer );
    const tx = await claimsVerifier.grantRole( ISSUER_ROLE, issuer );

    return { hash: tx.hash };
  }


  async getRole( verifier, issuer ){
    const claimsVerifier = config.network.nodeAddress ?
      new ethers.Contract( verifier, CLAIMS_VERIFIER_GAS.abi, signer ) :
      new ethers.Contract( verifier, CLAIMS_VERIFIER.abi, signer );
    const ISSUER_ROLE = await claimsVerifier.ISSUER_ROLE();
    return await claimsVerifier.getRoleMember( ISSUER_ROLE, 1 );
  }

}