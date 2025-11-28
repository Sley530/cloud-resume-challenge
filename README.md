# Cloud Resume Challenge — My Resume Site

This repository documents my Cloud Resume Challenge journey. I’m building a professional, US‑style resume site and using it to demonstrate cloud skills: static hosting, HTTPS, CI/CD, Infrastructure as Code (IaC), serverless, and observability.

Live site: [Coming soon]

Source: This repo (main branch)

## What’s implemented now

- Modern, US‑style resume in semantic HTML + lightweight CSS (Pico.css)
- Responsive layout: two columns on desktop (content + sidebar), single column on mobile
- Consistent “section header + boxed item” design across Experience, Projects, Skills, Education, and Certifications
- Dark‑mode friendly translucent cards (no harsh white boxes); light shadow in light mode
- Print‑to‑PDF support tailored for US Letter, with page‑break control to avoid splitting items
- “Download PDF” button (uses the browser’s print dialog)
- Structured data (JSON‑LD Person) to improve SEO/ATS parsing

Files:
- `index.html` — Resume content and structure
- `styles.css` — Layout, theme tuning, print styles, dark mode

## Why this project

The Cloud Resume Challenge is a practical way to show real cloud skills. Instead of a static PDF, I’m building and operating a small production site with the same care I’d apply to a customer app—version control, reproducible infra, CI/CD, security, and monitoring.

## Architecture (target)

- Frontend: Static site on Amazon S3
- CDN/HTTPS: Amazon CloudFront + ACM cert, Route 53 for DNS
- Visitor counter API: API Gateway → Lambda → DynamoDB (serverless)
- IaC: Terraform (or AWS CDK) for all resources, including buckets, policies, CloudFront, DNS, API, and database
- CI/CD: GitHub Actions
  - Lint/build checks (for future JS if added)
  - Deploy website on merge to main
  - Plan/apply Terraform with approvals for prod
- Observability: CloudWatch metrics/logs and dashboard for API + DynamoDB, alarms via SNS

## Process and decisions

- Start simple and accessible: semantic HTML, minimal CSS (Pico.css), clear hierarchy for ATS and readers
- Design for readability first, then add tasteful polish: boxed items, subtle separators, and dark‑mode translucency
- Optimize for recruiters: one‑page default print layout (US Letter), clean margins, and no header/footer clutter
- Add structured data (JSON‑LD Person) to help with machine parsing and search engines
- Keep it repo‑driven: all changes are tracked, and infra will be code‑reviewed via pull requests once IaC lands

## Roadmap

- [x] Initial resume layout (HTML/CSS) with dark mode and US‑Letter print
- [x] Consistent boxed sections (Experience/Projects/Skills/Education/Certs)
- [ ] Add a serverless visitor counter (API Gateway + Lambda + DynamoDB)
- [ ] S3 + CloudFront hosting with HTTPS and custom domain (Route 53)
- [ ] Terraform modules for website, CDN, DNS, and API
- [ ] GitHub Actions CI/CD for preview builds and production deploys
- [ ] CloudWatch dashboards and alerts for API/DynamoDB
- [ ] Add tests (unit for Lambda, integration for API)

## How to view locally

- Open `index.html` in your browser (double‑click from File Explorer).

Optional — Print to PDF
- Click “Download PDF” (opens the browser’s print dialog)
- Paper size: US Letter
- Margins: Default
- Disable headers/footers for a clean export

## Tech stack (current)

- HTML5, CSS (Pico.css via CDN)
- No JavaScript framework; a tiny inline JS call for printing
- JSON‑LD for structured data (Person schema)

## Planned tech

- AWS: S3, CloudFront, Route 53, ACM, API Gateway, Lambda, DynamoDB, CloudWatch, IAM
- IaC: Terraform (or AWS CDK if preferred)—single source of truth
- CI/CD: GitHub Actions with environments and approvals

## Accessibility & performance

- Proper headings and landmarks, high‑contrast text, keyboard‑friendly structure
- Lightweight assets (no heavy frameworks) for fast first paint
- Print styles for a compact, single‑page PDF

## Contact

- Email: your.email@example.com
- LinkedIn: https://www.linkedin.com/in/your-handle/
- GitHub: https://github.com/your-handle

If you’re an employer or reviewer and want a deeper dive (diagrams, IaC preview, pipeline design), I’m happy to walk through decisions and trade‑offs.