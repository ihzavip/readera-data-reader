
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import JSZip from "jszip";


function generateMarkdown(entry) {
  const title = entry?.data?.doc_title || "Untitled";
  const citations = entry?.citations || [];

  if (citations.length === 0) return "";

  const lines = citations.map((note) => {
    const word = note.note_body || "(empty)";
    const page = note.note_page ?? "?";
    const extra = note.note_extra;

    let line = `- Page ${page}: ${word}`;
    if (extra && extra.trim() !== "") {
      line += `\n  Note: ${extra}`;
    }
    return line;
  });

  return `## ${title}\n\n${lines.join("\n")}`;
}


function App() {
  const [output, setOutput] = useState([]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const fileName = file.name;
    const isBak = fileName.endsWith(".bak");
    const isZip = fileName.endsWith(".zip");

    if (isBak || isZip) {
      const zip = new JSZip();
      try {
        const renamedFile = new File([file], "renamed.zip", { type: "application/zip" });
        const content = await zip.loadAsync(renamedFile);

        const libraryFile = content.file("library.json");
        if (!libraryFile) {
          setOutput(["library.json not found in archive."]);
          return;
        }

        const text = await libraryFile.async("text");
        const output = JSON.parse(text).docs;

        const markdowns = output.map(generateMarkdown).filter(Boolean);
        setOutput(markdowns);
      } catch (err) {
        console.error(err);
        setOutput(["Failed to unzip or read library.json"]);
      }
    } else {
      setOutput(["Unsupported file type. Only .zip or disguised .bak accepted."]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/zip": [".zip"],
      "application/octet-stream": [".bak"],
    },
    multiple: false,
  });

  return (

    <div className="min-h-screen max-w-xl overflow-x-hidden flex flex-col items-center justify-center p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-yellow-900 underline">
        Upload .bak (renamed zip) or .zip
      </h1>

      <div
        {...getRootProps()}
        className={`border-4 border-dashed rounded-xl p-10 w-full max-w-xl text-center cursor-pointer transition ${isDragActive ? "border-yellow-600 bg-yellow-100" : "border-gray-300"
          }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-600">
          Drag and drop a <code>.bak</code> (zip disguised) or <code>.zip</code> file here, or click to select.
        </p>
      </div>

      {output.length > 0 && (

        <div className="max-w-screen">
          <pre className="mt-6 bg-white shadow p-4 rounded text-sm whitespace-pre-wrap break-words overflow-x-hidden">
            {output.join("\n\n")}
          </pre>

        </div>

      )}
    </div>
  );
}

export default App;

