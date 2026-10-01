# PDF Layout Translation API Guide (Legacy)

> **Archived compatibility reference.** New integrations must use the [current Jobs API guide](https://www.kolmopdf.com/api-docs), including its cross-platform quick start and agent setup. This document describes older endpoints and response shapes; it is not the current onboarding guide.

## Basic Information

### Base URL

Use the following base URL for all API requests:

`https://www.kolmopdf.com`

### General Notes

1. **Async workflow:** Upload the PDF first, poll task status, then download the translated PDF.
2. **Data retention:** Download results as soon as possible. Result files are retained for 7 days.
3. **File limits:**
   - Maximum file size: **300 MB**
   - Maximum page count per PDF: **800 pages**
4. **Points:** PDF layout translation costs **2 points/page**.
5. **Concurrency:** Each API Key can process up to **3 tasks concurrently**. Extra tasks are queued automatically.

---

## Authentication

Send your API Key in one of these ways:

| Method | Example |
| :--- | :--- |
| URL parameter | `?api_key=sk-xxx` |
| Header | `X-API-Key: sk-xxx` |
| Authorization | `Authorization: Bearer sk-xxx` |

---

## Async Processing Flow

**upload and translate** -> **poll status** -> **download result**

### 1. Upload and Translate

**POST /api/pdf-to-markdown-proxy/translate-pdf**

#### Request Parameters

| Name | Location | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `file` | FormData | `file` | Yes | PDF file in binary format. |
| `sourceLanguage` / `source_language` | FormData | `string` | No | Source language. Default: `en`. |
| `targetLanguage` / `target_language` | FormData | `string` | No | Target language. Default: `zh`. |
| `layoutModes` / `output_modes` / `outputModes` | FormData | `string` | No | Output mode list. Supported: `translated_only`, `side_by_side`. Comma-separated string or JSON array. |
| `enable_image_translation` / `enableImageTranslation` | FormData | `string` | No | Whether to translate image text. `true` or `false`. |
| `enable_table_translation` / `enableTableTranslation` | FormData | `string` | No | Whether to translate tables. `true` or `false`. |

#### Request Example

```bash
curl -X POST 'https://www.kolmopdf.com/api/pdf-to-markdown-proxy/translate-pdf?api_key=sk-xxx' \
  -F "file=@document.pdf" \
  -F "sourceLanguage=en" \
  -F "targetLanguage=zh" \
  -F "layoutModes=translated_only"
```

#### Success Example: Processing Started

```json
{
  "success": true,
  "task_id": "12345",
  "status": "processing",
  "message": "PDF layout-preserving translation task started",
  "points_deducted": 20,
  "remaining_points": 80
}
```

#### Success Example: Waiting in Queue

```json
{
  "success": true,
  "task_id": "12345",
  "status": "waiting",
  "message": "Task queued and waiting for processing",
  "points_deducted": 20,
  "remaining_points": 80,
  "queue_info": {
    "position": 1,
    "ahead_tasks": 3
  }
}
```

---

### 2. Query Task Status

**GET /api/pdf-to-markdown-proxy/status/{task_id}**

```bash
curl "https://www.kolmopdf.com/api/pdf-to-markdown-proxy/status/12345?api_key=sk-xxx"
```

#### Completed

```json
{
  "success": true,
  "status": "completed",
  "message": "Processing completed",
  "result": {
    "task_id": "12345",
    "download_url": "/api/pdf-to-markdown-proxy/download/12345"
  }
}
```

---

### 3. Download Result

**GET /api/pdf-to-markdown-proxy/download/{task_id}**

```bash
curl -L "https://www.kolmopdf.com/api/pdf-to-markdown-proxy/download/12345?api_key=sk-xxx" \
  -o translated.pdf
```

---

### 4. Query Balance

**GET /api/pdf-to-markdown-proxy/balance**

```bash
curl "https://www.kolmopdf.com/api/pdf-to-markdown-proxy/balance?api_key=sk-xxx"
```

