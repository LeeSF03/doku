import { spawn } from "node:child_process"
import { randomUUID } from "node:crypto"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import sharp from "sharp"

import { type DocumentCorners } from "@/app/scan/review/_lib/process-document-image"

export const runtime = "nodejs"

type TransformResult = {
  error?: string
  width?: number
  height?: number
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("image")
  const cornersValue = formData.get("corners")

  if (!(file instanceof File)) {
    return Response.json({ error: "Missing image file." }, { status: 400 })
  }

  if (typeof cornersValue !== "string") {
    return Response.json(
      { error: "Missing document corners." },
      { status: 400 }
    )
  }

  let corners: DocumentCorners

  try {
    corners = JSON.parse(cornersValue) as DocumentCorners
  } catch {
    return Response.json(
      { error: "Document corners must be valid JSON." },
      { status: 400 }
    )
  }

  console.log("[document-transform:server] Received image.", {
    size: file.size,
    type: file.type,
    corners,
  })

  const imageBuffer = Buffer.from(await file.arrayBuffer())
  const transformed = await transformDocument(imageBuffer, corners)

  return new Response(transformed, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-store",
    },
  })
}

async function transformDocument(
  imageBuffer: Buffer,
  corners: DocumentCorners
) {
  const tempDirectory = await mkdtemp(join(tmpdir(), "doku-document-"))
  const inputPath = join(tempDirectory, `${randomUUID()}.png`)
  const outputPath = join(tempDirectory, `${randomUUID()}.jpg`)

  try {
    const normalizedImage = await sharp(imageBuffer).rotate().png().toBuffer()
    await writeFile(inputPath, normalizedImage)
    await mkdir(dirname(outputPath), { recursive: true })

    console.log("[document-transform:server] Running Python transformer.")

    const result = await runPythonTransformer(inputPath, outputPath, corners)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log("[document-transform:server] Transformed image.", {
      width: result.width,
      height: result.height,
    })

    return await readFile(outputPath)
  } finally {
    await rm(tempDirectory, { force: true, recursive: true })
  }
}

function runPythonTransformer(
  inputPath: string,
  outputPath: string,
  corners: DocumentCorners
) {
  return new Promise<TransformResult>((resolve, reject) => {
    const pythonExecutable = process.env.PYTHON_BIN ?? getPythonExecutable()
    const scriptPath = join("scripts", "python", "transform-document.py")
    const child = spawn(
      pythonExecutable,
      [scriptPath, inputPath, outputPath, JSON.stringify(corners)],
      {
        windowsHide: true,
      }
    )
    let stdout = ""
    let stderr = ""

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on("error", (error) => {
      reject(error)
    })
    child.on("close", (code) => {
      if (stderr.trim()) {
        console.log("[document-transform:server] Python transformer logs.", {
          logs: stderr.trim(),
        })
      }

      if (code !== 0) {
        reject(
          new Error(
            `Python document transformer exited with code ${code}: ${stderr.trim()}`
          )
        )
        return
      }

      try {
        resolve(JSON.parse(stdout) as TransformResult)
      } catch (error) {
        reject(
          new Error(
            `Python document transformer returned invalid JSON: ${
              error instanceof Error ? error.message : String(error)
            }`
          )
        )
      }
    })
  })
}

function getPythonExecutable() {
  if (process.platform === "win32") {
    return join("scripts", "python", ".venv", "Scripts", "python.exe")
  }

  return join("scripts", "python", ".venv", "bin", "python")
}
