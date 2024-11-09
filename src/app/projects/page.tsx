'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { withAuth } from '@/components/hoc/with-auth'
import axios from 'axios'

interface Project {
  id: string
  title: string
  description: string
  link: string
  imageUrl: string
}

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  
  const addProject = async (project: Omit<Project, 'id'>) => {
    try {
      const response = await axios.post('/api/projects', project)
      setProjects([...projects, response.data])
    } catch (error) {
      console.error('Failed to add project:', error)
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
          <CardTitle>Add New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <Input placeholder="Project Title" />
            <Textarea placeholder="Project Description" />
            <Input placeholder="Project Link" />
            <Input type="file" accept="image/*" />
            <Button>Add Project</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <motion.div
            key={project.id}
            whileHover={{ scale: 1.05 }}
            className="card"
          >
            <Card>
              <CardHeader>
                <CardTitle>{project.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{project.description}</p>
                <a href={project.link}>View Project</a>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default withAuth(ProjectsPage) 