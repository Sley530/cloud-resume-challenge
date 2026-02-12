# Backend — Visitor Counter API

A serverless visitor counter for the Cloud Resume Challenge, built with a **Google Cloud Function** (2nd gen, Python 3.12) and **Firestore** (Native mode).

## Architecture

```
┌──────────────┐   POST /   ┌──────────────────┐   read/write   ┌───────────┐
│   Frontend   │ ─────────► │  Cloud Function   │ ─────────────► │ Firestore │
│  (index.html)│ ◄───────── │ (visitor-counter) │ ◄───────────── │ (default) │
└──────────────┘  { count } └──────────────────┘                └───────────┘
```

- **GET /**  — Returns the current visitor count (`{"count": N}`)
- **POST /** — Increments the count by 1 and returns the new value (`{"count": N+1}`)
- **OPTIONS /** — CORS preflight response (204)

## Project Structure

```
backend/
├── api/
│   ├── main.py              # Cloud Function source code
│   └── requirements.txt     # Python dependencies
├── tests/
│   └── test_main.py         # Unit tests (mocked Firestore)
└── README.md                # ← you are here
```

## Prerequisites

- Python 3.10+ installed locally
- GCP project with billing enabled
- Service account with the following roles:
  - `roles/cloudfunctions.admin`
  - `roles/datastore.user` (Firestore)
  - `roles/storage.admin`
  - `roles/run.admin` (Cloud Run, needed for 2nd gen functions)
  - `roles/iam.serviceAccountUser`

## Local Development

### 1. Install dependencies

```bash
cd backend/api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Run the function locally

```bash
# Using the Functions Framework
pip install functions-framework
functions-framework --target visitor_counter --debug --port 8080
```

Then test with:

```bash
# Get current count
curl http://localhost:8080

# Increment count
curl -X POST http://localhost:8080
```

> **Note:** Running locally requires either a Firestore emulator or
> `GOOGLE_APPLICATION_CREDENTIALS` pointing to a service account key.

### 3. Run with the Firestore emulator (optional)

```bash
# Install the emulator (requires gcloud CLI)
gcloud components install cloud-firestore-emulator

# Start the emulator
gcloud emulators firestore start --host-port=localhost:8081

# In another terminal, point the app to the emulator
export FIRESTORE_EMULATOR_HOST=localhost:8081
functions-framework --target visitor_counter --debug --port 8080
```

## Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

Tests mock Firestore so no GCP credentials are needed:

| Test | What it verifies |
|------|-----------------|
| `test_get_returns_current_count` | GET returns the stored count |
| `test_post_increments_count` | POST increments by 1 |
| `test_options_returns_204` | CORS preflight is handled correctly |
| `test_get_creates_counter_if_missing` | First-ever GET initializes count to 0 |

## Deployment

The backend is deployed automatically by Terraform (from the `gcp/` directory). When you run `./bin/deploy`, Terraform will:

1. Enable the required GCP APIs (Firestore, Cloud Functions, Cloud Build, Cloud Run, Artifact Registry)
2. Create or update the Firestore database in Native mode
3. Zip the `backend/api/` source and upload it to a GCS bucket
4. Deploy the Cloud Function (2nd gen) with public invocation enabled
5. Output the Cloud Function URL

### Manual deployment (without Terraform)

```bash
cd backend/api

gcloud functions deploy visitor-counter \
  --gen2 \
  --runtime python312 \
  --region us-east1 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point visitor_counter \
  --memory 256MB \
  --max-instances 5 \
  --source .
```

## Connecting the Frontend

After deployment, get the Cloud Function URL:

```bash
cd gcp
terraform output visitor_counter_url
```

Then update the `API_URL` constant in `frontend/js/counters.js`:

```javascript
const API_URL = "https://us-east1-cloud-resume-challenge-486522.cloudfunctions.net/visitor-counter";
```

Re-deploy the frontend (or just run `./bin/deploy` again) to upload the updated file.

## Service Account Roles

If your existing service account doesn't have the required permissions for the backend, add them:

```bash
SA="terraform-access@cloud-resume-challenge-486522.iam.gserviceaccount.com"
PROJECT="cloud-resume-challenge-486522"

gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA" \
  --role="roles/cloudfunctions.admin"

gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA" \
  --role="roles/artifactregistry.admin"
```

## Firestore Data Model

```
counters (collection)
  └── visitor_count (document)
        └── count: <integer>
```

The document is auto-created on the first request with `count: 0`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `403 Permission Denied` on deploy | Add `roles/cloudfunctions.admin` and `roles/run.admin` to the service account |
| `404 NOT_FOUND` Firestore | Ensure the Firestore database has been created (Terraform handles this) |
| Function deploys but returns 500 | Check Cloud Function logs: `gcloud functions logs read visitor-counter --gen2 --region us-east1` |
| CORS errors in the browser | The function includes CORS headers for all origins; check the browser console for the actual error |
