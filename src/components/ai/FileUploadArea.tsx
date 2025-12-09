import { useCallback, useState } from 'react';
import { Upload, X, FileVideo, FileAudio, Image, File, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
  file: File;
  preview?: string;
  type: 'video' | 'audio' | 'image' | 'document';
}

interface FileUploadAreaProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  selectedFiles: UploadedFile[];
  onRemoveFile: (index: number) => void;
  isUploading?: boolean;
  compact?: boolean;
}

const getFileType = (file: File): UploadedFile['type'] => {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('image/')) return 'image';
  return 'document';
};

const FileIcon = ({ type }: { type: UploadedFile['type'] }) => {
  switch (type) {
    case 'video':
      return <FileVideo className="h-5 w-5 text-blue-500" />;
    case 'audio':
      return <FileAudio className="h-5 w-5 text-purple-500" />;
    case 'image':
      return <Image className="h-5 w-5 text-green-500" />;
    default:
      return <File className="h-5 w-5 text-muted-foreground" />;
  }
};

export function FileUploadArea({
  onFilesSelected,
  selectedFiles,
  onRemoveFile,
  isUploading = false,
  compact = false,
}: FileUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const uploadedFiles: UploadedFile[] = files.map((file) => ({
        file,
        type: getFileType(file),
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));

      onFilesSelected(uploadedFiles);
    },
    [onFilesSelected]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const uploadedFiles: UploadedFile[] = Array.from(files).map((file) => ({
      file,
      type: getFileType(file),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    onFilesSelected(uploadedFiles);
    e.target.value = ''; // Reset input
  };

  if (selectedFiles.length > 0) {
    return (
      <div className="space-y-2">
        {selectedFiles.map((uploadedFile, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg",
              "bg-muted/50 border border-border"
            )}
          >
            {uploadedFile.preview ? (
              <img
                src={uploadedFile.preview}
                alt=""
                className="h-10 w-10 rounded object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                <FileIcon type={uploadedFile.type} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {uploadedFile.file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <button
                onClick={() => onRemoveFile(index)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "relative border-2 border-dashed rounded-lg transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50",
        compact ? "p-3" : "p-4"
      )}
    >
      <input
        type="file"
        multiple
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept="video/*,audio/*,image/*,.pdf,.doc,.docx"
      />
      <div className={cn(
        "flex items-center gap-3 text-center",
        compact ? "flex-row" : "flex-col"
      )}>
        <div className={cn(
          "p-2 rounded-full bg-primary/10",
          compact ? "" : "mx-auto"
        )}>
          <Upload className={cn(
            "text-primary",
            compact ? "h-4 w-4" : "h-5 w-5"
          )} />
        </div>
        <div className={compact ? "text-left" : ""}>
          <p className={cn(
            "font-medium text-foreground",
            compact ? "text-xs" : "text-sm"
          )}>
            {compact ? "Add files" : "Drop files here or click to upload"}
          </p>
          {!compact && (
            <p className="text-xs text-muted-foreground mt-1">
              Video, audio, images, or documents
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
