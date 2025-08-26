import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ABTestingVisualizations from './ABTestingVisualizations';

// Mock the API services
jest.mock('../../../services/abTestingSuite2API', () => ({
  getClientSessions: jest.fn()
}));

jest.mock('../../../services/api', () => ({
  clientAPI: {
    getClient: jest.fn()
  }
}));

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>,
  Radar: () => <div data-testid="radar-chart">Radar Chart</div>,
  Scatter: () => <div data-testid="scatter-chart">Scatter Chart</div>
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ABTestingVisualizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    renderWithRouter(<ABTestingVisualizations />);
    expect(screen.getByText('Loading visualizations...')).toBeInTheDocument();
  });

  it('renders error state when API fails', async () => {
    const { getByText } = renderWithRouter(<ABTestingVisualizations />);
    
    // Wait for the component to finish loading
    await screen.findByText('Error Loading Data');
    expect(getByText('Error Loading Data')).toBeInTheDocument();
  });

  it('renders no sessions message when no data available', async () => {
    const mockGetClientSessions = require('../../../services/abTestingSuite2API').getClientSessions;
    const mockGetClient = require('../../../services/api').clientAPI.getClient;
    
    mockGetClientSessions.mockResolvedValue({
      success: true,
      sessions: []
    });
    
    mockGetClient.mockResolvedValue({
      success: true,
      client: { firstName: 'John', lastName: 'Doe' }
    });

    renderWithRouter(<ABTestingVisualizations />);
    
    await screen.findByText('No Sessions Found');
    expect(screen.getByText('No Sessions Found')).toBeInTheDocument();
  });

  it('renders visualization tabs when data is available', async () => {
    const mockGetClientSessions = require('../../../services/abTestingSuite2API').getClientSessions;
    const mockGetClient = require('../../../services/api').clientAPI.getClient;
    
    mockGetClientSessions.mockResolvedValue({
      success: true,
      sessions: [{
        _id: '1',
        sessionId: 'test-session',
        status: 'completed',
        riskProfile: {
          calculatedRiskScore: {
            riskCategory: 'Moderate',
            riskPercentage: 65
          }
        },
        scenarios: [{
          scenarioId: 'scenario-1',
          scenarioName: 'Conservative',
          parameters: {
            equityAllocation: 40,
            debtAllocation: 50,
            alternativesAllocation: 10
          }
        }]
      }]
    });
    
    mockGetClient.mockResolvedValue({
      success: true,
      client: { firstName: 'John', lastName: 'Doe' }
    });

    renderWithRouter(<ABTestingVisualizations />);
    
    // Wait for tabs to appear
    await screen.findByText('Overview');
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Risk Analysis')).toBeInTheDocument();
    expect(screen.getByText('Scenarios')).toBeInTheDocument();
    expect(screen.getByText('Monte Carlo')).toBeInTheDocument();
    expect(screen.getByText('Stress Testing')).toBeInTheDocument();
    expect(screen.getByText('Goal Analysis')).toBeInTheDocument();
  });
});
