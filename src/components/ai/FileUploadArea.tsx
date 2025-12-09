import { useCallback, useState } from 'react';
import { Upload, X, FileVideo, FileAudio, Image, File, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UploadedFile {
  file: File;
  preview?: string;
  type: 'video' | 'audio' | 'image' | 'document';
  uploadProgress?: number;
  uploadedUrl?: string;
  projectId?: string;
}

interface FileUploadAreaProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  selectedFiles: UploadedFile[];
  onRemoveFile: (index: number) => void;
  isUploading?: boolean;
  compact?: boolean;
  autoUpload?: boolean;
  onUploadComplete?: (files: UploadedFile[]) => void;
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
  autoUpload = false,
  onUploadComplete,
}: FileUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadToStorage = async (file: UploadedFile): Promise<UploadedFile> => {
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('media-uploads')
      .upload(filePath, file.file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media-uploads')
      .getPublicUrl(filePath);

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: file.file.name.replace(/\.[^/.]+$/, ''),
        source_file_url: urlData.publicUrl,
        source_file_name: file.file.name,
        source_file_size: file.file.size,
        source_file_type: file.type,
        status: 'uploaded',
      })
      .select()
      .single();

    if (projectError) throw projectError;

    return {
      ...file,
      uploadedUrl: urlData.publicUrl,
      projectId: project.id,
    };
  };

  const handleFilesWithUpload = async (files: UploadedFile[]) => {
    if (!autoUpload) {
      onFilesSelected(files);
      return;
    }

    setUploading(true);
    
    try {
      const uploadedFiles: UploadedFile[] = [];
      
      for (const file of files) {
        try {
          const uploaded = await uploadToStorage(file);
          uploadedFiles.push(uploaded);
        } catch (error) {
          console.error('Upload error:', error);
          toast({
            title: 'Upload failed',
            description: `Failed to upload ${file.file.name}`,
            variant: 'destructive',
          });
        }
      }

      if (uploadedFiles.length > 0) {
        onFilesSelected(uploadedFiles);
        onUploadComplete?.(uploadedFiles);
        toast({
          title: 'Upload complete!',
          description: `${uploadedFiles.length} file(s) ready to Alchify`,
        });
      }
    } finally {
      setUploading(false);
    }
  };

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

      handleFilesWithUpload(uploadedFiles);
    },
    [onFilesSelected, autoUpload]
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

    handleFilesWithUpload(uploadedFiles);
    e.target.value = ''; // Reset input
  };

  if (uploading) {
    return (
      <div className={cn(
        "flex items-center justify-center gap-3 p-4 rounded-lg",
        "bg-primary/5 border-2 border-primary/20"
      )}>
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-medium">Uploading and creating project...</span>
      </div>
    );
  }

  if (selectedFiles.length > 0) {
    return (
      <div className="space-y-2">
        {selectedFiles.map((uploadedFile, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg",
              uploadedFile.uploadedUrl 
                ? "bg-green-500/10 border border-green-500/30" 
                : "bg-muted/50 border border-border"
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
                {uploadedFile.uploadedUrl && (
                  <span className="text-green-600 ml-2">• Uploaded</span>
                )}
              </p>
            </div>
            {uploadedFile.uploadedUrl ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : isUploading ? (
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
