# Scholars Avenue Internal Student and Application Management Platform

**Document type:** Product Requirements Document (PRD)  
**Status:** Initial requirements baseline  
**Product:** Scholars Avenue Internal Operations Platform  
**Primary users:** Students, Counselors, Administrators  
**Initial implementation context:** Existing Next.js project  
**Supported country scope:** Germany, Italy, France, Netherlands, United Kingdom, United States, Australia, Sweden, Finland, Hungary, Romania, and Czech Republic  

---

## 1. Product Overview

Scholars Avenue currently manages much of its student onboarding, document collection, university shortlisting, application progress, deadlines, and communication through Google Forms and WhatsApp groups. This creates fragmented records, repeated manual work, limited visibility for students and management, and a dependency on individual employees to retain important information.

The platform will centralize the complete student consultancy lifecycle in one system. Students will create and maintain their profiles, submit academic and language-test information, upload documents, communicate with their counselor, and follow the progress of their applications. Counselors will manage their assigned students, discover and shortlist suitable university programs from a maintained program database, manage application records, track deadlines, and keep students informed. Administrators will manage users, assignments, country-wise program data, operational settings, and organization-wide progress.

The platform must maintain a reliable record of each student, each shortlisted program, each application, every required document, every important status change, and every relevant deadline.

The system must support multiple countries, degree levels, intakes, application routes, and external application portals. The initial supported country scope is Germany, Italy, France, the Netherlands, the United Kingdom, the United States, Australia, Sweden, Finland, Hungary, Romania, and the Czech Republic. Country-specific rules must be configurable and must not be hardcoded into application logic. The country list must be extendable by administrators.

## 2. Product Goals

1. Replace scattered student onboarding and application records with a centralized system.
2. Reduce manual data collection and repeated communication between students, counselors, and administrators.
3. Allow counselors to identify relevant programs using structured student profiles and program requirements.
4. Give counselors final authority over which programs are shortlisted and which applications are pursued.
5. Give students reliable, current visibility into their university shortlists, application statuses, required actions, and deadlines.
6. Give administrators oversight of student assignments, counselor workloads, program data, application progress, and operational performance.
7. Maintain an auditable history of important actions, changes, communications, and application events.
8. Build a reusable country-wise program database that can be maintained and expanded over time.
9. Reduce the risk of missed deadlines, missing documents, outdated program requirements, and duplicated applications.
10. Establish a foundation for future integrations and workflow automation without depending on unsupported automation of third-party university portals.

## 3. Non-Goals and Boundaries

The initial release is an internal student and application management platform. The following are not required unless explicitly added in a later phase:

- Replacing university portals, Uni-Assist, or other third-party application systems.
- Guaranteeing admission, visa approval, scholarship awards, or eligibility outcomes.
- Automatically submitting applications to every university portal. Many portals do not provide supported APIs, and some require manual actions, identity verification, payment, or student consent.
- Automatically making final admission or program-selection decisions. Counselors must review and approve recommendations.
- Processing or holding student payments unless a payment integration is separately specified.
- Acting as a complete accounting, payroll, HR, or CRM replacement.
- Providing legal, immigration, or visa advice as an automated decision.
- Scraping or copying third-party program information in violation of a source website's terms or technical restrictions.
- Treating an estimated eligibility match as an admission guarantee.

## 4. Users and Roles

The platform must support exactly three primary internal role-based portals within one unified application: the Admin Portal, Counselor Portal, and Student Portal. These are role-specific workspaces, not separate applications or deployments. External university, centralized application, and document-evaluation portals are third-party services and must only be recorded or integrated where officially supported. Permissions must be enforced on the server and must not rely only on hiding controls in the client.

### 4.1 Student

A student is a customer who has purchased a Scholars Avenue consultancy package and is receiving assistance with one or more study applications.

A student can:

- Register and sign in securely.
- Complete and update their own profile, subject to fields that require counselor or administrator verification.
- Enter academic history, qualifications, grades, language-test results, and study preferences.
- Upload, view, replace, and download their own permitted documents.
- View their assigned counselor and relevant contact information.
- View programs shortlisted or shared with them.
- View each application, its current status, its history, relevant dates, and pending actions.
- View a consolidated timeline of their consultancy and application progress.
- Receive and respond to document requests and counselor messages.
- Send messages and submit questions within the platform.
- Receive notifications about new messages, missing information, deadlines, and status changes.
- View student-visible notes and instructions.
- Acknowledge, confirm, or provide information when a workflow requires their action.

A student must not:

- View another student's records, files, messages, or applications.
- Change counselor-only application statuses or internal notes.
- Access internal administrative data, counselor performance data, or internal-only discussions.
- Modify verified records without an auditable change process.

### 4.2 Counselor

A counselor is an employee responsible for managing assigned students and assisting them with program selection and applications.

A counselor can:

- View the students assigned to them.
- View the profiles and permitted documents of their assigned students.
- Identify missing, incomplete, expired, or unverified profile information.
- Request additional information or documents from a student.
- Review program database records and filter programs using student preferences and eligibility criteria.
- View program requirement details and the source/verification information supporting those requirements.
- Add programs to a student's shortlist, remove them from the shortlist, and record the reason for selection or rejection.
- Mark a program as discussed with the student and record the student's decision.
- Create and manage an application record for a shortlisted program.
- Track application stages, submission dates, portal references, fees, decisions, and next actions.
- Record whether an application is being handled through Uni-Assist, a university portal, an external application service, email, or another defined route.
- Upload application-related documents and evidence where permitted.
- Communicate with the student and maintain internal notes.
- View their own workload and application deadlines.
- Request reassignment or administrative assistance where applicable.

A counselor must not:

- View or modify students assigned to another counselor unless an administrator grants temporary access or the counselor is explicitly part of a shared case.
- Change system-wide roles, country settings, or global program records unless granted a specific permission.
- Permanently delete audit records, messages, submitted applications, or student documents.
- Mark an application as submitted without recording the relevant submission evidence or reason why evidence is unavailable.

### 4.3 Administrator

An administrator supervises the overall Scholars Avenue operation.

An administrator can:

- View and manage all students, counselors, and administrators within the organization, subject to their assigned administrative scope.
- Create, invite, deactivate, reactivate, and manage user accounts.
- Assign and reassign students to counselors.
- View counselor workloads and assignment counts.
- View all student profiles, documents, shortlists, applications, timelines, and communication records according to permissions.
- Create, update, archive, import, export, and maintain countries, cities, universities, faculties/departments, programs, intakes, and application requirement data.
- Review and approve program data changes where an approval workflow is enabled.
- Configure supported countries, degree levels, languages, application routes, status values, package types, and organization-wide settings.
- Monitor pending actions, overdue tasks, approaching deadlines, delayed applications, and missing information.
- Review operational reports and export permitted data.
- View audit logs and the history of important changes.
- Correct data errors while preserving the previous values in the audit history.
- Configure notification templates and workflow rules where supported.

Administrative access must be permission-based. A user with a limited administrative role must not automatically receive every possible permission.

### 4.4 Role and Permission Principles

- Every authenticated account must have an explicit role and active/inactive state.
- A user may have only one primary role in the initial release. The permission model should allow additional permissions or role expansion later.
- All authorization checks must be enforced by server-side logic.
- Records must be scoped to the user's organization. The initial deployment may contain one organization, but organization scoping should not be impossible to add later.
- Sensitive actions must be recorded in the audit log.
- Deactivated users must lose access immediately, while their historical actions and records remain preserved.

## 5. Core Business Concepts

### 5.1 Student Case

A student case represents the consultancy relationship for a particular student and service package. A student may have one active case initially, but the model should support multiple cases or packages over time.

A case should contain:

- Student reference.
- Package or service type.
- Target country or countries.
- Degree level or levels.
- Intended intake or admission period.
- Case creation date.
- Payment/activation state, if payment status is recorded in this system.
- Assigned counselor.
- Case status.
- Internal notes.
- Student-visible overview.
- Relevant milestones and deadlines.

### 5.2 Program

A program is a specific academic offering at a university, such as an MSc in Artificial Intelligence at a particular campus. A university may offer multiple programs, and a program may have different requirements or deadlines for different intakes.

A program must not be represented only by a free-text university name and course title. It should have a structured record linked to its university, location, degree level, requirements, intake, and application route.

### 5.3 Shortlist

