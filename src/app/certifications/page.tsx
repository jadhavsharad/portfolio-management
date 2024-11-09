'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { withAuth } from '@/components/hoc/with-auth'
import { Cross2Icon, ExternalLinkIcon } from '@radix-ui/react-icons'
import axios from 'axios'

interface Certification {
  id: string
  title: string
  issuer: string
  date: string
  link: string
}

function CertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [newCert, setNewCert] = useState({
    title: '',
    issuer: '',
    date: '',
    link: ''
  })

  const addCertification = async () => {
    try {
      const response = await axios.post('/api/certifications', newCert)
      setCertifications([...certifications, response.data])
      setNewCert({ title: '', issuer: '', date: '', link: '' })
    } catch (error) {
      console.error('Failed to add certification:', error)
    }
  }

  const removeCertification = async (id: string) => {
    try {
      await axios.delete(`/api/certifications/${id}`)
      setCertifications(certifications.filter(cert => cert.id !== id))
    } catch (error) {
      console.error('Failed to remove certification:', error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <Card>
        <CardHeader>
          <CardTitle>Add New Certification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Certification Title"
              value={newCert.title}
              onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
            />
            <Input
              placeholder="Issuer"
              value={newCert.issuer}
              onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
            />
            <Input
              type="date"
              value={newCert.date}
              onChange={(e) => setNewCert({ ...newCert, date: e.target.value })}
            />
            <Input
              placeholder="Certificate Link"
              value={newCert.link}
              onChange={(e) => setNewCert({ ...newCert, link: e.target.value })}
            />
            <Button onClick={addCertification}>Add Certification</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {certifications.map((cert) => (
          <motion.div
            key={cert.id}
            whileHover={{ scale: 1.02 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{cert.title}</h3>
                    <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                    <p className="text-sm text-muted-foreground">{cert.date}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <a href={cert.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLinkIcon className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCertification(cert.id)}
                    >
                      <Cross2Icon className="h-4 w-4" />
                    </Button>
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

export default withAuth(CertificationsPage) 