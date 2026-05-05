# Harare Municipality Stand Verification - Testing Guide

To make the system robust and enable realistic testing without access to the actual Harare Municipality database, we have implemented a **Mock Authority Database** within the platform.

The system now verifies every land listing against this "official" record.

## 1. Setup the Testing Database
Since the platform is in development mode, you need to populate the authority records. Run the following script in your terminal:

```bash
node server/scripts/seed-authority-testing-db.js
```

## 2. Testing Data (Success Cases)
Use these details when creating a new land listing to see a **successful** authority verification:

### Case A: Borrowdale Residential (Perfect Match)
*   **Stand Number**: `HRE-RES-BOR-001`
*   **Title Deed**: `TD-HRE-RES-BOR-001`
*   **Coordinates**: Latitude `-17.7289`, Longitude `31.0822`
*   **Expected Result**: System identifies this as a VALID residential stand. If your User Profile name is "Isaiah Matombo" and your National ID matches "63-123456X78", it will be fully verified.

### Case B: Mabelreign Residential
*   **Stand Number**: `HRE-RES-MV-002`
*   **Coordinates**: Latitude `-17.8547`, Longitude `31.0123`
*   **Expected Result**: System identifies this as a VALID residential stand.

## 3. Testing Data (Failure/Robustness Cases)
Use these to test the system's "Robustness" and fraud detection:

### Case C: Commercial Stand (Blocked)
*   **Stand Number**: `HRE-COM-AV-004`
*   **Expected Result**: **REJECTED**. The system identifies this as non-residential.

### Case D: Unallocated/Unprocessed Stand (Intelligent Block)
*   **Stand Number**: `HRE-UNALLOC-006` or `HRE-PLAN-007`
*   **Expected Result**: **BLOCKED**. The system recognizes that while the stand exists in the municipality's plans, it hasn't been allocated to an individual yet, preventing "placeholder" fraud.

### Case E: Disputed Ownership
*   **Stand Number**: `HRE-RES-DP-005`
*   **Expected Result**: **BLOCKED**.

### Case F: Wrong Coordinates (Fraud Flag)
*   **Stand Number**: `HRE-RES-BOR-001`
*   **Coordinates**: Use any coordinates far away (e.g., `-18.0000, 32.0000`)
*   **Expected Result**: **FLAGGED**.

## 4. Intelligent Fraud Detection Features
1.  **Stand Existence Check**: The system strictly blocks any stand number not found in official records, detecting attempts to list non-existent property.
2.  **Process State Verification**: It recognizes the difference between a "planned" stand and a "saleable" stand, blocking listings of land that is still in planning or unallocated.
3.  **Identity-Ownership Lock**: Automatically cross-references the Seller's name and ID with the official record.
4.  **Authority Verified Badge**: Listings that match municipality records perfectly receive an `Authority Verified` badge, giving buyers confidence.
