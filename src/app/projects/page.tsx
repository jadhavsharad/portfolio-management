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
import { TrashIcon, ExternalLinkIcon, Pencil1Icon, Cross2Icon, GearIcon } from '@radix-ui/react-icons'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { CodeIcon, FolderIcon, ImageIcon, InfoIcon, LinkIcon, SparklesIcon, StarIcon } from 'lucide-react'

// Constants for UI configuration and styling
const INITIAL_FORM_DATA = { title: '', description: '', link: '', imageUrl: '', isCompleted: true }

// Table column configuration
const TABLE_HEADERS = [
    { label: 'Project', className: 'text-xs text-indigo-400' },
    { label: 'Details', className: 'text-xs text-indigo-400' },
    { label: 'Preview', className: 'text-xs text-indigo-400' },
    { label: 'Status', className: 'text-xs text-indigo-400' },
    { label: 'Actions', className: 'text-xs text-indigo-400 w-[80px]' }
]

// Reusable button styling configurations
const BUTTON_STYLES = {
    edit: "h-7 w-7 p-0 hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50",
    delete: "h-7 w-7 p-0 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50",
    gradient: "bg-gradient-to-r from-indigo-400 to-blue-400 hover:from-indigo-500 hover:to-blue-500"
}

const DIALOG_STYLES = {
    base: "bg-gradient-to-r from-white/95 to-indigo-50/95 dark:from-gray-950/95 dark:to-indigo-950/95 border-none"
}

const INPUT_ICONS = {
    title: <FolderIcon className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />,
    description: <CodeIcon className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />,
    link: <LinkIcon className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />,
    imageUrl: <ImageIcon className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
}

// Project type definition for TypeScript
interface Project {
    id: string
    title: string
    description: string
    link: string
    imageUrl: string
    isCompleted: boolean
    createdAt: string
    updatedAt: string
}

