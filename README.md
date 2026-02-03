# yamlforms

Generate fillable PDF forms with interactive AcroForm fields from YAML schema definitions.

[![npm version](https://img.shields.io/npm/v/yamlforms.svg)](https://www.npmjs.com/package/yamlforms)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Fillable PDF Forms** - Generate PDFs with interactive AcroForm fields (text, checkbox, radio, dropdown, textarea, signature)
- **Flow Layout** - Content automatically flows across pages without manual positioning
- **Rich Content Types** - Headings, paragraphs, tables, admonitions, rules, and spacers
- **Tables with Form Fields** - Embed form fields directly in table cells
- **Calculated Fields** - Define formulas that compute values from other fields
- **Conditional Logic** - Show/hide fields based on other field values
- **Custom Styling** - CSS-based styling with WCAG 2.1 AA compliant defaults
- **Multi-format Output** - Generate PDF and HTML from the same schema
- **Watch Mode** - Auto-regenerate on file changes during development

## Installation

```bash
npm install -g yamlforms
```

**Requirements:** Node.js 24+

## Quick Start

```bash
# Initialize a new project
yamlforms init my-forms
cd my-forms

# Generate PDF from schema
yamlforms generate schemas/sample.yaml --output dist

# Generate both PDF and HTML
yamlforms generate schemas/sample.yaml --format pdf,html

# Watch for changes
yamlforms generate schemas/sample.yaml --watch
```

## CLI Commands

### generate

Generate documents from a YAML schema.

```bash
yamlforms generate <schema> [options]

Options:
  -o, --output <dir>      Output directory (default: current directory)
  -f, --format <formats>  Output formats: pdf,html (default: pdf)
  -w, --watch             Watch for file changes and regenerate
  -v, --verbose           Verbose output
```

### validate

Validate a schema file against the JSON schema.

```bash
yamlforms validate <schema> [options]

Options:
  -v, --verbose  Show detailed validation info
```

### preview

Preview form fields without generating files.

```bash
yamlforms preview <schema> [options]

Options:
  -f, --format <format>  Output format: table, json, yaml (default: table)
```

### init

Initialize a new project with sample files.

```bash
yamlforms init [directory]
```

## GitHub Action

Use yamlforms in your CI/CD workflows to generate PDF forms automatically.

### Basic Usage

```yaml
# Uses default schema path: schemas/*.yaml
- uses: robinmordasiewicz/yamlforms@v1

# Or specify a custom schema path
- uses: robinmordasiewicz/yamlforms@v1
  with:
    schema: 'forms/my-form.yaml'
```

### Inputs

| Input            | Description                                | Required | Default               |
| ---------------- | ------------------------------------------ | -------- | --------------------- |
| `command`        | Command to run: `generate` or `validate`   | No       | `generate`            |
| `schema`         | Path to YAML schema file or glob pattern   | No       | `schemas/*.yaml`      |
| `output`         | Output directory for generated files       | No       | `dist`                |
| `format`         | Output formats: `pdf`, `html`, or both     | No       | `pdf`                 |
| `fail-on-error`  | Fail the action if errors occur            | No       | `true`                |
| `publish`        | Enable GitHub Pages publishing             | No       | `true`                |
| `publish-method` | Publishing method: `pages-api` or `branch` | No       | `pages-api`           |
| `pages-branch`   | Branch for branch-based publishing         | No       | `gh-pages`            |
| `generate-index` | Generate index.html listing documents      | No       | `true`                |
| `index-title`    | Title for the generated index page         | No       | `Generated Documents` |

### Outputs

| Output                | Description                              |
| --------------------- | ---------------------------------------- |
| `files`               | JSON array of generated file paths       |
| `pdf-count`           | Number of PDF files generated            |
| `html-count`          | Number of HTML files generated           |
| `validation-errors`   | JSON array of validation errors (if any) |
| `pages-url`           | URL of deployed GitHub Pages site        |
| `index-file`          | Path to generated index.html             |
| `pages-artifact-path` | Path for upload-pages-artifact           |

### Examples

**Generate PDF and HTML:**

```yaml
- uses: robinmordasiewicz/yamlforms@v1
  with:
    schema: 'schemas/*.yaml'
    output: 'dist/forms'
    format: 'pdf,html'
```

**Validate schemas in PRs:**

```yaml
- uses: robinmordasiewicz/yamlforms@v1
  with:
    command: validate
    schema: 'schemas/**/*.yaml'
```

**Upload generated files as artifacts:**

```yaml
- uses: robinmordasiewicz/yamlforms@v1
  id: yamlforms
  with:
    schema: 'schemas/order-form.yaml'
    output: 'dist'

- uses: actions/upload-artifact@v4
  with:
    name: forms
    path: dist/
```

**Publish to GitHub Pages (Pages API method - recommended):**

```yaml
permissions:
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      - uses: robinmordasiewicz/yamlforms@v1
        with:
          schema: 'schemas/*.yaml'
          format: 'pdf,html'

      - uses: actions/upload-pages-artifact@v4
        with:
          path: dist

      - uses: actions/deploy-pages@v4
        id: deployment
```

**Publish to GitHub Pages (branch method - self-contained):**

```yaml
permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: robinmordasiewicz/yamlforms@v1
        with:
          schema: 'schemas/*.yaml'
          format: 'pdf,html'
          publish-method: branch
          pages-branch: gh-pages
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Disable publishing (generate only):**

```yaml
- uses: robinmordasiewicz/yamlforms@v1
  with:
    schema: 'schemas/*.yaml'
    publish: false
```

## Schema Format

### Basic Structure

```yaml
$schema: 'form-schema/v1'

form:
  id: my-form
  title: My Form
  version: '1.0.0'
  pages: 1
  positioning: flow # Automatic layout (recommended)
  numbering: true # Auto-number field labels

content:
  - type: heading
    level: 1
    text: 'Form Title'

  - type: paragraph
    text: 'Instructions for filling out this form.'

  - type: field
    label: 'Full Name'
    fieldType: text
    fieldName: full_name
    required: true

fields: [] # Legacy field definitions (optional with flow mode)
```

### Content Types

#### Heading

```yaml
- type: heading
  level: 1 # 1-6
  text: 'Section Title'
```

#### Paragraph

```yaml
- type: paragraph
  text: 'Body text content.'
  maxWidth: 400
  fontSize: 12
```

#### Field (Standalone)

```yaml
- type: field
  label: 'Email Address'
  fieldType: text # text, dropdown, checkbox, textarea
  fieldName: email
  width: 300
  placeholder: 'user@example.com'
  required: true
```

#### Table with Form Fields

```yaml
- type: table
  label: 'Contact Information'
  columns:
    - { label: 'Name', width: 150 }
    - { label: 'Email', width: 200 }
    - { label: 'Primary', width: 60 }
  rows:
    - cells:
        - { type: text, fieldName: contact_name_1 }
        - { type: text, fieldName: contact_email_1 }
        - { type: checkbox, fieldName: contact_primary_1 }
    - cells:
        - { type: text, fieldName: contact_name_2 }
        - { type: text, fieldName: contact_email_2 }
        - { type: checkbox, fieldName: contact_primary_2 }
```

#### Admonition

```yaml
- type: admonition
  variant: warning # warning, note, info, tip, danger
  title: 'Important'
  text: 'Please read carefully before proceeding.'
```

#### Rule (Horizontal Line)

```yaml
- type: rule
```

#### Spacer

```yaml
- type: spacer
  height: 24
```

### Field Types

| Type        | Description            | Properties                               |
| ----------- | ---------------------- | ---------------------------------------- |
| `text`      | Single-line text input | `maxLength`, `placeholder`, `validation` |
| `textarea`  | Multi-line text area   | `maxLength`, `multiline`                 |
| `checkbox`  | Boolean checkbox       | `default`                                |
| `radio`     | Radio button group     | `options`, `default`                     |
| `dropdown`  | Dropdown select        | `options`, `default`                     |
| `signature` | Signature field        | -                                        |

### Field Options

For radio and dropdown fields:

```yaml
options:
  - value: 'us'
    label: 'United States'
  - value: 'ca'
    label: 'Canada'
  - value: 'uk'
    label: 'United Kingdom'

# Or simple format (value = label)
options:
  - 'Option A'
  - 'Option B'
  - 'Option C'
```

### Calculated Fields

Define fields that compute values from other fields:

```yaml
calculations:
  - name: subtotal
    formula: 'quantity * price'
    format: currency
    decimals: 2

  - name: tax
    formula: 'subtotal * 0.1'
    format: currency

  - name: total
    formula: 'subtotal + tax'
    format: currency
```

**Formats:** `number`, `currency`, `percentage`, `text`

### Conditional Fields

Show or hide fields based on other field values:

```yaml
conditionalFields:
  - trigger:
      field: employment_type
      value: 'contractor'
    show: ['hourly_rate', 'contract_end_date']
    hide: ['annual_salary']

  - trigger:
      field: has_dependents
      value: true
    show: ['dependent_count', 'dependent_names']

  - trigger:
      field: age
      value: 18
      operator: greater
    show: ['adult_consent']
```

**Operators:** `equals`, `not_equals`, `contains`, `greater`, `less`

### Validation Rules

```yaml
validation:
  rules:
    - if: 'end_date < start_date'
      then: 'error: End date must be after start date'

    - if: 'quantity > 100'
      then: 'error: Maximum quantity is 100'
```

### Field Validation Patterns

```yaml
fields:
  - name: email
    type: text
    label: 'Email'
    validation:
      pattern: '^[\w.-]+@[\w.-]+\.\w+$'
      message: 'Please enter a valid email address'

  - name: phone
    type: text
    label: 'Phone'
    validation:
      pattern: '^\+?[\d\s()-]{10,}$'
      message: 'Please enter a valid phone number'
```

## Styling

Custom CSS stylesheets can override the default styling:

```yaml
form:
  id: my-form
  title: My Form
  stylesheet: './custom.css'
```

The default stylesheet follows accessibility standards (WCAG 2.1 AA, ISO 9241-115).

## Development

```bash
# Clone and install
git clone https://github.com/robinmordasiewicz/yamlforms.git
cd yamlforms
npm install

# Build
npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## License

MIT