A shortlist is the set of programs a counselor has considered for a particular student. The shortlist is student-specific and must preserve the counselor's decision history.

A program in a shortlist is not automatically an active application.

### 5.4 Application

An application represents the student's attempt to apply to one specific program for one specific intake. If the student applies to two programs at the same university, each program must have a separate application record. If a student applies to the same program for a different intake, it must be a separate application record.

### 5.5 Deadline

A deadline is a date/time or date range associated with a program intake, application step, document request, student action, or internal task. Deadlines must store a timezone or a clearly defined date-only value where time is not relevant.

### 5.6 Document

A document is a file or file reference associated with a student, case, application, or program workflow. The system must preserve document metadata, access permissions, version history, and upload history.

## 6. Main End-to-End Workflow

### 6.1 Package Purchase and Student Account Activation

1. A student purchases a Scholars Avenue package through the existing business process.
2. An authorized employee creates or activates the student's account, or the student receives an invitation to register.
3. The system associates the student with the relevant package/case.
4. The package activation date and available service scope are recorded.
5. The student receives an onboarding notification with instructions to complete their profile and upload required documents.
6. The case remains in an onboarding or information-pending state until required information is provided or an authorized employee records an exception.

The initial release may allow administrators or authorized employees to mark a package as paid/activated manually. Payment gateway integration is not a prerequisite.

### 6.2 Student Profile Completion

1. The student signs in.
2. The student completes personal, contact, academic, language, and study-preference information.
3. The student uploads the requested documents.
4. The system validates mandatory fields, formats, and file constraints.
5. The system indicates which sections or requested documents remain incomplete.
6. The counselor reviews the information and marks relevant fields or documents as verified, rejected, or requiring correction.
7. The system records who reviewed the information and when.
8. Changes to verified information must be visible in the history and may require re-verification.

### 6.3 Counselor Assignment

1. An administrator views the unassigned student queue.
2. The administrator selects a student and an active counselor.
3. The administrator assigns the student to the counselor.
4. The system records the assignment date, assigning administrator, and counselor.
5. The student and counselor receive a notification.
6. The student appears in the counselor's assigned-student list.
7. On reassignment, the system preserves the previous assignment history and transfers active case responsibility according to the reassignment rules.

### 6.4 Program Discovery and Eligibility Review

1. The counselor opens an assigned student's profile.
2. The counselor reviews academic qualifications, CGPA, grading scale, English-language results, country preferences, degree level, subject interests, intake, budget, and other relevant constraints.
3. The counselor searches or filters the program bank.
4. The system may display calculated matches based on structured requirements, but must distinguish a potential match from confirmed eligibility.
5. The counselor reviews the official requirements and program source information.
6. The counselor shortlists appropriate programs and records reasons, concerns, or conditions.
7. The counselor can mark a program as not suitable and record the reason.
8. The student can view programs that have been shared with them, including the relevant details and counselor notes intended for the student.
9. The counselor records the student's interest, approval, or rejection when that decision is received.

### 6.5 Application Creation and Progress Tracking

1. The counselor creates an application from an approved or selected shortlist entry.
2. The system creates a separate application record linked to the student, case, university, program, and intake.
3. The counselor records the application route and the external portal or service used.
4. The counselor prepares and tracks the requirements for that application.
5. The system displays application-specific missing documents and tasks.
6. The counselor performs the required work on the external portal or supported integration.
7. The counselor records each meaningful application status change.
8. The counselor adds dates, references, notes, fees, and evidence where applicable.
9. The student receives updates for student-visible milestones.
10. The application continues until a terminal outcome is recorded, such as admission, rejection, withdrawal, or closure.

### 6.6 Ongoing Communication and Deadline Management

1. A student or counselor can send a message within the relevant case or application context.
2. Counselors can send structured document requests and action requests.
3. The system creates or updates tasks and deadlines for requests that require action.
4. Students receive notifications when a new request or important update is available.
5. Counselors and administrators see overdue and approaching tasks.
6. Every important status and deadline change is reflected in the student's timeline.

## 7. Functional Requirements

Priority definitions:

- **P0:** Required for the initial usable release.
- **P1:** Important for the first operational release, but can follow core workflows.
- **P2:** Valuable enhancement for a later release.

### 7.1 Authentication and Account Management

| ID | Priority | Requirement |
|---|---|---|
| AUTH-001 | P0 | The system must support secure sign-in for students, counselors, and administrators. |
| AUTH-002 | P0 | The system must enforce role-based authorization on every protected server operation. |
| AUTH-003 | P0 | Administrators must be able to invite or create student and employee accounts. |
| AUTH-004 | P0 | The system must support account activation, deactivation, and reactivation without deleting historical records. |
| AUTH-005 | P0 | Users must be able to securely sign out. |
| AUTH-006 | P0 | Passwords must never be stored in plaintext. Use a secure authentication solution or password hashing mechanism. |
| AUTH-007 | P1 | The system should support password reset through a verified email flow. |
| AUTH-008 | P1 | The system should support email verification for accounts that use email-based authentication. |
| AUTH-009 | P1 | The system should support session expiration and revocation. |
| AUTH-010 | P2 | The system may support multi-factor authentication, preferably for employee and administrator accounts. |
| AUTH-011 | P1 | The system must prevent duplicate accounts based on configured unique identifiers, such as email address. |
| AUTH-012 | P1 | Administrators must be able to view a user's account state and relevant account activity. |

### 7.2 Student Intake and Profile

| ID | Priority | Requirement |
|---|---|---|
| STU-001 | P0 | A student must be able to create or access an account through an authorized invitation or registration process. |
| STU-002 | P0 | A student must be able to save an incomplete profile and continue later. |
| STU-003 | P0 | The system must maintain personal and contact information. |
| STU-004 | P0 | The system must maintain academic qualifications and academic history. |
| STU-005 | P0 | The system must maintain language-test details and relevant score components. |
| STU-006 | P0 | The system must maintain study preferences, including target countries, degree level, subject area, intended intake, and preferred study mode where relevant. |
| STU-007 | P0 | The system must indicate profile completion and missing required information. |
| STU-008 | P0 | Counselors must be able to review student information and request corrections. |
| STU-009 | P0 | The system must maintain an audit/history of changes to important profile fields. |
| STU-010 | P1 | Students should be able to maintain multiple academic qualifications, language tests, and prior education records. |
| STU-011 | P1 | The system should support additional academic information such as backlogs, repeated courses, gaps, thesis/project information, work experience, and relevant certifications. |
| STU-012 | P1 | Students should be able to select preferred cities, regions, tuition ranges, scholarship interest, and other constraints. |
| STU-013 | P1 | Counselors should be able to flag profile information as verified, unverified, or requiring correction. |
| STU-014 | P1 | The system should retain previous values when a student edits a field that was previously verified. |
| STU-015 | P2 | The system may support configurable intake forms based on country, package, or degree level. |

#### 7.2.1 Personal Information Fields

The student profile should support the following fields where applicable:

- Full legal name.
- Preferred name, optional.
- Date of birth.
- Nationality and country of residence.
- City of residence.
- Email address.
- Primary phone number, including country code.
- Secondary phone number, optional.
- Current address, optional where not needed.
- Passport details, only where required for the application workflow.
- Emergency contact, optional and access-restricted.
- Profile photo, optional.
- Preferred communication language, if required.

Sensitive fields such as passport number, date of birth, and identity documents must have restricted access and must not be exposed in unnecessary views or exports.

#### 7.2.2 Academic Information Fields

The system must support multiple academic records. Each academic record should include, as applicable:

- Qualification level, for example, Higher Secondary, Bachelor's, Master's, or PhD.
- Qualification/title and major/discipline.
- Institution name.
- Institution country and city.
- Start date and completion date, or expected completion date.
- Study mode, where relevant.
- Total duration, where known.
- CGPA or grade.
- Maximum CGPA/grade scale.
- Percentage, if officially available.
- Class/rank, if officially available.
- Total credits and completed credits, if applicable.
- Thesis or final-year project title and summary, optional.
- Backlogs, failed courses, repeats, or academic gaps, where relevant.
- Graduation/award status.
- Transcript and degree certificate document references.
- Verification status and verification notes.

The system must never assume that a CGPA is out of 4.0. The obtained grade and maximum grading scale must be stored separately.

#### 7.2.3 Language-Test Information Fields

