'use client'

import { useState } from 'react'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
    const [resetEmail, setResetEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await signInWithEmailAndPassword(auth, email, password)
            router.push('/')
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Invalid credentials",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleForgotPassword = async () => {
        if (!resetEmail) {
            toast({
                title: "Error",
                description: "Please enter your email address",
                variant: "destructive"
            })
            return
        }

        setIsLoading(true)
        try {
            await sendPasswordResetEmail(auth, resetEmail)
            toast({
                title: "Success",
                description: "Password reset email sent. Please check your inbox.",
            })
            setIsResetDialogOpen(false)
            setResetEmail('')
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to send reset email",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="w-[350px]">
                        <CardHeader>
                            <CardTitle>Login</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                                <Button 
                                    type="submit" 
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Logging in..." : "Login"}
                                </Button>
                            </form>
                        </CardContent>
                        <CardFooter>
                            <Button
                                variant="link"
                                className="w-full"
                                onClick={() => setIsResetDialogOpen(true)}
                                disabled={isLoading}
                            >
                                Forgot Password?
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>

            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Enter your email address and we'll send you a link to reset your password.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            type="email"
                            placeholder="Email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsResetDialogOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleForgotPassword}
                            disabled={isLoading}
                        >
                            {isLoading ? "Sending..." : "Send Reset Link"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
} 