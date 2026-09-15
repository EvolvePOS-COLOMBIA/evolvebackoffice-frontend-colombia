# Customers Specification

## Purpose

Defines requirements for the Customers CRUD feature under the People section. Customers represent external individuals (clients) identified by CC or CE documents, managed via a paginated catalog with role-gated mutations.

## Requirements

### Requirement: Customer List with Pagination

The system MUST display customers in a paginated table with columns for name, identification, email, phone, city, and active status. The list MUST support server-side pagination via `pageNumber` and `pageSize` query parameters.

#### Scenario: Load customer list

- GIVEN the user navigates to the Customers catalog page
- WHEN the page loads
- THEN a GET request is sent to `/api/Customers` with default `pageNumber=1` and `pageSize`
- AND the table renders the returned customer records

#### Scenario: Empty list state

- GIVEN no customers exist in the system
- WHEN the user views the customer list
- THEN an empty state message SHALL be displayed

#### Scenario: Pagination navigation

- GIVEN the customer list has multiple pages
- WHEN the user selects a different page
- THEN the table fetches and renders the corresponding page of results

### Requirement: Customer Search

The system MUST support searching customers by name or identification number. Search MUST be performed via `searchField` and `searchValue` query parameters sent to the GET endpoint.

#### Scenario: Search by name

- GIVEN the user types a name in the search field
- WHEN the search is triggered
- THEN the list filters results matching the search value against the name field

#### Scenario: Search by identification number

- GIVEN the user types an identification number in the search field
- WHEN the search is triggered
- THEN the list filters results matching the identification number

### Requirement: Create Customer

The system MUST allow users with BusinessAdmin role to create new customers via a form dialog. The form SHALL collect: firstName, lastName, identificationTypeId, identificationNumber, phoneNumber, emailAddress, address, city, department. The request MUST be a POST to `/api/Customers`.

#### Scenario: Successful creation

- GIVEN a BusinessAdmin user opens the create dialog and fills all required fields
- WHEN the form is submitted
- THEN a POST request is sent with the form data
- AND the list refreshes to include the new customer
- AND a success toast is displayed

#### Scenario: Validation errors on create

- GIVEN a BusinessAdmin user leaves required fields empty
- WHEN the form is submitted
- THEN Zod validation errors are displayed inline on the affected fields
- AND no API request is sent

#### Scenario: Non-admin cannot create

- GIVEN a user without BusinessAdmin role
- WHEN viewing the customer list
- THEN the create button MUST NOT be visible

### Requirement: Get Customer by ID

The system MUST fetch a single customer by GUID when the user navigates to the detail or edit view. The request MUST be a GET to `/api/Customers/{id}`.

#### Scenario: Load customer details

- GIVEN a customer with a known GUID exists
- WHEN the user navigates to the customer detail view
- THEN the system fetches and displays the customer's full information

#### Scenario: Customer not found

- GIVEN a customer with the requested GUID does not exist
- WHEN the system fetches the customer
- THEN a not-found message or redirect SHALL occur

### Requirement: Update Customer

The system MUST allow BusinessAdmin users to edit existing customers. The form SHALL pre-populate with current values. The request MUST be a PUT to `/api/Customers/{id}` with only changed fields.

#### Scenario: Successful update

- GIVEN a BusinessAdmin user modifies customer fields in the edit form
- WHEN the form is submitted
- THEN a PUT request is sent with the updated data
- AND the list and detail view refresh with new values

### Requirement: Soft-Delete Customer

The system MUST allow BusinessAdmin users to deactivate (soft-delete) a customer. The request MUST be a DELETE to `/api/Customers/{id}`, returning 204 No Content.

#### Scenario: Successful deactivation

- GIVEN a BusinessAdmin user confirms deletion of a customer
- WHEN the delete action completes
- THEN the customer record is removed from the active list
- AND a success confirmation is shown

#### Scenario: Deactivation requires confirmation

- GIVEN a BusinessAdmin user initiates delete on a customer
- WHEN the confirmation dialog appears
- THEN the user MUST confirm before the DELETE request is sent

### Requirement: Role-Based UI Visibility

The system MUST conditionally render mutation actions (create, edit, delete buttons) based on the authenticated user's role. Users without BusinessAdmin role SHALL only see read-only views of the customer list.

#### Scenario: Admin sees all actions

- GIVEN the authenticated user has BusinessAdmin role
- WHEN viewing the customer list
- THEN create, edit, and delete actions ARE visible

#### Scenario: Non-admin sees read-only

- GIVEN the authenticated user does NOT have BusinessAdmin role
- WHEN viewing the customer list
- THEN create, edit, and delete actions MUST NOT be visible
