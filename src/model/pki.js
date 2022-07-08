import mongoose from "mongoose";

export default mongoose.model(
	'pki',
	mongoose.Schema( {
		kind: {
			type: String,
			enum: ['PKD', 'TL']
		},
		parent: String,
		name: String,
		address: String,
		hash: String,
		entities: {
			type: [String],
			default: []
		}
	}, {
		timestamps: {
			createdAt: 'created_at',
			updatedAt: 'updated_at'
		}
	} )
)