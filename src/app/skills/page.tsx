'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { withAuth } from '@/components/hoc/with-auth'
import { Cross2Icon, GearIcon, InfoCircledIcon, ListBulletIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { BarChartIcon, CodeIcon, FolderIcon, ImageIcon, InfoIcon, StarIcon, TextIcon } from 'lucide-react'
import { ScrollArea } from '@radix-ui/react-scroll-area'

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
        <div className="container max-w-7xl mx-auto p-4 sm:p-6">
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-8 rounded-2xl border border-amber-100 dark:border-gray-700 shadow-sm">
                    <div className="space-y-2">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <GearIcon className="h-6 w-6" /> Skills Manager
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg flex items-center gap-2">
                            <InfoCircledIcon className="h-4 w-4" /> Manage your skills and expertise. Organize them into categories and showcase your proficiency levels.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <StarIcon className="h-5 sm:h-6 w-5 sm:w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Key Skills</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{keySkills.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FolderIcon className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{categories.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <CodeIcon className="h-5 sm:h-6 w-5 sm:w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Skills</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                {categories.reduce((acc, cat) => acc + cat.skills.length, 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Key Skills Management */}
                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                    <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                        <StarIcon className="h-4 sm:h-5 w-4 sm:w-5 text-amber-500" />Key Skills Management
                    </h2>
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2">
                            <TextIcon className="h-4 w-4 flex-shrink-0" />
                            <Input placeholder="Skill name" value={newKeySkill.name} 
                                onChange={(e) => setNewKeySkill({ ...newKeySkill, name: e.target.value })} 
                                disabled={isLoading} className="text-sm sm:text-base w-full" />
                        </div>
                        <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 flex-shrink-0" />
                            <Input placeholder="Icon URL" value={newKeySkill.imageUrl} 
                                onChange={(e) => setNewKeySkill({ ...newKeySkill, imageUrl: e.target.value })} 
                                disabled={isLoading} className="text-sm sm:text-base w-full" />
                        </div>
                        <Button onClick={addKeySkill} disabled={isLoading} 
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm sm:text-base py-2">
                            <PlusIcon className="h-4 w-4 mr-2 flex-shrink-0" />Add Key Skill
                        </Button>
                    </div>
                </div>

                {/* Category Management */}
                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                    <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                        <FolderIcon className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500" />Category Management
                    </h2>
                    <div className="flex gap-2">
                        <Input placeholder="Category name" value={newCategory} 
                            onChange={(e) => setNewCategory(e.target.value)} 
                            disabled={isLoading} className="text-sm sm:text-base flex-1" />
                        <Button onClick={addCategory} disabled={isLoading} className="text-sm sm:text-base whitespace-nowrap">
                            <PlusIcon className="h-4 w-4 mr-2 flex-shrink-0" />Add
                        </Button>
                    </div>
                </div>

                {/* Add New Skill */}
                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                    <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                        <CodeIcon className="h-4 sm:h-5 w-4 sm:w-5 text-purple-500" />Add New Skill
                    </h2>
                    <div className="space-y-3">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm text-sm sm:text-base w-full">
                                <SelectValue placeholder={categories.length === 0 ? "No categories available" : "Choose category"} />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.length === 0 ? 
                                    <SelectItem value="empty" disabled>Add a category first</SelectItem> : 
                                    categories.map((category) => (
                                        <SelectItem key={category.name} value={category.name}>{category.name}</SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                                <TextIcon className="h-4 w-4 flex-shrink-0" />
                                <Input placeholder="Skill name" value={newSkill.name} 
                                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })} 
                                    disabled={!selectedCategory || isLoading} 
                                    className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm text-sm sm:text-base w-full" />
                            </div>
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 flex-shrink-0" />
                                <Input placeholder="Icon URL" value={newSkill.imageUrl || ''} 
                                    onChange={(e) => setNewSkill({ ...newSkill, imageUrl: e.target.value })} 
                                    disabled={!selectedCategory || isLoading} 
                                    className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm text-sm sm:text-base w-full" />
                            </div>
                        </div>
                        <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-3">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Switch checked={showProficiency} onCheckedChange={setShowProficiency} id="show-proficiency" />
                                    <label htmlFor="show-proficiency" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                        Include proficiency
                                    </label>
                                </div>
                                {showProficiency && (
                                    <div className="flex items-center gap-2">
                                        <BarChartIcon className="h-4 w-4 flex-shrink-0" />
                                        <Input 
                                            type="number" 
                                            min="0" 
                                            max="100" 
                                            placeholder="Level (0-100)" 
                                            value={newSkill.level || ''} 
                                            onChange={(e) => setNewSkill({ ...newSkill, level: parseInt(e.target.value) })} 
                                            className="max-w-[120px] bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm text-sm sm:text-base" 
                                            disabled={!selectedCategory || isLoading} 
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <Button onClick={addSkill} disabled={!selectedCategory || isLoading} 
                            className="w-full bg-purple-500 hover:bg-purple-600 text-white transition-all duration-200 text-sm sm:text-base py-2">
                            <PlusIcon className="h-4 w-4 mr-2 flex-shrink-0" />Add Skill
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-6">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <ListBulletIcon className="h-5 w-5" />Skills by Category
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categories.length === 0 ? (
                            <div className="col-span-full p-12 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                <FolderIcon className="h-16 w-16 text-gray-400/40 mb-4" />
                                <p className="text-lg text-gray-600 dark:text-gray-300">No categories yet</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Create categories to organize your skills</p>
                            </div>
                        ) : (
                            categories.map((category) => (
                                <motion.div key={category.name} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} 
                                    className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                <FolderIcon className="h-5 w-5" />{category.name}
                                            </h3>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete "{category.name}" and all its skills.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => removeCategory(category.name)} 
                                                            className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                        <div className="space-y-3">
                                            {category.skills?.length === 0 ? (
                                                <div className="p-4 text-center text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center gap-2">
                                                    <InfoCircledIcon className="h-4 w-4" />No skills added
                                                </div>
                                            ) : (
                                                category.skills?.map((skill) => (
                                                    <motion.div key={skill.name} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} 
                                                        className="group relative bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-4 transition-all duration-200">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                {skill.imageUrl ? (
                                                                    <img src={skill.imageUrl} alt={skill.name} className="h-6 w-6 rounded-md" 
                                                                        onError={(e) => e.currentTarget.src = ''} />
                                                                ) : (
                                                                    <div className="h-6 w-6 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                                        <CodeIcon className="h-4 w-4 text-gray-500" />
                                                                    </div>
                                                                )}
                                                                <span className="font-medium text-gray-800 dark:text-gray-200">{skill.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" onClick={() => setEditingSkill({ skill, category: category.name })} 
                                                                    className="text-gray-400 hover:text-blue-500">
                                                                    <GearIcon className="h-4 w-4" />
                                                                </Button>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500">
                                                                            <Cross2Icon className="h-4 w-4" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Delete Skill</AlertDialogTitle>
                                                                            <AlertDialogDescription>Delete "{skill.name}" from {category.name}?</AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction onClick={() => removeSkill(category.name, skill.name)} 
                                                                                className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        </div>
                                                        {skill.level !== undefined && (
                                                            <div className="mt-3">
                                                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                                    <span className="flex items-center gap-1">
                                                                        <BarChartIcon className="h-3 w-3" />Proficiency
                                                                    </span>
                                                                    <span>{skill.level}%</span>
                                                                </div>
                                                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${skill.level}%` }} 
                                                                        transition={{ duration: 0.5, ease: "easeOut" }} 
                                                                        className="h-full bg-blue-500" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            {editingSkill && (
                <EditSkillDialog skill={editingSkill.skill} category={editingSkill.category}
                    isOpen={!!editingSkill} onClose={() => setEditingSkill(null)}
                    onSave={updateSkill} />
            )}
        </div>
    );
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

