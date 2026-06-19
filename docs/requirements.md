# Requirements Document

## Introduction
The Journey Registry feature allows employees to record their work shifts by capturing their exact time and geographic location (latitude and longitude) at the moment of registration. This feature ensures accurate attendance tracking and field presence verification. It also provides administrative tools for managers to oversee and correct journey data when necessary.

## Requirements

### 1. Journey Registration
- **User Story**: As an employee, I want to record my current time and location so that my work journey is accurately tracked.
- **Acceptance Criteria**:
  - WHEN the user clicks "Register Journey" THEN the system SHALL capture the current UTC timestamp and the device's latitude/longitude.
  - WHEN the location data is unavailable THEN the system SHALL prevent registration and display a clear error message.
  - WHEN the registry is successful THEN the system SHALL store the record associated with the authenticated user.

### 2. Journey History Visualization
- **User Story**: As an employee, I want to view my past journey records so that I can track my work hours.
- **Acceptance Criteria**:
  - WHEN the user accesses their journey history THEN the system SHALL display a list of their own records in reverse chronological order.
  - EACH record SHALL show the date, time, and coordinates.

### 3. Administrative Journey Management
- **User Story**: As an admin, I want to view and edit any user's journey records so that I can correct errors or omissions.
- **Acceptance Criteria**:
  - WHEN an admin views the journey module THEN the system SHALL allow searching for records by user or date range.
  - WHEN an admin edits a record THEN the system SHALL require a reason for the change and store the previous values for auditing.
  - WHEN an admin deletes a record THEN the system SHALL mark it as deleted (soft delete) rather than removing it from the database.

### 4. Employee User Profile & Visibility
- **User Story**: As an administrator, I want to assign the "Employee" role to users so that they can access the journey registry feature, and ensure their interface is restricted to relevant tools.
- **Acceptance Criteria**:
  - WHEN creating or updating a user THEN the system SHALL allow selecting the "EMPLOYEE" role (or equivalent new profile).
  - WHEN a user has the "EMPLOYEE" role THEN they SHALL have access to the journey registration UI.
  - WHEN a user has ONLY the "EMPLOYEE" role THEN the system SHALL only display the "My Journey" (Minha Jornada) menu.
  - WHEN a user has ONLY the "EMPLOYEE" role THEN the system SHALL automatically redirect them to the "My Journey" (Minha Jornada) screen after login.
  - WHEN a user has multiple roles including "EMPLOYEE" THEN the system SHALL follow standard role-based visibility rules for all assigned roles.

### 5. Security and Permissions
- **User Story**: As a system owner, I want to ensure that only authorized users can record journeys or edit them.
- **Acceptance Criteria**:
  - WHEN a non-authenticated user attempts to access journey endpoints THEN the system SHALL return a 401 Unauthorized error.
  - WHEN a non-admin user attempts to edit another user's journey THEN the system SHALL return a 403 Forbidden error.
