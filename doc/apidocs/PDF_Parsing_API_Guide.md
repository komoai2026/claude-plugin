# PDF Parsing API Guide (Legacy)

> **Archived compatibility reference.** New integrations must use the [current Jobs API guide](https://www.kolmopdf.com/api-docs), including its cross-platform quick start and agent setup. This document describes older endpoints, response shapes, and plan names; it is not the current onboarding guide. Free, PAYG, Go, and Plus accounts can create one API key; Pro supports ten. A subscription is not required.

## Basic Information

### Base URL

Use the following base URL for all API requests:

`https://www.kolmopdf.com`

### General Notes

1. **Network access:** Connect to the API directly. Outside mainland China, temporary network instability may interrupt uploads.
2. **Data retention:** After you receive the result from the status endpoint, download it as soon as possible. Result files are kept on the server for 7 days only.
   - **Image URL retention:** When `images_as_url=true` is enabled, generated image URLs are cached for **30 days** and will be cleaned up after expiration.
3. **File limits:**
   - Maximum file size: **300 MB**
   - Maximum page count per PDF: **800 pages**

---

## Authentication

### Getting an API Key

You can now apply for and manage API keys directly on the KolmoPDF website from the [PDF Parsing API](/api-keys) page.

1. **Advanced plan members:** May create 1 API key. API usage consumes the same point balance as the web account.
2. **Team plan members:** May create up to 10 API keys. Each key can have its own usage limit, which makes it easier to allocate quotas to subprojects or partners.

**Point limit logic**

The actual usable balance for a key is the lower of:

- your account's remaining total balance
- the remaining limit configured for that key

### Request Headers

Include either a Bearer token in the `Authorization` header or send the key with `X-API-Key`.

| Name | Example | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer sk-xxx` | Replace `sk-xxx` with your real API key. |
| `X-API-Key` | `sk-xxx` | Replace `sk-xxx` with your real API key. |

You can also pass the key as a URL parameter:

| Parameter | Example | Description |
| :--- | :--- | :--- |
| `api_key` | `sk-xxx` | Replace `sk-xxx` with your real API key. |

---

## Async Processing Flow

KolmoPDF uses a three-step async workflow:

**upload and parse** -> **poll status** -> **download result**

### 1. Upload and Parse

**POST /api/pdf-to-markdown-proxy/parse**

Upload a PDF file and create a parsing task.

#### Request Parameters

| Name | Location | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `file` | FormData | `file` | Yes | PDF file in binary format. |
| `table_mode` | FormData | `string` | No | Table output mode. `markdown` converts tables into Markdown tables. `image` keeps them as images. Default: `markdown`. |
| `formula_format` | FormData | `string` | No | Math delimiter mode. `dollar` keeps `$...$` and `$$...$$`. `bracket` converts them to `\\(...\\)` and `\\[...\\]`. Default: `dollar`. Escaped `\\$` is ignored. |
| `enable_translation` | FormData | `string` | No | Whether translation is enabled. `true` or `false`. Default: `false`. |
| `images_as_url` | FormData | `string` | No | Whether image references should be returned as public URLs. `true` or `false`. Default: `false`. When `true`, the final output is a Markdown file instead of a ZIP archive. |
| `target_language` | FormData | `string` | No | Target language code. Only valid when `enable_translation=true`. Supported: `zh`, `en`, `ja`, `ko`, `fr`, `de`, `es`, `ru`. Default: `zh`. |
| `output_options` | FormData | `string` | No | Translation output mode. Available: `original`, `translated`, `bilingual`. Multiple values can be joined with commas. Default: `original`. |
| `skip_rotation_detection` | FormData | `string` | No | Skip auto-rotation detection. `true` or `false`. Default: `false`. |
| `enable_cross_page_merge` | FormData | `string` | No | Enable smart cross-page table merging for up to three consecutive pages. `true` or `false`. Default: `false`. |

#### Request Examples

**Windows (CMD / PowerShell):**

```cmd
curl -X POST "https://www.kolmopdf.com/api/pdf-to-markdown-proxy/parse?api_key=sk-xxx" ^
  -F "file=@document.pdf" ^
  -F "table_mode=markdown" ^
  -F "formula_format=dollar" ^
  -F "enable_translation=false" ^
  -F "skip_rotation_detection=false" ^
  -F "enable_cross_page_merge=true"
```

**Linux / macOS:**

```bash
curl -X POST 'https://www.kolmopdf.com/api/pdf-to-markdown-proxy/parse?api_key=sk-xxx' \
  -F "file=@document.pdf" \
  -F "table_mode=markdown" \
  -F "formula_format=dollar" \
  -F "enable_translation=false" \
  -F "skip_rotation_detection=false" \
  -F "enable_cross_page_merge=true"
```

#### Success Example: Processing Started

```json
{
  "success": true,
  "task_id": "12345",
  "status": "processing",
  "message": "Task created successfully",
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

#### Failure Example: Insufficient Points

```json
{
  "success": false,
  "message": "Insufficient points",
  "error_code": "insufficient_points",
  "points_required": 20,
  "current_points": 15
}
```

#### Failure Example: Invalid File Type

```json
{
  "success": false,
  "message": "File is not a PDF file",
  "error_code": "parse_file_not_pdf"
}
```

#### Failure Example: File Too Large

```json
{
  "success": false,
  "message": "File size exceeds limit (300MB)",
  "error_code": "parse_file_too_large",
  "file_size": 314572800,
  "max_size": 314572800
}
```

#### Failure Example: Page Limit Exceeded

```json
{
  "success": false,
  "message": "Page count exceeds limit (800 pages)",
  "error_code": "parse_page_limit_exceeded",
  "page_count": 1000,
  "max_pages": 800
}
```

#### Point Consumption Rules

| Service | Cost |
| :--- | :--- |
| Parsing only | 2 points per page |
| Parsing + translation | 3 points per page |

---

### 2. Check Task Status

**GET /api/pdf-to-markdown-proxy/status/{task_id}**

Poll the task status. A polling interval of 1 to 3 seconds is recommended.

#### Success Example

```json
{
  "success": true,
  "status": "completed",
  "message": "Processing completed",
  "result": {
    "task_id": "01920000-0000-0000-0000-000000000000",
    "download_url": "/api/pdf-to-markdown-proxy/download/01920000-0000-0000-0000-000000000000"
  }
}
```

#### Processing Example

```json
{
  "success": true,
  "status": "processing",
  "message": "Processing"
}
```

#### Waiting Example

```json
{
  "success": true,
  "status": "waiting",
  "message": "Waiting in queue (3 tasks ahead)",
  "queue_info": {
    "position": 1,
    "ahead_tasks": 3
  }
}
```

#### Failure Example

```json
{
  "success": false,
  "status": "failed",
  "message": "Parsing error",
  "error_code": "parse_error"
}
```

If a task fails after it was created successfully, deducted points are automatically refunded.

---

### 3. Download Result

**GET /api/pdf-to-markdown-proxy/download/{task_id}**

Download the finished result file.

By default, successful requests return a ZIP archive containing the Markdown file and related assets. If the original parse request used `images_as_url=true`, this endpoint returns a Markdown file instead, and image references point to public URLs.

---

## Check Point Balance

**GET /api/pdf-to-markdown-proxy/balance**

Returns the current point balance for the API key.

#### Success Example

```json
{
  "success": true,
  "points": 98,
  "api_key": "sk-xxxx..."
}
```

#### Invalid Key Example

```json
{
  "success": false,
  "message": "Invalid API key"
}
```

---

## Error Codes

### HTTP Status Codes

| Status | Meaning | Description |
| :--- | :--- | :--- |
| `401` | Unauthorized | API key is missing or invalid. |
| `402` | Insufficient points | Not enough balance to complete the operation. |
| `429` | Rate limit / queue limit | Too many active tasks are already running for this key. |
| `500` | Server error | Internal server error. See the response body for details. |

### Business Error Codes

| Error Code | Meaning | Suggested Action | Points Deducted |
| :--- | :--- | :--- | :--- |
| `invalid_api_key` | API key is invalid or does not exist. | Check the key and try again. | No |
| `insufficient_points` | Not enough available points. | Add more points to the account. | No |
| `no_file_found` | No file was included in the request. | Make sure FormData contains the `file` field. | No |
| `parse_file_too_large` | File size exceeds the limit. | Split the PDF into smaller parts. | No |
| `parse_page_limit_exceeded` | PDF page count exceeds the limit. | Split the PDF into smaller parts. | No |
| `parse_file_not_pdf` | Uploaded file is not a PDF. | Upload a valid `.pdf` file. | No |
| `file_upload_failed` | Upload to storage failed. | Check the network and retry. | No |
| `points_deduction_failed` | Point deduction failed. | Contact support. | No |
| `task_creation_failed` | Task creation failed. | Contact support. Refunded automatically if needed. | Refunded |
| `parse_error` | Parsing failed. | Retry later. If the issue persists, contact support. | Refunded |
| `parse_file_invalid` | The PDF is malformed or invalid. | Try a different export or re-save the PDF. | Refunded |
| `parse_timeout` | Processing timed out. | Split the PDF and try again. | Refunded |

---

## Parameter Notes

### `table_mode`

| Value | Meaning |
| :--- | :--- |
| `markdown` | Convert tables into editable Markdown tables. |
| `image` | Keep tables as images to preserve layout. |

### `target_language`

Supported language codes:

| Code | Language |
| :--- | :--- |
| `zh` | Chinese |
| `en` | English |
| `ja` | Japanese |
| `ko` | Korean |
| `fr` | French |
| `de` | German |
| `es` | Spanish |
| `ru` | Russian |

### `output_options`

| Value | Meaning |
| :--- | :--- |
| `original` | Output the original Markdown only. |
| `translated` | Output the translated Markdown only. |
| `bilingual` | Output a bilingual version with original and translation. |

### `formula_format`

| Value | Meaning |
| :--- | :--- |
| `dollar` | Default. Keeps `$...$` for inline math and `$$...$$` for display math. |
| `bracket` | Converts inline math to `\\(...\\)` and display math to `\\[...\\]`. Escaped `\\$` is left unchanged. |

---

## Recommended Workflow

1. Upload the PDF with `/parse`
2. Poll `/status/{task_id}` until the task is complete
3. Download the final file with `/download/{task_id}`
4. Save the result locally before the retention window expires
