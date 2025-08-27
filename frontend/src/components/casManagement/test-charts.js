// Test file for ClientFinancialCharts component
// This file can be used to test the charts component with sample data

const sampleClient = {
  clientId: 'test-client-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  status: 'active'
};

const sampleCASDetails = {
  clientInfo: {
    name: 'John Doe',
    email: 'john.doe@example.com'
  },
  accounts: {
    dematAccounts: {
      count: 2,
      holdings: [
        {
          symbol: 'RELIANCE',
          value: '150000',
          quantity: '100',
          avgPrice: '1500'
        },
        {
          symbol: 'TCS',
          value: '200000',
          quantity: '50',
          avgPrice: '4000'
        },
        {
          symbol: 'INFOSYS',
          value: '120000',
          quantity: '200',
          avgPrice: '600'
        },
        {
          symbol: 'HDFC',
          value: '180000',
          quantity: '150',
          avgPrice: '1200'
        }
      ]
    },
    mutualFunds: {
      count: 3,
      folios: [
        {
          amc: 'HDFC Mutual Fund',
          folio_number: '123456789',
          value: '250000'
        },
        {
          amc: 'ICICI Prudential',
          folio_number: '987654321',
          value: '180000'
        },
        {
          amc: 'SBI Mutual Fund',
          folio_number: '456789123',
          value: '120000'
        }
      ]
    }
  },
  summary: {
    totalValue: '1200000',
    totalHoldings: 7,
    lastParsedAt: '2025-01-15T10:30:00Z'
  }
};

// Test data for different scenarios
const testScenarios = {
  // Scenario 1: High equity concentration
  highEquity: {
    ...sampleCASDetails,
    accounts: {
      ...sampleCASDetails.accounts,
      dematAccounts: {
        count: 5,
        holdings: [
          { symbol: 'RELIANCE', value: '500000', quantity: '200', avgPrice: '2500' },
          { symbol: 'TCS', value: '400000', quantity: '100', avgPrice: '4000' },
          { symbol: 'INFOSYS', value: '300000', quantity: '500', avgPrice: '600' },
          { symbol: 'HDFC', value: '250000', quantity: '200', avgPrice: '1250' },
          { symbol: 'WIPRO', value: '150000', quantity: '300', avgPrice: '500' }
        ]
      },
      mutualFunds: {
        count: 1,
        folios: [
          { amc: 'HDFC Mutual Fund', folio_number: '123456789', value: '100000' }
        ]
      }
    }
  },

  // Scenario 2: Balanced portfolio
  balanced: {
    ...sampleCASDetails,
    accounts: {
      ...sampleCASDetails.accounts,
      dematAccounts: {
        count: 3,
        holdings: [
          { symbol: 'RELIANCE', value: '200000', quantity: '100', avgPrice: '2000' },
          { symbol: 'TCS', value: '150000', quantity: '30', avgPrice: '5000' },
          { symbol: 'INFOSYS', value: '100000', quantity: '150', avgPrice: '667' }
        ]
      },
      mutualFunds: {
        count: 4,
        folios: [
          { amc: 'HDFC Mutual Fund', folio_number: '123456789', value: '200000' },
          { amc: 'ICICI Prudential', folio_number: '987654321', value: '150000' },
          { amc: 'SBI Mutual Fund', folio_number: '456789123', value: '100000' },
          { amc: 'Axis Mutual Fund', folio_number: '789123456', value: '75000' }
        ]
      }
    }
  },

  // Scenario 3: Mutual fund heavy
  mfHeavy: {
    ...sampleCASDetails,
    accounts: {
      ...sampleCASDetails.accounts,
      dematAccounts: {
        count: 1,
        holdings: [
          { symbol: 'RELIANCE', value: '100000', quantity: '50', avgPrice: '2000' }
        ]
      },
      mutualFunds: {
        count: 6,
        folios: [
          { amc: 'HDFC Mutual Fund', folio_number: '123456789', value: '300000' },
          { amc: 'ICICI Prudential', folio_number: '987654321', value: '250000' },
          { amc: 'SBI Mutual Fund', folio_number: '456789123', value: '200000' },
          { amc: 'Axis Mutual Fund', folio_number: '789123456', value: '150000' },
          { amc: 'Kotak Mutual Fund', folio_number: '321654987', value: '100000' },
          { amc: 'Aditya Birla Sun Life', folio_number: '147258369', value: '75000' }
        ]
      }
    }
  }
};

