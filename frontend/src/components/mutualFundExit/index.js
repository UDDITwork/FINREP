/**
 * FILE LOCATION: frontend/src/components/mutualFundExit/index.js
 * 
 * PURPOSE: Central export file for all mutual fund exit strategy components
 * 
//import MutualFundExitSuite from '../components/mutualFundExit/MutualFundExitSuite'
 * 
 * COMPONENT HIERARCHY:
 * - MutualFundExitSuite (parent)
 *   ├── ClientSelection (client selection)
 *   ├── MutualFundsList (fund listing)
 *   ├── ExitStrategyForm (strategy creation)
 *   └── ExitStrategyView (strategy viewing)
 * 

 */

export { default as MutualFundExitSuite } from './MutualFundExitSuite';
export { default as ClientSelection } from './ClientSelection';
export { default as MutualFundsList } from './MutualFundsList';
export { default as ExitStrategyForm } from './ExitStrategyForm';
export { default as ExitStrategyView } from './ExitStrategyView';
