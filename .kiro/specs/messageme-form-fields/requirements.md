# Requirements Document

## Introduction

This feature extends the "Send me a message" form in the MessageMe section of the Astro portfolio site. Today the form (in `src/components/MessageMe.astro`) collects only an email address and uses the Startbootstrap Grayscale theme with SB Forms validation attributes. The form is not wired to a real backend.

This feature adds two new input fields — a name field and a message field — and a simulated (non-production) anti-bot mechanism. The anti-bot mechanism is explicitly decorative: it performs client-side checks only and is not backed by any real verification service. The goal is to make the form appear more complete and demonstrate basic bot deterrence without introducing server-side infrastructure.

## Glossary

- **Message_Form**: The HTML form with id `contactForm` in `src/components/MessageMe.astro` that collects visitor input in the MessageMe section.
- **Name_Field**: The text input added by this feature for a visitor's name.
- **Message_Field**: The multi-line text input (textarea) added by this feature for the visitor's message body.
- **Email_Field**: The existing email input with id `emailAddress`.
- **Submit_Button**: The existing form submit control with id `submitButton`.
- **Antibot_Control**: The simulated, client-side-only anti-bot mechanism added by this feature. Not backed by any external verification service.
- **Honeypot_Field**: A visually hidden input that is expected to remain empty for human visitors, used as one form of Antibot_Control.
- **Visitor**: A person interacting with the Message_Form in a browser.
- **Validation_Feedback**: The inline messages shown when a field fails validation, consistent with the existing SB Forms `invalid-feedback` pattern.

## Requirements

### Requirement 1: Name field

**User Story:** As a visitor, I want to enter my name in the message form, so that the recipient knows who is contacting them.

#### Acceptance Criteria

1. THE Message_Form SHALL display a Name_Field that accepts text entry of 1 to 100 characters.
2. THE Name_Field SHALL display placeholder text that indicates a name is expected.
3. THE Name_Field SHALL expose an accessible label equivalent to the placeholder text through an `aria-label` attribute.
4. IF the Message_Form is submitted while the Name_Field contains no characters or only whitespace characters, THEN THE Message_Form SHALL block submission and display Validation_Feedback indicating that a name is required.
5. WHEN the Visitor enters at least 1 non-whitespace character into a Name_Field that previously showed Validation_Feedback, THE Message_Form SHALL clear the name-required Validation_Feedback.

### Requirement 2: Message field

**User Story:** As a visitor, I want to type a message in the form, so that I can describe the reason I am reaching out.

#### Acceptance Criteria

1. THE Message_Form SHALL display a Message_Field that accepts multi-line text up to 2000 characters, rendered with at least 3 visible text rows.
2. THE Message_Field SHALL render non-empty placeholder text while the Message_Field contains no Visitor-entered characters.
3. THE Message_Field SHALL expose an `aria-label` attribute whose value is identical to the Message_Field placeholder text.
4. WHEN the Submit_Button is activated WHILE the Message_Field contains zero characters, THE Message_Form SHALL display visible Validation_Feedback indicating that a message is required, SHALL prevent submission of the Message_Form, and SHALL retain any values already entered in the other fields.
5. IF the Message_Field contains more than 2000 characters when the Submit_Button is activated, THEN THE Message_Form SHALL display visible Validation_Feedback indicating the maximum message length is exceeded, SHALL prevent submission of the Message_Form, and SHALL retain the Visitor-entered values.

### Requirement 3: Existing email field preserved

**User Story:** As the site owner, I want the existing email field and submit behavior to remain intact, so that the form keeps its current structure and styling.

#### Acceptance Criteria

1. THE Message_Form SHALL retain the Email_Field with id `emailAddress`, type `email`, and class `form-control`.
2. THE Message_Form SHALL retain the Submit_Button with id `submitButton`, type `submit`, and classes `btn btn-primary`.
3. THE Email_Field SHALL retain the `data-sb-validations="required,email"` attribute.
4. IF the Message_Form is submitted while the Email_Field contains zero characters, THEN THE Message_Form SHALL display Validation_Feedback indicating an email is required and SHALL prevent submission of the Message_Form.
5. WHEN the Message_Form is submitted WHILE the Email_Field contains a value that is not a valid email address, THE Message_Form SHALL display Validation_Feedback indicating the email is not valid and SHALL prevent submission of the Message_Form.
6. WHEN the Message_Form is submitted WHILE the Email_Field contains a valid email address, THE Message_Form SHALL clear the email Validation_Feedback and SHALL proceed with the existing submit behavior.

### Requirement 4: Simulated anti-bot protection

**User Story:** As the site owner, I want a simulated anti-bot control on the form, so that casual automated submissions are deterred without integrating a real verification service.

#### Acceptance Criteria

1. THE Message_Form SHALL include an Antibot_Control that executes entirely within the Visitor's browser and issues zero network requests.
2. THE Antibot_Control SHALL NOT send any data to an external verification service or third-party endpoint.
3. WHERE the Antibot_Control is implemented as a Honeypot_Field, THE Honeypot_Field SHALL be not visually rendered, excluded from the keyboard tab order, and excluded from the accessibility tree.
4. WHERE the Antibot_Control is implemented as a Honeypot_Field, IF the Honeypot_Field contains a non-empty value when the Message_Form is submitted, THEN THE Message_Form SHALL keep the success outcome hidden and SHALL present no feedback that distinguishes a detected bot from a successful submission.
5. WHERE the Antibot_Control is implemented as a Honeypot_Field, WHEN the Message_Form is submitted WHILE the Honeypot_Field is empty, THE Message_Form SHALL process the submission through its normal success path without Antibot_Control interference.
6. WHERE the Antibot_Control is implemented as a challenge the Visitor must complete, IF the Message_Form is submitted before the challenge is satisfied, THEN THE Message_Form SHALL block submission and display Validation_Feedback indicating the challenge must be completed.

### Requirement 5: Layout and styling consistency

**User Story:** As the site owner, I want the new fields and control to match the existing Grayscale styling, so that the section looks cohesive.

#### Acceptance Criteria

1. THE Name_Field SHALL apply the `form-control` class so it inherits the Grayscale form styling defined by the `.form-signup input` rules in `src/styles/sections/_message-me.scss`.
2. THE Message_Field SHALL apply the `form-control` class so it inherits the Grayscale form styling defined in `src/styles/sections/_message-me.scss`.
3. THE Message_Form SHALL arrange the fields in the reading order Name_Field, Email_Field, Message_Field, Antibot_Control, Submit_Button using the existing Bootstrap `row`, `col`, and `col-auto` grid classes.
4. WHERE the Antibot_Control is implemented as a Honeypot_Field, THE Honeypot_Field SHALL be visually hidden so it does not appear in the rendered layout.
5. THE Message_Form SHALL preserve the existing `submitSuccessMessage` and `submitErrorMessage` containers with their `d-none` class.