function ProjectsPage() {
    // State management for projects and UI controls
    const [projects, setProjects] = useState<Project[]>([])
    const [formData, setFormData] = useState(INITIAL_FORM_DATA)
    const [isLoading, setIsLoading] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
    const { toast } = useToast()

    // Reference to the Firestore document containing all projects
    const projectsDocRef = doc(db, 'projects/NjUmAfebfBPHfXZ4CVnW')

    // Load projects on component mount
    useEffect(() => { fetchProjects() }, [])

    // Fetch projects from Firestore
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

    // Handle form input changes for both create and edit modes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        if (editingProject) {
            setEditingProject(prev => ({ ...prev!, [name]: value }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    // Handle project status changes (completed/upcoming)
    const handleStatusChange = (value: string) => {
        const isCompleted = value !== 'upcoming'
        if (editingProject) {
            setEditingProject(prev => ({ ...prev!, isCompleted }))
        } else {
            setFormData(prev => ({ ...prev, isCompleted }))
        }
    }

    // Project deletion handlers
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

    // Project editing handlers
    const openEditDialog = (project: Project) => {
        setEditingProject(project)
        setIsEditDialogOpen(true)
    }

    const updateProject = async () => {
        if (!editingProject) return
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

    // Create new project
    const addProject = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const now = new Date().toISOString()
            const newProject = {
                id: Date.now().toString(),
                ...formData,
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

    return (
        // Main layout container with animation
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl mx-auto p-4" role="main" aria-label="Projects Management">
            {/* Project Creation Card */}
            <Card className="border-none bg-gradient-to-r from-white/30 to-indigo-50/30 dark:from-gray-950/30 dark:to-indigo-900/20">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                        <CardTitle className="text-lg">Create Project</CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-1.5">
                        <StarIcon className="h-3 w-3 text-indigo-300" aria-hidden="true" />
                        <span>Share your work</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={addProject} className="space-y-3">
                        <div className="flex items-center gap-2 bg-transparent border border-indigo-100 dark:border-indigo-900/50 rounded-md px-3">
                            {INPUT_ICONS.title}
                            <Input name="title" placeholder="Project Title" value={formData.title} onChange={handleInputChange} disabled={isLoading} className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" aria-label="Project Title" />
                        </div>
                        <div className="flex gap-2 bg-transparent border border-indigo-100 dark:border-indigo-900/50 rounded-md px-3 py-2">
                            {INPUT_ICONS.description}
                            <Textarea name="description" placeholder="Project Description" value={formData.description} onChange={handleInputChange} disabled={isLoading} className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" aria-label="Project Description" />
                        </div>
                        <div className="flex items-center gap-2 bg-transparent border border-indigo-100 dark:border-indigo-900/50 rounded-md px-3">
                            {INPUT_ICONS.link}
                            <Input name="link" placeholder="Project Link" value={formData.link} onChange={handleInputChange} disabled={isLoading} className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" aria-label="Project Link" />
                        </div>
                        <div className="flex items-center gap-2 bg-transparent border border-indigo-100 dark:border-indigo-900/50 rounded-md px-3">
                            {INPUT_ICONS.imageUrl}
                            <Input name="imageUrl" placeholder="Image URL" value={formData.imageUrl} onChange={handleInputChange} disabled={isLoading} className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" aria-label="Image URL" />
                        </div>
                        <Select onValueChange={handleStatusChange} defaultValue="completed">
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Project Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="completed">Completed Project</SelectItem>
                                <SelectItem value="upcoming">Upcoming Project</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button type="submit" disabled={isLoading} className={BUTTON_STYLES.gradient}>{isLoading ? 'Creating...' : 'Create Project'}</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Project Gallery Card */}
            <Card className="border-none bg-gradient-to-r from-white/30 to-indigo-50/30 dark:from-gray-950/30 dark:to-indigo-900/20">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <GearIcon className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                        <CardTitle className="text-lg">Project Gallery</CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-1.5">
                        <InfoIcon className="h-3 w-3 text-indigo-300" aria-hidden="true" />
                        <span>Your creative portfolio</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    {TABLE_HEADERS.map((header, index) => (
                                        <TableHead key={index} className={header.className}>{header.label}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.map((project) => (
                                    <TableRow key={project.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20">
                                        <TableCell className="font-medium">{project.title}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{project.description}</TableCell>
                                        <TableCell>
                                            {project.link ? (
                                                <a href={project.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-500" aria-label={`Visit ${project.title} project`}>
                                                    Visit <ExternalLinkIcon className="h-3 w-3" aria-hidden="true" />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-400">Coming Soon</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-xs ${project.isCompleted ? 'text-green-500' : 'text-amber-500'}`}>
                                                {project.isCompleted ? 'Completed' : 'Upcoming'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => openEditDialog(project)} className={BUTTON_STYLES.edit} aria-label={`Edit ${project.title}`}>
                                                    <Pencil1Icon className="h-3 w-3" aria-hidden="true" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => confirmDelete(project.id)} className={BUTTON_STYLES.delete} aria-label={`Delete ${project.title}`}>
                                                    <Cross2Icon className="h-3 w-3" aria-hidden="true" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Project Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <Pencil1Icon className="h-4 w-4 text-indigo-500" aria-hidden="true" />
                            <DialogTitle>Enhance Project</DialogTitle>
                        </div>
                        <DialogDescription className="flex items-center gap-1.5">
                            <SparklesIcon className="h-3 w-3 text-indigo-400" aria-hidden="true" />
                            <span>Make it even better</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        <div className="space-y-3">
                            {['title', 'description', 'link', 'imageUrl'].map(key => (
                                <div key={key} className="flex items-center gap-2 bg-transparent border border-gray-200 dark:border-gray-800 rounded-md px-3">
                                    {INPUT_ICONS[key as keyof typeof INPUT_ICONS]}
                                    {key === 'description' ? (
                                        <Textarea
                                            name={key}
                                            placeholder={`Project ${key}`}
                                            value={editingProject?.[key] || ''}
                                            onChange={handleInputChange}
                                            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                            aria-label={`Project ${key}`}
                                        />
                                    ) : (
                                        <Input
                                            name={key}
                                            placeholder={`Project ${key}`}
                                            value={editingProject ? (editingProject as any)[key] : ''}
                                            onChange={handleInputChange}
                                            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                            aria-label={`Project ${key}`}
                                        />
                                    )}
                                </div>
                            ))}
                            <Select onValueChange={handleStatusChange} defaultValue={editingProject?.isCompleted ? 'completed' : 'upcoming'}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Project Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="completed">Completed Project</SelectItem>
                                    <SelectItem value="upcoming">Upcoming Project</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button onClick={updateProject} className="bg-indigo-500 hover:bg-indigo-600 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700">Update Project</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Project</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this project? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={deleteProject}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}

// Wrap the component with authentication HOC
export default withAuth(ProjectsPage)
