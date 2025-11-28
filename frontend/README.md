# Frontend — Resume Site

This folder contains the frontend for my Cloud Resume Challenge: a clean, US‑style resume built with semantic HTML and lightweight CSS (Pico.css). It’s responsive, dark‑mode aware, and prints to a single US Letter page.

## Structure

- `index.html` — Resume markup and sections
- `css/styles.css` — Layout, theme tuning, and print/dark‑mode styles
- `assets/` — Images or icons (optional)
- `js/` — Placeholder for future interactivity (optional)

## Sections

- Contact — email, phone, location, and social links in a translucent info box
- Summary — concise career overview
- Experience — each role as a boxed item with bullets and meta
- Projects — featured projects in the same boxed style
- Skills — boxed list of core skills
- Education — degree details in a boxed item
- Certifications — certs listed in a boxed item

## Design details

- Two‑column on desktop (content + sidebar); single column on mobile
- Boxed items for consistent scannability across all sections
- Dark mode: translucent cards to avoid harsh white blocks
- Print: US Letter, controlled page breaks, clean margins

## View locally

- Open `frontend/index.html` in your browser.
- Use the "Download PDF" button to print or save as PDF.
  - Paper size: US Letter
  - Margins: Default
  - Disable headers/footers for clean export

## Next steps

- Host on S3 behind CloudFront (HTTPS) with Route 53
- Add serverless visitor counter (API Gateway + Lambda + DynamoDB)
- Manage infra with Terraform (or AWS CDK)
- CI/CD via GitHub Actions

## Customize

- Update placeholders (name, contact info, roles, bullets) in `index.html`.
- Tweak spacing and colors in `css/styles.css`.
- Add assets to `assets/` (keep them lightweight).

## Notes

Accessibility (semantic tags, headings, contrasts) and performance (minimal CSS/JS) are prioritized. Structured data (JSON‑LD Person) is included to help ATS/search parse the resume.
