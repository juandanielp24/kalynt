import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WhatsAppConfiguration } from '@/components/whatsapp/WhatsAppConfiguration';
import { WhatsAppMessages } from '@/components/whatsapp/WhatsAppMessages';
import { WhatsAppSendMessage } from '@/components/whatsapp/WhatsAppSendMessage';
import { WhatsAppTemplates } from '@/components/whatsapp/WhatsAppTemplates';
import { WhatsAppAnalytics } from '@/components/whatsapp/WhatsAppAnalytics';
import { MessageSquare, Settings, Send, FileText, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'WhatsApp Business | Kalynt',
  description: 'Gestiona tu integración de WhatsApp Business',
};

export default function WhatsAppPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp Business</h1>
        <p className="text-muted-foreground">
          Conecta tu cuenta de WhatsApp Business y gestiona notificaciones automáticas
        </p>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Mensajes
          </TabsTrigger>
          <TabsTrigger value="send" className="gap-2">
            <Send className="h-4 w-4" />
            Enviar
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <WhatsAppConfiguration />
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <WhatsAppMessages />
        </TabsContent>

        <TabsContent value="send" className="space-y-6">
          <WhatsAppSendMessage />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <WhatsAppTemplates />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <WhatsAppAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
