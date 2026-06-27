"use client"

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import moment from 'moment'

export default function EventChat({ eventId }: { eventId: string }) {
  const { data: userObj } = useUser()
  const user = userObj?.id ? userObj : null
  const supabase = createClient()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [chatId, setChatId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 1. Fetch or Create Chat Room for Event
    const initChat = async () => {
      // Find existing chat
      let { data } = await supabase.from('chats').select('*').eq('event_id', eventId).single()
      let chat = data as any
      
      if (!chat && user) {
        // Create if doesn't exist (Only a user or organizer might trigger this first)
        const chatsTable = supabase.from('chats') as any
        const { data: newChat } = await chatsTable.insert({ event_id: eventId }).select().single()
        chat = newChat
      }
      
      if (chat) {
        setChatId(chat.id)
        // Fetch historical messages
        const { data: history } = await supabase
          .from('messages')
          .select('*, profiles(full_name)')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: true })
        
        if (history) setMessages(history)
      }
    }

    initChat()
  }, [eventId, user])

  useEffect(() => {
    if (!chatId) return

    // 2. Subscribe to Realtime Updates
    const channel = supabase.channel(`chat_${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, async (payload) => {
        // Fetch sender details since realtime payload only has foreign keys
        const { data: sender } = await supabase.from('profiles').select('full_name').eq('id', payload.new.sender_id).single()
        
        setMessages((prev) => [...prev, { ...payload.new, profiles: sender }])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !chatId || !user) return

    const content = newMessage.trim()
    setNewMessage('') // optimistic clear

    const messagesTable = supabase.from('messages') as any
    await messagesTable.insert({
      chat_id: chatId,
      sender_id: user.id,
      content: content
    })
  }

  if (!user) {
    return (
      <div className="bg-zinc-100 dark:bg-zinc-900 p-8 text-center rounded-xl border border-zinc-200 dark:border-zinc-800">
        <p className="text-zinc-500">Log in to join the event chat.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[500px] bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
        <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Live Event Chat</h3>
        <p className="text-xs text-zinc-500">Discuss with attendees and organizers.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === user.id
            return (
              <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="text-[10px] text-zinc-500 mb-1 px-1">
                  {msg.profiles?.full_name || 'User'} • {moment(msg.created_at).format('h:mm A')}
                </div>
                <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${
                  isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">Send</Button>
        </form>
      </div>
    </div>
  )
}