The system must support multiple language-test records. Each record should include:

- Test type, for example IELTS Academic, IELTS General, TOEFL iBT, PTE Academic, Cambridge English, Duolingo English Test, or another configurable test.
- Test date.
- Overall score.
- Individual component scores where applicable, for example Listening, Reading, Writing, Speaking.
- Maximum score or scale where relevant.
- Test report/reference number, optional and access-restricted.
- Test validity/expiry date, if applicable.
- Test result document.
- Verification status.

The system must preserve exact scores and must not convert or equate different English tests unless an explicitly configured and source-backed equivalence is available. A counselor must be able to see whether a test is expired or will expire before the relevant application date.

#### 7.2.4 Other Test and Qualification Records

The system should support additional test records, where relevant:

- GRE, GMAT, SAT, ACT, TestAS, or country-specific tests.
- German language test and proficiency level, including CEFR level where applicable.
- Other language tests and professional qualifications.
- Date, score, component score, validity, report/reference number, document, and verification status.

### 7.3 Student Documents and File Management

| ID | Priority | Requirement |
|---|---|---|
| DOC-001 | P0 | Students must be able to upload documents to their own profile or case. |
| DOC-002 | P0 | Counselors must be able to view documents belonging to their assigned students. |
| DOC-003 | P0 | Administrators must be able to access documents according to their permissions. |
| DOC-004 | P0 | The system must store document metadata, including filename, file type, file size, upload time, uploader, owner, and association. |
| DOC-005 | P0 | The system must validate permitted file types and maximum file sizes. |
| DOC-006 | P0 | Private documents must not be accessible through public or guessable URLs. |
| DOC-007 | P0 | The system must allow authorized employees to mark a document as received, under review, verified, rejected, expired, or replacement required. |
| DOC-008 | P0 | The system must allow employees to provide a reason when rejecting a document or requesting a replacement. |
| DOC-009 | P0 | The system must preserve previous versions when a document is replaced, subject to retention policy. |
| DOC-010 | P1 | The system should support document categories and configurable document checklists. |
| DOC-011 | P1 | The system should support document requests linked to a specific student, case, or application. |
| DOC-012 | P1 | The system should support secure download of authorized files. |
| DOC-013 | P1 | The system should support preview for common document formats where safe and technically supported. |
| DOC-014 | P1 | The system should support expiry dates for documents that can expire. |
| DOC-015 | P2 | The system may support automatic document text extraction or OCR, with human verification before extracted information is treated as authoritative. |

Suggested document categories include:

- Passport or national identity document.
- CV/resume.
- Matriculation/secondary certificate and transcript.
- Higher secondary certificate and transcript.
- Bachelor's degree certificate and transcript.
- Master's degree certificate and transcript.
- English-language test report.
- German-language certificate or other language certificate.
- Motivation letter or statement of purpose.
- Recommendation letters.
- Experience letters.
- Internship certificates.
- Research/publication evidence.
- Portfolio or project evidence.
- Financial documents, only where relevant and access-restricted.
- University-specific forms and application confirmations.
- Other configurable documents.

A document may be associated with a student generally and reused in multiple applications. The system must still allow an application-specific copy, snapshot, or reference so the team can identify exactly which version was used for a particular submission.

### 7.4 Student Case and Package Management

| ID | Priority | Requirement |
|---|---|---|
| CASE-001 | P0 | The system must maintain a student case linked to a student and service package. |
| CASE-002 | P0 | The system must record package name/type, activation date, and case status. |
| CASE-003 | P0 | Administrators must be able to activate, pause, close, or reopen a case with a reason. |
| CASE-004 | P0 | The system must link a case to an assigned counselor. |
| CASE-005 | P1 | The system should support package-specific country, degree, application-count, or service-scope limits. |
| CASE-006 | P1 | The system should record payment status or payment confirmation metadata if the business chooses to manage it in this platform. |
| CASE-007 | P1 | The system should support internal case notes and student-visible case notes separately. |
| CASE-008 | P1 | The system should support case milestones and a consolidated case timeline. |
| CASE-009 | P2 | The system may support multiple active cases for one student, including separate countries or future admission cycles. |

### 7.5 Counselor Assignment and Workload Management

| ID | Priority | Requirement |
|---|---|---|
| ASN-001 | P0 | Administrators must be able to assign an unassigned student case to an active counselor. |
| ASN-002 | P0 | Administrators must be able to reassign a case to another counselor. |
| ASN-003 | P0 | Every assignment and reassignment must be recorded with actor, timestamp, previous counselor, new counselor, and reason where provided. |
| ASN-004 | P0 | Counselors must only see their assigned cases unless explicitly granted shared access. |
| ASN-005 | P0 | Administrators must be able to see the number of active and unassigned students per counselor. |
| ASN-006 | P1 | Administrators should be able to filter assignments by counselor, country, package, case status, and date. |
| ASN-007 | P1 | The system should warn administrators when assigning a case to a counselor whose active workload exceeds a configurable threshold. |
| ASN-008 | P1 | The system should support a temporary counselor absence or inactive state and identify cases requiring reassignment. |
| ASN-009 | P2 | The system may suggest a counselor based on workload, country expertise, language, or other configurable criteria. Suggestions must not replace administrator approval. |

### 7.6 Country, City, University, and Program Database

The program database is a core system capability. It must be structured, searchable, maintainable, and source-backed. The initial supported country scope is Germany, Italy, France, the Netherlands, the United Kingdom, the United States, Australia, Sweden, Finland, Hungary, Romania, and the Czech Republic. All country-specific requirements must be configurable, independently maintained, and expandable to additional countries.

| ID | Priority | Requirement |
|---|---|---|
| PRG-001 | P0 | Administrators must be able to create and update country records. |
| PRG-002 | P0 | Administrators must be able to create and update city/location records. |
| PRG-003 | P0 | Administrators must be able to create and update university records. |
| PRG-004 | P0 | Administrators must be able to create and update program records linked to universities. |
| PRG-005 | P0 | Each program must have a degree level, study subject/field, language of instruction, and location. |
| PRG-006 | P0 | Each program must support structured admission requirements and application details. |
| PRG-007 | P0 | Each program or intake must support one or more application deadlines. |
| PRG-008 | P0 | Each program must support an official source URL and last-verified metadata for important requirements. |
| PRG-009 | P0 | Counselors must be able to search and filter the program database. |
| PRG-010 | P0 | Administrators must be able to archive outdated programs without deleting their historical links to student applications. |
| PRG-011 | P1 | Administrators should be able to import and export program data in a documented CSV or spreadsheet format. |
| PRG-012 | P1 | The system should support program data review, approval, and verification states. |
| PRG-013 | P1 | The system should support multiple intakes and intake-specific requirements for a single program. |
| PRG-014 | P1 | The system should support multiple campuses or locations for one university. |
| PRG-015 | P1 | The system should identify likely duplicate university and program records during imports. |
| PRG-016 | P1 | The system should track changes to requirements, deadlines, fees, and source URLs over time. |
| PRG-017 | P1 | The system should support tags and categories for subject areas, specializations, and research areas. |
| PRG-018 | P2 | The system may support controlled data collection from permitted sources or official APIs, with source, timestamp, and human review recorded. |

#### 7.6.1 Country Fields

Each country record should support:

- Official country name.
- ISO country code(s).
- Region/continent, optional.
- Default currency.
- Common application periods or intake labels, optional.
- Country-specific grading and qualification notes, optional.
- Country-specific language-test rules, optional.
- Country-specific application process notes, optional.
- Active/archived status.

#### 7.6.1A Initial Country Coverage and Country-Specific Configuration

The program database and counselor search must support these 12 countries from the initial country configuration:

1. Germany
2. Italy
3. France
4. Netherlands
5. United Kingdom
6. United States
7. Australia
8. Sweden
9. Finland
10. Hungary
11. Romania
12. Czech Republic

Country coverage means the system can store, maintain, search, shortlist, and track programs and applications for each country. It does not mean that every university or program in these countries is preloaded, nor that every external application portal is integrated. Program and university records must be added through authorized data entry, imports, or permitted data collection, and must pass the configured verification process before being treated as verified.

For every country, administrators must be able to maintain the following configurable information where applicable:

