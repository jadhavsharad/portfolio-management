'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { withAuth } from '@/components/hoc/with-auth'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { TrashIcon, ExternalLinkIcon, Pencil1Icon, Cross2Icon, GearIcon, CheckIcon, DownloadIcon } from '@radix-ui/react-icons'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { CodeIcon, FolderIcon, ImageIcon, InfoIcon, LinkIcon, SparklesIcon, StarIcon } from 'lucide-react'
import { saveAs } from 'file-saver'

/**
 * Initial form state for creating new projects
 * Provides default values for all required project fields
 * @default isCompleted is true for new projects
 */
const INITIAL_FORM_DATA = { title: '', description: '', link: '', mediaUrl: '', mediaType: 'image', isCompleted: true }

/**
 * Table column configuration
 * Defines the structure and styling of the project table headers
 * Uses consistent sky-400 theming for visual coherence
 */
const TABLE_HEADERS = [
    { label: 'Project', className: 'text-xs text-sky-400' },
    { label: 'Details', className: 'text-xs text-sky-400' },
    { label: 'Preview', className: 'text-xs text-sky-400' },
    { label: 'Status', className: 'text-xs text-sky-400' },
    { label: 'Actions', className: 'text-xs text-sky-400 w-[80px]' }
]

/**
 * Icon mapping for form input fields
 * Associates each form field with a relevant icon component
 * Maintains consistent sizing and coloring (sky-400)
 */
const INPUT_ICONS = {
    title: <FolderIcon className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />,
    description: <CodeIcon className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />,
    link: <LinkIcon className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />,
    media: <ImageIcon className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
}

/**
 * Project interface
 * Defines the complete data structure for project entries
 * @property id - Unique identifier
 * @property title - Project name
 * @property description - Detailed project information
 * @property link - URL to project (optional)
 * @property mediaUrl - URL to project media
 * @property mediaType - Either 'image' or 'video'
 * @property isCompleted - Project status flag
 * @property createdAt - Timestamp of creation
 * @property updatedAt - Timestamp of last update
 * @property selected - Optional selection state for bulk operations
 */
interface Project {
    id: string
    title: string
    description: string
    link: string
    mediaUrl: string
    mediaType: 'image' | 'video'
    isCompleted: boolean
    createdAt: string
    updatedAt: string
    selected?: boolean
}

