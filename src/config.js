export default {
	server: {
		name: process.env.NAME || 'SSI API',
		ver: process.env.VERSION || '1.0',
		port: process.env.PORT || 8080,
		ip: process.env.BINDING_IP || '0.0.0.0',
		ssl: {
			enabled: process.env.SSL_ENABLED || false,
			key: process.env.SSL_KEY || '/certs/cert.key',
			crt: process.env.SSL_CRT || '/certs/cert.crt'
		}
	},
	network: {
		name: process.env.NETWORK_NAME || 'main',
		rpc: process.env.NETWORK_RPC || "https://writer.lacchain.net",
		nodeAddress: process.env.NODE_ADDRESS,
		expiration: process.env.NODE_EXPIRATION
	},
	account: {
		address: process.env.ACCOUNT_ADDRESS,
		privateKey: process.env.ACCOUNT_PRIVATE_KEY,
		encryptionKey: {
			publicKey: process.env.ACCOUNT_PUBLIC_ENCRYPTION_KEY,
			privateKey: process.env.ACCOUNT_PRIVATE_ENCRYPTION_KEY
		}
	},
	mongo: {
		url: process.env.MONGODB_URL || 'mongodb://localhost:27017/ssi-api'
	},
	passport: {
		bearer: {
			accessMethodID: 'bearer',
			passReqToCallback: true
		}
	},
	logger: {
		level: process.env.LOGGER_LEVEL || 'error'
	},
	mailbox: {
		did: process.env.MAILBOX_DID || "did:lac:main:0x5c3968542ca976bec977270d3fe980dd4742865e"
	}
}