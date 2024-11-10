'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { withAuth } from '@/components/hoc/with-auth'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { GitHubLogoIcon, VercelLogoIcon } from '@radix-ui/react-icons'
import { BrainCircuitIcon, CodeIcon, GlobeIcon, LayoutDashboardIcon, GitBranchIcon, PackageIcon, ArrowUpRightIcon, GitCommitIcon, GraduationCapIcon, CodepenIcon, UsersIcon, BookOpenIcon, ClockIcon, FolderPlusIcon } from 'lucide-react'
import { Octokit } from "@octokit/rest";
import { useRouter } from 'next/navigation'

// Constants
const LINKS = {
  portfolio: 'https://sharadjadhavportfolio.vercel.app',
  github: 'https://github.com/jadhavsharad',
  vercel: 'https://vercel.com/jadhavsharad'
} as const

const COLORS = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4', 
  tertiary: '#45B7D1',
  chart: ['#F43F5E', '#3B82F6', '#8B5CF6']
} as const

const ACTIVITY_TYPES = {
  commit: 'commit',
  project: 'project',
  skill: 'skill',
  category: 'category',
  certification: 'certification'
} as const

const GITHUB_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN

function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalSkills: 0,
    totalCertifications: 0
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return `${seconds} sec ago`
    
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hrs ago`
    
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} days ago`
    
    return date.toLocaleDateString()
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const projectsDoc = await getDoc(doc(db, 'projects', 'NjUmAfebfBPHfXZ4CVnW'))
        const skillsDoc = await getDoc(doc(db, 'skills', 'MFY6937UnRyIoPp8Ehfg'))
        const certificationsDoc = await getDoc(doc(db, 'certifications', 'rx2fFCF5UgZxRvH9FfiN'))

        setStats({
          totalProjects: projectsDoc.data()?.projects?.length || 0,
          totalSkills: skillsDoc.data()?.categories?.reduce((acc: number, cat: any) => acc + cat.skills.length, 0) || 0,
          totalCertifications: certificationsDoc.data()?.certifications?.length || 0
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    const fetchGithubActivity = async () => {
      try {
        const octokit = new Octokit({ auth: GITHUB_TOKEN })
        const { data: commits } = await octokit.repos.listCommits({
          owner: 'jadhavsharad',
          repo: 'Portfolio-v2'
        })
        const githubActivities = commits.map(commit => ({
          type: ACTIVITY_TYPES.commit,
          title: 'Commit',
          description: commit.commit.message,
          timestamp: new Date(commit.commit.author?.date || new Date()),
          timeAgo: getTimeAgo(new Date(commit.commit.author?.date || new Date()))
        }))

        const projectsDoc = await getDoc(doc(db, 'projects', 'NjUmAfebfBPHfXZ4CVnW'))
        const skillsDoc = await getDoc(doc(db, 'skills', 'MFY6937UnRyIoPp8Ehfg'))
        const certificationsDoc = await getDoc(doc(db, 'certifications', 'rx2fFCF5UgZxRvH9FfiN'))

        const projectActivities: any[] = []
        const projects = projectsDoc.data()?.projects || []
        projects.forEach((project: any) => {
          if (project.createdAt) {
            projectActivities.push({
              type: ACTIVITY_TYPES.project,
              title: 'New Project Created',
              description: `Created project: ${project.title}`,
              timestamp: new Date(project.createdAt),
              timeAgo: getTimeAgo(new Date(project.createdAt))
            })
          }
          if (project.updatedAt && project.updatedAt !== project.createdAt) {
            projectActivities.push({
              type: ACTIVITY_TYPES.project,
              title: 'Project Updated',
              description: `Updated project: ${project.title}`,
              timestamp: new Date(project.updatedAt),
              timeAgo: getTimeAgo(new Date(project.updatedAt))
            })
          }
        })

        const skillActivities: any[] = []
        const categories = skillsDoc.data()?.categories || []
        
        categories.forEach((category: any) => {
          if (category.createdAt) {
            skillActivities.push({
              type: ACTIVITY_TYPES.category,
              title: `New Category Added`,
              description: `Added ${category.name} category`,
              timestamp: new Date(category.createdAt),
              timeAgo: getTimeAgo(new Date(category.createdAt))
            })
          }

          if (Array.isArray(category.skills)) {
            category.skills.forEach((skill: any) => {
              if (skill.updatedAt) {
                skillActivities.push({
                  type: ACTIVITY_TYPES.skill,
                  title: `New Skill Added`,
                  description: `Added ${skill.name} in ${category.name}`,
                  timestamp: new Date(skill.updatedAt),
                  timeAgo: getTimeAgo(new Date(skill.updatedAt))
                })
              }
            })
          }
        })

        const certificationActivities = certificationsDoc.data()?.certifications?.map((cert: any) => ({
          type: ACTIVITY_TYPES.certification,
          title: cert.name,
          description: cert.issuer,
          timestamp: new Date(cert.updatedAt || cert.date?.seconds * 1000),
          timeAgo: getTimeAgo(new Date(cert.updatedAt || cert.date?.seconds * 1000))
        })) || []

        const allActivities = [
          ...githubActivities,
          ...projectActivities,
          ...skillActivities,
          ...certificationActivities
        ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        
        setRecentActivities(allActivities.slice(0, 10))
      } catch (error) {
        console.error('Error fetching activities:', error)
      }
    }

    fetchStats()
    fetchGithubActivity()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-6"
    >
      <div className="flex flex-wrap flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <LayoutDashboardIcon className="h-5 w-5 text-indigo-500" aria-hidden="true" />
          <h1 className="text-2xl font-medium">Analytics Hub</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <a 
            href={LINKS.portfolio}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-950/60 transition-colors"
            aria-label="View Portfolio"
          >
            <GlobeIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-sm">Portfolio</span>
          </a>

          <a 
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-950/40 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-950/60 transition-colors"
            aria-label="View GitHub Profile"
          >
            <GitHubLogoIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-sm">GitHub</span>
          </a>

          <a
            href={LINKS.vercel}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-950/60 transition-colors"
            aria-label="View Vercel Dashboard"
          >
            <VercelLogoIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-sm">Vercel</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          onClick={() => handleNavigation('/projects')}
          className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 cursor-pointer"
          role="button"
          aria-label="View Projects"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-bl-full"></div>
          <div className="p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-rose-100 dark:bg-rose-950/40 rounded-xl">
                  <CodeIcon className="h-6 w-6 text-rose-600 dark:text-rose-300" aria-hidden="true" />
                </div>
                <ArrowUpRightIcon className="h-5 w-5 text-rose-500" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">{stats.totalProjects}</h3>
              <p className="text-base font-medium text-gray-600 dark:text-gray-300">Active Projects</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Full-stack Development</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          onClick={() => handleNavigation('/skills')}
          className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 cursor-pointer"
          role="button"
          aria-label="View Skills"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full"></div>
          <div className="p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-100 dark:bg-blue-950/40 rounded-xl">
                  <BrainCircuitIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" aria-hidden="true" />
                </div>
                <ArrowUpRightIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">{stats.totalSkills}</h3>
              <p className="text-base font-medium text-gray-600 dark:text-gray-300">Technical Skills</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Core Competencies</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          onClick={() => handleNavigation('/certifications')}
          className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 cursor-pointer"
          role="button"
          aria-label="View Certifications"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-bl-full"></div>
          <div className="p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-100 dark:bg-purple-950/40 rounded-xl">
                  <GraduationCapIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" aria-hidden="true" />
                </div>
                <ArrowUpRightIcon className="h-5 w-5 text-purple-500" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">{stats.totalCertifications}</h3>
              <p className="text-base font-medium text-gray-600 dark:text-gray-300">Certifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Professional Growth</p>
            </div>
          </div>
        </motion.div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <motion.div 
          className="recent-activity-card p-6 rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 lg:max-h-[50svh] overflow-y-auto"
        >
          <div className="flex items-center gap-3 mb-4">
            <GitBranchIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
            <h2 className="text-lg font-medium">Recent Activity</h2>
          </div>

          <div className="space-y-4">
            {recentActivities.map((activity, index) => {
              const isClickable = activity.type !== ACTIVITY_TYPES.commit;
              const getPath = () => {
                switch(activity.type) {
                  case ACTIVITY_TYPES.project: return '/projects';
                  case ACTIVITY_TYPES.skill: 
                  case ACTIVITY_TYPES.category: return '/skills';
                  case ACTIVITY_TYPES.certification: return '/certifications';
                  default: return '';
                }
              };

              return (
                <div key={index} onClick={() => isClickable && handleNavigation(getPath())}
                  className={`flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 ${isClickable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800' : ''}`}>
                  <div className={`h-8 w-8 rounded-full ${activity.type === ACTIVITY_TYPES.commit ? 'bg-green-100 dark:bg-green-950/40' : 
                    activity.type === ACTIVITY_TYPES.project ? 'bg-blue-100 dark:bg-blue-950/40' :
                    activity.type === ACTIVITY_TYPES.skill ? 'bg-orange-100 dark:bg-orange-950/40' :
                    activity.type === ACTIVITY_TYPES.category ? 'bg-yellow-100 dark:bg-yellow-950/40' : 
                    'bg-purple-100 dark:bg-purple-950/40'} flex items-center justify-center`}>
                    {activity.type === ACTIVITY_TYPES.commit && <GitCommitIcon className="h-4 w-4 text-green-600 dark:text-green-300" />}
                    {activity.type === ACTIVITY_TYPES.project && <PackageIcon className="h-4 w-4 text-blue-600 dark:text-blue-300" />}
                    {activity.type === ACTIVITY_TYPES.skill && <CodeIcon className="h-4 w-4 text-orange-600 dark:text-orange-300" />}
                    {activity.type === ACTIVITY_TYPES.category && <FolderPlusIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />}
                    {activity.type === ACTIVITY_TYPES.certification && <GraduationCapIcon className="h-4 w-4 text-purple-600 dark:text-purple-300" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">{activity.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.description}</p>
                  </div>
                  <span className="ml-auto text-xs text-gray-400">{activity.timeAgo}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Time Tracking */}
        <motion.div 
          className="p-6 rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center gap-3 mb-4">
            <ClockIcon className="h-5 w-5 text-orange-500" aria-hidden="true" />
            <h2 className="text-lg font-medium">Time Tracking</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
              <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center">
                <CodeIcon className="h-4 w-4 text-orange-600 dark:text-orange-300" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Coding Time</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">6 hours today</p>
              </div>
              <span className="ml-auto text-xs text-gray-400">↑ 12%</span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
              <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-950/40 flex items-center justify-center">
                <BookOpenIcon className="h-4 w-4 text-teal-600 dark:text-teal-300" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Learning</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">2 hours today</p>
              </div>
              <span className="ml-auto text-xs text-gray-400">↑ 8%</span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
              <div className="h-8 w-8 rounded-full bg-pink-100 dark:bg-pink-950/40 flex items-center justify-center">
                <UsersIcon className="h-4 w-4 text-pink-600 dark:text-pink-300" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Meetings</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">1.5 hours today</p>
              </div>
              <span className="ml-auto text-xs text-gray-400">↓ 5%</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default withAuth(DashboardPage)
