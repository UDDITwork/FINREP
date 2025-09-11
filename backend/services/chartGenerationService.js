/**
 * FILE LOCATION: backend/services/chartGenerationService.js
 * 
 * PURPOSE: Chart generation service for PDF reports
 * 

 */

const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { logger } = require('../utils/logger');

class ChartGenerationService {
  constructor() {
    this.width = 800;
    this.height = 400;
    this.chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: this.width,
      height: this.height,
      backgroundColour: 'white'
    });

    // Professional color palette
    this.colors = {
      primary: '#10B981',      // Green
      secondary: '#1E3A8A',    // Dark Blue
      accent: '#F59E0B',       // Yellow
      danger: '#EF4444',       // Red
      neutral: '#6B7280',      // Gray
      light: '#F3F4F6',        // Light Gray
      white: '#FFFFFF'
    };

    // Chart configuration
    this.defaultConfig = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
              family: 'Arial, sans-serif'
            }
          }
        },
        title: {
          display: true,
          font: {
            size: 16,
            weight: 'bold',
            family: 'Arial, sans-serif'
          },
          color: this.colors.secondary
        }
      },
      scales: {
        x: {
          grid: {
            color: this.colors.light
          },
          ticks: {
            font: {
              size: 11,
              family: 'Arial, sans-serif'
            },
            color: this.colors.neutral
          }
        },
        y: {
          grid: {
            color: this.colors.light
          },
          ticks: {
            font: {
              size: 11,
              family: 'Arial, sans-serif'
            },
            color: this.colors.neutral,
            callback: function(value) {
              return '₹' + value.toLocaleString('en-IN');
            }
          }
        }
      }
    };
  }

  /**
   * Generate asset allocation pie chart
   * @param {Object} financialData - Financial data
   * @returns {String} - Base64 image
   */
  async generateAssetAllocationChart(financialData) {
    try {
      const assets = financialData.assets || [];
      
      if (assets.length === 0) {
        return await this.generateEmptyChart('Asset Allocation', 'No asset data available');
      }

      // Group assets by type
      const assetGroups = {};
      assets.forEach(asset => {
        const type = asset.type || 'Other';
        assetGroups[type] = (assetGroups[type] || 0) + (asset.value || 0);
      });

      const labels = Object.keys(assetGroups);
      const data = Object.values(assetGroups);
      const colors = this.generateColors(labels.length);

      const configuration = {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors,
            borderColor: colors.map(color => color.replace('0.8', '1')),
            borderWidth: 2,
            hoverOffset: 4
          }]
        },
        options: {
          ...this.defaultConfig,
          plugins: {
            ...this.defaultConfig.plugins,
            title: {
              ...this.defaultConfig.plugins.title,
              text: 'Asset Allocation'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${context.label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
                }
              }
            }
          }
        }
      };

      const imageBuffer = await this.chartJSNodeCanvas.renderToBuffer(configuration);
      return `data:image/png;base64,${imageBuffer.toString('base64')}`;

    } catch (error) {
      logger.error('❌ [CHART GENERATION] Error generating asset allocation chart', {
        error: error.message,
        stack: error.stack
      });
      return await this.generateErrorChart('Asset Allocation');
    }
  }

  /**
   * Generate income vs expense bar chart
   * @param {Object} financialData - Financial data
   * @returns {String} - Base64 image
   */
  async generateIncomeExpenseChart(financialData) {
    try {
      const monthlyIncome = financialData.monthlyIncome || 0;
      const monthlyExpenses = financialData.monthlyExpenses || 0;
      const savings = monthlyIncome - monthlyExpenses;

      if (monthlyIncome === 0 && monthlyExpenses === 0) {
        return await this.generateEmptyChart('Income vs Expenses', 'No financial data available');
      }

      const configuration = {
        type: 'bar',
        data: {
          labels: ['Monthly Income', 'Monthly Expenses', 'Monthly Savings'],
          datasets: [{
            data: [monthlyIncome, monthlyExpenses, savings],
            backgroundColor: [
              this.colors.primary,
              this.colors.danger,
              savings >= 0 ? this.colors.accent : this.colors.danger
            ],
            borderColor: [
              this.colors.primary,
              this.colors.danger,
              savings >= 0 ? this.colors.accent : this.colors.danger
            ],
            borderWidth: 1
          }]
        },
        options: {
          ...this.defaultConfig,
          plugins: {
            ...this.defaultConfig.plugins,
            title: {
              ...this.defaultConfig.plugins.title,
              text: 'Monthly Income vs Expenses'
            }
          },
          scales: {
            ...this.defaultConfig.scales,
            y: {
              ...this.defaultConfig.scales.y,
              beginAtZero: true
            }
          }
        }
      };

      const imageBuffer = await this.chartJSNodeCanvas.renderToBuffer(configuration);
      return `data:image/png;base64,${imageBuffer.toString('base64')}`;

    } catch (error) {
      logger.error('❌ [CHART GENERATION] Error generating income expense chart', {
        error: error.message,
        stack: error.stack
      });
      return await this.generateErrorChart('Income vs Expenses');
    }
  }

  /**
   * Generate net worth trend line chart
   * @param {Object} financialData - Financial data
   * @returns {String} - Base64 image
   */
  async generateNetWorthTrendChart(financialData) {
    try {
      // Generate sample trend data (in real implementation, this would come from historical data)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentNetWorth = (financialData.totalAssets || 0) - (financialData.totalLiabilities || 0);
      
      // Generate trend data (simplified - in real app, use historical data)
      const trendData = months.map((month, index) => {
        const growth = (index / months.length) * currentNetWorth * 0.2; // 20% growth over year
        return Math.max(0, currentNetWorth - growth);
      });

      const configuration = {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Net Worth Trend',
            data: trendData,
            borderColor: this.colors.primary,
            backgroundColor: this.colors.primary + '20',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: this.colors.primary,
            pointBorderColor: this.colors.white,
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
          }]
        },
        options: {
          ...this.defaultConfig,
          plugins: {
            ...this.defaultConfig.plugins,
            title: {
              ...this.defaultConfig.plugins.title,
              text: 'Net Worth Trend (Last 12 Months)'
            }
          },
          scales: {
            ...this.defaultConfig.scales,
            y: {
              ...this.defaultConfig.scales.y,
              beginAtZero: false
            }
          }
        }
      };

      const imageBuffer = await this.chartJSNodeCanvas.renderToBuffer(configuration);
      return `data:image/png;base64,${imageBuffer.toString('base64')}`;

    } catch (error) {
      logger.error('❌ [CHART GENERATION] Error generating net worth trend chart', {
        error: error.message,
        stack: error.stack
      });
      return await this.generateErrorChart('Net Worth Trend');
    }
  }

  /**
   * Generate goal progress chart
   * @param {Array} goals - Goals array
   * @returns {String} - Base64 image
   */
  async generateGoalProgressChart(goals) {
    try {
      if (!goals || goals.length === 0) {
        return await this.generateEmptyChart('Goal Progress', 'No goals defined');
      }

      const labels = goals.map(goal => goal.name || 'Unnamed Goal');
      const progressData = goals.map(goal => {
        const current = goal.currentAmount || 0;
        const target = goal.targetAmount || 1;
        return Math.min((current / target) * 100, 100);
      });

      const configuration = {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Progress (%)',
            data: progressData,
            backgroundColor: progressData.map(progress => 
              progress >= 100 ? this.colors.primary : 
              progress >= 75 ? this.colors.accent : 
              progress >= 50 ? this.colors.secondary : 
              this.colors.danger
            ),
            borderColor: progressData.map(progress => 
              progress >= 100 ? this.colors.primary : 
              progress >= 75 ? this.colors.accent : 
              progress >= 50 ? this.colors.secondary : 
              this.colors.danger
            ),
            borderWidth: 1
          }]
        },
        options: {
          ...this.defaultConfig,
          plugins: {
            ...this.defaultConfig.plugins,
            title: {
              ...this.defaultConfig.plugins.title,
              text: 'Financial Goals Progress'
            }
          },
          scales: {
            ...this.defaultConfig.scales,
            y: {
              ...this.defaultConfig.scales.y,
              min: 0,
              max: 100,
              ticks: {
                ...this.defaultConfig.scales.y.ticks,
                callback: function(value) {
                  return value + '%';
                }
              }
            }
          }
        }
      };

      const imageBuffer = await this.chartJSNodeCanvas.renderToBuffer(configuration);
      return `data:image/png;base64,${imageBuffer.toString('base64')}`;

    } catch (error) {
      logger.error('❌ [CHART GENERATION] Error generating goal progress chart', {
        error: error.message,
        stack: error.stack
      });
      return await this.generateErrorChart('Goal Progress');
    }
  }

  /**
   * Generate investment recommendations chart
   * @param {Array} mutualFundRecommend - Mutual fund recommendations
   * @returns {String} - Base64 image
   */
  async generateInvestmentChart(mutualFundRecommend) {
    try {
      if (!mutualFundRecommend || mutualFundRecommend.length === 0) {
        return await this.generateEmptyChart('Investment Recommendations', 'No investment recommendations available');
      }

      const labels = mutualFundRecommend.map(fund => fund.fundName || 'Unnamed Fund');
      const amounts = mutualFundRecommend.map(fund => fund.recommendedAmount || 0);

      const configuration = {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Recommended Amount (₹)',
            data: amounts,
            backgroundColor: this.colors.primary + '80',
            borderColor: this.colors.primary,
            borderWidth: 2
          }]
        },
        options: {
          ...this.defaultConfig,
          plugins: {
            ...this.defaultConfig.plugins,
            title: {
              ...this.defaultConfig.plugins.title,
              text: 'Mutual Fund Recommendations'
            }
          },
          scales: {
            ...this.defaultConfig.scales,
            y: {
              ...this.defaultConfig.scales.y,
              beginAtZero: true
            }
          }
        }
      };

      const imageBuffer = await this.chartJSNodeCanvas.renderToBuffer(configuration);
      return `data:image/png;base64,${imageBuffer.toString('base64')}`;

    } catch (error) {
      logger.error('❌ [CHART GENERATION] Error generating investment chart', {
        error: error.message,
        stack: error.stack
      });
      return await this.generateErrorChart('Investment Recommendations');
    }
  }

  /**
   * Generate tax savings chart
   * @param {Object} taxPlanning - Tax planning data
   * @returns {String} - Base64 image
   */
  async generateTaxSavingsChart(taxPlanning) {
    try {
      if (!taxPlanning) {
        return await this.generateEmptyChart('Tax Planning', 'No tax planning data available');
      }

      const currentTax = taxPlanning.currentTaxLiability || 0;
      const projectedTax = taxPlanning.projectedTaxLiability || 0;
      const savings = Math.max(0, currentTax - projectedTax);

      const configuration = {
        type: 'bar',
        data: {
          labels: ['Current Tax', 'Projected Tax', 'Tax Savings'],
          datasets: [{
            data: [currentTax, projectedTax, savings],
            backgroundColor: [
              this.colors.danger,
              this.colors.accent,
              this.colors.primary
            ],
            borderColor: [
              this.colors.danger,
              this.colors.accent,
              this.colors.primary
            ],
            borderWidth: 1
          }]
        },
        options: {
          ...this.defaultConfig,
          plugins: {
            ...this.defaultConfig.plugins,
            title: {
              ...this.defaultConfig.plugins.title,
              text: 'Tax Planning Analysis'
            }
          },
          scales: {
            ...this.defaultConfig.scales,
            y: {
              ...this.defaultConfig.scales.y,
              beginAtZero: true
            }
          }
        }
      };

      const imageBuffer = await this.chartJSNodeCanvas.renderToBuffer(configuration);
      return `data:image/png;base64,${imageBuffer.toString('base64')}`;

    } catch (error) {
      logger.error('❌ [CHART GENERATION] Error generating tax savings chart', {
        error: error.message,
        stack: error.stack
      });
      return await this.generateErrorChart('Tax Planning');
    }
  }

  /**
   * Generate empty chart placeholder
   * @param {String} title - Chart title
   * @param {String} message - Empty message
   * @returns {String} - Base64 image
   */
  async generateEmptyChart(title, message) {
    const configuration = {
      type: 'bar',
      data: {
        labels: ['No Data'],
        datasets: [{
          data: [0],
          backgroundColor: this.colors.light,
          borderColor: this.colors.neutral,
          borderWidth: 1
        }]
      },
      options: {
        ...this.defaultConfig,
        plugins: {
          ...this.defaultConfig.plugins,
          title: {
            ...this.defaultConfig.plugins.title,
            text: title
          },
          subtitle: {
            display: true,
            text: message,
            font: {
              size: 12,
              style: 'italic',
              family: 'Arial, sans-serif'
            },
            color: this.colors.neutral
          }
        }
      }
    };

    const imageBuffer = await this.chartJSNodeCanvas.renderToBuffer(configuration);
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
  }

  /**
   * Generate error chart placeholder
   * @param {String} title - Chart title
   * @returns {String} - Base64 image
   */
  async generateErrorChart(title) {
    return await this.generateEmptyChart(title, 'Chart generation failed');
  }

  /**
   * Generate color palette
   * @param {Number} count - Number of colors needed
   * @returns {Array} - Color array
   */
  generateColors(count) {
    const baseColors = [
      this.colors.primary,
      this.colors.secondary,
      this.colors.accent,
      this.colors.danger,
      this.colors.neutral
    ];

    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length] + '80'); // Add transparency
    }
    return colors;
  }
}

module.exports = ChartGenerationService;
