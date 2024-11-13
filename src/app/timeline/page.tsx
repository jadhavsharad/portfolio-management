'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { withAuth } from '@/components/hoc/with-auth'
import { CalendarIcon, InfoCircledIcon, PlusIcon, TrashIcon, Pencil1Icon, CheckIcon } from '@radix-ui/react-icons'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteField } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TimelineEvent {
    year: number
    title: string
    description: string
    createdAt: string
    link?: string
}
function TimelinePage() {
    const [selectedGroup, setSelectedGroup] = useState<string>('')
    const [groups, setGroups] = useState<{id: string, createdAt: string, name: string}[]>([])
    const [newGroupName, setNewGroupName] = useState('')
    const [editGroupName, setEditGroupName] = useState('')
    const [showAddGroup, setShowAddGroup] = useState(false)
    const [showEditGroup, setShowEditGroup] = useState(false)
    const [events, setEvents] = useState<TimelineEvent[]>([])
    const [selectedEvents, setSelectedEvents] = useState<string[]>([])
    const [editingEvent, setEditingEvent] = useState<string | null>(null)
    const [editedEvent, setEditedEvent] = useState<Partial<TimelineEvent>>({})
    const [newEvent, setNewEvent] = useState<Partial<TimelineEvent>>({
        year: undefined,
        title: '',
        description: '',
        link: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const timelineRef = doc(db, 'timeline', 'QyjNHNlotRubmFO3hSWU')

    useEffect(() => {
        if (selectedGroup) {
            fetchEvents()
        }
    }, [selectedGroup])

    const fetchEvents = async () => {
        try {
            const docSnap = await getDoc(timelineRef)
            if (docSnap.exists()) {
                const groupData = docSnap.data()[selectedGroup]
                if (groupData && groupData.name) {
                    const groupEvents = groupData[groupData.name] || []
                    const sortedEvents = [...groupEvents].sort((a, b) => b.year - a.year)
                    setEvents(sortedEvents)
                }
            }
        } catch (error) {
            console.error('Failed to fetch events:', error)
            toast({ title: "Error", description: "Failed to load timeline events", variant: "destructive" })
        }
    }

    const validateEvent = (event: Partial<TimelineEvent>) => {
        if (!event.year) {
            toast({ title: "Error", description: "Please enter a year", variant: "destructive" })
            return false
        }
        if (event.year < 1900 || event.year > new Date().getFullYear() + 100) {
            toast({ title: "Error", description: "Please enter a valid year between 1900 and future 100 years", variant: "destructive" })
            return false
        }
        if (!event.title?.trim()) {
            toast({ title: "Error", description: "Please enter a title", variant: "destructive" })
            return false
        }
        if (event.title.trim().length < 3) {
            toast({ title: "Error", description: "Title must be at least 3 characters long", variant: "destructive" })
            return false
        }
        if (!event.description?.trim()) {
            toast({ title: "Error", description: "Please enter a description", variant: "destructive" })
            return false
        }
        if (event.description.trim().length < 10) {
            toast({ title: "Error", description: "Description must be at least 10 characters long", variant: "destructive" })
            return false
        }
        return true
    }

    const addEvent = async () => {
        if (!validateEvent(newEvent)) {
            return
        }

        setIsLoading(true)
        try {
            const docSnap = await getDoc(timelineRef)
            const groupData = docSnap.data()?.[selectedGroup]
            if (!groupData || !groupData.name) {
                throw new Error('Group data not found')
            }

            const eventToAdd: TimelineEvent = {
                year: newEvent.year!,
                title: newEvent.title!.trim(),
                description: newEvent.description!.trim(),
                createdAt: new Date().toISOString(),
                link: newEvent.link?.trim()
            }

            await updateDoc(timelineRef, {
                [`${selectedGroup}.${groupData.name}`]: arrayUnion(eventToAdd)
            })

            setEvents([eventToAdd, ...events].sort((a, b) => b.year - a.year))
            setNewEvent({ year: undefined, title: '', description: '', link: '' })
            toast({ title: "Success", description: "Event added successfully" })
        } catch (error) {
            console.error('Failed to add event:', error)
            toast({ title: "Error", description: "Failed to add event", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const removeEvent = async (eventToRemove: TimelineEvent) => {
        setIsLoading(true)
        try {
            const docSnap = await getDoc(timelineRef)
            const groupData = docSnap.data()?.[selectedGroup]
            if (!groupData || !groupData.name) {
                throw new Error('Group data not found')
            }

            await updateDoc(timelineRef, {
                [`${selectedGroup}.${groupData.name}`]: arrayRemove(eventToRemove)
            })
            setEvents(events.filter(event => event.createdAt !== eventToRemove.createdAt))
            setSelectedEvents(selectedEvents.filter(id => id !== eventToRemove.createdAt))
            toast({ title: "Success", description: "Event removed successfully" })
        } catch (error) {
            console.error('Failed to remove event:', error)
            toast({ title: "Error", description: "Failed to remove event", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const updateEvent = async (eventId: string) => {
        const eventToUpdate = events.find(e => e.createdAt === eventId)
        if (!eventToUpdate || !validateEvent({ ...eventToUpdate, ...editedEvent })) {
            return
        }

        setIsLoading(true)
        try {
            const docSnap = await getDoc(timelineRef)
            const groupData = docSnap.data()?.[selectedGroup]
            if (!groupData || !groupData.name) {
                throw new Error('Group data not found')
            }

            const updatedEvent = {
                ...eventToUpdate,
                ...editedEvent,
                year: editedEvent.year || eventToUpdate.year,
                title: editedEvent.title?.trim() || eventToUpdate.title,
                description: editedEvent.description?.trim() || eventToUpdate.description,
                link: editedEvent.link?.trim() || eventToUpdate.link
            }

            await updateDoc(timelineRef, {
                [`${selectedGroup}.${groupData.name}`]: arrayRemove(eventToUpdate)
            })
            await updateDoc(timelineRef, {
                [`${selectedGroup}.${groupData.name}`]: arrayUnion(updatedEvent)
            })

            setEvents(prev => 
                prev.map(e => e.createdAt === eventId ? updatedEvent : e)
                   .sort((a, b) => b.year - a.year)
            )
            setEditingEvent(null)
            setEditedEvent({})
            toast({ title: "Success", description: "Event updated successfully" })
        } catch (error) {
            console.error('Failed to update event:', error)
            toast({ title: "Error", description: "Failed to update event", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const toggleSelectAll = () => {
        if (selectedEvents.length === events.length) {
            setSelectedEvents([])
        } else {
            setSelectedEvents(events.map(e => e.createdAt))
        }
    }

    const removeSelectedEvents = async () => {
        setIsLoading(true)
        try {
            const docSnap = await getDoc(timelineRef)
            const groupData = docSnap.data()?.[selectedGroup]
            if (!groupData || !groupData.name) {
                throw new Error('Group data not found')
            }

            const eventsToRemove = events.filter(e => selectedEvents.includes(e.createdAt))
            for (const event of eventsToRemove) {
                await updateDoc(timelineRef, {
                    [`${selectedGroup}.${groupData.name}`]: arrayRemove(event)
                })
            }
            setEvents(events.filter(e => !selectedEvents.includes(e.createdAt)))
            setSelectedEvents([])
            toast({ title: "Success", description: "Selected events removed successfully" })
        } catch (error) {
            console.error('Failed to remove selected events:', error)
            toast({ title: "Error", description: "Failed to remove selected events", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const fetchGroups = async () => {
        try {
            const docSnap = await getDoc(timelineRef)
            if (docSnap.exists()) {
                const data = docSnap.data()
                if (!data || Object.keys(data).length === 0) {
                    // Create default group if no groups exist
                    const defaultGroup = {
                        name: 'events',
                        events: [],
                        createdAt: new Date().toISOString()
                    }
                    await updateDoc(timelineRef, {
                        events: defaultGroup
                    })
                    setGroups([{id: 'events', name: 'events', createdAt: defaultGroup.createdAt}])
                    setSelectedGroup('events')
                    return
                }
                
                const availableGroups = Object.keys(data).map(key => ({
                    id: key,
                    name: data[key].name || key,
                    createdAt: data[key].createdAt || new Date().toISOString()
                }))
                setGroups(availableGroups)
                if (!selectedGroup && availableGroups.length > 0) {
                    setSelectedGroup(availableGroups[0].id)
                }
            } else {
                // Create document with default group if document doesn't exist
                const defaultGroup = {
                    name: 'events',
                    events: [],
                    createdAt: new Date().toISOString()
                }
                await updateDoc(timelineRef, {
                    events: defaultGroup
                })
                setGroups([{id: 'events', name: 'events', createdAt: defaultGroup.createdAt}])
                setSelectedGroup('events')
            }
        } catch (error) {
            console.error('Failed to fetch groups:', error)
            toast({ title: "Error", description: "Failed to load groups", variant: "destructive" })
        }
    }

    useEffect(() => {
        fetchGroups()
    }, [])

    const addNewGroup = async () => {
        if (!newGroupName.trim()) {
            toast({ title: "Error", description: "Please enter a group name", variant: "destructive" })
            return
        }

        const groupId = newGroupName.toLowerCase().replace(/\s+/g, '_')

        if (groups.some(g => g.id === groupId)) {
            toast({ title: "Error", description: "Group already exists", variant: "destructive" })
            return
        }

        setIsLoading(true)
        try {
            const newGroup = {
                name: groupId,
                [groupId]: [],
                createdAt: new Date().toISOString()
            }
            
            await updateDoc(timelineRef, {
                [groupId]: newGroup
            })
            
            setGroups([...groups, {id: groupId, name: groupId, createdAt: newGroup.createdAt}])
            setNewGroupName('')
            setShowAddGroup(false)
            toast({ title: "Success", description: "Group added successfully" })
        } catch (error) {
            console.error('Failed to add group:', error)
            toast({ title: "Error", description: "Failed to add group", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const editGroup = async () => {
        if (!editGroupName.trim()) {
            toast({ title: "Error", description: "Please enter a group name", variant: "destructive" })
            return
        }

        const newGroupId = editGroupName.toLowerCase().replace(/\s+/g, '_')

        if (groups.some(g => g.id === newGroupId && g.id !== selectedGroup)) {
            toast({ title: "Error", description: "Group already exists", variant: "destructive" })
            return
        }

        setIsLoading(true)
        try {
            const docSnap = await getDoc(timelineRef)
            const groupData = docSnap.data()?.[selectedGroup]
            if (!groupData || !groupData.name) {
                throw new Error('Group data not found')
            }

            const oldEvents = groupData[groupData.name] || []
            
            // Add new group with existing data
            await updateDoc(timelineRef, {
                [newGroupId]: {
                    name: newGroupId,
                    [newGroupId]: oldEvents,
                    createdAt: groupData.createdAt
                }
            })

            // Remove old group
            await updateDoc(timelineRef, {
                [selectedGroup]: deleteField()
            })
            
            setGroups(groups.map(g => g.id === selectedGroup ? {id: newGroupId, name: newGroupId, createdAt: g.createdAt} : g))
            setSelectedGroup(newGroupId)
            setEditGroupName('')
            setShowEditGroup(false)
            toast({ title: "Success", description: "Group renamed successfully" })
        } catch (error) {
            console.error('Failed to rename group:', error)
            toast({ title: "Error", description: "Failed to rename group", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const removeGroup = async (groupId: string) => {
        if (groups.length <= 1) {
            toast({ title: "Error", description: "Cannot remove the last group", variant: "destructive" })
            return
        }

        setIsLoading(true)
        try {
            await updateDoc(timelineRef, {
                [groupId]: deleteField()
            })
            
            const remainingGroups = groups.filter(g => g.id !== groupId)
            setGroups(remainingGroups)
            if (selectedGroup === groupId) {
                setSelectedGroup(remainingGroups[0].id)
            }
            toast({ title: "Success", description: "Group removed successfully" })
        } catch (error) {
            console.error('Failed to remove group:', error)
            toast({ title: "Error", description: "Failed to remove group", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8" role="main">
            {/* Header Section */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 lg:gap-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 lg:p-8 rounded-2xl border border-blue-100 dark:border-gray-700 shadow-sm">
                    <div className="space-y-2">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" /> Timeline Manager
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-lg flex items-center gap-2">
                            <InfoCircledIcon className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" /> Manage your timeline events. Add important milestones and achievements.
                        </p>
                    </div>
                </div>
            </div>

            {/* Group Management Section */}
            <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
                <Select
                    value={selectedGroup}
                    onValueChange={setSelectedGroup}
                >
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                        {groups.map(group => (
                            <SelectItem key={group.id} value={group.id}>
                                {group.id.charAt(0).toUpperCase() + group.id.slice(1).replace(/_/g, ' ')}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex flex-wrap gap-2">
                    <Dialog open={showAddGroup} onOpenChange={setShowAddGroup}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Add Group
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add New Group</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Input
                                    placeholder="Enter group name"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowAddGroup(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={addNewGroup} disabled={isLoading}>
                                    Add Group
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showEditGroup} onOpenChange={setShowEditGroup}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                <Pencil1Icon className="h-4 w-4 mr-2" />
                                Edit Group
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Edit Group Name</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Input
                                    placeholder="Enter new group name"
                                    value={editGroupName}
                                    onChange={(e) => setEditGroupName(e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowEditGroup(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={editGroup} disabled={isLoading}>
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Remove Group
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Remove Group</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to remove this group? All events in this group will be deleted.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => removeGroup(selectedGroup)}
                                    className="bg-red-500 hover:bg-red-600"
                                >
                                    Remove
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Add Event Section */}
            <Card className="mb-4 sm:mb-6 lg:mb-8">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                    <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                        <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />Add New Event
                    </h2>
                    <div className="grid gap-3 sm:gap-4" role="form" aria-label="Add new event form">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <Select
                                value={newEvent.year?.toString()}
                                onValueChange={(value) => 
                                    setNewEvent({ ...newEvent, year: parseInt(value) })
                                }
                                disabled={isLoading}
                            >
                                <SelectTrigger className="w-full">
                                    <div className="flex items-center">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        <SelectValue placeholder="Select year">
                                            {newEvent.year ? newEvent.year : "Select year"}
                                        </SelectValue>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {(() => {
                                        const currentYear = new Date().getFullYear();
                                        return Array.from({ length: 50 }, (_, i) => {
                                            const year = currentYear - i;
                                            return (
                                                <SelectItem key={year} value={year.toString()}>
                                                    {year}
                                                </SelectItem>
                                            );
                                        });
                                    })()}
                                </SelectContent>
                            </Select>
                            <Input
                                placeholder="Title"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                disabled={isLoading}
                                aria-label="Event title"
                                required
                            />
                        </div>
                        <Textarea
                            placeholder="Description"
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                            disabled={isLoading}
                            className="min-h-[100px]"
                            aria-label="Event description"
                            required
                        />
                        <Input
                            placeholder="Link (optional)"
                            value={newEvent.link}
                            onChange={(e) => setNewEvent({ ...newEvent, link: e.target.value })}
                            disabled={isLoading}
                            aria-label="Event link"
                        />
                        <Button 
                            onClick={addEvent} 
                            disabled={isLoading}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                            aria-label="Add new event"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" aria-hidden="true" />Add Event
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Timeline Events Section */}
            <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 min-h-[40px]">
                    <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />Timeline Events
                    </h2>
                    {events.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            {selectedEvents.length > 0 && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="px-2 sm:px-3 h-8 text-xs sm:text-sm font-medium"
                                            aria-label={`Delete ${selectedEvents.length} selected events`}
                                        >
                                            <TrashIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" aria-hidden="true" />
                                            Delete ({selectedEvents.length})
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Selected Events</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete {selectedEvents.length} selected events?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={removeSelectedEvents}
                                                className="bg-red-500 hover:bg-red-600"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}

                            <div className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md px-2 py-1 cursor-pointer transition-colors" onClick={toggleSelectAll} role="checkbox" aria-checked={selectedEvents.length === events.length} aria-label="Select all events">
                                <Checkbox 
                                    checked={selectedEvents.length === events.length}
                                    onCheckedChange={toggleSelectAll}
                                    className="mr-2"
                                />
                                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                    Select All ({events.length})
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="min-h-[200px]" role="region" aria-label="Timeline events list">
                    {events.length === 0 ? (
                        <div className="text-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed h-full flex flex-col items-center justify-center">
                            <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-gray-400 mb-2" aria-hidden="true" />
                            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No events added yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2 sm:space-y-3">
                            {events.map((event, index) => (
                                <motion.div
                                    key={event.createdAt}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="relative group bg-white dark:bg-gray-900 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all duration-200"
                                    role="article"
                                    aria-label={`Event from ${event.year}: ${event.title}`}
                                >
                                    <div className="absolute top-2 right-2 flex items-center gap-1">
                                        <Checkbox
                                            checked={selectedEvents.includes(event.createdAt)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedEvents([...selectedEvents, event.createdAt])
                                                } else {
                                                    setSelectedEvents(selectedEvents.filter(id => id !== event.createdAt))
                                                }
                                            }}
                                            className="mr-2"
                                            aria-label={`Select event from ${event.year}`}
                                        />
                                        <Dialog open={editingEvent === event.createdAt} onOpenChange={(open) => {
                                            if (!open) {
                                                setEditingEvent(null)
                                                setEditedEvent({})
                                            }
                                        }}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-gray-400 hover:text-blue-500"
                                                onClick={() => {
                                                    setEditingEvent(event.createdAt)
                                                    setEditedEvent(event)
                                                }}
                                                aria-label={`Edit event from ${event.year}`}
                                            >
                                                <Pencil1Icon className="h-4 w-4" aria-hidden="true" />
                                            </Button>
                                            <DialogContent className="sm:max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle>Edit Event</DialogTitle>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4" role="form" aria-label="Edit event form">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <Input
                                                            type="number"
                                                            value={editedEvent.year || event.year}
                                                            onChange={(e) => setEditedEvent({ ...editedEvent, year: parseInt(e.target.value) })}
                                                            disabled={isLoading}
                                                            placeholder="Year"
                                                            aria-label="Edit event year"
                                                            required
                                                        />
                                                        <Input
                                                            value={editedEvent.title || event.title}
                                                            onChange={(e) => setEditedEvent({ ...editedEvent, title: e.target.value })}
                                                            disabled={isLoading}
                                                            placeholder="Title"
                                                            aria-label="Edit event title"
                                                            required
                                                        />
                                                    </div>
                                                    <Textarea
                                                        value={editedEvent.description || event.description}
                                                        onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
                                                        disabled={isLoading}
                                                        placeholder="Description"
                                                        className="min-h-[100px]"
                                                        aria-label="Edit event description"
                                                        required
                                                    />
                                                    <Input
                                                        placeholder="Link (optional)"
                                                        value={editedEvent.link || event.link}
                                                        onChange={(e) => setEditedEvent({ ...editedEvent, link: e.target.value })}
                                                        disabled={isLoading}
                                                        aria-label="Edit event link"
                                                    />
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setEditingEvent(null)
                                                            setEditedEvent({})
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        onClick={() => updateEvent(event.createdAt)}
                                                        disabled={isLoading}
                                                    >
                                                        <CheckIcon className="h-4 w-4 mr-2" aria-hidden="true" />Save Changes
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 text-gray-400 hover:text-red-500"
                                                    aria-label={`Delete event from ${event.year}`}
                                                >
                                                    <TrashIcon className="h-4 w-4" aria-hidden="true" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete this event from {event.year}?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => removeEvent(event)}
                                                        className="bg-red-500 hover:bg-red-600"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-8 sm:mt-0">
                                        <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs sm:text-sm font-medium w-fit">
                                            {event.year}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm sm:text-base font-medium truncate">{event.title}</h3>
                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{event.description}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default withAuth(TimelinePage)
