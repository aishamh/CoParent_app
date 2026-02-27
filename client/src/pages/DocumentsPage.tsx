import { useState, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, supabaseApi } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  FileArchive,
  File as FileIcon,
  Trash2,
  Download,
  Share2,
  FolderOpen,
  Search,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  X,
  Info,
  CloudUpload,
  HardDrive,
  Clock,
  ArrowUpRight,
  Eye,
  FileSpreadsheet,
  FileType,
  Loader2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import type { Child } from "@shared/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentRecord {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_size: number;
  file_type: string;
  category: string | null;
  child_id: number | null;
  uploaded_by: string;
  tags: string[] | null;
  shared_with: string[] | null;
  created_at: string;
  updated_at: string;
}

interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

type SortField = "date" | "name" | "size";
type SortDirection = "asc" | "desc";
type ViewMode = "grid" | "list";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "medical", label: "Medical" },
  { value: "legal", label: "Legal" },
  { value: "receipt", label: "Receipts" },
  { value: "school", label: "School" },
  { value: "court", label: "Court" },
  { value: "other", label: "Other" },
] as const;

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  medical: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  legal: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  receipt: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  school: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  court: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  other: { bg: "bg-slate-50", text: "text-slate-700", dot: "bg-slate-400" },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getFileIcon(fileType: string, size: "sm" | "md" | "lg" = "md") {
  const sizeClasses = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-8 w-8" };
  const cls = sizeClasses[size];

  if (fileType.startsWith("image/"))
    return <ImageIcon className={cls} />;
  if (fileType.includes("pdf"))
    return <FileText className={cls} />;
  if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv"))
    return <FileSpreadsheet className={cls} />;
  if (fileType.includes("zip") || fileType.includes("archive") || fileType.includes("rar") || fileType.includes("7z"))
    return <FileArchive className={cls} />;
  if (fileType.includes("word") || fileType.includes("document"))
    return <FileType className={cls} />;
  return <FileIcon className={cls} />;
}

function getFileIconBg(fileType: string): string {
  if (fileType.startsWith("image/")) return "bg-pink-100 text-pink-600";
  if (fileType.includes("pdf")) return "bg-red-100 text-red-600";
  if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv"))
    return "bg-green-100 text-green-600";
  if (fileType.includes("zip") || fileType.includes("archive"))
    return "bg-yellow-100 text-yellow-600";
  if (fileType.includes("word") || fileType.includes("document"))
    return "bg-blue-100 text-blue-600";
  return "bg-slate-100 text-slate-600";
}

