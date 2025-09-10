"use server";

import { PDFLoader } from "langchain/document_loaders/fs/pdf";

export async function parsePdf(formData: FormData) {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      throw new Error("No file provided");
    }

    const loader = new PDFLoader(file);
    const docs = await loader.load();
    const fullText = docs.map((doc) => doc.pageContent).join("\n");

    return {
      success: true,
      text: fullText,
    };
  } catch (error) {
    console.error("Error parsing PDF:", error);

    return {
      success: false,
      error: "Failed to parse PDF",
    };
  }
}
