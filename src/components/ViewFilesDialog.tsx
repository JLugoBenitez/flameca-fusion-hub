import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, File, Image as ImageIcon, Download, Loader2 } from "lucide-react";
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

interface ViewFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  bucketName: string;
  tableName: "custom_order_files" | "suit_repair_files";
  orderFieldName: "custom_order_id" | "suit_repair_id";
  title: string;
  onFilesChange?: () => void;
}

export function ViewFilesDialog({
  open,
  onOpenChange,
  orderId,
  bucketName,
  tableName,
  orderFieldName,
  title,
  onFilesChange,
}: ViewFilesDialogProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<FileItem | null>(null);

  useEffect(() => {
    if (open && orderId) {
      fetchFiles();
    } else {
      setFiles([]);
    }
  }, [open, orderId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq(orderFieldName, orderId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      console.error("Error fetching files:", error);
      toast.error("Error al cargar archivos");
      setFiles([]);
    } finally {
      setLoading(false);
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
        console.error("Error deleting file from storage:", storageError);
        toast.error("Error al eliminar archivo del almacenamiento");
      }

      // Eliminar referencia de la base de datos
      const { error: dbError } = await supabase
        .from(tableName)
        .delete()
        .eq("id", file.id);

      if (dbError) {
        console.error("Error deleting file reference:", dbError);
        toast.error("Error al eliminar referencia del archivo");
        return;
      }

      toast.success("Archivo eliminado correctamente");
      fetchFiles();
      if (onFilesChange) {
        onFilesChange();
      }
    } catch (error: any) {
      console.error("Error deleting file:", error);
      toast.error("Error al eliminar archivo");
    } finally {
      setDeletingFile(null);
      setDeleteConfirm(null);
    }
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="h-5 w-5" />;
    if (fileType.startsWith("image/")) return <ImageIcon className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return data.publicUrl;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Archivos adjuntos ({files.length})
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <File className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay archivos adjuntos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => {
                const isImage = file.file_type?.startsWith('image/');
                const fileUrl = getFileUrl(file.file_path);
                
                return (
                  <div
                    key={file.id}
                    className="border rounded-lg hover:bg-muted/50 transition-colors overflow-hidden"
                  >
                    {isImage ? (
                      <div className="p-4 space-y-3">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <img
                              src={fileUrl}
                              alt={file.file_name}
                              className="w-32 h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(fileUrl, '_blank')}
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
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.file_size)}
                              </p>
                              <span className="text-xs text-muted-foreground">•</span>
                              <p className="text-xs text-muted-foreground">
                                {new Date(file.created_at).toLocaleDateString("es-ES", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={file.file_name}
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button
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
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
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
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.file_size)}
                              </p>
                              <span className="text-xs text-muted-foreground">•</span>
                              <p className="text-xs text-muted-foreground">
                                {new Date(file.created_at).toLocaleDateString("es-ES", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={file.file_name}
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
    </>
  );
}

