import moment from "moment";
import uuid from "uuidv4";
import config from "../config.js";
import { getCountryName } from "./x509.js";

const diseases = {
	'J07BX03': 'COVID-19',
	'J07BL01': 'Yellow fever'
};

export function buildVaccinationCredential( issuer, data, trustedList ) {
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
		"issuer": `did:lac:main:${issuer.address}`,
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

export function buildEducationCredential( issuer, data, trustedList ) {
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
		"issuer": `did:lac:main:${issuer.address}`,
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
				"name": signer.name
			}) ),
			"diploma": {
				"title": diploma.title,
				"description": diploma.description,
				"category": diploma.category,
				"modality": diploma.modality,
				"url": diploma.url,
				"issued": diploma.issued,
				"educationalInstitution": diploma.educationalInstitution,
				"courseID": diploma.courseID,
				"approved": diploma.approved,
				"grade": diploma.grade,
				"campusName": diploma.campusName,
				"city": diploma.city,
				"country": diploma.country
			}
		}
	};
}

export function buildVerifiablePresentation( credential, attachment ) {
	return {
		"@context": ["https://www.w3.org/2018/credentials/v1"],
		"type": "VerifiablePresentation",
		"verifiableCredential": [credential],
		"attachment": attachment
	}
}