- Country-specific qualification types and accepted prior education levels.
- Grading systems, grade scales, minimum-grade formats, conversion methods, and explanatory references.
- Language of instruction and accepted language tests, including overall and component score requirements.
- Alternative language evidence and any conditions attached to it.
- Degree levels and country-specific degree naming conventions.
- Intake names, academic-year patterns, application windows, and deadline types.
- Application routes, including direct university applications, centralized/national platforms, university consortia, external application services, and email-based processes.
- External application service or portal names, official URLs, and instructions.
- Document requirements, translation rules, certification/legalization requirements, and accepted file formats, where officially specified.
- Application fees, tuition fees, semester charges, deposits, currencies, and fee effective dates.
- Credit systems, qualification frameworks, prerequisite subject-credit rules, and work-experience requirements where relevant.
- Country-specific tests, entrance assessments, interviews, portfolios, research proposals, or other selection steps.
- Scholarship and funding application routes and deadlines, where maintained.
- Country-specific notes and links to authoritative sources.

The system must not assume that a single rule applies to every institution in a country. University-level and program-level requirements must be able to override or add to country-level defaults. The system must preserve the scope of each rule, such as country-wide guidance, institution-specific policy, program-specific requirement, or intake-specific condition.

Country-specific configuration must follow these rules:

- A country can be active for student preferences and counselor search even if its program catalog is not yet fully populated.
- Administrators can enable or disable a country without deleting its historical student cases, applications, or program records.
- New countries can be added without a code change or database schema redesign for ordinary country configuration.
- Unknown or unverified values must remain explicitly unknown or unverified. The system must not invent requirements or infer that a requirement does not exist.
- Each changing requirement, fee, deadline, or process note must include its source, verification status, last-checked date, and effective intake or period when known.
- Counselors must be able to filter records by country and see warnings for missing, stale, or unverified country/program information.
- Country-level defaults must never silently overwrite a more specific university, program, or intake requirement.

#### 7.6.2 City and Location Fields

Each location record should support:

- City name.
- Country.
- State/province/region, where applicable.
- Optional campus address.
- Postal code, where available.
- Timezone.
- Optional coordinates or map reference.
- General city information useful to students, such as cost-of-living notes, transport notes, accommodation information, climate notes, and student-life notes.
- Source URL and last-verified date for information that can change.

City information must be clearly distinguished from verified university or program requirements. General living-cost information should include an effective date or last-verified date and must not be presented as a guaranteed cost.

#### 7.6.3 University Fields

Each university record should support:

- Official university name.
- Alternative names or abbreviations.
- Country and one or more campus locations.
- University type, where known, such as public or private.
- Official website.
- Official admissions website.
- General contact information, optional.
- Institutional description.
- Relevant rankings, optional, with ranking organization and year if stored.
- Tuition or semester contribution notes, where applicable.
- General application notes.
- Active/archived state.
- Source URLs and last-verified metadata.

Rankings must never be stored as an unexplained number. The source and ranking year must accompany them.

#### 7.6.4 Program Fields

Each program record should support, where applicable:

**Identity and classification**
- Official program name.
- Alternative name or abbreviation.
- Linked university.
- Linked campus/location.
- Country.
- Faculty, school, or department.
- Degree level, such as Bachelor's, Master's, PhD, or other configurable level.
- Degree title, such as BSc, MSc, MA, MEng, or PhD.
- Subject area and specialization tags.
- Program description.
- Study mode, such as full-time or part-time.
- Attendance mode, such as on-campus, online, or hybrid.
- Standard duration and duration unit.
- Total credits and credit system, where available.
- Language(s) of instruction.

**Academic admission requirements**
- Required previous qualification.
- Accepted disciplines or subject backgrounds.
- Required subject credits or prerequisite courses, if applicable.
- Minimum CGPA or grade.
- Maximum/scale for the minimum grade requirement.
- Minimum percentage, if applicable.
- Grade conversion or country-specific assessment notes.
- Required work experience, if applicable.
- Research proposal, thesis, or portfolio requirement, if applicable.
- Additional tests such as GRE, GMAT, or country-specific tests.
- Whether applicants from different academic backgrounds can be considered.
- Any explicit exclusions or special conditions.

**Language requirements**
- Accepted language tests.
- Minimum overall score for each accepted test.
- Minimum component scores for each accepted test.
- Accepted alternative proof, such as a prior degree taught in English, if officially permitted.
- Minimum language proficiency for other required languages.
- Validity rules or test-date restrictions, if stated by the university.

**Application and intake information**
- Intake name or semester.
- Intake year.
- Application opening date, where published.
- Application deadline.
- Deadline type, for example, university deadline, Uni-Assist deadline, scholarship deadline, or document deadline.
- Whether the deadline is fixed, rolling, or not published.
- Application route, such as Uni-Assist, direct university portal, centralized portal, email, or another route.
- Application portal URL.
- Required application steps.
- Whether a preliminary document review or VPD is required, where relevant.
- Whether an aptitude assessment, entrance test, interview, or selection process is required.
- Whether admission is restricted or unrestricted, if officially stated.
- Application fee and currency, if applicable.
- Semester contribution or tuition fee and currency, where relevant.

**Additional information**
- Scholarship availability or scholarship links, where verified.
- Accommodation or campus notes, if known.
- Program-specific notes for counselors.
- Student-visible notes.
- Official program page URL.
- Official admission requirements URL.
- Additional authoritative source URLs.
- Last checked date.
- Checked by user/employee.
- Verification status.
- Record status: draft, pending review, verified, outdated, archived.

The system must allow unknown values to remain unknown. It must not silently convert an unknown requirement into a zero, false, unrestricted, or no-requirement value.

#### 7.6.5 Intake-Specific Requirements

Admission requirements and deadlines may change between intakes. The data model must allow intake-specific values instead of assuming that one program has identical requirements every year.

For example, a program's minimum English score, application deadline, tuition amount, or application route may change for a later intake. The historical application must retain the requirement snapshot that was relevant when the counselor evaluated or submitted that application.

#### 7.6.6 Program Data Quality and Verification

- Every important program record must indicate whether its requirements have been verified.
- Important fields should have source URLs and last-checked dates.
- The system must make outdated or unverified program information visible to counselors.
- Administrators must be able to mark records as requiring review.
- The system should support a configurable review interval for time-sensitive information.
- Imported data must not automatically become verified.
- The system must preserve the source and import batch for imported records.
- Conflicting source information must be flagged for human review rather than silently resolved.
- Official university and application portal sources should take precedence over third-party summaries.

### 7.7 Program Search, Filtering, and Eligibility Matching

| ID | Priority | Requirement |
|---|---|---|
| MAT-001 | P0 | Counselors must be able to search programs by country, university, program title, degree level, subject, and intake. |
| MAT-002 | P0 | Counselors must be able to filter programs by language of instruction, location, application route, deadline, and verification state. |
| MAT-003 | P0 | Counselors must be able to compare a student's profile with structured program requirements. |
| MAT-004 | P0 | The system must distinguish between confirmed matches, possible matches requiring review, and known mismatches. |
| MAT-005 | P0 | The system must show the reason for each eligibility warning or mismatch. |
| MAT-006 | P0 | The counselor must be able to override or accept a potential match with a recorded reason. |
| MAT-007 | P0 | The system must not automatically reject a program solely because data is missing or unverified. |
| MAT-008 | P1 | The system should rank or sort matching programs using configurable criteria. |
| MAT-009 | P1 | The system should support filters for budget, tuition, public/private status, scholarship interest, and preferred cities. |
| MAT-010 | P1 | The system should flag expiring language tests or documents that may not remain valid by the application deadline. |
| MAT-011 | P1 | The system should compare individual language-test component scores, not only overall scores. |
| MAT-012 | P1 | The system should support country-specific grade conversion as an informational aid, with the formula/source displayed and no unsupported equivalence presented as official. |
| MAT-013 | P2 | The system may provide configurable recommendation scoring based on counselor-approved weights. |
| MAT-014 | P2 | The system may use AI to summarize program fit or extract requirements, but every extracted or generated claim must be traceable to sources and reviewed by a human before being treated as verified. |

#### 7.7.1 Matching Logic Principles

The matching engine must use transparent rules. At minimum, it should evaluate:

- Degree-level compatibility.
- Previous qualification and accepted academic background.
- CGPA/grade against the program's stated scale and minimum.
- Relevant prerequisite subjects or required credits, where recorded.
- Accepted English-language test type.
- Overall English score.
- Individual English component minimums.
- Test validity at the relevant application date, where applicable.
- Other required tests or language qualifications.
- Intake availability and deadline state.
- Country, location, delivery mode, and student preferences.
- Budget and tuition constraints, when reliable data is available.
- Program record verification and data freshness.

