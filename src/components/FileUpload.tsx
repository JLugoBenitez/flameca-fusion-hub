import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Upload, File, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface FileItem {
  id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  created_at: string;
}

interface FileUploadProps {
  orderId: string;
  bucketName: string;
  tableName: "custom_order_files" | "suit_repair_files";
  orderFieldName: "custom_order_id" | "suit_repair_id";
  files: FileItem[];
  onFilesChange: () => void;
}

export function FileUpload({ 
  orderId, 
  bucketName, 
  tableName, 
  orderFieldName,
  files, 
  onFilesChange 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<FileItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(selectedFiles)) {
        // Validar tamaño (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`El archivo ${file.name} es demasiado grande (máximo 10MB)`);
          continue;
        }

        // Generar nombre único para el archivo
        const fileExt = file.name.split('.').pop();
        const fileName = `${orderId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Subir archivo a Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          toast.error(`Error al subir ${file.name}: ${uploadError.message}`);
          continue;
        }

        // Obtener URL pública del archivo
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        // Guardar referencia en la base de datos
        const { error: dbError } = await supabase
          .from(tableName)
          .insert({
            [orderFieldName]: orderId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type || fileExt,
            uploaded_by: (await supabase.auth.getUser()).data.user?.id || null,
          });

        if (dbError) {
          console.error('Error saving file reference:', dbError);
          // Si falla la inserción en BD, eliminar el archivo del storage
          await supabase.storage.from(bucketName).remove([filePath]);
          toast.error(`Error al guardar referencia de ${file.name}`);
          continue;
        }

        toast.success(`${file.name} subido correctamente`);
      }

      onFilesChange();
    } catch (error: any) {
      console.error('Error in file upload:', error);
      toast.error('Error al subir archivos');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (file: FileItem) => {
    setDeletingFile(file.id);

    try {
      // Eliminar archivo del storage
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([file.file_path]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        toast.error('Error al eliminar archivo del almacenamiento');
      }

      // Eliminar referencia de la base de datos
      const { error: dbError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', file.id);

      if (dbError) {
        console.error('Error deleting file reference:', dbError);
        toast.error('Error al eliminar referencia del archivo');
        return;
      }

      toast.success('Archivo eliminado correctamente');
      onFilesChange();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast.error('Error al eliminar archivo');
    } finally {
      setDeletingFile(null);
      setDeleteConfirm(null);
    }
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="h-4 w-4" />;
    if (fileType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return data.publicUrl;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Archivos adjuntos</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !orderId}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Subir archivos
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => {
            const isImage = file.file_type?.startsWith('image/');
            const fileUrl = getFileUrl(file.file_path);
            
            return (
              <div
                key={file.id}
                className="border rounded-lg hover:bg-muted/50 transition-colors overflow-hidden"
              >
                {isImage ? (
                  <div className="p-3 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <img
                          src={fileUrl}
                          alt={file.file_name}
                          className="w-20 h-20 object-cover rounded border"
                          onError={(e) => {
                            // Si falla la carga de la imagen, mostrar icono
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:underline truncate block"
                        >
                          {file.file_name}
                        </a>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(file)}
                        disabled={deletingFile === file.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                      >
                        {deletingFile === file.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(file.file_type)}
                      <div className="flex-1 min-w-0">
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:underline truncate block"
                        >
                          {file.file_name}
                        </a>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(file)}
                      disabled={deletingFile === file.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {deletingFile === file.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {files.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay archivos adjuntos. Haz clic en "Subir archivos" para añadir archivos.
        </p>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el archivo "{deleteConfirm?.file_name}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

