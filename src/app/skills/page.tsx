'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { withAuth } from '@/components/hoc/with-auth'
import { Cross2Icon } from '@radix-ui/react-icons'
import axios from 'axios'

interface Skill {
  id: string
  name: string
  level: number
}

function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [newSkill, setNewSkill] = useState({ name: '', level: 0 })

  const addSkill = async () => {
    try {
      const response = await axios.post('/api/skills', newSkill)
      setSkills([...skills, response.data])
      setNewSkill({ name: '', level: 0 })
    } catch (error) {
      console.error('Failed to add skill:', error)
    }
  }

  const removeSkill = async (id: string) => {
    try {
      await axios.delete(`/api/skills/${id}`)
      setSkills(skills.filter(skill => skill.id !== id))
    } catch (error) {
      console.error('Failed to remove skill:', error)
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
          <CardTitle>Add New Skill</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Input
              placeholder="Skill Name"
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
            />
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="Skill Level"
              value={newSkill.level}
              onChange={(e) => setNewSkill({ ...newSkill, level: parseInt(e.target.value) })}
            />
            <Button onClick={addSkill}>Add</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((skill) => (
          <motion.div
            key={skill.id}
            whileHover={{ scale: 1.02 }}
          >
            <Card>
              <CardContent className="flex justify-between items-center p-4">
                <div>
                  <h3 className="font-medium">{skill.name}</h3>
                  <div className="w-full bg-secondary mt-2 rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSkill(skill.id)}
                >
                  <Cross2Icon className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default withAuth(SkillsPage) 