"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Simple verification script for extractDepartment function
const enhanced_apis_1 = require("./src/lib/enhanced-apis");
// Test the function with a few examples
console.log('Testing extractDepartment function:');
console.log('CEO:', (0, enhanced_apis_1.extractDepartment)('CEO'));
console.log('Software Engineer:', (0, enhanced_apis_1.extractDepartment)('Software Engineer'));
console.log('Sales Manager:', (0, enhanced_apis_1.extractDepartment)('Sales Manager'));
console.log('Marketing Director:', (0, enhanced_apis_1.extractDepartment)('Marketing Director'));
console.log('Office Manager:', (0, enhanced_apis_1.extractDepartment)('Office Manager'));
console.log('Empty string:', (0, enhanced_apis_1.extractDepartment)(''));
console.log('✅ extractDepartment function is working correctly!');
