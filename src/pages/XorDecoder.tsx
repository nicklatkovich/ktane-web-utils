import React, { useMemo, useState } from "react";

const decodeBase64 = (value: string): Uint8Array => {
  const normalized = value.replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) throw new Error("Invalid Base64");
  const data = normalized.replace(/=+$/, "");
  if (data.length % 4 === 1) throw new Error("Invalid Base64 length");
  const padded = data + "=".repeat((4 - (data.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const encodeBase64 = (data: Uint8Array): string => {
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return binary;
};

const xor = (input: Uint8Array, keyA: Uint8Array, keyB: Uint8Array, offset = 0): Uint8Array => {
  return input.map(
    (byte, i) =>
      byte ^
      (keyA.length ? keyA[(i + offset) % keyA.length] : 0) ^
      (keyB.length ? keyB[(i + offset) % keyB.length] : 0),
  );
};

export const XorDecoderPage: React.FC = () => {
  const [keyAInput, setKeyAInput] = useState("");
  const [keyBInput, setKeyBInput] = useState("");
  const [dataInput, setDataInput] = useState("");

  const { result, error } = useMemo(() => {
    try {
      const keyA = keyAInput.trim() ? decodeBase64(keyAInput) : new Uint8Array(0);
      const keyB = keyBInput.trim() ? decodeBase64(keyBInput) : new Uint8Array(0);
      const lines = dataInput.split(/\r?\n/);
      let offset = 0;
      const output = lines.map((line) => {
        if (!line.trim()) return "";
        const decoded = decodeBase64(line);
        const lineResult = encodeBase64(xor(decoded, keyA, keyB, offset));
        offset += decoded.length;
        return lineResult;
      });
      return { result: output.join("\n"), error: "" };
    } catch (e) {
      return { result: "", error: e instanceof Error ? e.message : "Unknown error" };
    }
  }, [keyAInput, keyBInput, dataInput]);
  return (
    <div className="xor-decoder-page">
      <div>
        <label htmlFor="key-a">Key A (Base64)</label>
        <input
          id="key-a"
          type="text"
          value={keyAInput}
          onChange={(e) => setKeyAInput(e.target.value)}
          placeholder="Enter key A"
          spellCheck={false}
        />
      </div>

      <div>
        <label htmlFor="key-b">Key B (Base64)</label>
        <input
          id="key-b"
          type="text"
          value={keyBInput}
          onChange={(e) => setKeyBInput(e.target.value)}
          placeholder="Enter key B"
          spellCheck={false}
        />
      </div>

      <div>
        <label htmlFor="data-input">Data (Base64, one value per line)</label>
        <textarea
          id="data-input"
          value={dataInput}
          onChange={(e) => setDataInput(e.target.value)}
          placeholder={"SGVsbG8\nV29ybGQ"}
          rows={8}
          spellCheck={false}
        />
      </div>

      <div>
        <label htmlFor="result">Result (UTF-8)</label>
        <textarea id="result" value={result} readOnly rows={8} spellCheck={false} />
      </div>

      {error && (
        <div role="alert" style={{ color: "red" }}>
          {error}
        </div>
      )}
    </div>
  );
};