Each criterion should return one of the following states:

- Meets requirement.
- Does not meet requirement.
- Needs counselor review.
- Unknown because student data is missing.
- Unknown because program data is missing or unverified.
- Not applicable.

The overall match must explain the individual criterion results. A simple percentage match may be offered later, but it must not hide hard eligibility failures or missing information.

The matching engine must not:

- Assume a student's CGPA scale without explicit data.
- Compare a 3.0/4.0 result with a 3.0/5.0 requirement as if the scales were the same.
- Assume English-medium education satisfies a language requirement unless the program's official rules allow it.
- Treat a program as open merely because no deadline is stored.
- Present a potential match as guaranteed admission.
- Convert incomplete program data into a positive eligibility result.

### 7.8 Student Shortlisting

| ID | Priority | Requirement |
|---|---|---|
| SHL-001 | P0 | Counselors must be able to add a program from the program bank to a student's shortlist. |
| SHL-002 | P0 | Each shortlist entry must be associated with a student/case and a specific program/intake. |
| SHL-003 | P0 | Counselors must be able to record a selection reason and relevant eligibility notes. |
| SHL-004 | P0 | Counselors must be able to mark a shortlist entry as proposed, shared, under discussion, approved by student, rejected by student, unsuitable, or converted to application. |
| SHL-005 | P0 | Students must only see shortlist entries that have been shared with them. |
| SHL-006 | P0 | Counselors must be able to record student feedback and decisions. |
| SHL-007 | P1 | The system should support comparing shortlisted programs for the same student. |
| SHL-008 | P1 | The system should support counselor-only notes and student-visible notes on each shortlist entry. |
| SHL-009 | P1 | The system should preserve the history of shortlist status changes and removal reasons. |
| SHL-010 | P1 | The system should prevent accidental duplicate shortlist entries for the same student, program, and intake, while allowing an explicitly justified duplicate where required. |

### 7.9 Application Management

| ID | Priority | Requirement |
|---|---|---|
| APP-001 | P0 | A counselor must be able to create an application from a shortlisted program. |
| APP-002 | P0 | Each application must be linked to one student, one case, one program, and one intake. |
| APP-003 | P0 | The system must support different application routes, including Uni-Assist and direct university portals. |
| APP-004 | P0 | The application must have a configurable status and a complete status history. |
| APP-005 | P0 | The counselor must be able to record the external portal URL and reference/application number. |
| APP-006 | P0 | The counselor must be able to record application start date, submission date, and relevant decision dates. |
| APP-007 | P0 | The counselor must be able to record application fees, payment state, and payment evidence where applicable. |
| APP-008 | P0 | The system must support application-specific document requirements and task tracking. |
| APP-009 | P0 | The student must be able to see the student-visible application status and timeline. |
| APP-010 | P0 | The counselor must be able to record notes and next actions for an application. |
| APP-011 | P0 | The system must support admission, rejection, withdrawal, and closure outcomes. |
| APP-012 | P1 | The system should support multiple submissions or resubmission events when a portal permits corrections. |
| APP-013 | P1 | The system should support admission conditions and related follow-up tasks. |
| APP-014 | P1 | The system should support offer acceptance or decline tracking. |
| APP-015 | P1 | The system should support waiting-list, interview, entrance-test, and additional-document stages. |
| APP-016 | P1 | The system should support an application history export or student case summary. |
| APP-017 | P1 | The system should support configurable application statuses by country or application route while preserving common reporting categories. |
| APP-018 | P2 | The system may support official APIs or permitted integrations to synchronize application status. |

#### 7.9.1 Suggested Application Statuses

The system must allow administrators to configure statuses. The initial default status set should include:

1. Planned.
2. Requirements being reviewed.
3. Documents pending from student.
4. Documents under review.
5. Documents ready.
6. Application preparation in progress.
7. Application awaiting student confirmation.
8. Ready for submission.
9. Submitted.
10. Submission confirmation pending.
11. Under university review.
12. Additional documents requested.
13. Interview or assessment scheduled.
14. Interview or assessment completed.
15. Waitlisted.
16. Offer received.
17. Conditional offer received.
18. Offer accepted.
19. Offer declined.
20. Rejected.
21. Withdrawn.
22. Closed.

These statuses are defaults, not a mandatory linear sequence. The platform must permit valid transitions based on configured workflow rules. Every transition must record the actor, timestamp, previous status, new status, and optional reason.

The student-facing description may be simpler than the internal status. The system must support separate internal and student-visible status labels where necessary.

#### 7.9.2 Application Route Details

For each application, the system should be able to record:

- Route type: Uni-Assist, direct university portal, centralized portal, email, external service, or other.
- Portal/service name.
- Portal URL.
- External application ID/reference.
- Account ownership or responsibility note, without storing third-party passwords in plaintext.
- Required verification steps.
- Fee amount and currency.
- Fee payer and payment state, if tracked.
- Submission confirmation/reference.
- Confirmation document or screenshot, where permitted.
- Date submitted.
- Next expected response date, if known.
- Portal-specific notes.

The platform must not store third-party portal passwords or ask counselors to place them in ordinary notes. If a future integration needs credentials, it must use a dedicated secure secrets mechanism and explicit security review.

### 7.10 Tasks, Deadlines, and Timeline

| ID | Priority | Requirement |
|---|---|---|
| TSK-001 | P0 | The system must support tasks linked to a student, case, application, document request, or internal operation. |
| TSK-002 | P0 | A task must have a title, description, owner, status, due date, priority, and related record. |
| TSK-003 | P0 | The system must support internal and student-action tasks. |
| TSK-004 | P0 | Counselors must be able to create tasks for themselves or request actions from students. |
| TSK-005 | P0 | Students must be able to see and complete tasks assigned to them. |
| TSK-006 | P0 | The system must identify overdue and approaching deadlines. |
| TSK-007 | P0 | The system must display an ordered timeline of important case and application events. |
| TSK-008 | P1 | The system should support recurring reminders before a deadline. |
| TSK-009 | P1 | The system should support task comments and completion evidence. |
| TSK-010 | P1 | Administrators should be able to see overdue tasks across the organization. |
| TSK-011 | P1 | The system should support deadline categories, such as university application, scholarship, document, payment, test booking, and internal review. |
| TSK-012 | P1 | The system should support date-only deadlines and timezone-aware date/time deadlines. |
| TSK-013 | P1 | The system should allow a deadline to be updated while preserving its previous value and change reason. |
| TSK-014 | P2 | The system may support calendar export or calendar integrations. |

#### 7.10.1 Timeline Events

The timeline should include, where relevant:

- Case created or activated.
- Counselor assigned or reassigned.
- Profile section completed or updated.
- Document uploaded, replaced, reviewed, or rejected.
- Program shortlisted or shared.
- Student approved or rejected a program.
- Application created.
- Application status changed.
- Application submitted.
- Application fee recorded.
- University requested additional documents.
- Interview or assessment scheduled/completed.
- Offer, rejection, withdrawal, or closure recorded.
- Task created, due, completed, or overdue.
- Important message or student acknowledgement.

Timeline visibility must respect the distinction between internal-only and student-visible events.

### 7.11 Messaging and Communication

| ID | Priority | Requirement |
|---|---|---|
| MSG-001 | P0 | The platform must provide case-linked messaging between students and their assigned counselors. |
| MSG-002 | P0 | Counselors must be able to send messages to their assigned students. |
| MSG-003 | P0 | Students must be able to respond to their counselor. |
| MSG-004 | P0 | The system must support separate internal notes that are not visible to students. |
| MSG-005 | P0 | Messages must record sender, recipient/case context, timestamp, and read state where supported. |
| MSG-006 | P0 | The system must support attaching permitted documents or linking existing documents to messages. |
| MSG-007 | P1 | The system should support messages associated with a specific application or task. |
| MSG-008 | P1 | The system should support message search within an authorized case. |
| MSG-009 | P1 | The system should support notification delivery for unread messages. |
| MSG-010 | P1 | The system should support employee-only internal discussions or notes linked to a case. |
| MSG-011 | P2 | The system may support approved external notification channels such as email or WhatsApp Business API, subject to consent, provider availability, and compliance review. |

