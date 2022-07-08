import bbs from "@mattrglobal/jsonld-signatures-bbs";
import jsonld from "jsonld-signatures";

import bbsContext from "./contexts/bbs.json";
import credentialContext from "./contexts/credentialsContext.json";
import trustedContext from "./contexts/trusted.json";
import vaccinationContext from "./contexts/vaccination.json";
import { findVerificationMethod, resolve } from "./did.js";

const documents = {
  "https://w3id.org/security/bbs/v1": bbsContext,
  "https://www.w3.org/2018/credentials/v1": credentialContext,
  "https://credentials-library.lacchain.net/credentials/trusted/v1": trustedContext,
  "https://w3id.org/vaccination/v1": vaccinationContext
};

export async function bbsProof(issuer, vc ) {
  const issuerDocument = await resolve( `did:lac:main:${issuer.address}` );
  const documentLoader = jsonld.extendContextLoader(uri => {
    if( uri.startsWith( 'did' ) ) return issuerDocument;

    const document = documents[uri];
    if (!document) throw new Error( `Unable to load document : ${uri}` );
    return {
      contextUrl: null,
      document,
      documentUrl: uri
    };
  });

  const verificationMethod = await findVerificationMethod( issuerDocument, issuer.bbsKey.publicKey );
  const keyPair = await new bbs.Bls12381G2KeyPair({
        "id": verificationMethod.id,
        "controller": `did:lac:main:${issuer.address}`,
        "privateKeyBase58": issuer.bbsKey.privateKey,
        "publicKeyBase58": issuer.bbsKey.publicKey
      }
  );

  const signedDocument = await jsonld.sign(vc, {
    suite: new bbs.BbsBlsSignature2020({ key: keyPair }),
    purpose: new jsonld.purposes.AssertionProofPurpose(),
    documentLoader
  });

  return signedDocument.proof;
}