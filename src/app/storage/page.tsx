"use client"

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
    TrashIcon, 
    DownloadIcon, 
    UploadIcon,
    ReloadIcon,
} from '@radix-ui/react-icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ShareIcon, AlertCircle, Upload, RefreshCwIcon, PlusCircleIcon, FileTextIcon, ImageIcon, VideoIcon, FileIcon, CalendarIcon, DatabaseIcon, ArrowDownToLineIcon, Trash2Icon, Share2Icon, InboxIcon, UploadCloudIcon, PencilIcon, HashIcon, CheckIcon, XIcon, ClipboardCopyIcon, AlertOctagonIcon, FolderIcon, InfoIcon, TableIcon, FileEditIcon, PackageIcon } from 'lucide-react';
import { toast } from 'sonner';

// Type definition for file metadata
interface BlobFile {
    url: string;
    pathname: string; 
    size: number;
    uploadedAt: string;
    shareableUrl?: string;
}

export default function StoragePage() {
    // State management
    const [files, setFiles] = useState<BlobFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<BlobFile | null>(null);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [customFileName, setCustomFileName] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [addSuffix, setAddSuffix] = useState(true);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);

    // Fetch files from API
    const fetchFiles = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/blob');
            setFiles(response.data.files);
        } catch (error) {
            toast.error('Failed to fetch files. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast.error('File size exceeds 10MB limit');
            return;
        }

        setFileToUpload(file);
        setCustomFileName(file.name);
        setShowUploadDialog(true);
    };

    // Handle file upload
    const handleUpload = async () => {
        if (!fileToUpload) return;

        setUploading(true);
        setUploadProgress(0);
        
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('customFileName', customFileName || fileToUpload.name);
        formData.append('addSuffix', addSuffix.toString());

        try {
            await axios.post('/api/blob', formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / (progressEvent.total || 100)
                    );
                    setUploadProgress(percentCompleted);
                },
            });
            
            setCustomFileName('');
            setFileToUpload(null);
            setShowUploadDialog(false);
            fetchFiles();
            toast.success('File uploaded successfully');
        } catch (error) {
            toast.error('Upload failed. Please try again.');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // Handle file deletion
    const handleDelete = async (url: string) => {
        try {
            await axios.delete('/api/blob', { data: { url } });
            fetchFiles();
            toast.success('File deleted successfully');
            setShowDeleteDialog(false);
        } catch (error) {
            toast.error('Delete failed. Please try again.');
        }
    };

    // Upload progress indicator
    const renderUploadProgress = () => {
        if (!uploading) return null;
        return (
            <div className="fixed bottom-4 right-4 bg-background/80 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                <div className="space-y-1.5">
                    <div className="text-xs font-medium">Uploading...</div>
                    <div className="w-[180px] h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                    <div className="text-[10px] text-muted-foreground">{uploadProgress}%</div>
                </div>
            </div>
        );
    };

    return (
        <div className="container max-w-7xl mx-auto p-6 space-y-10">
            {/* Header section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100 shadow-sm">
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-blue-700">
                        <FolderIcon className="h-7 w-7" />
                        Vercel Storage
                    </h1>
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                        <InfoIcon className="h-4 w-4 text-blue-400" />
                        Vercel's Blob Storage
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 lg:col-span-2 justify-end">
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchFiles}
                            disabled={loading}
                            className="bg-white hover:bg-slate-50 transition-colors"
                        >
                            <RefreshCwIcon className="mr-2 h-4 w-4 text-emerald-500" />
                            Refresh
                        </Button>
                        <Input
                            type="file"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload"
                            disabled={uploading}
                        />
                        <label htmlFor="file-upload">
                            <Button
                                size="sm"
                                className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all"
                                disabled={uploading}
                                asChild
                            >
                                <span>
                                    <UploadCloudIcon className="mr-2 h-4 w-4" />
                                    Upload File
                                </span>
                            </Button>
                        </label>
                    </div>
                </div>
            </div>

            {/* Files grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {files.map((file) => (
                    <Card
                        key={file.url}
                        className="relative overflow-hidden bg-white hover:shadow-lg transition-shadow duration-300"
                    >
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
                        <div className="p-5 space-y-4">
                            <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-xl flex items-center justify-center">
                                {file.pathname.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                    <ImageIcon className="h-10 w-10 text-emerald-500" />
                                ) : file.pathname.match(/\.(mp4|mov|avi)$/i) ? (
                                    <VideoIcon className="h-10 w-10 text-amber-500" />
                                ) : (
                                    <FileIcon className="h-10 w-10 text-slate-500" />
                                )}
                            </div>
                            <div className="space-y-3">
                                <h3 className="font-medium text-sm truncate flex items-center gap-2 text-slate-800">
                                    <FileIcon className="h-4 w-4 text-blue-500" />
                                    {file.pathname.split('/').pop()}
                                </h3>
                                <div className="flex flex-col gap-2">
                                    <p className="text-xs text-slate-600 flex items-center gap-2">
                                        <CalendarIcon className="h-3.5 w-3.5 text-indigo-400" />
                                        {new Date(file.uploadedAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-slate-600 flex items-center gap-2">
                                        <DatabaseIcon className="h-3.5 w-3.5 text-emerald-400" />
                                        {(file.size / 1024).toFixed(1)}KB
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="bg-emerald-50 hover:bg-emerald-100 transition-colors"
                                    asChild
                                >
                                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                                        <DownloadIcon className="h-4 w-4 text-emerald-600" />
                                    </a>
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="bg-red-50 hover:bg-red-100 transition-colors"
                                    onClick={() => {
                                        setSelectedFile(file);
                                        setShowDeleteDialog(true);
                                    }}
                                >
                                    <Trash2Icon className="h-4 w-4 text-red-600" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="bg-indigo-50 hover:bg-indigo-100 transition-colors"
                                    onClick={() => {
                                        setSelectedFile(file);
                                        setShowShareDialog(true);
                                    }}
                                >
                                    <Share2Icon className="h-4 w-4 text-indigo-600" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}

                {files.length === 0 && !loading && (
                    <div className="col-span-full text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-100">
                        <InboxIcon className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                        <p className="text-slate-600">Your storage is empty</p>
                        <p className="text-sm text-slate-500 mt-2">Upload files to get started</p>
                    </div>
                )}

                {loading && (
                    <div className="col-span-full text-center py-16">
                        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-600">Loading your files...</p>
                    </div>
                )}
            </div>

            {/* Upload dialog */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-blue-600">
                            <UploadCloudIcon className="h-5 w-5" />
                            Upload File
                        </DialogTitle>
                        <DialogDescription>
                            Customize your file upload settings
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <FileIcon className="h-4 w-4 text-blue-500" />
                                Selected File
                            </label>
                            <p className="text-sm text-slate-600">{fileToUpload?.name}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <PencilIcon className="h-4 w-4 text-indigo-500" />
                                Custom Filename
                            </label>
                            <Input
                                placeholder="Enter custom filename"
                                value={customFileName}
                                onChange={(e) => setCustomFileName(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="addSuffix"
                                checked={addSuffix}
                                onChange={(e) => setAddSuffix(e.target.checked)}
                                className="h-4 w-4 text-blue-600"
                            />
                            <label htmlFor="addSuffix" className="text-sm flex items-center gap-2">
                                <HashIcon className="h-4 w-4 text-emerald-500" />
                                Add random suffix to filename
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowUploadDialog(false)}
                            disabled={uploading}
                            className="bg-slate-50"
                        >
                            <XIcon className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600"
                        >
                            <CheckIcon className="mr-2 h-4 w-4" />
                            {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Share dialog */}
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-indigo-600">
                            <Share2Icon className="h-5 w-5" />
                            Share File
                        </DialogTitle>
                        <DialogDescription>
                            Copy the link below to share this file
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3">
                        <Input
                            readOnly
                            value={selectedFile?.url || ''}
                            onClick={(e) => e.currentTarget.select()}
                            className="text-sm bg-white"
                        />
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(selectedFile?.url || '');
                                toast.success('Link copied to clipboard');
                            }}
                            variant="outline"
                            size="sm"
                            className="bg-indigo-50 hover:bg-indigo-100"
                        >
                            <ClipboardCopyIcon className="h-4 w-4 text-indigo-600" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertOctagonIcon className="h-5 w-5" />
                            Confirm Deletion
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600">
                        Are you sure you want to delete this file? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteDialog(false)}
                            className="bg-slate-50"
                        >
                            <XIcon className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(selectedFile?.url || '')}
                            className="bg-gradient-to-r from-red-600 to-red-700"
                        >
                            <Trash2Icon className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {renderUploadProgress()}
        </div>
    );
}
