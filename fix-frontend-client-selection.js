/**
 * FRONTEND CLIENT SELECTION FIX SCRIPT
 * 
 * This script helps identify and fix frontend client selection issues:
 * - Checks what client IDs are being sent
 * - Validates client selection logic
 * - Generates correct client data for frontend
 * 
 * USAGE:
 * 1. Run this script to get valid client data
 * 2. Update your frontend with the correct client information
 * 3. Test the mutual fund recommendation submission
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection - Use your actual MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://techfuturepodsuddit:uddit@cluster0.f3fzm4.mongodb.net/richieat?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

// Client Schema
const clientSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Advisor' },
  status: String,
  createdAt: Date,
  updatedAt: Date
});

const Client = mongoose.model('Client', clientSchema);

// Advisor Schema
const advisorSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  status: String
});

const Advisor = mongoose.model('Advisor', advisorSchema);

// Generate frontend-ready client data
async function generateFrontendClientData() {
  console.log('\n🔧 FRONTEND CLIENT SELECTION FIX SCRIPT\n');
  
  const advisorId = '6883ec3e2cc2c6df98e40604';
  
  try {
    // Get advisor info
    const advisor = await Advisor.findById(advisorId);
    if (!advisor) {
      console.log('❌ Advisor not found');
      return;
    }
    
    console.log(`👤 Advisor: ${advisor.firstName} ${advisor.lastName} (${advisor.email})`);
    console.log('');
    
    // Get all clients for this advisor
    const clients = await Client.find({ advisorId })
      .select('_id firstName lastName email status createdAt')
      .sort({ firstName: 1, lastName: 1 });
    
    if (clients.length === 0) {
      console.log('❌ No clients found for this advisor');
      console.log('💡 You need to create clients first before making recommendations');
      return;
    }
    
    console.log(`📊 Found ${clients.length} clients for advisor:`);
    console.log('');
    
    // Generate JavaScript object for frontend
    console.log('📋 COPY THIS TO YOUR FRONTEND:');
    console.log('');
    console.log('```javascript');
    console.log('// Valid clients for mutual fund recommendations');
    console.log('const availableClients = [');
    
    clients.forEach((client, index) => {
      console.log(`  {`);
      console.log(`    id: "${client._id}",`);
      console.log(`    firstName: "${client.firstName}",`);
      console.log(`    lastName: "${client.lastName}",`);
      console.log(`    fullName: "${client.firstName} ${client.lastName}",`);
      console.log(`    email: "${client.email}",`);
      console.log(`    status: "${client.status}",`);
      console.log(`    createdAt: "${client.createdAt.toISOString()}"`);
      console.log(`  }${index < clients.length - 1 ? ',' : ''}`);
    });
    
    console.log('];');
    console.log('');
    console.log('// Helper function to get client by ID');
    console.log('function getClientById(clientId) {');
    console.log('  return availableClients.find(client => client.id === clientId);');
    console.log('}');
    console.log('');
    console.log('// Helper function to validate client selection');
    console.log('function validateClientSelection(clientId) {');
    console.log('  const client = getClientById(clientId);');
    console.log('  if (!client) {');
    console.log('    console.error("Invalid client ID:", clientId);');
    console.log('    return false;');
    console.log('  }');
    console.log('  if (client.status !== "active") {');
    console.log('    console.error("Client is not active:", client.fullName);');
    console.log('    return false;');
    console.log('  }');
    console.log('  return true;');
    console.log('}');
    console.log('```');
    
    console.log('');
    
    // Generate React component example
    console.log('📋 REACT COMPONENT EXAMPLE:');
    console.log('');
    console.log('```jsx');
    console.log('import React, { useState, useEffect } from "react";');
    console.log('');
    console.log('function ClientSelection({ onClientSelect, selectedClientId }) {');
    console.log('  const [clients, setClients] = useState([]);');
    console.log('  const [loading, setLoading] = useState(true);');
    console.log('');
    console.log('  useEffect(() => {');
    console.log('    // Load clients from your API');
    console.log('    const loadClients = async () => {');
    console.log('      try {');
    console.log('        const response = await fetch("/api/clients", {');
    console.log('          headers: {');
    console.log('            "Authorization": `Bearer ${localStorage.getItem("token")}`');
    console.log('          }');
    console.log('        });');
    console.log('        const data = await response.json();');
    console.log('        if (data.success) {');
    console.log('          setClients(data.data);');
    console.log('        }');
    console.log('      } catch (error) {');
    console.log('        console.error("Error loading clients:", error);');
    console.log('      } finally {');
    console.log('        setLoading(false);');
    console.log('      }');
    console.log('    };');
    console.log('');
    console.log('    loadClients();');
    console.log('  }, []);');
    console.log('');
    console.log('  if (loading) return <div>Loading clients...</div>;');
    console.log('');
    console.log('  return (');
    console.log('    <div className="client-selection">');
    console.log('      <label htmlFor="client-select">Select Client:</label>');
    console.log('      <select');
    console.log('        id="client-select"');
    console.log('        value={selectedClientId || ""}');
    console.log('        onChange={(e) => onClientSelect(e.target.value)}');
    console.log('        className="form-select"');
    console.log('      >');
    console.log('        <option value="">-- Select a client --</option>');
    console.log('        {clients.map(client => (');
    console.log('          <option key={client._id} value={client._id}>');
    console.log('            {client.firstName} {client.lastName}');
    console.log('          </option>');
    console.log('        ))}');
    console.log('      </select>');
    console.log('    </div>');
    console.log('  );');
    console.log('}');
    console.log('');
    console.log('export default ClientSelection;');
    console.log('```');
    
    console.log('');
    
    // Generate validation function
    console.log('📋 VALIDATION FUNCTION:');
    console.log('');
    console.log('```javascript');
    console.log('// Add this validation before submitting mutual fund recommendation');
    console.log('function validateRecommendationData(data) {');
    console.log('  const errors = [];');
    console.log('');
    console.log('  // Check if client exists and belongs to current advisor');
    console.log('  const selectedClient = availableClients.find(c => c.id === data.clientId);');
    console.log('  if (!selectedClient) {');
    console.log('    errors.push("Selected client not found");');
    console.log('  } else if (selectedClient.status !== "active") {');
    console.log('    errors.push("Selected client is not active");');
    console.log('  }');
    console.log('');
    console.log('  // Check other required fields');
    console.log('  if (!data.fundName) errors.push("Fund name is required");');
    console.log('  if (!data.fundHouseName) errors.push("Fund house name is required");');
    console.log('  if (!data.recommendedMonthlySIP) errors.push("Monthly SIP amount is required");');
    console.log('  if (!data.sipStartDate) errors.push("SIP start date is required");');
    console.log('  if (!data.expectedExitDate) errors.push("Expected exit date is required");');
    console.log('');
    console.log('  return {');
    console.log('    isValid: errors.length === 0,');
    console.log('    errors');
    console.log('  };');
    console.log('}');
    console.log('```');
    
    console.log('');
    
    // Show the problematic client ID
    console.log('⚠️ PROBLEMATIC CLIENT ID FROM YOUR LOGS:');
    console.log(`   ${clients.length > 0 ? 'NOT FOUND' : 'NO CLIENTS EXIST'}`);
    console.log('');
    console.log('💡 SOLUTION: Use one of the valid client IDs above in your frontend');
    
  } catch (error) {
    console.error('❌ Error generating frontend data:', error.message);
  }
}

// Check for data inconsistencies
async function checkDataInconsistencies() {
  console.log('\n🔍 CHECKING FOR DATA INCONSISTENCIES...\n');
  
  try {
    // Check for clients with missing advisorId
    const orphanedClients = await Client.find({ advisorId: { $exists: false } });
    if (orphanedClients.length > 0) {
      console.log(`⚠️ Found ${orphanedClients.length} orphaned clients:`);
      orphanedClients.forEach(client => {
        console.log(`   - ${client.firstName} ${client.lastName} (ID: ${client._id})`);
      });
    }
    
    // Check for clients with invalid advisorId format
    const invalidFormatClients = await Client.find({
      advisorId: { $exists: true, $ne: null },
      $expr: { $not: { $regexMatch: { input: { $toString: "$advisorId" }, regex: "^[0-9a-fA-F]{24}$" } } }
    });
    
    if (invalidFormatClients.length > 0) {
      console.log(`⚠️ Found ${invalidFormatClients.length} clients with invalid advisorId format:`);
      invalidFormatClients.forEach(client => {
        console.log(`   - ${client.firstName} ${client.lastName} (ID: ${client._id})`);
        console.log(`     Invalid advisorId: ${client.advisorId}`);
      });
    }
    
    if (orphanedClients.length === 0 && invalidFormatClients.length === 0) {
      console.log('✅ No data inconsistencies found');
    }
    
  } catch (error) {
    console.error('❌ Error checking data inconsistencies:', error.message);
  }
}

// Main function
async function main() {
  const connected = await connectDB();
  if (connected) {
    try {
      await generateFrontendClientData();
      await checkDataInconsistencies();
      console.log('\n✅ FRONTEND CLIENT SELECTION ANALYSIS COMPLETE\n');
    } catch (error) {
      console.error('❌ Error during analysis:', error);
    } finally {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    }
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateFrontendClientData, checkDataInconsistencies };
