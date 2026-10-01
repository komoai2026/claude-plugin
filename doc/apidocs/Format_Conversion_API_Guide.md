# Format Conversion API Guide (Legacy)

> **Archived compatibility reference.** New integrations must use the [current Jobs API guide](https://www.kolmopdf.com/api-docs), including its cross-platform quick start and agent setup. This document describes older endpoints and response shapes; it is not the current onboarding guide.

## Basic Information

### Base URL

Use the following base URL for all API requests:

`https://www.kolmopdf.com`

### General Notes

1. **Async workflow:** Upload the source file, poll task status, then download the converted result.
2. **Data retention:** Download results as soon as possible. Result files are retained for 7 days.
3. **File limits:** Maximum file size is **300 MB**.
4. **Input formats:** Markdown (`.md`, `.markdown`) or ZIP archive.
5. **Output formats:** Word (`docx`), HTML, PDF, or LaTeX.
6. **Points:** Format conversion costs **1 point/task**.
7. **Concurrency:** Each API Key can process up to **3 tasks concurrently**. Extra tasks are queued automatically.

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

**upload and convert** -> **poll status** -> **download result**

### 1. Upload and Convert

**POST /api/pdf-to-markdown-proxy/convert**

#### Request Parameters

| Name | Location | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `file` | FormData | `file` | Yes | Markdown file or ZIP archive. |
| `format` / `target_format` / `targetFormat` | FormData | `string` | No | Target format. Supported: `word`, `docx`, `html`, `pdf`, `latex`, `tex`. Default: `word`. |

#### Request Example

```bash
curl -X POST 'https://www.kolmopdf.com/api/pdf-to-markdown-proxy/convert?api_key=sk-xxx' \
  -F "file=@document.md" \
  -F "targetFormat=pdf"
```

#### Success Example: Processing Started

```json
{
  "success": true,
  "task_id": "12345",
  "status": "processing",
  "message": "Format conversion task started",
  "points_deducted": 1,
  "remaining_points": 99
}
```

#### Success Example: Waiting in Queue

```json
{
  "success": true,
  "task_id": "12345",
  "status": "waiting",
  "message": "Task queued and waiting for processing",
  "points_deducted": 1,
  "remaining_points": 99,
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

---

### 3. Download Result

**GET /api/pdf-to-markdown-proxy/download/{task_id}**

```bash
curl -L "https://www.kolmopdf.com/api/pdf-to-markdown-proxy/download/12345?api_key=sk-xxx" \
  -o result.pdf
```

---

### 4. Query Balance

**GET /api/pdf-to-markdown-proxy/balance**

```bash
curl "https://www.kolmopdf.com/api/pdf-to-markdown-proxy/balance?api_key=sk-xxx"
```
