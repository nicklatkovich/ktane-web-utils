import React from "react";

export interface FileUploaderProps {
  label: string;
  onLoad: (files: FileList | null) => unknown;
}

export const FileUploaderComponent: React.FC<FileUploaderProps> = (props) => {
  let input: HTMLInputElement | null = null;
  return <>
    <input
      type="file"
      className="hidden"
      onChange={(event) => props.onLoad(event.target.files)}
      ref={(node) => input = node}
      multiple={true}
    />
    <button onClick={() => input?.click()}>{props.label}</button>
  </>;
};
