# Expense Tracking Standard Operating Procedure (SOP)

This document outlines the end-to-end flow for the Expense Tracking feature within the HOMMA application, specifically detailing the user interaction within the app, review processes, administrative tasks, and backend automations.

## 1. User Flow (HOMMA App)

The user flow is initiated from the HOMMA application via the Expense Receipt component.

**Steps:**
1. **Fill out the Expense Form:** The participant (staff member) provides details of the expense:
   - **Vendor:** Selected from a searchable dropdown (populated from QuickBase vendor table `bpqx5i336`, storing the QuickBooks ID).
   - **Expense Date:** The date the expense occurred.
   - **Quantity:** Default is 1.
   - **Amount:** The total cost of the expense.
   - **Description:** A text explanation of the expense.
   - **Grant Expenditure:** A toggle (`grantYesNo`) to indicate if it's a grant-related expense. If 'Yes', the user selects a grant type (Reentry, Federal, Tax, or Coalition). The grant type is then automatically prepended to the description (e.g., `"Grant Expense - Reentry Grant. <User Description>"`).

2. **Take/Upload a Receipt Photo:**
   - The user captures a photo of the receipt using their device's camera or uploads a file (PNG or PDF). The receipt *must be legible*.
   - The app processes the file into a Base64 string.
   - The file is automatically renamed into an auditor-friendly format: `MM-yy $##.00 StaffName.extension` (e.g., `12-25 $150.00 John Doe.png`).

3. **Submit to Quickbase:**
   - The app sends a POST request to the Quickbase API via a secure cloud function proxy (`quickbaseProxy`).
   - The following Quickbase fields are populated:
     - **Field 14 (Related Staff):** Numeric Staff Record ID.
     - **Field 12 (Related Vendor):** QuickBooks ID of the vendor.
     - **Field 7 (Expense Date):** Formatted as `YYYY-MM-DD`.
     - **Field 20 (Quantity):** Numeric quantity.
     - **Field 8 (Amount):** Currency amount.
     - **Field 9 (Description):** Multiline text (including grant prefix if applicable).
     - **Field 10 (Receipt):** File attachment containing the Base64 image/PDF and the smart filename.

---

## 2. Finance Director (FD) Review

Once the expense is logged in Quickbase, it requires review.

**Steps:**
1. The Finance Director logs into Quickbase.
2. The FD locates the submitted expense record.
3. The FD reviews the details and the attached receipt photo for legibility and accuracy.
4. The FD updates the record status to either **'Approved'** or **'Pending'** (e.g., if more information or a clearer receipt is required).

---

## 3. Administrative (Admin) Step

Following FD Approval, an Admin prepares the record for synchronization with the accounting software.

**Steps:**
1. The Admin reviews the Approved expense record in Quickbase.
2. The Admin manually assigns the appropriate **'Account Name'** (General Ledger account) to categorize the expense.
3. The Admin toggles the **'Send to Quickbooks'** switch to **'Yes'**.

---

## 4. Automations (Zapier / Webhook Flow)

Toggling 'Send to Quickbooks' triggers a series of automated backend processes to finalize the bookkeeping and document storage.

**Steps:**
1. **Trigger:** The 'Send to Quickbooks' switch changing to 'Yes' triggers a Quickbase Webhook (or Zapier Zap).
2. **Create QuickBooks Expense:** The automation reads the expense details (Vendor QuickBooks ID, Amount, Account Name, Description, Date) and uses the QuickBooks Online API to create a new Expense or Bill transaction.
3. **Upload to OneDrive:** The automation retrieves the file attachment (the receipt photo) from Quickbase Field 10 and uploads it to a designated folder in Microsoft OneDrive for long-term audit compliance.
4. **Delete Quickbase Attachment:** Once successfully uploaded to OneDrive, the automation clears/deletes the file attachment from Quickbase to conserve Quickbase file storage space.