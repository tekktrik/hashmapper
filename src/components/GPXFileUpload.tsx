import React from "react";
import { Form } from "react-bulma-components";

interface GPXFileUploadProps {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  filename: string;
}

export const GPXFileUpload: React.FC<GPXFileUploadProps> = ({
  onChange,
  filename,
}: GPXFileUploadProps) => {
  return (
    <Form.Label>
      <Form.InputFile
        className="m-6"
        boxed
        label="GPX File"
        align="center"
        filename={filename}
        onChange={onChange}
      />
    </Form.Label>
  );
};
