import React from "react";
import type { IntakeDocumentUploadKind, IntakeIdentityDocuments } from "../../types/intake";

interface DocumentUploadsProps {
  documents: IntakeIdentityDocuments;
  uploading: Record<string, boolean>;
  onUpload: (file: File, kind: IntakeDocumentUploadKind) => void;
}

function UploadField({
  label,
  kind,
  uploadedUrl,
  uploading,
  onUpload,
}: {
  label: string;
  kind: IntakeDocumentUploadKind;
  uploadedUrl: string;
  uploading: boolean;
  onUpload: (file: File, kind: IntakeDocumentUploadKind) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file, kind);
        }}
        className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-200 file:text-xs file:font-medium file:bg-slate-50 hover:file:bg-slate-100"
      />
      {uploading && <p className="mt-1 text-xs text-slate-500">Uploading...</p>}
      {!uploading && uploadedUrl && (
        <div className="mt-2">
          <img src={uploadedUrl} alt={label} className="h-20 w-auto rounded border border-slate-200 object-cover" />
          <p className="mt-1 text-xs text-emerald-600">Uploaded.</p>
        </div>
      )}
    </div>
  );
}

export default function DocumentUploads({ documents, uploading, onUpload }: DocumentUploadsProps) {
  return (
    <div className="sm:col-span-2">
      <label className="block text-sm font-medium text-slate-700 mb-2">Identity documents</label>
      <p className="text-xs text-slate-500 mb-3">
        Upload both front and back for Driver License and State ID.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <UploadField
          label="Driver license - front"
          kind="driver-license-front"
          uploadedUrl={documents.driverLicenseUrlFront}
          uploading={Boolean(uploading["driver-license-front"])}
          onUpload={onUpload}
        />
        <UploadField
          label="Driver license - back"
          kind="driver-license-back"
          uploadedUrl={documents.driverLicenseUrlBack}
          uploading={Boolean(uploading["driver-license-back"])}
          onUpload={onUpload}
        />
        <UploadField
          label="State ID - front"
          kind="state-id-front"
          uploadedUrl={documents.stateIdUrlFront}
          uploading={Boolean(uploading["state-id-front"])}
          onUpload={onUpload}
        />
        <UploadField
          label="State ID - back"
          kind="state-id-back"
          uploadedUrl={documents.stateIdUrlBack}
          uploading={Boolean(uploading["state-id-back"])}
          onUpload={onUpload}
        />
      </div>
    </div>
  );
}