function ProjectsPage() {
    /**
     * State Management
     * Handles all dynamic data and UI states for the project management system
     */
    const [projects, setProjects] = useState<Project[]>([])
    const [formData, setFormData] = useState(INITIAL_FORM_DATA)
    const [isLoading, setIsLoading] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
    const [selectedProjects, setSelectedProjects] = useState<string[]>([])
    const { toast } = useToast()

    /**
     * Firebase Reference
     * Points to the specific document containing all projects
     * Uses a fixed document ID for consistent data storage
     */
    const projectsDocRef = doc(db, 'projects/NjUmAfebfBPHfXZ4CVnW')

    /**
     * Lifecycle Hook
     * Fetches projects when component mounts
     */
    useEffect(() => { fetchProjects() }, [])

    /**
     * Data Fetching
     * Retrieves projects from Firestore and updates local state
     * Includes error handling and toast notifications
     */
    const fetchProjects = async () => {
        try {
            const docSnap = await getDoc(projectsDocRef)
            if (docSnap.exists()) {
                const projectsList = docSnap.data().projects || []
                setProjects(projectsList)
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error)
            toast({ title: "Error", description: "Failed to load projects", variant: "destructive" })
        }
    }

    /**
     * Form Input Handlers
     * Manages form state updates for both create and edit modes
     * @param e - Input change event
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        if (editingProject) {
            setEditingProject(prev => ({ ...prev!, [name]: value }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    /**
     * Media Type Handler
     * Updates media type and clears existing media URL
     * @param value - New media type ('image' or 'video')
     */
    const handleMediaTypeChange = (value: string) => {
        const mediaType = value as 'image' | 'video'
        if (editingProject) {
            // Clear existing media URL when switching types
            setEditingProject(prev => ({ ...prev!, mediaType, mediaUrl: '' }))
        } else {
            setFormData(prev => ({ ...prev, mediaType, mediaUrl: '' }))
        }
    }

    /**
     * Media URL Validation
     * Ensures media URLs are valid based on type
     * @param url - Media URL to validate
     * @param type - Media type to check against
     */
    const validateMediaUrl = (url: string, type: 'image' | 'video'): boolean => {
        return url.length > 0
    }

    /**
     * Project Status Handler
     * Toggles between completed and upcoming status
     * @param value - New status value
     */
    const handleStatusChange = (value: string) => {
        const isCompleted = value !== 'upcoming'
        if (editingProject) {
            setEditingProject(prev => ({ ...prev!, isCompleted }))
        } else {
            setFormData(prev => ({ ...prev, isCompleted }))
        }
    }

    /**
     * Delete Operations
     * Handles project deletion workflow including confirmation
     */
    const confirmDelete = (projectId: string) => {
        setProjectToDelete(projectId)
        setDeleteDialogOpen(true)
    }

    const deleteProject = async () => {
        if (!projectToDelete) return
        try {
            const updatedProjects = projects.filter(project => project.id !== projectToDelete)
            await setDoc(projectsDocRef, { projects: updatedProjects })
            setProjects(updatedProjects)
            toast({ title: "Success", description: "Project deleted successfully" })
        } catch (error) {
            console.error('Failed to delete project:', error)
            toast({ title: "Error", description: "Failed to delete project", variant: "destructive" })
        } finally {
            setDeleteDialogOpen(false)
            setProjectToDelete(null)
        }
    }

    /**
     * Edit Operations
     * Manages project editing workflow including dialog state
     */
    const openEditDialog = (project: Project) => {
        setEditingProject(project)
        setIsEditDialogOpen(true)
    }

    const updateProject = async () => {
        if (!editingProject) return

        if (!validateMediaUrl(editingProject.mediaUrl, editingProject.mediaType)) {
            toast({
                title: "Invalid Media URL",
                description: `Please provide a valid ${editingProject.mediaType} URL`,
                variant: "destructive"
            })
            return
        }

        try {
            const updatedProject = {
                ...editingProject,
                updatedAt: new Date().toISOString()
            }
            const updatedProjects = projects.map(p => p.id === editingProject.id ? updatedProject : p)
            await setDoc(projectsDocRef, { projects: updatedProjects })
            setProjects(updatedProjects)
            setIsEditDialogOpen(false)
            setEditingProject(null)
            toast({ title: "Success", description: "Project updated successfully" })
        } catch (error) {
            console.error('Failed to update project:', error)
            toast({ title: "Error", description: "Failed to update project", variant: "destructive" })
        }
    }

    /**
     * Project Creation
     * Handles new project submission and validation
     * @param e - Form submission event
     */
    const addProject = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateMediaUrl(formData.mediaUrl, formData.mediaType as "image" | "video")) {
            toast({
                title: "Invalid Media URL", 
                description: `Please provide a valid ${formData.mediaType} URL`,
                variant: "destructive"
            })
            return
        }

        setIsLoading(true)
        try {
            const now = new Date().toISOString()
            const newProject = {
                id: Date.now().toString(),
                ...formData,
                mediaType: formData.mediaType as 'image' | 'video',
                createdAt: now,
                updatedAt: now
            }
            const updatedProjects = [...projects, newProject]
            await setDoc(projectsDocRef, { projects: updatedProjects })
            setProjects(updatedProjects)
            setFormData(INITIAL_FORM_DATA)
            toast({ title: "Success", description: "Project added successfully" })
        } catch (error) {
            toast({ title: "Error", description: "Failed to add project", variant: "destructive" })
            console.error('Failed to add project:', error)
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Selection Handlers
     * Manages bulk selection functionality
     */
    const toggleSelectAll = () => {
        if (selectedProjects.length === projects.length) {
            setSelectedProjects([])
            setProjects(projects.map(p => ({ ...p, selected: false })))
        } else {
            setSelectedProjects(projects.map(p => p.id))
            setProjects(projects.map(p => ({ ...p, selected: true })))
        }
    }

    const toggleProjectSelection = (projectId: string) => {
        setSelectedProjects(prev => {
            const isSelected = prev.includes(projectId)
            const newSelection = isSelected
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
            
            setProjects(projects.map(p => ({
                ...p,
                selected: newSelection.includes(p.id)
            })))
            
            return newSelection
        })
    }

    /**
     * Bulk Operations
     * Handles operations on multiple selected projects
     */
    const deleteSelectedProjects = async () => {
        try {
            const updatedProjects = projects.filter(project => !selectedProjects.includes(project.id))
            await setDoc(projectsDocRef, { projects: updatedProjects })
            setProjects(updatedProjects)
            setSelectedProjects([])
            toast({ title: "Success", description: "Selected projects deleted successfully" })
        } catch (error) {
            console.error('Failed to delete projects:', error)
            toast({ title: "Error", description: "Failed to delete projects", variant: "destructive" })
        }
    }

    const exportSelectedProjects = (format: 'json' | 'csv') => {
        const selectedProjectsData = projects.filter(project => selectedProjects.includes(project.id))
        
        if (format === 'json') {
            const jsonString = JSON.stringify(selectedProjectsData, null, 2)
            const blob = new Blob([jsonString], { type: 'application/json' })
            saveAs(blob, `projects-export-${new Date().toISOString()}.json`)
        } else {
            const headers = ['title', 'description', 'link', 'mediaUrl', 'mediaType', 'isCompleted', 'createdAt', 'updatedAt']
            const csvContent = [
                headers.join(','),
                ...selectedProjectsData.map(project => 
                    headers.map(header => {
                        const value = project[header as keyof Project]
                        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
                    }).join(',')
                )
            ].join('\n')
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
            saveAs(blob, `projects-export-${new Date().toISOString()}.csv`)
        }
        
        toast({ 
            title: "Success", 
            description: `${selectedProjects.length} projects exported as ${format.toUpperCase()}` 
        })
    }

    /**
     * Helper Components
     * UI elements for improved user experience
     */
    const selectionNote = (
        <small className=" text-gray-500 dark:text-gray-400 mb-2">
            💡 Click the checkboxes or use the master checkbox to select multiple projects for bulk actions
        </small>
    )

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-7xl mx-auto" role="main" aria-label="Projects Management">
            <Card className="border-none bg-gradient-to-r from-white/30 to-sky-50/30 dark:from-gray-900/30 dark:to-sky-950/20">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="h-4 w-4 text-sky-400 dark:text-sky-500" aria-hidden="true" />
                        <CardTitle className="text-base sm:text-lg md:text-xl">Create Project</CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-1.5">
                        <StarIcon className="h-3 w-3 text-sky-300 dark:text-sky-400" aria-hidden="true" />
                        <span>Share your work</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={addProject} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 bg-transparent border border-sky-100 dark:border-sky-800/50 rounded-md px-3">
                                {INPUT_ICONS.title}
                                <Input name="title" placeholder="Project Title" value={formData.title} onChange={handleInputChange} disabled={isLoading} className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" aria-label="Project Title" />
                            </div>
                            <div className="flex items-center gap-2 bg-transparent border border-sky-100 dark:border-sky-800/50 rounded-md px-3">
                                {INPUT_ICONS.link}
                                <Input name="link" placeholder="Project Link" value={formData.link} onChange={handleInputChange} disabled={isLoading} className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" aria-label="Project Link" />
                            </div>
                        </div>
                        <div className="flex gap-2 bg-transparent border border-sky-100 dark:border-sky-800/50 rounded-md px-3 py-2">
                            {INPUT_ICONS.description}
                            <Textarea name="description" placeholder="Project Description" value={formData.description} onChange={handleInputChange} disabled={isLoading} className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" aria-label="Project Description" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
                                <Button type="button" onClick={() => handleMediaTypeChange('image')} className={`flex-1 ${formData.mediaType === 'image' ? 'bg-sky-500 dark:bg-sky-600 text-white' : 'bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300'} hover:bg-sky-200 dark:hover:bg-sky-800`}>Image</Button>
                                <Button type="button" onClick={() => handleMediaTypeChange('video')} className={`flex-1 ${formData.mediaType === 'video' ? 'bg-sky-500 dark:bg-sky-600 text-white' : 'bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300'} hover:bg-sky-200 dark:hover:bg-sky-800`}>Video</Button>
                            </div>
                            <div className="flex items-center gap-2 bg-transparent border border-sky-100 dark:border-sky-800/50 rounded-md px-3 col-span-1 sm:col-span-2">
                                {INPUT_ICONS.media}
                                <Input name="mediaUrl" placeholder={`${formData.mediaType === 'image' ? 'Image' : 'Video'} URL`} value={formData.mediaUrl} onChange={handleInputChange} disabled={isLoading} className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" aria-label={`${formData.mediaType === 'image' ? 'Image' : 'Video'} URL`} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Select onValueChange={handleStatusChange} defaultValue="completed">
                                <SelectTrigger className="w-full"><SelectValue placeholder="Project Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="completed">Completed Project</SelectItem>
                                    <SelectItem value="upcoming">Upcoming Project</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button type="submit" disabled={isLoading} className="bg-sky-500 hover:bg-sky-600 text-white dark:bg-sky-600 dark:hover:bg-sky-700">{isLoading ? 'Creating...' : 'Create Project'}</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-none bg-gradient-to-r from-white/30 to-sky-50/30 dark:from-gray-900/30 dark:to-sky-950/20">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <GearIcon className="h-4 w-4 text-sky-400 dark:text-sky-500" aria-hidden="true" />
                        <CardTitle className="text-base sm:text-lg md:text-xl">Project Gallery</CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-1.5">
                        <InfoIcon className="h-3 w-3 text-sky-300 dark:text-sky-400" aria-hidden="true" />
                        <span>Your creative portfolio</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border border-sky-100 dark:border-sky-800/50 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-gray-200 dark:border-gray-800">
                                    <TableHead className="w-[40px]">
                                        <div className="flex items-center justify-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-6 w-6 p-0 ${selectedProjects.length === projects.length ? 'bg-sky-100 dark:bg-sky-900' : ''}`}
                                                onClick={toggleSelectAll}
                                            >
                                                <CheckIcon className={`h-4 w-4 ${selectedProjects.length === projects.length ? 'text-sky-600 dark:text-sky-400' : 'text-gray-300 dark:text-gray-600'}`} />
                                            </Button>
                                        </div>
                                    </TableHead>
                                    {TABLE_HEADERS.map((header, index) => (
                                        <TableHead key={index} className={header.className}>{header.label}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.map((project) => (
                                    <TableRow key={project.id} className="hover:bg-sky-50/50 dark:hover:bg-sky-900/20 border-b border-gray-100 dark:border-gray-800">
                                        <TableCell>
                                            <div className="flex items-center justify-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={`h-6 w-6 p-0 ${project.selected ? 'bg-sky-100 dark:bg-sky-900' : ''}`}
                                                    onClick={() => toggleProjectSelection(project.id)}
                                                >
                                                    <CheckIcon className={`h-4 w-4 ${project.selected ? 'text-sky-600 dark:text-sky-400' : 'text-gray-300 dark:text-gray-600'}`} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{project.title}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground max-w-[200px] sm:max-w-[300px] md:max-w-[400px] truncate">{project.description}</TableCell>
                                        <TableCell>
                                            {project.link ? (
                                                <a href={project.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-sky-400 dark:text-sky-500 hover:text-sky-500 dark:hover:text-sky-400" aria-label={`Visit ${project.title} project`}>Visit <ExternalLinkIcon className="h-3 w-3" aria-hidden="true" /></a>
                                            ) : (
                                                <span className="text-xs text-gray-400 dark:text-gray-500">Coming Soon</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-xs ${project.isCompleted ? 'text-green-500 dark:text-green-400' : 'text-amber-500 dark:text-amber-400'}`}>{project.isCompleted ? 'Completed' : 'Upcoming'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => openEditDialog(project)} className="text-sky-500 hover:text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:text-sky-300 dark:hover:bg-sky-900/20" aria-label={`Edit ${project.title}`}><Pencil1Icon className="h-3 w-3" aria-hidden="true" /></Button>
                                                <Button variant="ghost" size="sm" onClick={() => confirmDelete(project.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20" aria-label={`Delete ${project.title}`}><Cross2Icon className="h-3 w-3" aria-hidden="true" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {selectionNote}
                </CardContent>
            </Card>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-[95%] sm:w-[90%] md:w-[85%] lg:w-[75%] max-w-3xl">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <Pencil1Icon className="h-4 w-4 text-sky-500 dark:text-sky-400" aria-hidden="true" />
                            <DialogTitle>Enhance Project</DialogTitle>
                        </div>
                        <DialogDescription className="flex items-center gap-1.5">
                            <SparklesIcon className="h-3 w-3 text-sky-400 dark:text-sky-500" aria-hidden="true" />
                            <span>Make it even better</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {['title', 'link'].map(key => (
                                    <div key={key} className="flex items-center gap-2 bg-transparent border border-gray-200 dark:border-gray-700 rounded-md px-3">
                                        {INPUT_ICONS[key as keyof typeof INPUT_ICONS]}
                                        <Input name={key} placeholder={`Project ${key}`} value={editingProject ? (editingProject as any)[key] : ''} onChange={handleInputChange} className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" aria-label={`Project ${key}`} />
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 bg-transparent border border-gray-200 dark:border-gray-700 rounded-md px-3">
                                {INPUT_ICONS.description}
                                <Textarea name="description" placeholder="Project description" value={editingProject?.description || ''} onChange={handleInputChange} className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" aria-label="Project description" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select onValueChange={handleMediaTypeChange} defaultValue={editingProject?.mediaType}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder="Media Type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="image">Image</SelectItem>
                                        <SelectItem value="video">Video</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-2 bg-transparent border border-gray-200 dark:border-gray-700 rounded-md px-3">
                                    {INPUT_ICONS.media}
                                    <Input name="mediaUrl" placeholder={`${editingProject?.mediaType === 'image' ? 'Image' : 'Video'} URL`} value={editingProject?.mediaUrl || ''} onChange={handleInputChange} className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" aria-label={`${editingProject?.mediaType === 'image' ? 'Image' : 'Video'} URL`} />
                                </div>
                            </div>
                            <Select onValueChange={handleStatusChange} defaultValue={editingProject?.isCompleted ? 'completed' : 'upcoming'}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Project Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="completed">Completed Project</SelectItem>
                                    <SelectItem value="upcoming">Upcoming Project</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button onClick={updateProject} className="bg-sky-500 hover:bg-sky-600 text-white dark:bg-sky-600 dark:hover:bg-sky-700">Update Project</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="w-[95%] sm:w-[90%] md:w-[85%] lg:w-[75%] max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Delete Project</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this project? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={deleteProject}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Actions Floating Panel */}
            {selectedProjects.length > 0 && (
                <div className="fixed bottom-4 right-4 flex gap-2 bg-white dark:bg-gray-900 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSelectedProjects([])
                            setProjects(projects.map(p => ({ ...p, selected: false })))
                        }}
                        className="text-gray-500"
                    >
                        Deselect All
                    </Button>
                    <div className="flex items-center gap-1 px-2 border-l border-gray-200 dark:border-gray-700">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportSelectedProjects('json')}
                            className="text-sky-500 hover:text-sky-600"
                        >
                            <DownloadIcon className="h-3 w-3 mr-1" />
                            Export JSON
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportSelectedProjects('csv')}
                            className="text-sky-500 hover:text-sky-600"
                        >
                            <DownloadIcon className="h-3 w-3 mr-1" />
                            Export CSV
                        </Button>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={deleteSelectedProjects}
                        className="bg-red-500 hover:bg-red-600"
                    >
                        Delete Selected ({selectedProjects.length})
                    </Button>
                </div>
            )}
        </motion.div>
    )
}

// Apply authentication HOC to protect the page
export default withAuth(ProjectsPage)
