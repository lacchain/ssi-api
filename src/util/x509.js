import x509 from "@fidm/x509";
import moment from "moment";

export const getEntityName = pem => {
  const certificate = x509.Certificate.fromPEM( pem );
  return certificate.subject.organizationName;
}

export const getExpirationDate = pem => {
  const certificate = x509.Certificate.fromPEM( pem );
  return moment( certificate.validTo );
}

export const getCountryName = pem => {
  const certificate = x509.Certificate.fromPEM( pem );
  return certificate.subject.countryName;
}