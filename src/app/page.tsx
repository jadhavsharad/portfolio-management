'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { withAuth } from '@/components/hoc/with-auth'
import axios from 'axios'

interface DashboardStats {
  totalProjects: number
  totalSkills: number
  totalCertifications: number
}

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalSkills: 0,
    totalCertifications: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/dashboard/stats')
        setStats(response.data)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div whileHover={{ scale: 1.05 }}>
          <Card>
            <CardHeader>
              <CardTitle>Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalProjects}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }}>
          <Card>
            <CardHeader>
              <CardTitle>Total Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalSkills}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }}>
          <Card>
            <CardHeader>
              <CardTitle>Total Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalCertifications}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Add recent activity or other dashboard widgets here */}
    </motion.div>
  )
}

export default withAuth(DashboardPage)
