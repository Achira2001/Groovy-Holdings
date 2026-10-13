'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import AccountShell from '@/components/account/AccountShell';
import ChatWindow from '@/components/chat/ChatWindow';
import Logo from '@/components/ui/Logo';
import { PageLoader } from '@/components/ui';
import { cn, whatsappLink, WHATSAPP_DISPLAY } from '@/lib/utils';

function CustomerChat() {
  const { adminOnline } = useSocket();
  const [conversation, setConversation] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/chat/my-conversation').then(({ data }) => setConversation(data.conversation)).catch((e) => setError(getErrorMessage(e)));
  }, []);

  if (error) return <p className="text-danger">{error}</p>;
  if (!conversation) return <PageLoader />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <ChatWindow
        conversationId={conversation._id}
        className="h-[calc(100vh-240px)] min-h-[520px]"
        header={
          <div className="flex items-center gap-3">
            <Logo compact href="/chat" />
            <div>
              <p className="font-bold leading-tight">Groovy Holdings team</p>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <span className={cn('h-2 w-2 rounded-full', adminOnline ? 'bg-success' : 'bg-line')} />
                {adminOnline ? 'Online now' : 'We reply by chat and email'}
              </p>
            </div>
          </div>
        }
      />
      <aside className="space-y-4">
        <div className="panel text-sm">
          <h2 className="font-bold">How we work</h2>
          <ul className="mt-3 space-y-2 text-muted">
            <li>• Attach designs (AI, PDF, PNG, PSD, CDR… up to 25 MB each).</li>
            <li>• Both of us can open every shared file from “Shared files”.</li>
            <li>• Every message is also sent to your email.</li>
          </ul>
        </div>
        <div className="panel text-sm">
          <h2 className="font-bold">Urgent or need a design?</h2>
          <p className="mt-2 text-muted">WhatsApp us on {WHATSAPP_DISPLAY}. Our designers can create your artwork.</p>
          <a href={whatsappLink('Hi Groovy Holdings!')} target="_blank" rel="noreferrer" className="btn mt-3 w-full bg-[#1FAF5A] text-white hover:bg-[#199a4e]">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </aside>
    </div>
  );
}

export default function ChatPage() {
  return (
    <AccountShell>
      <CustomerChat />
    </AccountShell>
  );
}
