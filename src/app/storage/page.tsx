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
import { RefreshCwIcon, VideoIcon, DatabaseIcon, Trash2Icon, Share2Icon, InboxIcon, UploadCloudIcon, PencilIcon, HashIcon, CheckIcon, XIcon, ClipboardCopyIcon, AlertOctagonIcon, FolderIcon, InfoIcon, TableIcon, FileEditIcon, PackageIcon, HardDriveIcon, ClockIcon, ImageIcon } from 'lucide-react';
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
            const response = await axios.post('/api/blob', formData, {
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
            toast.success('File uploaded successfully', {
                description: (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono break-all">
                        {response.data.url}
                    </div>
                )
            });
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
        <div className="container max-w-7xl mx-auto p-4 sm:p-6">
            {/* Header section */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-8 rounded-2xl border border-blue-100 dark:border-gray-700 shadow-sm">
                    <div className="space-y-2">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                            Storage Manager
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg">
                            Manage your files using Vercel's Blob Storage. Upload, share and organize your assets efficiently.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchFiles}
                            disabled={loading}
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                        >
                            <RefreshCwIcon className="mr-2 h-4 w-4" />
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
                                className="cursor-pointer bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
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

            {/* Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <DatabaseIcon className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Files</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{files.length}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <HardDriveIcon className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Size</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                {(files.reduce((acc, file) => acc + file.size, 0) / (1000 * 1000)).toFixed(2)} MB
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <ClockIcon className="h-5 sm:h-6 w-5 sm:w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Last Upload</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                {files.length > 0 ? new Date(files[0].uploadedAt).toLocaleDateString() : '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Files List */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Your Files</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {files.map((file) => (
                            <div
                                key={file.url}
                                className="group relative bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        {file.pathname.match(/\.(mp4|mov|avi)$/i) ? (
                                            <VideoIcon className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600 dark:text-blue-400" />
                                        ) : (
                                            <ImageIcon className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600 dark:text-blue-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-20"> {/* Added right padding to prevent overlap */}
                                        <h3 className="font-medium text-sm truncate text-gray-900 dark:text-white">
                                            {file.pathname.split('/').pop()}
                                        </h3>
                                        <div className="mt-1 flex flex-col gap-1">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(file.uploadedAt).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {Math.round(file.size / 1000)} KB
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50 dark:bg-gray-800 p-1 rounded-lg">
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            asChild
                                        >
                                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                <DownloadIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                            </a>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => {
                                                setSelectedFile(file);
                                                setShowShareDialog(true);
                                            }}
                                        >
                                            <Share2Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => {
                                                setSelectedFile(file);
                                                setShowDeleteDialog(true);
                                            }}
                                        >
                                            <Trash2Icon className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {files.length === 0 && !loading && (
                            <div className="col-span-full text-center py-12 sm:py-16">
                                <InboxIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">No files uploaded yet</p>
                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Upload files to get started</p>
                            </div>
                        )}

                        {loading && (
                            <div className="col-span-full text-center py-12 sm:py-16">
                                <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-3 sm:mb-4"></div>
                                <p className="text-gray-600 dark:text-gray-400">Loading files...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent className="sm:max-w-md mx-4">
                    <DialogHeader>
                        <DialogTitle>Upload File</DialogTitle>
                        <DialogDescription>
                            Configure your file upload settings
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Selected File</label>
                            <p className="text-sm text-gray-500 break-all">{fileToUpload?.name}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Custom Filename</label>
                            <Input
                                placeholder="Enter custom filename"
                                value={customFileName}
                                onChange={(e) => setCustomFileName(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="addSuffix"
                                checked={addSuffix}
                                onChange={(e) => setAddSuffix(e.target.checked)}
                            />
                            <label htmlFor="addSuffix" className="text-sm">
                                Add random suffix to filename
                            </label>
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
                        <Button onClick={handleUpload} disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <DialogContent className="sm:max-w-md mx-4">
                    <DialogHeader>
                        <DialogTitle>Share File</DialogTitle>
                        <DialogDescription>
                            Copy the file URL to share
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                            readOnly
                            value={selectedFile?.url || ''}
                            onClick={(e) => e.currentTarget.select()}
                            className="flex-1"
                        />
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(selectedFile?.url || '');
                                toast.success('URL copied to clipboard');
                            }}
                            variant="outline"
                        >
                            Copy
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md mx-4">
                    <DialogHeader>
                        <DialogTitle>Delete File</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this file? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                        <Button 
                            variant="destructive" 
                            onClick={() => handleDelete(selectedFile?.url || '')}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {renderUploadProgress()}
        </div>
    );
}