The platform's in-app communication record should be the authoritative record for operational decisions. External messages must not be assumed to be synchronized unless a supported integration is implemented.

Internal notes must be visibly and technically separate from student-visible messages. A student must never receive an internal note through a notification, API response, export, or accidental rendering.

### 7.12 Notifications and Reminders

| ID | Priority | Requirement |
|---|---|---|
| NOT-001 | P0 | The system must show in-app notifications for important events. |
| NOT-002 | P0 | Students must be notified about document requests, new student-visible messages, shortlist updates, application status changes, and important deadlines. |
| NOT-003 | P0 | Counselors must be notified about new assignments, student responses, uploaded documents, and approaching application deadlines. |
| NOT-004 | P0 | Administrators must be notified about configured operational issues, such as unassigned cases or overdue critical tasks. |
| NOT-005 | P1 | The system should support email notifications for selected important events. |
| NOT-006 | P1 | Users should be able to manage non-critical notification preferences. |
| NOT-007 | P1 | The system should support configurable reminder intervals, such as 30 days, 14 days, 7 days, 3 days, and 1 day before a deadline. |
| NOT-008 | P1 | The system should avoid repeatedly sending duplicate notifications for the same event. |
| NOT-009 | P1 | Notifications must link only to records the recipient is authorized to access. |
| NOT-010 | P2 | The system may support WhatsApp Business notifications or other external messaging providers. |

Notification delivery failure must not silently change the underlying application or task status. Delivery state should be recorded where the provider makes it available.

### 7.13 Administrative Operations and Oversight

| ID | Priority | Requirement |
|---|---|---|
| ADM-001 | P0 | Administrators must have an organization-wide view of students, cases, counselors, and applications. |
| ADM-002 | P0 | Administrators must be able to filter students by counselor, country, package, case status, and date. |
| ADM-003 | P0 | Administrators must be able to view each counselor's assigned and active student counts. |
| ADM-004 | P0 | Administrators must be able to manage the country, city, university, program, and intake database. |
| ADM-005 | P0 | Administrators must be able to review application progress across counselors and students. |
| ADM-006 | P0 | Administrators must be able to see unassigned students and cases requiring attention. |
| ADM-007 | P1 | Administrators should be able to view approaching and missed deadlines across the organization. |
| ADM-008 | P1 | Administrators should be able to filter applications by country, university, program, intake, route, counselor, and status. |
| ADM-009 | P1 | Administrators should be able to manage configurable lookup values, status labels, package types, and document categories. |
| ADM-010 | P1 | Administrators should be able to export authorized operational reports. |
| ADM-011 | P1 | Administrators should be able to review audit history for a student, case, application, program, or employee. |
| ADM-012 | P1 | Administrators should be able to mark program records as outdated or requiring verification. |
| ADM-013 | P2 | The system may support configurable approval workflows for sensitive data changes or program imports. |

### 7.14 Reporting and Operational Metrics

| ID | Priority | Requirement |
|---|---|---|
| RPT-001 | P0 | The administrator must be able to see counts of total students, active cases, unassigned cases, and active applications. |
| RPT-002 | P0 | The administrator must be able to see student and case counts by counselor. |
| RPT-003 | P1 | The system should report applications by status, country, university, intake, and counselor. |
| RPT-004 | P1 | The system should report overdue tasks and approaching deadlines. |
| RPT-005 | P1 | The system should report profile completion and pending document counts. |
| RPT-006 | P1 | The system should report program database coverage and verification status. |
| RPT-007 | P1 | The system should report application outcomes, including offers and rejections, with date and filter context. |
| RPT-008 | P1 | The system should support export to CSV or spreadsheet for authorized users. |
| RPT-009 | P2 | The system may support conversion metrics such as case activation to first shortlist, shortlist to application, and application to outcome. |
| RPT-010 | P2 | The system may support counselor workload and turnaround-time metrics. |

Reports must define their date range, filters, and calculation logic. Metrics must not imply counselor performance or admission success without proper context. The system should distinguish pending applications from applications with a final outcome.

### 7.15 Search and Filtering

| ID | Priority | Requirement |
|---|---|---|
| SRC-001 | P0 | Authorized users must be able to search students by name and configured identifiers. |
| SRC-002 | P0 | Counselors must be able to search their assigned cases. |
| SRC-003 | P0 | Counselors must be able to search program records using structured filters. |
| SRC-004 | P1 | Administrators should be able to search universities, cities, programs, students, and application references. |
| SRC-005 | P1 | Search results must respect record-level permissions. |
| SRC-006 | P1 | Search must support pagination or another bounded result strategy for large datasets. |

### 7.16 Data Import and Export

| ID | Priority | Requirement |
|---|---|---|
| IMP-001 | P1 | Administrators must be able to import program and university records from a documented CSV or spreadsheet template. |
| IMP-002 | P1 | The import process must validate columns, data types, required fields, duplicate candidates, and linked references before applying changes. |
| IMP-003 | P1 | The system must provide an import preview and error report. |
| IMP-004 | P1 | The system must record the importer, import date, source file, and import batch. |
| IMP-005 | P1 | Imported records must be marked unverified or pending review unless verified through an approved process. |
| IMP-006 | P1 | Administrators must be able to export permitted program data and operational reports. |
| IMP-007 | P1 | Student and application exports must enforce role and privacy permissions. |
| IMP-008 | P2 | The system may support bulk student intake import from an approved template. |

An import must not partially corrupt linked records. The system should validate the complete batch and report which rows can be imported, which rows require correction, and which rows are duplicates or conflicts.

### 7.17 Audit Log and History

| ID | Priority | Requirement |
|---|---|---|
| AUD-001 | P0 | The system must record significant changes to students, cases, assignments, programs, shortlists, applications, and tasks. |
| AUD-002 | P0 | Audit entries must include actor, action, timestamp, affected record, and relevant before/after values where appropriate. |
| AUD-003 | P0 | Users must not be able to edit or delete audit entries through normal application functionality. |
| AUD-004 | P0 | Administrators must be able to review audit history within their authorized scope. |
| AUD-005 | P1 | The system should record authentication and access-related security events. |
| AUD-006 | P1 | The system should support configurable retention rules for audit data, subject to legal and operational requirements. |

## 8. Status Models

The platform must support configurable statuses while maintaining consistent reporting categories.

### 8.1 Student/Case Statuses

Suggested defaults:

- Invited.
- Registration pending.
- Profile incomplete.
- Documents pending.
- Under counselor review.
- Active.
- Waiting for student.
- Waiting for counselor/internal team.
- On hold.
- Completed.
- Cancelled.
- Closed.

### 8.2 Document Statuses

Suggested defaults:

- Not requested.
- Requested.
- Uploaded.
- Under review.
- Verified.
- Rejected.
- Replacement required.
- Expired.
- Not applicable.

### 8.3 Program Record Statuses

Suggested defaults:

- Draft.
- Pending review.
- Verified.
- Needs update.
- Outdated.
- Archived.

### 8.4 Shortlist Statuses

Suggested defaults:

- Proposed internally.
- Shared with student.
- Under discussion.
- Student approved.
- Student declined.
- Unsuitable.
- Application created.
- Removed.

### 8.5 Task Statuses

Suggested defaults:

- Open.
- In progress.
- Waiting for student.
- Waiting for counselor.
- Completed.
- Cancelled.
- Overdue.

Overdue may be a calculated state derived from the due date and task completion state, rather than a manually selected status.

## 9. Conceptual Data Model

The following entities are required conceptually. The implementation may choose different table names, but must preserve the relationships and data integrity.

### 9.1 Identity and Organization

- **User:** authentication identity, email/username, password/auth provider reference, account state, timestamps.
- **Role:** student, counselor, administrator, and future roles.
- **UserRole/Permission:** role assignment and granular permissions, if required.
- **Organization:** tenant or company boundary, even if only one organization is initially deployed.

### 9.2 Student and Case Management

- **StudentProfile:** personal and contact details linked to a user.
- **AcademicRecord:** one or more qualifications for a student.
- **LanguageTest:** one or more language-test records for a student.
- **OtherTest:** other admissions test records.
- **StudentPreference:** desired country, degree, field, intake, budget, and study preferences.
- **StudentCase:** package/case record linked to a student.
- **PackageType:** configurable service package definitions.
- **CounselorAssignment:** assignment history for a case.

