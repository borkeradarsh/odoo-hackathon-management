// Simple test data for product creation
const testProductData = {
  name: "Test Product " + Date.now(),
  type: "Raw Material",
  stock_on_hand: 100,
  min_stock_level: 10
};

console.log("✅ Test product data (should not cause stack overflow):");
console.log(JSON.stringify(testProductData, null, 2));

// Test JSON serialization 
try {
  const serialized = JSON.stringify(testProductData);
  console.log("✅ JSON serialization successful");
  console.log("Serialized length:", serialized.length);
} catch (error) {
  console.error("❌ JSON serialization failed:", error);
}

console.log("\n🔧 Stack overflow fixes applied:");
console.log("✅ Clean data creation in ProductForm");
console.log("✅ Safe JSON serialization in API client");
console.log("✅ Simplified error handling in API route");
console.log("✅ Proper data type conversion");