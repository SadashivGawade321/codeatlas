const mongoose = require('mongoose');

const repositoryHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repositoryUrl: { type: String, required: true },
  repositoryName: { type: String, required: true },
  healthScore: { type: String }, // e.g., 'A+', 'B'
  analysisDate: { type: Date, default: Date.now },
  languageBreakdown: { type: Map, of: Number }, // e.g., { "JavaScript": 80, "HTML": 20 }
  graphId: { type: mongoose.Schema.Types.ObjectId, ref: 'Graph' }
}, { timestamps: true });

module.exports = mongoose.model('RepositoryHistory', repositoryHistorySchema);