### 9.3 Program Catalog

- **Country:** country metadata.
- **City/Location:** city, region, campus location, timezone, and location information.
- **University:** institution metadata.
- **UniversityCampus:** one or more locations associated with a university.
- **Faculty/Department:** optional institutional department.
- **Program:** core academic program identity and classification.
- **ProgramIntake:** intake-specific details and dates.
- **AdmissionRequirement:** structured academic and other admission requirements.
- **LanguageRequirement:** accepted language tests and score requirements.
- **ProgramDeadline:** deadline type, date, timezone/date-only state, and source.
- **ApplicationRoute:** route type and portal information.
- **ProgramFee:** tuition, semester contribution, or application fee with currency and effective period.
- **ProgramSource:** source URL, source type, verification date, and reviewer.
- **ProgramChangeHistory:** prior values and data-change metadata.

### 9.4 Shortlisting and Applications

- **ShortlistEntry:** student/case, program, intake, decision, notes, and history.
- **StudentProgramDecision:** student response to a proposed program, if separated from shortlist history.
- **Application:** one student's application to one program/intake.
- **ApplicationStatusHistory:** status transitions.
- **ApplicationRequirement:** application-specific checklist item.
- **ApplicationEvent:** submission, fee, interview, offer, rejection, and other milestones.
- **ApplicationExternalReference:** external portal and reference details.

### 9.5 Documents and Communication

- **Document:** metadata and secure storage reference.
- **DocumentVersion:** versioned file reference and upload metadata.
- **DocumentReview:** reviewer, status, reason, and timestamp.
- **DocumentRequest:** requested document, requester, recipient, due date, and state.
- **Conversation/Thread:** case or application communication context.
- **Message:** sender, content, visibility, timestamp, and read/delivery metadata.
- **MessageAttachment:** secure link between messages and documents.
- **InternalNote:** private employee-only note, technically separated from student-visible messages.

### 9.6 Tasks, Notifications, and Audit

- **Task:** task owner, type, due date, status, priority, and related entity.
- **TaskEvent:** task history and completion evidence.
- **Notification:** recipient, event, channel, delivery state, and timestamp.
- **AuditLog:** immutable activity history.
- **ImportBatch:** import source, actor, date, outcome, and error report reference.

### 9.7 Data Integrity Requirements

- Use stable IDs for all core entities.
- Use foreign keys or equivalent integrity controls for related records.
- Avoid duplicating university, city, and program identities across student records.
- Store currency as an amount plus currency code, not as an ambiguous formatted string only.
- Store obtained grades separately from grade scales.
- Store date/time values consistently and preserve timezone context where time matters.
- Preserve historical program requirement snapshots used for a shortlist or application.
- Soft archive records where deletion would break history or reporting.
- Enforce uniqueness where appropriate, such as a program intake identifier or a student's application for a particular program/intake, while allowing documented exceptions.

## 10. Privacy, Security, and Access Control

The platform will contain personal, academic, identity, and financial-related information. Security and privacy are core requirements, not optional enhancements.

1. All authenticated traffic must use HTTPS in production.
2. Passwords must be handled by a secure authentication provider or a modern password hashing algorithm.
3. Private files must be stored in private storage, not directly in a public assets directory.
4. File access must use authorization checks and short-lived signed URLs or an equivalent secure access method.
5. All protected API/server actions must enforce permissions and record ownership/assignment scope.
6. Students must only access their own profile, cases, documents, messages, shortlists, tasks, and applications.
7. Counselors must only access assigned cases and explicitly shared cases.
8. Administrators must only access records within their administrative scope.
9. Internal notes must never be exposed to students.
10. Secrets, passwords, API keys, and third-party portal credentials must not be hardcoded or stored in ordinary records.
11. Sensitive data must not be included in application logs, analytics events, or error messages unnecessarily.
12. The platform must validate and safely handle uploaded files, including extension, MIME type, size, and storage permissions. File scanning should be added where operationally available.
13. The platform must protect against common web vulnerabilities, including broken access control, injection, cross-site scripting, cross-site request forgery where applicable, insecure direct object references, and unsafe file upload handling.
14. Sensitive actions such as account deactivation, assignment changes, document deletion/retention actions, and application status overrides must be audited.
15. The system must define a retention and deletion policy consistent with applicable privacy and business requirements.
16. The system must support a process to correct inaccurate student data and record the correction history.
17. Backups must be protected and restoration procedures must be tested.
18. Production errors must not expose stack traces, database details, credentials, or private student data.
19. Access to exports must be permission-controlled and auditable.
20. A student must not be able to enumerate another student's IDs and retrieve their data by changing a URL or request parameter.

## 11. Non-Functional Requirements

### 11.1 Reliability and Data Integrity

- The system must avoid losing saved profile changes, documents, messages, or application events.
- Critical writes should use appropriate database transactions.
- Duplicate form submissions should not unintentionally create duplicate applications, payments, or assignment events.
- Long-running imports should provide a clear completion or failure result.
- The system should provide meaningful error handling and recoverable workflows.

### 11.2 Performance

- Common authenticated operations should respond promptly under normal operational load.
- Student and application lists must use pagination or bounded queries.
- Program filtering must be supported by appropriate indexes and query design.
- Large file uploads must not block unrelated requests.
- Reports should avoid loading entire student or application datasets into memory.
- The platform should be designed to support growth in students, programs, documents, and historical application records.

### 11.3 Availability and Recovery

- Production data must be backed up on a defined schedule.
- The owner must be able to restore the database and document references after an incident.
- Failed notification delivery must not interrupt core record updates.
- External service failures must not make core student records unavailable.
- The platform should expose operational logs and basic health checks for maintainers.

### 11.4 Maintainability

- Business rules such as statuses, package types, and country-specific configuration should be data-driven where practical.
- The application should have clear separation between authentication, authorization, business logic, data access, file storage, and external integrations.
- Database schema changes must be managed through versioned migrations.
- Important matching rules and status transitions must be documented and testable.
- The system must include automated tests for critical workflows and access control.

### 11.5 Accessibility and Usability Requirements

These are functional quality requirements, not visual design specifications:

- Forms must provide understandable validation errors.
- Required and optional fields must be distinguishable.
- Users must not lose entered data because of avoidable navigation or validation failures.
- Critical actions must provide a clear success or failure result.
- Dates must be displayed unambiguously, including the year.
- Status labels must have consistent meanings across student, counselor, and administrator views.
- The platform should support keyboard navigation and accessible form labeling.
- The application should remain usable on common desktop and mobile screen sizes.

## 12. External Services and Integration Requirements

Integrations should be isolated behind service modules so the platform can operate when an external provider is unavailable.

### 12.1 Email

Potential uses:

- Invitation and account verification.
- Password reset.
- Student and counselor notifications.
- Deadline reminders.
- Important application updates.

Email integration is P1. In-app notifications are P0.

### 12.2 WhatsApp

A future WhatsApp Business integration may be used for notification delivery or limited communication convenience. It must not be a dependency for the core workflow.

Requirements for any future WhatsApp integration:

- Use an officially supported provider/API and comply with provider policies.
- Obtain and maintain required student consent.
- Record delivery status where available.
- Do not send sensitive documents or highly sensitive personal information through an insecure or unsupported flow.
- Keep the platform's internal case/application record authoritative.
- Avoid creating duplicate messages or notifications when retries occur.

### 12.3 University Portals and Uni-Assist

- The platform must record portal links, references, application dates, and manually updated statuses.
- Direct automated submission is not assumed.
- Any future portal integration must use an officially supported API or a separately reviewed and permitted integration approach.
- The system must work fully for manual counselor updates.

### 12.4 Payment Providers

Payment processing is not required for the initial release. The platform may record an externally confirmed payment state and reference. A future payment integration must use a supported provider and must not store card details.

### 12.5 File Storage

The system must use a storage mechanism suitable for private student documents. Storage must support access control, versioning or application-managed version history, and backup/retention requirements.

## 13. Data Governance and Operational Rules

