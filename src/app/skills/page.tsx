'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { withAuth } from '@/components/hoc/with-auth'
import { Cross2Icon, GearIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { CodeIcon, FolderIcon, ImageIcon, InfoIcon, StarIcon } from 'lucide-react'

interface Skill {
    name: string
    level?: number
    imageUrl?: string
    updatedAt: string
}

interface Category {
    name: string
    skills: Skill[]
    createdAt: string
}

interface KeySkill {
    name: string
    imageUrl: string
}

interface EditSkillDialogProps {
    skill: Skill
    category: string
    isOpen: boolean
    onClose: () => void
    onSave: (categoryName: string, oldSkillName: string, updatedSkill: Skill) => void
}

function SkillsPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [keySkills, setKeySkills] = useState<KeySkill[]>([])
    const [newKeySkill, setNewKeySkill] = useState({ name: '', imageUrl: '' })
    const [newCategory, setNewCategory] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [newSkill, setNewSkill] = useState({ name: '', level: 0, imageUrl: '' })
    const [showProficiency, setShowProficiency] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [editingSkill, setEditingSkill] = useState<{ skill: Skill, category: string } | null>(null)
    const { toast } = useToast()

    const skillsRef = doc(db, 'skills', 'MFY6937UnRyIoPp8Ehfg')
    const keySkillsRef = doc(db, 'skills', '4rdxBjE7SqTpaexjYUw1')

    useEffect(() => {
        fetchSkills()
        fetchKeySkills()
    }, [])

    const fetchKeySkills = async () => {
        try {
            const docSnap = await getDoc(keySkillsRef)
            if (docSnap.exists()) setKeySkills(docSnap.data().keySkills || [])
        } catch (error) {
            console.error('Failed to fetch key skills:', error)
            toast({ title: "Error", description: "Failed to load key skills", variant: "destructive" })
        }
    }

    const addKeySkill = async () => {
        if (!newKeySkill.name.trim()) {
            toast({ title: "Error", description: "Please enter a skill name", variant: "destructive" })
            return
        }
        if (!newKeySkill.imageUrl.trim()) {
            toast({ title: "Error", description: "Please enter an image URL", variant: "destructive" })
            return
        }

        setIsLoading(true)
        try {
            const newKeySkillObj = { name: newKeySkill.name, imageUrl: newKeySkill.imageUrl }
            await updateDoc(keySkillsRef, { keySkills: arrayUnion(newKeySkillObj) })
            setKeySkills([...keySkills, newKeySkillObj])
            setNewKeySkill({ name: '', imageUrl: '' })
            toast({ title: "Success", description: "Key skill added successfully" })
        } catch (error) {
            console.error('Failed to add key skill:', error)
            toast({ title: "Error", description: "Failed to add key skill", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const removeKeySkill = async (skillToRemove: KeySkill) => {
        setIsLoading(true)
        try {
            await updateDoc(keySkillsRef, { keySkills: arrayRemove(skillToRemove) })
            setKeySkills(keySkills.filter(s => s.name !== skillToRemove.name))
            toast({ title: "Success", description: "Key skill removed successfully" })
        } catch (error) {
            console.error('Failed to remove key skill:', error)
            toast({ title: "Error", description: "Failed to remove key skill", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const fetchSkills = async () => {
        try {
            const docSnap = await getDoc(skillsRef)
            if (docSnap.exists()) setCategories(docSnap.data().categories || [])
        } catch (error) {
            console.error('Failed to fetch skills:', error)
            toast({ title: "Error", description: "Failed to load skills", variant: "destructive" })
        }
    }

    const addCategory = async () => {
        if (!newCategory.trim()) {
            toast({ title: "Error", description: "Please enter a category name", variant: "destructive" })
            return
        }

        if (categories.some(cat => cat.name === newCategory.trim())) {
            toast({ title: "Error", description: "Category already exists", variant: "destructive" })
            return
        }

        setIsLoading(true)
        try {
            const newCategoryObj = { name: newCategory, skills: [], createdAt: new Date().toISOString() }
            await updateDoc(skillsRef, { categories: arrayUnion(newCategoryObj) })
            setCategories([...categories, newCategoryObj])
            setNewCategory('')
            toast({ title: "Success", description: "Category added successfully" })
        } catch (error) {
            console.error('Failed to add category:', error)
            toast({ title: "Error", description: "Failed to add category", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const removeCategory = async (categoryName: string) => {
        setIsLoading(true)
        try {
            const categoryToRemove = categories.find(c => c.name === categoryName)
            if (categoryToRemove) {
                await updateDoc(skillsRef, { categories: arrayRemove(categoryToRemove) })
                setCategories(categories.filter(c => c.name !== categoryName))
                toast({ title: "Success", description: "Category removed successfully" })
            }
        } catch (error) {
            console.error('Failed to remove category:', error)
            toast({ title: "Error", description: "Failed to remove category", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const addSkill = async () => {
        if (!selectedCategory) {
            toast({ title: "Error", description: "Please select a category", variant: "destructive" })
            return
        }
        if (!newSkill.name.trim()) {
            toast({ title: "Error", description: "Please enter a skill name", variant: "destructive" })
            return
        }
        if (showProficiency && (newSkill.level < 0 || newSkill.level > 100)) {
            toast({ title: "Error", description: "Skill level must be between 0 and 100", variant: "destructive" })
            return
        }

        const category = categories.find(c => c.name === selectedCategory)
        if (category?.skills.some(s => s.name === newSkill.name.trim())) {
            toast({ title: "Error", description: "Skill already exists in this category", variant: "destructive" })
            return
        }

        setIsLoading(true)
        try {
            const skillToAdd = {
                name: newSkill.name,
                imageUrl: newSkill.imageUrl,
                ...(showProficiency && { level: newSkill.level }),
                updatedAt: new Date().toISOString()
            }

            const updatedCategories = categories.map(category => {
                if (category.name === selectedCategory) {
                    return { ...category, skills: [...category.skills, skillToAdd] }
                }
                return category
            })

            await updateDoc(skillsRef, { categories: updatedCategories })
            setCategories(updatedCategories)
            setNewSkill({ name: '', level: 0, imageUrl: '' })
            toast({ title: "Success", description: "Skill added successfully" })
        } catch (error) {
            console.error('Failed to add skill:', error)
            toast({ title: "Error", description: "Failed to add skill", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const updateSkill = async (categoryName: string, oldSkillName: string, updatedSkill: Skill) => {
        setIsLoading(true)
        try {
            const updatedCategories = categories.map(category => {
                if (category.name === categoryName) {
                    return {
                        ...category,
                        skills: category.skills.map(skill =>
                            skill.name === oldSkillName ? updatedSkill : skill
                        )
                    }
                }
                return category
            })

            await updateDoc(skillsRef, { categories: updatedCategories })
            setCategories(updatedCategories)
            toast({ title: "Success", description: "Skill updated successfully" })
        } catch (error) {
            console.error('Failed to update skill:', error)
            toast({ title: "Error", description: "Failed to update skill", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const removeSkill = async (categoryName: string, skillName: string) => {
        setIsLoading(true)
        try {
            const updatedCategories = categories.map(category => {
                if (category.name === categoryName) {
                    return { ...category, skills: category.skills.filter(skill => skill.name !== skillName) }
                }
                return category
            })

            await updateDoc(skillsRef, { categories: updatedCategories })
            setCategories(updatedCategories)
            toast({ title: "Success", description: "Skill removed successfully" })
        } catch (error) {
            console.error('Failed to remove skill:', error)
            toast({ title: "Error", description: "Failed to remove skill", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 max-w-7xl mx-auto p-2 sm:p-3 md:p-4">
            <Card className="bg-gradient-to-br from-teal-50/30 to-teal-50/30 dark:from-teal-950/30 dark:to-teal-950/30 border-teal-100 dark:border-teal-900">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <StarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500" />
                        <CardTitle className="text-base sm:text-lg md:text-xl">Key Skills</CardTitle>
                    </div>
                    <CardDescription className="text-sm sm:text-base">Add and manage your core technical skills with icons</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-2 mb-3 sm:mb-4">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <CodeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-500" />
                            <Input placeholder="Add key skill name" value={newKeySkill.name} onChange={(e) => setNewKeySkill({ ...newKeySkill, name: e.target.value })} disabled={isLoading} className="bg-white/80 dark:bg-gray-950/60" />
                        </div>
                        <div className="flex space-x-1.5 sm:space-x-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
                                <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-500" />
                                <Input placeholder="Add skill image URL" value={newKeySkill.imageUrl} onChange={(e) => setNewKeySkill({ ...newKeySkill, imageUrl: e.target.value })} disabled={isLoading} className="bg-white/80 dark:bg-gray-950/60" />
                            </div>
                            <Button onClick={addKeySkill} disabled={isLoading} variant="outline" className="border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950">
                                <PlusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-500" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {keySkills.length === 0 ? (
                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                                <InfoIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span>No key skills added yet</span>
                            </div>
                        ) : (
                            keySkills.map((skill, index) => (
                                <div key={index} className="flex items-center gap-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border border-teal-200 dark:border-teal-800">
                                    {skill.imageUrl && <img src={skill.imageUrl} alt={skill.name} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                                    <span className="text-xs sm:text-sm">{skill.name}</span>
                                    <Button variant="ghost" size="icon" onClick={() => removeKeySkill(skill)} className="h-4 w-4 sm:h-5 sm:w-5 hover:text-red-500">
                                        <Cross2Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                <Card className="bg-gradient-to-br from-teal-50/30 to-teal-50/30 dark:from-teal-950/30 dark:to-teal-950/30 border-teal-100 dark:border-teal-900">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <FolderIcon className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500" />
                            <CardTitle className="text-base sm:text-lg md:text-xl">Add New Category</CardTitle>
                        </div>
                        <CardDescription className="text-sm sm:text-base">Create a new category to group related skills together</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex space-x-1.5 sm:space-x-2">
                            <Input placeholder="Category Name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} disabled={isLoading} className="bg-white/80 dark:bg-gray-950/60" />
                            <Button onClick={addCategory} disabled={isLoading} variant="outline" className="border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950">
                                <PlusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-500" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-teal-50/30 to-teal-50/30 dark:from-teal-950/30 dark:to-teal-950/30 border-teal-100 dark:border-teal-900 overflow-hidden">
                    <CardHeader className="pb-2 relative">
                        <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-teal-100/20 dark:bg-teal-900/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center gap-1.5 sm:gap-2 relative">
                            <GearIcon className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500 animate-spin-slow" />
                            <CardTitle className="text-base sm:text-lg md:text-xl">Add New Skill</CardTitle>
                        </div>
                        <CardDescription className="mt-1 text-sm sm:text-base">Add a skill to an existing category with proficiency level</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col space-y-2 sm:space-y-3 relative">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="bg-white/80 dark:bg-gray-950/60 border-teal-200 dark:border-teal-800">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.length === 0 ? (
                                        <div className="p-2 text-xs sm:text-sm text-muted-foreground flex items-center">
                                            <InfoIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                            No categories available
                                        </div>
                                    ) : (
                                        categories.map((category, index) => (
                                            <SelectItem key={index} value={category.name} className="hover:bg-teal-50 dark:hover:bg-teal-900/20">
                                                {category.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                <div className="relative">
                                    <Input placeholder="Skill Name" value={newSkill.name} onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })} disabled={isLoading || !selectedCategory} className="bg-white/80 dark:bg-gray-950/60 pl-8 sm:pl-9 border-teal-200 dark:border-teal-800" />
                                    <CodeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-teal-500" />
                                </div>
                                <div className="relative">
                                    <Input placeholder="Image URL" value={newSkill.imageUrl} onChange={(e) => setNewSkill({ ...newSkill, imageUrl: e.target.value })} disabled={isLoading || !selectedCategory} className="bg-white/80 dark:bg-gray-950/60 pl-8 sm:pl-9 border-teal-200 dark:border-teal-800" />
                                    <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-teal-500" />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-teal-50/50 dark:bg-teal-900/20 rounded-lg">
                                <div className="flex items-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-0">
                                    <Switch checked={showProficiency} onCheckedChange={setShowProficiency} id="show-proficiency" className="data-[state=checked]:bg-teal-500" />
                                    <label htmlFor="show-proficiency" className="text-xs sm:text-sm flex items-center gap-1">
                                        <StarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-500" />
                                        Show Proficiency Level
                                    </label>
                                </div>
                                <div className="flex items-center gap-2">
                                    {showProficiency && (
                                        <Input type="number" min="0" max="100" placeholder="Level" value={newSkill.level} onChange={(e) => setNewSkill({ ...newSkill, level: parseInt(e.target.value) })} disabled={isLoading || !selectedCategory} className="w-20 sm:w-24 bg-white/80 dark:bg-gray-950/80 border-teal-200 dark:border-teal-800" />
                                    )}
                                    <Button onClick={addSkill} disabled={isLoading || !selectedCategory} className="bg-teal-500 hover:bg-teal-600 text-white">
                                        <PlusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                                        Add
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {categories.length === 0 ? (
                    <div className="col-span-full flex items-center justify-center gap-1.5 sm:gap-2 py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">
                        <InfoIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>No categories added yet. Add a category to get started.</span>
                    </div>
                ) : (
                    categories.map((category) => (
                        <div key={category.name} className="bg-gradient-to-br from-gray-50/50 to-gray-50/50 dark:from-gray-900/50 dark:to-gray-900/50 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <FolderIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-500" />
                                    <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground/90">{category.name}</h2>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" disabled={isLoading} className="h-7 w-7 sm:h-8 sm:w-8 hover:text-red-500">
                                            <TrashIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                            <AlertDialogDescription>Are you sure you want to delete the category "{category.name}" and all its skills?</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => removeCategory(category.name)} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                                {category.skills?.length === 0 ? (
                                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                                        <InfoIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        <span>No skills added to this category yet</span>
                                    </div>
                                ) : (
                                    category.skills?.map((skill) => (
                                        <div key={skill.name} className="group">
                                            <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                                                <div className="flex items-center gap-1.5 sm:gap-2">
                                                    {skill.imageUrl ? <img src={skill.imageUrl} alt={skill.name} className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <CodeIcon className="h-3 w-3 text-teal-500" />}
                                                    <span className="text-xs sm:text-sm font-medium text-foreground/80">{skill.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 sm:gap-2">
                                                    {skill.level !== undefined && <span className="text-[10px] sm:text-xs text-muted-foreground">{skill.level}%</span>}
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingSkill({ skill, category: category.name })} className="h-5 w-5 sm:h-6 sm:w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <GearIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" disabled={isLoading} className="h-5 w-5 sm:h-6 sm:w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500">
                                                                <Cross2Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Skill</AlertDialogTitle>
                                                                <AlertDialogDescription>Are you sure you want to delete the skill "{skill.name}"?</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => removeSkill(category.name, skill.name)} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                            {skill.level !== undefined && (
                                                <div className="h-0.5 sm:h-1 bg-muted/30 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-300" style={{ width: `${skill.level}%` }} />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
            {editingSkill && <EditSkillDialog skill={editingSkill.skill} category={editingSkill.category} isOpen={!!editingSkill} onClose={() => setEditingSkill(null)} onSave={updateSkill} />}
        </motion.div>
    )
}

export default withAuth(SkillsPage)


function EditSkillDialog({ skill, category, isOpen, onClose, onSave }: EditSkillDialogProps) {
    const [editedSkill, setEditedSkill] = useState<Skill>({ ...skill })
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        setIsLoading(true)
        try {
            await onSave(category, skill.name, { ...editedSkill, updatedAt: new Date().toISOString() })
            onClose()
        } catch (error) {
            console.error('Failed to update skill:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Edit Skill</AlertDialogTitle>
                    <AlertDialogDescription>Update the skill details below</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-2">
                        <CodeIcon className="h-4 w-4 text-teal-500" />
                        <Input placeholder="Skill name" value={editedSkill.name} onChange={(e) => setEditedSkill({ ...editedSkill, name: e.target.value })} className="bg-white/80 dark:bg-gray-950/60" />
                    </div>
                    <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-teal-500" />
                        <Input placeholder="Image URL" value={editedSkill.imageUrl || ''} onChange={(e) => setEditedSkill({ ...editedSkill, imageUrl: e.target.value })} className="bg-white/80 dark:bg-gray-950/60" />
                    </div>
                    {editedSkill.level !== undefined && (
                        <div className="flex items-center gap-2">
                            <StarIcon className="h-4 w-4 text-teal-500" />
                            <Input type="number" min="0" max="100" placeholder="Proficiency level" value={editedSkill.level} onChange={(e) => setEditedSkill({ ...editedSkill, level: parseInt(e.target.value) })} className="bg-white/80 dark:bg-gray-950/60" />
                        </div>
                    )}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSave} disabled={isLoading}>Save Changes</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

