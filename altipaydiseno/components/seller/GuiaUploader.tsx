import { useState } from 'react';
import { UploadCloud, File as FileIcon, CheckCircle2, X } from 'lucide-react';

export function GuiaUploader({ onUpload }: { onUpload: (file: File | null) => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (newFile: File) => {
    setFile(newFile);
    onUpload(newFile);
  };

  const removeFile = () => {
    setFile(null);
    onUpload(null);
  };

  if (file) {
    return (
      <div className="relative mt-2 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <FileIcon className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-primary" />
          <button onClick={removeFile} className="rounded-full p-1 text-muted-foreground hover:bg-muted" aria-label="Remove file">
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <UploadCloud className="size-6" />
      </div>
      <p className="mt-4 text-sm font-medium">Foto de la guía (Opcional)</p>
      <p className="mt-1 text-xs text-muted-foreground">Arrastra y suelta aquí o busca en tu dispositivo</p>
      <label className="mt-4 cursor-pointer rounded-lg bg-background px-4 py-2 text-xs font-semibold shadow-sm border border-border hover:bg-muted">
        Seleccionar imagen
        <input type="file" className="hidden" accept="image/*" onChange={handleChange} />
      </label>
    </div>
  );
}
