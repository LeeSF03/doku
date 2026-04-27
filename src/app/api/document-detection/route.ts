import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";

import { type DocumentCorners } from "@/app/scan/review/_lib/process-document-image";

export const runtime = "nodejs";

type DetectionResult = {
  corners: DocumentCorners | null;
  error?: string;
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return Response.json({ error: "Missing image file." }, { status: 400 });
  }

  console.log("[document-detection:server] Received image.", {
    size: file.size,
    type: file.type,
  });

  const imageBuffer = Buffer.from(await file.arrayBuffer());
  const corners = await detectDocumentCorners(imageBuffer);

  return Response.json({ corners });
}

async function detectDocumentCorners(imageBuffer: Buffer) {
  const tempDirectory = await mkdtemp(join(tmpdir(), "doku-document-"));
  const imagePath = join(tempDirectory, `${randomUUID()}.png`);

  try {
    const normalizedImage = await sharp(imageBuffer).rotate().png().toBuffer();
    await writeFile(imagePath, normalizedImage);

    console.log("[document-detection:server] Running Python detector.");

    const result = await runPythonDetector(imagePath);

    if (result.error) {
      console.warn("[document-detection:server] Python detector error.", {
        error: result.error,
      });
    }

    if (result.corners) {
      console.log("[document-detection:server] Using Python corners.", {
        corners: result.corners,
      });
    } else {
      console.log("[document-detection:server] Python detector found no corners.");
    }

    return result.corners;
  } finally {
    await rm(tempDirectory, { force: true, recursive: true });
  }
}

function runPythonDetector(imagePath: string) {
  return new Promise<DetectionResult>((resolve, reject) => {
    const pythonExecutable = process.env.PYTHON_BIN ?? getPythonExecutable();
    const scriptPath = join("scripts", "python", "detect-document.py");
    const child = spawn(pythonExecutable, [scriptPath, imagePath], {
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      reject(error);
    });
    child.on("close", (code) => {
      if (stderr.trim()) {
        console.log("[document-detection:server] Python detector logs.", {
          logs: stderr.trim(),
        });
      }

      if (code !== 0) {
        reject(
          new Error(
            `Python document detector exited with code ${code}: ${stderr.trim()}`
          )
        );
        return;
      }

      try {
        resolve(JSON.parse(stdout) as DetectionResult);
      } catch (error) {
        reject(
          new Error(
            `Python document detector returned invalid JSON: ${
              error instanceof Error ? error.message : String(error)
            }`
          )
        );
      }
    });
  });
}

function getPythonExecutable() {
  if (process.platform === "win32") {
    return join("scripts", "python", ".venv", "Scripts", "python.exe");
  }

  return join("scripts", "python", ".venv", "bin", "python");
}