function getCategoryStyle(category: string | null) {
  return CATEGORY_COLORS[category || "other"] || CATEGORY_COLORS.other;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // UI state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [deleteTarget, setDeleteTarget] = useState<DocumentRecord | null>(null);

  // Drag & drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other",
    childId: 0,
  });

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const { data: documents = [], isLoading: isLoadingDocs } = useQuery<DocumentRecord[]>({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabaseApi.getDocuments();
      if (error) throw error;
      return (data || []) as DocumentRecord[];
    },
  });

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["children"],
    queryFn: async () => {
      const { data, error } = await supabaseApi.getChildren();
      if (error) throw error;
      return (data || []) as Child[];
    },
  });

  // ---------------------------------------------------------------------------
  // Upload logic (Supabase Storage)
  // ---------------------------------------------------------------------------

  const uploadToSupabase = useCallback(
    async (file: File, metadata: { title: string; description: string; category: string; childId: number }) => {
      const userId = user?.id;
      if (!userId) throw new Error("You must be signed in to upload documents.");

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds the 10 MB limit. Your file is ${formatFileSize(file.size)}.`);
      }

      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${userId}/${timestamp}-${sanitizedName}`;

      // Simulate progress during upload
      let progressInterval: ReturnType<typeof setInterval> | null = null;
      let currentProgress = 0;

      const startProgress = () => {
        progressInterval = setInterval(() => {
          currentProgress = Math.min(currentProgress + Math.random() * 15, 85);
          setUploadProgress(Math.round(currentProgress));
        }, 200);
      };

      const stopProgress = () => {
        if (progressInterval) clearInterval(progressInterval);
      };

      try {
        startProgress();

        // Upload file to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from("documents")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        let publicUrl = "";

        if (storageError) {
          // Fallback: save metadata only with a placeholder URL
          console.warn("Storage upload failed, saving metadata only:", storageError.message);
          publicUrl = `placeholder://${filePath}`;
          toast({
            title: "File storage unavailable",
            description: "Document metadata was saved but the file could not be stored. You can try re-uploading later.",
          });
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from("documents")
            .getPublicUrl(storageData.path);
          publicUrl = urlData.publicUrl;
        }

        setUploadProgress(90);

        // Save document metadata to database
        const { data: doc, error: dbError } = await supabase
          .from("documents")
          .insert({
            title: metadata.title || file.name,
            description: metadata.description || null,
            file_path: publicUrl,
            file_size: file.size,
            file_type: file.type || "application/octet-stream",
            category: metadata.category || "other",
            child_id: metadata.childId || null,
            uploaded_by: userId,
            tags: [],
            shared_with: [],
          })
          .select()
          .single();

        if (dbError) throw dbError;

        setUploadProgress(100);
        stopProgress();
        return doc;
      } catch (err) {
        stopProgress();
        throw err;
      }
    },
    [user, toast],
  );

  const uploadMutation = useMutation({
    mutationFn: async ({ file, metadata }: { file: File; metadata: typeof formData }) => {
      return uploadToSupabase(file, metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Document uploaded", description: "Your document has been uploaded successfully." });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Something went wrong. Please try again.",
      });
      setUploadProgress(0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: DocumentRecord) => {
      // Try to delete from storage first (ignore errors since file may not exist)
      if (doc.file_path && !doc.file_path.startsWith("placeholder://")) {
        // Extract the storage path from the public URL
        const pathMatch = doc.file_path.match(/\/documents\/(.+)$/);
        if (pathMatch) {
          await supabase.storage.from("documents").remove([pathMatch[1]]);
        }
      }
      // Delete metadata from database
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Document deleted", description: "The document has been removed." });
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message || "Could not delete the document.",
      });
    },
  });

  // ---------------------------------------------------------------------------
  // Form helpers
  // ---------------------------------------------------------------------------

  const resetForm = useCallback(() => {
    setIsUploadDialogOpen(false);
    setSelectedFile(null);
    setUploadProgress(0);
    setFormData({ title: "", description: "", category: "other", childId: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `Maximum file size is 10 MB. Your file is ${formatFileSize(file.size)}.`,
        });
        return;
      }

      setSelectedFile(file);
      if (!formData.title) {
        setFormData((prev) => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
      }
    },
    [formData.title, toast],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedFile) {
        toast({ variant: "destructive", title: "No file selected", description: "Please select a file to upload." });
        return;
      }
      uploadMutation.mutate({ file: selectedFile, metadata: formData });
    },
    [selectedFile, formData, uploadMutation, toast],
  );

  // ---------------------------------------------------------------------------
  // Drag & drop (multi-file quick upload)
  // ---------------------------------------------------------------------------

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if we actually left the drop zone (not a child element)
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processDroppedFiles = useCallback(
    async (files: File[]) => {
      if (!user?.id) {
        toast({ variant: "destructive", title: "Not signed in", description: "Please sign in to upload files." });
        return;
      }

      const validFiles = files.filter((f) => {
        if (f.size > MAX_FILE_SIZE) {
          toast({
            variant: "destructive",
            title: `Skipped: ${f.name}`,
            description: "File exceeds 10 MB limit.",
          });
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      const queueItems: UploadQueueItem[] = validFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        progress: 0,
        status: "pending" as const,
      }));

      setUploadQueue((prev) => [...prev, ...queueItems]);

      // Upload files sequentially
      for (const item of queueItems) {
        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "uploading" as const, progress: 10 } : q)),
        );

        try {
          const timestamp = Date.now();
          const sanitizedName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const filePath = `${user.id}/${timestamp}-${sanitizedName}`;

          // Simulate incremental progress
          let progress = 10;
          const interval = setInterval(() => {
            progress = Math.min(progress + Math.random() * 20, 80);
            setUploadQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, progress: Math.round(progress) } : q)),
            );
          }, 250);

          const { data: storageData, error: storageError } = await supabase.storage
            .from("documents")
            .upload(filePath, item.file, { cacheControl: "3600", upsert: false });

          clearInterval(interval);

          let publicUrl = "";
          if (storageError) {
            publicUrl = `placeholder://${filePath}`;
          } else {
            const { data: urlData } = supabase.storage
              .from("documents")
              .getPublicUrl(storageData.path);
            publicUrl = urlData.publicUrl;
          }

          setUploadQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, progress: 90 } : q)),
          );

          const { error: dbError } = await supabase
            .from("documents")
            .insert({
              title: item.file.name.replace(/\.[^/.]+$/, ""),
              description: null,
              file_path: publicUrl,
              file_size: item.file.size,
              file_type: item.file.type || "application/octet-stream",
              category: "other",
              child_id: null,
              uploaded_by: user.id,
              tags: [],
              shared_with: [],
            })
            .select()
            .single();

          if (dbError) throw dbError;

          setUploadQueue((prev) =>
            prev.map((q) =>
              q.id === item.id ? { ...q, progress: 100, status: "complete" as const } : q,
            ),
          );
        } catch (err: any) {
          setUploadQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: "error" as const, error: err?.message || "Upload failed" }
                : q,
            ),
          );
        }
      }

      // Refresh documents list
      queryClient.invalidateQueries({ queryKey: ["documents"] });

      // Clear completed items after a delay
      setTimeout(() => {
        setUploadQueue((prev) => prev.filter((q) => q.status !== "complete"));
      }, 3000);
    },
    [user, toast, queryClient],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        processDroppedFiles(droppedFiles);
      }
    },
    [processDroppedFiles],
  );

  const clearQueueItem = useCallback((id: string) => {
    setUploadQueue((prev) => prev.filter((q) => q.id !== id));
  }, []);

  // ---------------------------------------------------------------------------
  // Filtering, sorting, searching
  // ---------------------------------------------------------------------------

  const filteredAndSorted = useMemo(() => {
    let result = [...documents];

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((d) => d.category === selectedCategory);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q)) ||
          d.file_type.toLowerCase().includes(q),
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "name":
          cmp = a.title.localeCompare(b.title);
          break;
        case "size":
          cmp = a.file_size - b.file_size;
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [documents, selectedCategory, searchQuery, sortField, sortDirection]);

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  const totalSize = useMemo(() => documents.reduce((sum, d) => sum + d.file_size, 0), [documents]);

  const documentsByCategory = useMemo(
    () =>
      documents.reduce<Record<string, number>>((acc, d) => {
        const cat = d.category || "other";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {}),
    [documents],
  );

  const recentUploads = useMemo(
    () =>
      [...documents]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [documents],
  );

  // ---------------------------------------------------------------------------
  // Toggle helpers
  // ---------------------------------------------------------------------------

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("desc");
      }
    },
    [sortField],
  );

  const handleDownload = useCallback((doc: DocumentRecord) => {
    if (doc.file_path.startsWith("placeholder://")) {
      return;
    }
    window.open(doc.file_path, "_blank");
  }, []);

  const isImageType = useCallback((fileType: string) => fileType.startsWith("image/"), []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Layout>
      <div className="space-y-6">
        {/* Gradient Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-600 p-6 md:p-8 text-white shadow-lg"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <FolderOpen className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                Documents
              </h1>
              <p className="text-teal-100 mt-1 text-sm md:text-base">
                Securely store and organize important files
              </p>
            </div>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-white text-teal-700 hover:bg-teal-50 shadow-md font-semibold"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                      Upload and organize important documents. Max file size: 10 MB.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {/* File picker area */}
                    <div className="space-y-2">
                      <Label htmlFor="file">File</Label>
                      <div
                        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          id="file"
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        {selectedFile ? (
                          <div className="flex items-center gap-3 justify-center">
                            <div className={`p-2 rounded-lg ${getFileIconBg(selectedFile.type)}`}>
                              {getFileIcon(selectedFile.type)}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-foreground truncate max-w-[300px]">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(selectedFile.size)}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <CloudUpload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click to select a file
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              PDF, images, documents up to 10 MB
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Medical Receipt - Dr. Smith"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="medical">Medical</SelectItem>
                            <SelectItem value="legal">Legal</SelectItem>
                            <SelectItem value="receipt">Receipt</SelectItem>
                            <SelectItem value="school">School</SelectItem>
                            <SelectItem value="court">Court</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="childId">Child (optional)</Label>
                        <Select
                          value={formData.childId.toString()}
                          onValueChange={(value) =>
                            setFormData({ ...formData, childId: parseInt(value) })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">None</SelectItem>
                            {children.map((child) => (
                              <SelectItem key={child.id} value={child.id.toString()}>
                                {child.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Add any additional notes..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    {/* Upload progress */}
                    {uploadMutation.isPending && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Uploading...</span>
                          <span className="font-medium">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      disabled={uploadMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={uploadMutation.isPending || !selectedFile}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      {uploadMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Known limitation banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 text-sm text-blue-800"
        >
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
          <span>Document sharing with the other parent is coming soon.</span>
        </motion.div>

        {/* Drag & Drop Zone */}
        <motion.div
          ref={dropZoneRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed transition-all duration-300 ${
            isDragOver
              ? "border-teal-400 bg-teal-50 shadow-lg shadow-teal-100 scale-[1.01]"
              : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
          }`}
        >
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <motion.div
              animate={isDragOver ? { scale: 1.2, rotate: 5 } : { scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <CloudUpload
                className={`h-10 w-10 mb-3 transition-colors ${
                  isDragOver ? "text-teal-500" : "text-slate-400"
                }`}
              />
            </motion.div>
            <p
              className={`text-sm font-medium transition-colors ${
                isDragOver ? "text-teal-700" : "text-slate-600"
              }`}
            >
              {isDragOver ? "Drop files to upload" : "Drag and drop files here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or use the Upload button above - supports multiple files
            </p>
          </div>
        </motion.div>

        {/* Upload Queue */}
        <AnimatePresence>
          {uploadQueue.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
                Upload Queue
              </h3>
              {uploadQueue.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm"
                >
                  <div className={`p-1.5 rounded-md ${getFileIconBg(item.file.type)}`}>
                    {getFileIcon(item.file.type, "sm")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress
                        value={item.progress}
                        className={`h-1.5 flex-1 ${
                          item.status === "error" ? "[&>div]:bg-red-500" : ""
                        } ${item.status === "complete" ? "[&>div]:bg-emerald-500" : ""}`}
                      />
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {item.status === "complete"
                          ? "Done"
                          : item.status === "error"
                            ? "Err"
                            : `${item.progress}%`}
                      </span>
                    </div>
                    {item.error && (
                      <p className="text-xs text-red-500 mt-0.5">{item.error}</p>
                    )}
                  </div>
                  {(item.status === "complete" || item.status === "error") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => clearQueueItem(item.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Documents
                </CardTitle>
                <div className="p-2 bg-teal-100 rounded-lg">
                  <FileIcon className="h-4 w-4 text-teal-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documents.length}</div>
                <p className="text-xs text-muted-foreground mt-1">files uploaded</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Storage Used
                </CardTitle>
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <HardDrive className="h-4 w-4 text-cyan-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
                <p className="text-xs text-muted-foreground mt-1">total size</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Categories
                </CardTitle>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Grid3X3 className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(documentsByCategory).length}
                </div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {Object.entries(documentsByCategory)
                    .slice(0, 3)
                    .map(([cat, count]) => (
                      <span
                        key={cat}
                        className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full ${getCategoryStyle(cat).bg} ${getCategoryStyle(cat).text}`}
                      >
                        {count} {cat}
                      </span>
                    ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Recent Uploads
                </CardTitle>
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                {recentUploads.length > 0 ? (
                  <div className="space-y-1">
                    {recentUploads.slice(0, 2).map((doc) => (
                      <div key={doc.id} className="flex items-center gap-1.5">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${getCategoryStyle(doc.category).dot}`}
                        />
                        <span className="text-xs truncate text-muted-foreground max-w-[120px]">
                          {doc.title}
                        </span>
                      </div>
                    ))}
                    {recentUploads.length > 2 && (
                      <p className="text-[10px] text-muted-foreground/60">
                        +{recentUploads.length - 2} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No uploads yet</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Toolbar: search, filter chips, sort, view toggle */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* Search & view controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Sort buttons */}
              <div className="flex items-center border rounded-lg overflow-hidden">
                {(["date", "name", "size"] as SortField[]).map((field) => (
                  <Button
                    key={field}
                    variant="ghost"
                    size="sm"
                    className={`rounded-none text-xs h-9 px-3 ${
                      sortField === field
                        ? "bg-teal-50 text-teal-700 font-medium"
                        : ""
                    }`}
                    onClick={() => toggleSort(field)}
                  >
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                    {sortField === field &&
                      (sortDirection === "asc" ? (
                        <SortAsc className="h-3 w-3 ml-1" />
                      ) : (
                        <SortDesc className="h-3 w-3 ml-1" />
                      ))}
                  </Button>
                ))}
              </div>

              {/* View toggle */}
              <div className="flex items-center border rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-none h-9 px-2.5 ${
                    viewMode === "grid" ? "bg-teal-50 text-teal-700" : ""
                  }`}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-none h-9 px-2.5 ${
                    viewMode === "list" ? "bg-teal-50 text-teal-700" : ""
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Category filter chips */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.value;
              const count =
                cat.value === "all"
                  ? documents.length
                  : documentsByCategory[cat.value] || 0;
              const style =
                cat.value !== "all" ? getCategoryStyle(cat.value) : null;
              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? cat.value === "all"
                        ? "bg-teal-600 text-white shadow-sm"
                        : `${style!.bg} ${style!.text} ring-2 ring-offset-1 ring-current/20`
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.value !== "all" && style && (
                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  )}
                  {cat.label}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? cat.value === "all"
                          ? "bg-white/20 text-white"
                          : "bg-white/80"
                        : "bg-slate-200/80"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Document List / Grid */}
        <div>
          {isLoadingDocs ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-2/3" />
                    <div className="flex gap-2 mt-4">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 px-6 text-center">
                  <div className="mx-auto w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <FolderOpen className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">
                    {searchQuery || selectedCategory !== "all"
                      ? "No documents found"
                      : "No documents yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                    {searchQuery || selectedCategory !== "all"
                      ? "Try adjusting your search or filter to find what you're looking for."
                      : "Upload your first document to keep important files organized and accessible."}
                  </p>
                  {!searchQuery && selectedCategory === "all" && (
                    <Button
                      className="bg-teal-600 hover:bg-teal-700"
                      onClick={() => setIsUploadDialogOpen(true)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload your first document
                    </Button>
                  )}
                  {(searchQuery || selectedCategory !== "all") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : viewMode === "grid" ? (
            /* ---- Grid View ---- */
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredAndSorted.map((doc) => {
                const catStyle = getCategoryStyle(doc.category);
                return (
                  <motion.div key={doc.id} variants={itemVariants} layout>
                    <Card className="group border-0 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                      {/* Image preview for image files */}
                      {isImageType(doc.file_type) &&
                        !doc.file_path.startsWith("placeholder://") && (
                          <div className="relative h-36 bg-slate-100 overflow-hidden">
                            <img
                              src={doc.file_path}
                              alt={doc.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          </div>
                        )}
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className={`p-2.5 rounded-xl ${getFileIconBg(doc.file_type)} shrink-0`}
                          >
                            {getFileIcon(doc.file_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate" title={doc.title}>
                              {doc.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatFileSize(doc.file_size)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <Badge
                            variant="secondary"
                            className={`${catStyle.bg} ${catStyle.text} border-0 text-xs font-medium`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${catStyle.dot} mr-1.5`}
                            />
                            {(doc.category || "other").charAt(0).toUpperCase() +
                              (doc.category || "other").slice(1)}
                          </Badge>
                        </div>

                        {doc.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {doc.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(doc.created_at), "MMM d, yyyy")}
                          </span>
                          <span className="text-muted-foreground/60">
                            {formatDistanceToNow(new Date(doc.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs h-8"
                            onClick={() => handleDownload(doc)}
                            disabled={doc.file_path.startsWith("placeholder://")}
                          >
                            {isImageType(doc.file_type) ? (
                              <>
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View
                              </>
                            ) : (
                              <>
                                <Download className="h-3.5 w-3.5 mr-1" />
                                Download
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-600"
                            title="Share (coming soon)"
                            disabled
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:border-red-200"
                            onClick={() => setDeleteTarget(doc)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            /* ---- List View ---- */
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {/* List header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-5">Document</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-1 text-right">Size</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              {filteredAndSorted.map((doc) => {
                const catStyle = getCategoryStyle(doc.category);
                return (
                  <motion.div key={doc.id} variants={itemVariants} layout>
                    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
                      <CardContent className="p-3 md:p-4">
                        <div className="grid grid-cols-12 gap-3 md:gap-4 items-center">
                          {/* Document info */}
                          <div className="col-span-12 md:col-span-5 flex items-center gap-3 min-w-0">
                            <div
                              className={`p-2 rounded-lg ${getFileIconBg(doc.file_type)} shrink-0`}
                            >
                              {getFileIcon(doc.file_type, "sm")}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-medium text-sm truncate">{doc.title}</h3>
                              {doc.description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {doc.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Category */}
                          <div className="col-span-4 md:col-span-2">
                            <Badge
                              variant="secondary"
                              className={`${catStyle.bg} ${catStyle.text} border-0 text-xs`}
                            >
                              {(doc.category || "other").charAt(0).toUpperCase() +
                                (doc.category || "other").slice(1)}
                            </Badge>
                          </div>

                          {/* Size */}
                          <div className="col-span-3 md:col-span-1 text-right">
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(doc.file_size)}
                            </span>
                          </div>

                          {/* Date */}
                          <div className="col-span-5 md:col-span-2">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(doc.created_at), "MMM d, yyyy")}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="col-span-12 md:col-span-2 flex items-center gap-1.5 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleDownload(doc)}
                              disabled={doc.file_path.startsWith("placeholder://")}
                            >
                              <Download className="h-3.5 w-3.5 mr-1" />
                              {isImageType(doc.file_type) ? "View" : "Get"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-blue-600"
                              title="Share (coming soon)"
                              disabled
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                              onClick={() => setDeleteTarget(doc)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Results count */}
        {!isLoadingDocs && filteredAndSorted.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground text-center"
          >
            Showing {filteredAndSorted.length} of {documents.length} document
            {documents.length !== 1 ? "s" : ""}
            {searchQuery && ` matching "${searchQuery}"`}
          </motion.p>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be
                undone. The file will be permanently removed from storage.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
