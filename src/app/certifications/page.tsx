'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { withAuth } from '@/components/hoc/with-auth'
import { Cross2Icon, ExternalLinkIcon, Pencil1Icon, Pencil2Icon } from '@radix-ui/react-icons'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AwardIcon, BuildingIcon, CalendarIcon, FileTextIcon, FolderIcon, LinkIcon, SparklesIcon, StarIcon } from 'lucide-react'

// Interface defining the structure of a certification
interface Certification {
  id: string
  title: string
  issuer: string
  date: string
  link: string
  description: string
  updatedAt: string
}

function CertificationsPage() {
  // State management for certifications and UI controls
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [isLoading, setIsLoading] = useState(false)     // Controls loading states during async operations
  const [isEditing, setIsEditing] = useState(false)     // Toggles edit mode
  const [editingCert, setEditingCert] = useState<Certification | null>(null)  // Stores certification being edited
  const [newCert, setNewCert] = useState({
    // Initial state for new/editing certification
    title: '',
    issuer: '',
    date: '',
    link: '',
    description: '',
    updatedAt: new Date().toISOString()
  })
  const { toast } = useToast()

  // Reference to the Firestore document containing all certifications
  const certRef = doc(db, 'certifications', 'rx2fFCF5UgZxRvH9FfiN')

  // Fetch certifications on component mount
  useEffect(() => {
    fetchCertifications()
  }, [])

  // Function to fetch certifications from Firestore
  const fetchCertifications = async () => {
    try {
      const docSnap = await getDoc(certRef)
      if (docSnap.exists()) {
        setCertifications(docSnap.data().certifications || [])
      }
    } catch (error) {
      console.error('Failed to fetch certifications:', error)
      toast({
        title: "Error",
        description: "Failed to load certifications",
        variant: "destructive"
      })
    }
  }

  // Function to add a new certification to Firestore
  const addCertification = async () => {
    // Validate required fields
    if (!newCert.title.trim() || !newCert.issuer.trim()) return
    setIsLoading(true)
    try {
      const newCertObj = {
        ...newCert,
        id: Date.now().toString(),
        updatedAt: new Date().toISOString()
      }
      await updateDoc(certRef, {
        certifications: arrayUnion(newCertObj)
      })
      setCertifications([...certifications, newCertObj])
      setNewCert({ title: '', issuer: '', date: '', link: '', description: '', updatedAt: new Date().toISOString() })
      toast({
        title: "Success",
        description: "Certification added successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add certification",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to initiate editing mode for a certification
  const startEditing = (cert: Certification) => {
    setIsEditing(true)
    setEditingCert(cert)
    setNewCert(cert)
  }

  // Function to cancel editing mode and reset form
  const cancelEditing = () => {
    setIsEditing(false)
    setEditingCert(null)
    setNewCert({ title: '', issuer: '', date: '', link: '', description: '', updatedAt: new Date().toISOString() })
  }

  // Function to update an existing certification in Firestore
  const updateCertification = async () => {
    // Validate required fields and editing state
    if (!editingCert || !newCert.title.trim() || !newCert.issuer.trim()) return
    setIsLoading(true)
    try {
      const updatedCert = { ...newCert, id: editingCert.id, updatedAt: new Date().toISOString() }
      await updateDoc(certRef, {
        certifications: arrayRemove(editingCert)
      })
      await updateDoc(certRef, {
        certifications: arrayUnion(updatedCert)
      })
      setCertifications(certifications.map(c => c.id === editingCert.id ? updatedCert : c))
      cancelEditing()
      toast({
        title: "Success",
        description: "Certification updated successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update certification",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to remove a certification from Firestore
  const removeCertification = async (cert: Certification) => {
    setIsLoading(true)
    try {
      await updateDoc(certRef, {
        certifications: arrayRemove(cert)
      })
      setCertifications(certifications.filter(c => c.id !== cert.id))
      toast({
        title: "Success",
        description: "Certification removed successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove certification",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    // Main container with animation
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 max-w-7xl mx-auto px-4 py-8"
    >
      <Card className="border-none bg-gradient-to-r from-white/30 to-sky-50/30 dark:from-gray-950/30 dark:to-sky-900/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-sky-500" aria-hidden="true" />
            <CardTitle className="text-lg">{isEditing ? 'Enhance Certification' : 'New Certification'}</CardTitle>
          </div>
          <CardDescription className="flex items-center gap-1.5">
            <StarIcon className="h-3 w-3 text-sky-400" aria-hidden="true" />
            <span>{isEditing ? 'Make your certification even better' : 'Share your professional achievements'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-transparent border border-gray-200 dark:border-gray-800 rounded-md px-3">
                <FolderIcon className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                <Input 
                  placeholder="Certification Title"
                  value={newCert.title}
                  onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                  disabled={isLoading}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="flex items-center gap-2 bg-transparent border border-gray-200 dark:border-gray-800 rounded-md px-3">
                <BuildingIcon className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                <Input
                  placeholder="Issuer"
                  value={newCert.issuer}
                  onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                  disabled={isLoading}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-transparent border border-gray-200 dark:border-gray-800 rounded-md px-3">
                <CalendarIcon className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                <Input
                  type="date"
                  value={newCert.date}
                  onChange={(e) => setNewCert({ ...newCert, date: e.target.value })}
                  disabled={isLoading}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="flex items-center gap-2 bg-transparent border border-gray-200 dark:border-gray-800 rounded-md px-3">
                <LinkIcon className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                <Input
                  placeholder="Certificate Link"
                  value={newCert.link}
                  onChange={(e) => setNewCert({ ...newCert, link: e.target.value })}
                  disabled={isLoading}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
            <div className="flex gap-2 bg-transparent border border-gray-200 dark:border-gray-800 rounded-md px-3 py-2">
              <FileTextIcon className="h-3.5 w-3.5 text-sky-400 mt-1" aria-hidden="true" />
              <Textarea
                placeholder="Certification Description"
                value={newCert.description}
                onChange={(e) => setNewCert({ ...newCert, description: e.target.value })}
                disabled={isLoading}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={isEditing ? updateCertification : addCertification}
                disabled={isLoading}
                className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600"
              >
                {isEditing ? 'Update' : 'Add'} Certification
              </Button>
              {isEditing && (
                <Button
                  onClick={cancelEditing}
                  disabled={isLoading}
                  variant="outline"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {certifications.map((cert) => (
          <motion.div
            key={cert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-l-2 border-l-sky-500 bg-gradient-to-r from-white/50 to-sky-50/30 dark:from-gray-950/50 dark:to-sky-900/20">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AwardIcon className="h-4 w-4 text-sky-500" aria-hidden="true" />
                      <h3 className="font-medium">{cert.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BuildingIcon className="h-3 w-3" aria-hidden="true" />
                      <span>{cert.issuer}</span>
                      <span>•</span>
                      <CalendarIcon className="h-3 w-3" aria-hidden="true" />
                      <span>{new Date(cert.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long'
                      })}</span>
                    </div>
                    {cert.description && (
                      <p className="text-sm text-muted-foreground">{cert.description}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 items-start">
                    {cert.link && (
                      <Button
                        variant="ghost" 
                        size="sm"
                        asChild
                        className="h-8 hover:text-sky-500"
                      >
                        <a href={cert.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLinkIcon className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(cert)}
                      disabled={isLoading}
                      className="h-8 hover:text-amber-500"
                    >
                      <Pencil1Icon className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoading}
                          className="h-8 hover:text-red-500"
                        >
                          <Cross2Icon className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Certification</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this certification?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeCertification(cert)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// Wrap the component with authentication HOC
export default withAuth(CertificationsPage)