1. Official university pages and official application portals are preferred sources for admission requirements and deadlines.
2. Third-party summaries may be recorded as supplemental sources but must not silently override an official source.
3. Program information must show its last verification date.
4. Counselors must be warned when using an outdated or unverified program record.
5. A program requirement change must not rewrite the historical basis of an already-created application.
6. A counselor's eligibility decision must be distinguishable from the system's rule-based match result.
7. Every application must have a responsible counselor or an explicitly configured responsible team.
8. Every active application should have a next action or a clear reason why no next action is currently required.
9. Every student request for a document must have a status and, where applicable, a due date.
10. Students must be told which items require their action and which are being handled internally.
11. A program with an unknown deadline must be labeled as unknown, not open.
12. A program with missing English requirements must be labeled incomplete, not language-unrestricted.
13. Archived records must remain available to authorized users for historical application context.
14. A student's package scope must be checked before creating work that exceeds the agreed service scope, if package limits are configured.
15. Manual corrections to program data must record the editor and the reason where appropriate.

## 14. Acceptance Criteria for the Initial Release

The initial release is not considered operationally complete until all P0 criteria below pass.

### 14.1 Authentication and Permissions

- A student can sign in and cannot access another student's records by changing a URL, ID, or request payload.
- A counselor can sign in and can only access assigned student cases unless access is explicitly shared.
- An administrator can view and manage records within their permission scope.
- Deactivating a user prevents further access without deleting their historical records.
- Internal notes are not exposed to student accounts through any endpoint or notification.

### 14.2 Student Onboarding

- An administrator can create or invite a student.
- The student can complete and save a profile over multiple sessions.
- The profile supports academic records with an explicit grade scale.
- The profile supports English test records with overall and component scores.
- The student can upload required documents.
- The system identifies incomplete profile sections and missing documents.
- A counselor can review information and request corrections.

### 14.3 Assignment

- An administrator can assign a case to a counselor.
- The case appears in that counselor's assigned list.
- The assignment is visible in the audit history.
- An administrator can reassign the case and the previous assignment remains in history.
- The administrator can see assigned-student counts for each counselor.

### 14.4 Program Database

- An administrator can create a country, city, university, program, and intake.
- A program contains structured academic and language requirements.
- A program contains official source URLs and a last-verified date or an explicit unverified state.
- The program can be found through structured search and filters.
- A program can be updated or archived without deleting historical application references.
- A counselor can view enough detail to assess a student's fit without relying on an unstructured description alone.

### 14.5 Matching and Shortlisting

- A counselor can compare a student's stored grade and grade scale with a program requirement.
- The system does not compare grades across incompatible scales without an explicit conversion rule.
- The system identifies missing or unverified information as unknown or requiring review.
- The system explains each eligibility mismatch or warning.
- The counselor can add a program to a student's shortlist and record a reason.
- The student cannot see a shortlist entry until it is shared.
- The counselor can record a student's decision.

### 14.6 Application Tracking

- A counselor can create an application from a shortlist entry.
- The application is linked to the correct student, case, program, and intake.
- The counselor can select Uni-Assist or a direct university portal as the route.
- The counselor can record the external portal reference and submission date.
- The counselor can update application status and add a note.
- Each status change is recorded in history.
- The student can see the student-visible status and important timeline events.
- The application can reach a final outcome such as offer, rejection, withdrawal, or closure.

### 14.7 Tasks, Messages, and Notifications

- A counselor can request a document from a student with a due date.
- The student can see and respond to the request.
- A counselor and student can exchange messages in the case context.
- Internal notes remain private to authorized employees.
- Important new messages and deadlines produce in-app notifications.
- Overdue tasks are identifiable by counselors and administrators.

### 14.8 Administration and Reporting

- An administrator can see total students, active cases, unassigned cases, and active applications.
- An administrator can filter cases by counselor and status.
- An administrator can see workload counts per counselor.
- An administrator can see application status counts.
- An administrator can manage program records.
- An administrator can review audit history for important records.

## 15. Recommended Delivery Phases

The phases below are implementation priorities, not a restriction on the internal architecture.

### Phase 1: Operational Foundation

- Authentication and role-based authorization.
- Student accounts and profiles.
- Academic and language-test records.
- Private document upload and review.
- Student case/package records.
- Counselor assignment and reassignment.
- Basic administrator overview.
- Audit history for core entities.

### Phase 2: Program Catalog and Shortlisting

- Country, city, university, program, and intake data.
- Structured program requirements.
- Source verification and data freshness.
- Search and filters.
- Rule-based eligibility comparison.
- Student-specific shortlists and student decisions.
- Program data import/export.

### Phase 3: Applications and Communication

- Application records and configurable statuses.
- Uni-Assist/direct portal route tracking.
- Application checklists and document requirements.
- Tasks, deadlines, and timelines.
- In-app messaging and internal notes.
- In-app notifications and reminders.
- Student application progress view.

### Phase 4: Operational Intelligence and Integrations

- Expanded reporting and exports.
- Email notifications.
- Optional WhatsApp Business notifications.
- Optional supported portal/API integrations.
- Program data verification workflows.
- AI-assisted requirement extraction or summarization with human review.
- Country-specific configuration and workflow coverage for Germany, Italy, France, Netherlands, United Kingdom, United States, Australia, Sweden, Finland, Hungary, Romania, and Czech Republic.
- Additional country-specific workflows for countries added later.

## 16. Open Decisions and Configurable Assumptions

The following points must remain configurable or be confirmed by Scholars Avenue during implementation. They should not be hardcoded as facts:

1. Exact package names, prices, currencies, and included services.
2. Whether the platform itself records payment or only receives manual payment confirmation from staff.
3. Whether students can self-register or can only join through an invitation.
4. Whether one student can have multiple active packages/cases at the same time.
5. Whether a student can be assigned to more than one counselor or only one primary counselor.
6. Whether counselors can share access to a case.
7. The initial supported country scope is Germany, Italy, France, Netherlands, United Kingdom, United States, Australia, Sweden, Finland, Hungary, Romania, and Czech Republic. Scholars Avenue must confirm whether all 12 catalogs are expected to be populated before launch or whether country support can be enabled progressively.
8. Which degree levels are included at launch, including Bachelor's, Master's, and PhD.
9. Which program data fields are mandatory for publication to counselors.
10. Whether an administrator must approve every program record before counselors can use it.
11. Which application statuses and transitions are used by Scholars Avenue operationally.
12. Which notifications are in-app only and which should also go through email or WhatsApp.
13. Which email provider and private file storage provider will be used.
14. Data retention periods for student records, identity documents, and audit logs.
15. Whether the company requires multiple administrative permission levels.
16. Whether application fees and package payments are in scope for the initial release.
17. Whether the student-facing platform needs English only or multiple languages.
18. Whether the organization needs a formal approval or acknowledgement from the student before each application is submitted.

## 17. Implementation Guidance for the Existing Project

These requirements are intended to be implemented in the existing Next.js repository.

- Inspect the existing repository, package configuration, installed dependencies, and current structure before making changes.
- Preserve working project setup and existing code unless a change is necessary to satisfy a requirement.
- Do not replace the existing application with a separate project.
- Do not assume that a database, authentication provider, file storage provider, email provider, or deployment provider has already been selected. Inspect the repository and document the current state before choosing or adding dependencies.
- Implement the data model and server-side authorization before relying on client-side role-specific behavior.
- Use database migrations or the equivalent versioned schema process.
- Keep credentials and environment-specific configuration in environment variables or a secure secret manager. Provide an example environment file without real secrets.
- Include seed data only for development and clearly label it as sample data. Do not present invented universities, requirements, deadlines, or fees as verified production data.
- Include automated tests for permissions, profile updates, document access, counselor assignment, program matching, shortlist creation, and application status transitions.
- Include validation and useful error messages for all critical data-entry operations.
- Include a README describing setup, required environment variables, database setup/migrations, seed data, tests, and development commands.
- Do not implement an automated admission decision. The platform supports counselor evaluation and evidence-based matching only.

## 18. Definition of Done

A feature is complete only when:

- Its functional requirements are implemented.
- Its server-side authorization is tested.
- Its validation and error cases are handled.
- Its data is persisted correctly and linked to the relevant entities.
- Important changes are represented in history/audit records.
- Student-visible and internal-only information are correctly separated.
- The feature is covered by appropriate automated tests.
- Any configuration or operational dependency is documented.
- No sample or unverified data is presented as an official fact.

The initial platform is ready for controlled operational use when all P0 acceptance criteria pass, critical security and privacy controls are verified, backups are configured, and Scholars Avenue has approved the initial workflows, statuses, and data-retention policy.
