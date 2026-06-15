const mongoose = require('mongoose');

const graphSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repositoryUrl: { type: String, required: true },
  nodes: [{
    id: String,
    label: String,
    type: { type: String }, // file, folder, api, db, service
    data: mongoose.Schema.Types.Mixed
  }],
  edges: [{
    source: String,
    target: String,
    label: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Graph', graphSchema);
