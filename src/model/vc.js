import mongoose from "mongoose";

export default mongoose.model(
	'vc',
	mongoose.Schema( {
		verifier: String,
		registry: String,
		data: Object,
		status: {
			type: String,
			enum: ['active', 'revoked'],
			default: 'active'
		},
		revokedAt: Date
	}, {
		timestamps: {
			createdAt: 'created_at',
			updatedAt: 'updated_at'
		}
	} )
)