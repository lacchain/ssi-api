import moment from "moment";
import uuid from "uuidv4";
import config from "../config.js";
import { getCountryName } from "./x509.js";

const diseases = {
	'J07BX03': 'COVID-19',
	'J07BL01': 'Yellow fever'
};

export function buildW3CVaccinationCredential( issuer, data, trustedList ) {
	const { subject, vaccine } = data;
	const disease = diseases[vaccine.code];
	return {
		"@context": [
			"https://www.w3.org/2018/credentials/v1",
			"https://credentials-library.lacchain.net/credentials/trusted/v1",
			"https://w3id.org/security/bbs/v1",
			"https://w3id.org/vaccination/v1"
		],
		"type": [
			"VerifiableCredential",
			"VaccinationCertificate"
		],
		"id": `urn:uuid:${uuid.uuid()}`,
		"name": disease,
		"issuer": `did:lac:${config.network.name}:${issuer.address}`,
		"issuanceDate": moment().toISOString(),
		"expirationDate": moment(data.expirationDate).toISOString(),
		"trustedList": trustedList,
		"credentialSubject": {
			"id": subject.did,
			"type": "VaccinationEvent",
			"batchNumber": vaccine.batchNumber,
			"administeringCentre": data.administeringCentre,
			"healthProfessional": data.healthProfessional,
			"countryOfVaccination": data.country,
			"order": vaccine.dose,
			"recipient": {
				"type": "VaccineRecipient",
				"givenName": subject.givenName,
				"familyName": subject.familyName,
				"gender": subject.gender,
				"birthDate": moment( subject.birthDate ).format('DD-MM-YYYY')
			},
			"vaccine": {
				"type": "Vaccine",
				"disease": disease,
				"atcCode": vaccine.code
			}
		}
	}
}

export function buildRedClaraCredential( issuer, data, trustedList ) {
	const { name, subject, expirationDate, diploma, signers } = data;
	return {
		"@context": [
			"https://www.w3.org/2018/credentials/v1",
			"https://credentials-library.lacchain.net/credentials/education/v1",
			"https://credentials-library.lacchain.net/credentials/trusted/v1",
			"https://credentials-library.lacchain.net/credentials/education/redclara/diploma/v1"
		],
		"type": [
			"VerifiableCredential",
			"EducationCertificate"
		],
		"id": `urn:uuid:${uuid.uuid()}`,
		"name": name,
		"issuer": `did:lac:${config.network.name}:${issuer.address}`,
		"issuanceDate": moment().toISOString(),
		"expirationDate": moment(expirationDate).toISOString(),
		"trustedList": trustedList,
		"credentialSubject": {
			"id": subject.did,
			"type": "Diploma",
			"attendant": {
				"givenName": subject.givenName,
				"familyName": subject.familyName,
				"email": subject.email,
				"nationalId": subject.nationalId
			},
			"signers": signers.map( signer => ({
				"did": signer.did,
				"name": signer.name,
				"occupation": signer.occupation
			}) ),
			"diploma": {
				"title": diploma.title,
				"description": diploma.description,
				"category": diploma.category,
				"modality": diploma.modality,
				"url": diploma.url,
				"issued": diploma.issued,
				"issuance": diploma.issuance,
				"educationalInstitution": diploma.educationalInstitution,
				"courseID": diploma.courseID,
				"approved": diploma.approved,
				"grade": diploma.grade,
				"campusName": diploma.campusName,
				"city": diploma.city,
				"country": diploma.country,
				"recordID": diploma.recordID || ';;',
				"hashQR": diploma.hashQR || ''
			}
		}
	};
}

export function buildFAirLACCredential( issuer, data ) {
	const issuanceDate = moment();
	const expirationDate = issuanceDate.clone().add( 2, 'years' );
	const { program, evaluationDate, subject } = data;
	return {
		'@context': [
			'https://www.w3.org/2018/credentials/v1',
			`https://www.lacchain.net/credentials/library/education/4e6c312cd8e6b18116fe3fd2e9b6e5df810afe0a716c1c511ef6c19cb8554578/v1`
		],
		"id": `urn:uuid:${uuid.uuid()}`,
		type: ['VerifiableCredential', 'Diploma'],
		issuer: `did:lac:${config.network.name}:${issuer.address}`,
		issuanceDate: issuanceDate.toISOString(),
		expirationDate: expirationDate.toISOString(),
		credentialSubject: {
			id: subject.did,
			givenName: subject.givenName,
			familyName: subject.familyName,
			title: subject.title,
			company: subject.company,
			email: subject.email,
			holds: {
				role: subject.role,
				country: subject.country,
				category: subject.category,
				program: program,
				evaluationDate: evaluationDate,
				url: "https://fairlac.iadb.org",
				modality: "virtual"
			}
		}
	}
}

export function buildVerifiablePresentation( credential, attachment ) {
	return {
		"@context": ["https://www.w3.org/2018/credentials/v1"],
		"type": "VerifiablePresentation",
		"id": credential.id,
		"verifiableCredential": [credential],
		"attachment": attachment
	}
}