// Function to test chart data preparation
function testChartDataPreparation() {
  console.log('🧪 Testing Chart Data Preparation...');
  
  Object.entries(testScenarios).forEach(([scenarioName, casDetails]) => {
    console.log(`\n📊 Testing Scenario: ${scenarioName}`);
    
    // Simulate the prepareChartData function logic
    const portfolioData = [];
    let totalValue = 0;

    // Add Demat Account Holdings
    if (casDetails.accounts?.dematAccounts?.holdings) {
      casDetails.accounts.dematAccounts.holdings.forEach(holding => {
        const value = parseFloat(holding.value) || 0;
        totalValue += value;
        portfolioData.push({
          name: holding.symbol || 'Unknown',
          value: value,
          type: 'Equity',
          category: 'Demat Holdings'
        });
      });
    }

    // Add Mutual Fund Holdings
    if (casDetails.accounts?.mutualFunds?.folios) {
      casDetails.accounts.mutualFunds.folios.forEach(folio => {
        const value = parseFloat(folio.value) || 0;
        totalValue += value;
        portfolioData.push({
          name: folio.amc || 'Unknown AMC',
          value: value,
          type: 'Mutual Fund',
          category: 'MF Holdings'
        });
      });
    }

    // Group by type for pie chart
    const typeData = portfolioData.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = { name: item.type, value: 0, count: 0 };
      }
      acc[item.type].value += item.value;
      acc[item.type].count += 1;
      return acc;
    }, {});

    // Top 10 holdings for bar chart
    const topHoldings = portfolioData
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    console.log(`✅ Total Portfolio Value: ₹${totalValue.toLocaleString()}`);
    console.log(`✅ Total Holdings: ${portfolioData.length}`);
    console.log(`✅ Equity Value: ₹${typeData['Equity']?.value.toLocaleString() || 0}`);
    console.log(`✅ MF Value: ₹${typeData['Mutual Fund']?.value.toLocaleString() || 0}`);
    console.log(`✅ Top Holding: ${topHoldings[0]?.name} (₹${topHoldings[0]?.value.toLocaleString()})`);
    
    // Calculate percentages
    const equityPercentage = ((typeData['Equity']?.value || 0) / totalValue * 100).toFixed(1);
    const mfPercentage = ((typeData['Mutual Fund']?.value || 0) / totalValue * 100).toFixed(1);
    console.log(`✅ Asset Allocation: ${equityPercentage}% Equity, ${mfPercentage}% Mutual Funds`);
  });
}

// Function to test chart rendering scenarios
function testChartRendering() {
  console.log('\n🎨 Testing Chart Rendering Scenarios...');
  
  const scenarios = [
    { name: 'High Equity Portfolio', data: testScenarios.highEquity },
    { name: 'Balanced Portfolio', data: testScenarios.balanced },
    { name: 'MF Heavy Portfolio', data: testScenarios.mfHeavy }
  ];

  scenarios.forEach((scenario, index) => {
    console.log(`\n📈 Scenario ${index + 1}: ${scenario.name}`);
    console.log(`   - Demat Accounts: ${scenario.data.accounts.dematAccounts.count}`);
    console.log(`   - Mutual Funds: ${scenario.data.accounts.mutualFunds.count}`);
    console.log(`   - Total Holdings: ${scenario.data.accounts.dematAccounts.count + scenario.data.accounts.mutualFunds.count}`);
  });
}

// Export test functions and data
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sampleClient,
    sampleCASDetails,
    testScenarios,
    testChartDataPreparation,
    testChartRendering
  };
} else {
  // Browser environment
  window.testChartData = {
    sampleClient,
    sampleCASDetails,
    testScenarios,
    testChartDataPreparation,
    testChartRendering
  };
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  console.log('🚀 Starting Chart Component Tests...\n');
  testChartDataPreparation();
  testChartRendering();
  console.log('\n✅ Chart Component Tests Completed!');
}
