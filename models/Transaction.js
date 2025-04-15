const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  email:{type:String},
  action: { 
    type: String, 
    enum: ['buy', 'sell'], 
    required: true 
  },
  symbol: { 
    type: String, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: [1, 'Quantity must be at least 1']  // Ensure quantity is a positive integer
  },
  price: { 
    type: Number, 
    required: true,
    min: [0, 'Price must be a positive number']  // Ensure price is a positive number
  },
  totalCost: { 
    type: Number, 
    required: true,
    // totalCost can be dynamically calculated and updated if necessary
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
}, { 
  timestamps: true // This will automatically add createdAt and updatedAt fields
});

// Add an index for faster queries on userId, symbol, and action
transactionSchema.index({ userId: 1, symbol: 1, action: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
